// ==========================================
// МОДУЛЬ 3D-РЕДАКТОРА СТЕН И ЭЛЕМЕНТОВ ЗДАНИЙ
// Перемещение, вращение, масштабирование, добавление,
// удаление, история отмены, автосохранение и экспорт кода
// ==========================================

const EDITOR_STORAGE_KEY = 'college3d_custom_edits_v1';

const EDITOR_STATE = {
    enabled: false,
    mode: 'translate',       // 'translate' | 'rotate' | 'scale'
    snap: 0.1,              // Шаг сетки перемещения (в метрах): 0.05, 0.1, 0.25, 0.5, 1.0, 0
    rotSnapDeg: 15,         // Шаг поворота (в градусах): 5, 15, 45, 90, 0
    selected: null,         // Текущий выделенный Three.js Mesh
    hovered: null,          // Меш под курсором
    origMaterial: null,     // Исходный материал выделенного меша
    hoverOrigMaterial: null,
    isDrawing: false,       // Режим создания стены по 2 точкам
    drawStartPoint: null,   // Vector3 первой точки
    drawPreviewMesh: null,  // Временный меш для предпросмотра
    changes: {
        modified: {},       // wallId -> { x, z, rotY, scaleX, scaleZ, len, thickness }
        deleted: [],        // [ wallId1, wallId2, ... ]
        added: []           // [ { id, building, floor, x, z, rotY, len, thickness, isDoor } ]
    },
    history: [],            // Стек Undo
    redoStack: []           // Стек Redo
};

let transformGizmo = null;
let editorRaycaster = null;
let editorMouse = null;
let editorPointerDownPos = { x: 0, y: 0 };
let isGizmoDragging = false;

// Инициализация редактора
function initEditor() {
    if (typeof THREE.TransformControls === 'undefined') {
        console.warn('TransformControls не найден. Проверьте подключение js/TransformControls.js');
        return;
    }

    editorRaycaster = new THREE.Raycaster();
    editorMouse = new THREE.Vector2();

    // Создаем экземпляр TransformControls
    transformGizmo = new THREE.TransformControls(camera, renderer.domElement);
    transformGizmo.size = 0.82;
    transformGizmo.showY = false; // Блокируем Y по умолчанию для перемещения в плоскости этажа
    transformGizmo.translationSnap = EDITOR_STATE.snap;
    transformGizmo.rotationSnap = THREE.MathUtils.degToRad(EDITOR_STATE.rotSnapDeg);
    transformGizmo.visible = false;
    transformGizmo.enabled = false;
    scene.add(transformGizmo);

    // Отключаем OrbitControls при перетаскивании гизмо
    transformGizmo.addEventListener('dragging-changed', function (event) {
        if (controls) controls.enabled = !event.value;
        isGizmoDragging = event.value;

        if (!event.value && EDITOR_STATE.selected) {
            // Завершили перетаскивание — сохраняем состояние
            commitSelectedTransform();
            saveEditorChanges();
            updateInspectorUI();
        }
        if (typeof requestRender === 'function') requestRender(20);
    });

    transformGizmo.addEventListener('change', function () {
        if (EDITOR_STATE.selected && isGizmoDragging) {
            // Держим Y стены на высоте текущего этажа
            const h = (STATE.wallHeight || 2.4);
            const wallSink = (typeof WALL_SINK !== 'undefined' ? WALL_SINK : 0.025);
            EDITOR_STATE.selected.position.y = (h - wallSink) / 2;
            updateInspectorUI();
        }
        if (typeof requestRender === 'function') requestRender(10);
    });

    // Обработчики кликов и наведения мыши на холст
    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onEditorPointerDown);
    dom.addEventListener('pointermove', onEditorPointerMove);
    dom.addEventListener('pointerup', onEditorPointerUp);

    // Клавиатурные сокращения
    window.addEventListener('keydown', onEditorKeyDown);

    // Загрузка сохранённых правок из LocalStorage
    loadSavedEditorChanges();

    // Создание DOM элементов панели редактора и модального окна
    createEditorDOM();
    updateEditorBadge();
}

// Загрузка сохранённых правок из LocalStorage
function loadSavedEditorChanges() {
    try {
        const raw = localStorage.getItem(EDITOR_STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (!data) return;

        EDITOR_STATE.changes = {
            modified: data.modified || {},
            deleted: data.deleted || [],
            added: data.added || []
        };

        applyAllSavedChanges();
    } catch (e) {
        console.error('Ошибка загрузки изменений редактора:', e);
    }
}

// Применение всех сохраненных изменений к геометрии
function applyAllSavedChanges() {
    const { modified, deleted, added } = EDITOR_STATE.changes;

    // 1. Применяем удаленные стены
    if (Array.isArray(deleted)) {
        deleted.forEach(id => {
            const mesh = findMeshByWallId(id);
            if (mesh) {
                mesh.visible = false;
                mesh.userData.isDeleted = true;
            }
        });
    }

    // 2. Применяем модифицированные стены
    if (modified && typeof modified === 'object') {
        Object.keys(modified).forEach(id => {
            const mod = modified[id];
            const mesh = findMeshByWallId(id);
            if (mesh && mod) {
                if (mod.x !== undefined) mesh.position.x = mod.x;
                if (mod.z !== undefined) mesh.position.z = mod.z;
                if (mod.rotY !== undefined) mesh.rotation.y = mod.rotY;
                if (mod.scaleX !== undefined) mesh.scale.x = mod.scaleX;
                if (mod.scaleZ !== undefined) mesh.scale.z = mod.scaleZ;
                mesh.userData.currentLen = mod.len;
                mesh.userData.currentThickness = mod.thickness;
            }
        });
    }

    // 3. Восстанавливаем добавленные стены
    if (Array.isArray(added)) {
        added.forEach(item => {
            recreateAddedWall(item);
        });
    }

    if (typeof requestRender === 'function') requestRender(30);
}

// Поиск меша по его wallId
function findMeshByWallId(wallId) {
    if (!wallId) return null;
    if (window.WALL_REGISTRY && window.WALL_REGISTRY.has(wallId)) {
        return window.WALL_REGISTRY.get(wallId);
    }
    // Запасной поиск по wallMeshes и doorMeshes
    const all = [...(wallMeshes || []), ...(doorMeshes || [])];
    return all.find(m => m.userData && m.userData.wallId === wallId) || null;
}

// Воссоздание добавленной вручную стены из данных
function recreateAddedWall(item) {
    const bldg = item.building || 1;
    const floor = item.floor || 1;
    let targetGroup = null;

    if (bldg === 1 && bldg1FloorGroups[floor]) targetGroup = bldg1FloorGroups[floor];
    else if (bldg === 2 && bldg2FloorGroups[floor]) targetGroup = bldg2FloorGroups[floor];
    else if (bldg === 3 && bldg3FloorGroups[floor]) targetGroup = bldg3FloorGroups[floor];
    else if (bldg === 4 && bldg4FloorGroups[floor]) targetGroup = bldg4FloorGroups[floor];
    else targetGroup = floorGroups[floor] || scene;

    const len = item.len || 3.0;
    const thickness = item.thickness || 0.18;
    const geom = new THREE.BoxGeometry(len, 1, thickness);
    const mat = item.isDoor ? MATERIALS.doorThin : MATERIALS.wall;
    const mesh = new THREE.Mesh(geom, mat);

    const h = STATE.wallHeight || 2.4;
    const wallSink = typeof WALL_SINK !== 'undefined' ? WALL_SINK : 0.025;
    mesh.scale.set(item.scaleX || 1, h + wallSink, item.scaleZ || 1);
    mesh.position.set(item.x || 0, (h - wallSink) / 2, item.z || 0);
    mesh.rotation.y = item.rotY || 0;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mesh.userData.isWall = !item.isDoor;
    mesh.userData.isDoor = !!item.isDoor;
    mesh.userData.isCustomAdded = true;
    mesh.userData.wallId = item.id;
    mesh.userData.len = len;
    mesh.userData.thickness = thickness;
    mesh.userData.building = bldg;
    mesh.userData.floor = floor;
    mesh.userData.targetGroup = targetGroup;

    targetGroup.add(mesh);

    const edgeGeom = new THREE.EdgesGeometry(geom);
    const edgeLine = new THREE.LineSegments(edgeGeom, item.isDoor ? MATERIALS.edgeDoor : MATERIALS.edgeMain);
    mesh.add(edgeLine);

    if (item.isDoor) {
        doorMeshes.push(mesh);
        doorEdges.push(edgeLine);
    } else {
        wallMeshes.push(mesh);
        wallEdges.push(edgeLine);
    }

    if (window.WALL_REGISTRY) {
        window.WALL_REGISTRY.set(item.id, mesh);
    }

    return mesh;
}

// Сохранение изменений в LocalStorage
function saveEditorChanges() {
    try {
        localStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(EDITOR_STATE.changes));
        updateEditorBadge();
    } catch (e) {
        console.error('Ошибка сохранения изменений редактора:', e);
    }
}

// Переключение режима редактора
function toggleEditor(force) {
    EDITOR_STATE.enabled = (force !== undefined) ? force : !EDITOR_STATE.enabled;

    const panel = document.getElementById('editor-floating-panel');
    const btn = document.getElementById('btn-toggle-editor');

    if (EDITOR_STATE.enabled) {
        if (panel) panel.classList.remove('hidden');
        if (btn) {
            btn.classList.add('bg-sky-500', 'text-slate-950', 'font-bold');
            btn.classList.remove('bg-sky-950/70', 'text-sky-200');
        }
        if (transformGizmo) transformGizmo.enabled = true;
        showToast('✏️ Режим редактора включен. Кликните на стену для редактирования');
    } else {
        if (panel) panel.classList.add('hidden');
        if (btn) {
            btn.classList.remove('bg-sky-500', 'text-slate-950', 'font-bold');
            btn.classList.add('bg-sky-950/70', 'text-sky-200');
        }
        deselectWall();
        cancelDrawingWall();
        if (transformGizmo) {
            transformGizmo.visible = false;
            transformGizmo.enabled = false;
        }
        showToast('Режим редактора выключен');
    }

    if (typeof requestRender === 'function') requestRender(20);
}

// Обработка pointerdown
function onEditorPointerDown(e) {
    editorPointerDownPos.x = e.clientX;
    editorPointerDownPos.y = e.clientY;
}

// Обработка pointermove
function onEditorPointerMove(e) {
    if (!EDITOR_STATE.enabled || isGizmoDragging) return;

    const rect = renderer.domElement.getBoundingClientRect();
    editorMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    editorMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Режим рисования стены по 2 точкам
    if (EDITOR_STATE.isDrawing && EDITOR_STATE.drawStartPoint) {
        updateDrawingPreview(e);
        return;
    }

    // Подсветка стены при наведении
    editorRaycaster.setFromCamera(editorMouse, camera);
    const targets = getVisibleInteractiveWalls();
    const hits = editorRaycaster.intersectObjects(targets, false);

    if (hits.length > 0) {
        const hitMesh = hits[0].object;
        if (hitMesh !== EDITOR_STATE.selected && hitMesh !== EDITOR_STATE.hovered) {
            clearHover();
            setHover(hitMesh);
            renderer.domElement.style.cursor = 'pointer';
        }
    } else {
        if (EDITOR_STATE.hovered) {
            clearHover();
            renderer.domElement.style.cursor = 'grab';
        }
    }
}

// Обработка pointerup (клик)
function onEditorPointerUp(e) {
    if (!EDITOR_STATE.enabled || isGizmoDragging) return;

    // Если указатель сместился более чем на 5px — это было вращение камеры OrbitControls
    const dist = Math.hypot(e.clientX - editorPointerDownPos.x, e.clientY - editorPointerDownPos.y);
    if (dist > 5) return;

    const rect = renderer.domElement.getBoundingClientRect();
    editorMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    editorMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    editorRaycaster.setFromCamera(editorMouse, camera);

    // 1. Если включен режим рисования стены
    if (EDITOR_STATE.isDrawing) {
        handleDrawingClick();
        return;
    }

    // 2. Обычный режим: выбор или снятие выделения стены
    const targets = getVisibleInteractiveWalls();
    const hits = editorRaycaster.intersectObjects(targets, false);

    if (hits.length > 0) {
        const hitMesh = hits[0].object;
        selectWall(hitMesh);
    } else {
        // Клик в пустоту
        deselectWall();
    }
}

// Получение списка всех видимых стен, доступных для редактирования
function getVisibleInteractiveWalls() {
    const list = [];
    const all = [...(wallMeshes || []), ...(doorMeshes || [])];
    for (let i = 0; i < all.length; i++) {
        const m = all[i];
        if (!m || !m.visible || (m.userData && m.userData.isDeleted)) continue;
        // Проверяем видимость родительских групп этажа
        let parent = m.parent;
        let isVis = true;
        while (parent && parent !== scene) {
            if (!parent.visible) {
                isVis = false;
                break;
            }
            parent = parent.parent;
        }
        if (isVis) list.push(m);
    }
    return list;
}

// Установка подсветки hover
function setHover(mesh) {
    EDITOR_STATE.hovered = mesh;
    EDITOR_STATE.hoverOrigMaterial = mesh.material;
    if (MATERIALS.hoverWall) {
        mesh.material = MATERIALS.hoverWall;
        if (typeof requestRender === 'function') requestRender(10);
    }
}

// Снятие подсветки hover
function clearHover() {
    if (EDITOR_STATE.hovered && EDITOR_STATE.hoverOrigMaterial) {
        if (EDITOR_STATE.hovered !== EDITOR_STATE.selected) {
            EDITOR_STATE.hovered.material = EDITOR_STATE.hoverOrigMaterial;
        }
        EDITOR_STATE.hovered = null;
        EDITOR_STATE.hoverOrigMaterial = null;
        if (typeof requestRender === 'function') requestRender(10);
    }
}

// Выбор стены для редактирования
function selectWall(mesh) {
    if (!mesh) return;

    if (EDITOR_STATE.selected === mesh) return;

    // Снимаем предыдущее выделение
    deselectWall();

    EDITOR_STATE.selected = mesh;
    EDITOR_STATE.origMaterial = mesh.material;

    // Назначаем подсвеченный материал
    if (MATERIALS.selectedWall) {
        mesh.material = MATERIALS.selectedWall;
    }

    // Прикрепляем TransformGizmo
    if (transformGizmo) {
        transformGizmo.attach(mesh);
        transformGizmo.visible = true;
        transformGizmo.setMode(EDITOR_STATE.mode);
        updateGizmoAxes();
    }

    // Сохраняем исходные координаты для отмены (Undo)
    mesh.userData._prevTransform = {
        x: mesh.position.x,
        z: mesh.position.z,
        rotY: mesh.rotation.y,
        scaleX: mesh.scale.x,
        scaleZ: mesh.scale.z
    };

    updateInspectorUI();
    if (typeof requestRender === 'function') requestRender(20);
}

// Снятие выделения со стены
function deselectWall() {
    if (!EDITOR_STATE.selected) return;

    if (EDITOR_STATE.origMaterial) {
        EDITOR_STATE.selected.material = EDITOR_STATE.origMaterial;
    }
    EDITOR_STATE.selected = null;
    EDITOR_STATE.origMaterial = null;

    if (transformGizmo) {
        transformGizmo.detach();
        transformGizmo.visible = false;
    }

    updateInspectorUI();
    if (typeof requestRender === 'function') requestRender(20);
}

// Обновление осей гизмо в зависимости от режима
function updateGizmoAxes() {
    if (!transformGizmo) return;
    if (EDITOR_STATE.mode === 'translate') {
        transformGizmo.showX = true;
        transformGizmo.showY = false;
        transformGizmo.showZ = true;
    } else if (EDITOR_STATE.mode === 'rotate') {
        transformGizmo.showX = false;
        transformGizmo.showY = true;
        transformGizmo.showZ = false;
    } else if (EDITOR_STATE.mode === 'scale') {
        transformGizmo.showX = true;
        transformGizmo.showY = false;
        transformGizmo.showZ = true;
    }
}

// Установка режима трансформации: translate, rotate, scale
function setTransformMode(mode) {
    EDITOR_STATE.mode = mode;
    if (transformGizmo) {
        transformGizmo.setMode(mode);
        updateGizmoAxes();
    }
    document.querySelectorAll('.editor-mode-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === mode);
    });
    if (typeof requestRender === 'function') requestRender(15);
}

// Установка шага сетки (snap)
function setSnapGrid(snapVal) {
    EDITOR_STATE.snap = parseFloat(snapVal) || 0;
    if (transformGizmo) {
        transformGizmo.translationSnap = EDITOR_STATE.snap > 0 ? EDITOR_STATE.snap : null;
    }
    const label = document.getElementById('editor-snap-label');
    if (label) {
        label.textContent = EDITOR_STATE.snap > 0 ? `${EDITOR_STATE.snap} м` : 'Выкл';
    }
}

// Установка шага вращения
function setRotationSnap(degVal) {
    EDITOR_STATE.rotSnapDeg = parseFloat(degVal) || 0;
    if (transformGizmo) {
        transformGizmo.rotationSnap = EDITOR_STATE.rotSnapDeg > 0 ? THREE.MathUtils.degToRad(EDITOR_STATE.rotSnapDeg) : null;
    }
}

// Фиксация трансформации выделенного объекта в истории и изменениях
function commitSelectedTransform() {
    const mesh = EDITOR_STATE.selected;
    if (!mesh) return;

    const prev = mesh.userData._prevTransform;
    const current = {
        x: mesh.position.x,
        z: mesh.position.z,
        rotY: mesh.rotation.y,
        scaleX: mesh.scale.x,
        scaleZ: mesh.scale.z
    };

    // Если изменения не было — выходим
    if (prev &&
        Math.abs(prev.x - current.x) < 0.001 &&
        Math.abs(prev.z - current.z) < 0.001 &&
        Math.abs(prev.rotY - current.rotY) < 0.001 &&
        Math.abs(prev.scaleX - current.scaleX) < 0.001 &&
        Math.abs(prev.scaleZ - current.scaleZ) < 0.001) {
        return;
    }

    // Добавляем в историю Undo
    pushHistory({
        type: 'transform',
        mesh: mesh,
        wallId: mesh.userData.wallId,
        prev: { ...prev },
        current: { ...current }
    });

    mesh.userData._prevTransform = { ...current };

    // Записываем в список измененных стен
    const wallId = mesh.userData.wallId;
    const baseLen = mesh.userData.len || 3.0;
    const baseThickness = mesh.userData.thickness || 0.18;
    const effectiveLen = baseLen * mesh.scale.x;
    const effectiveThickness = baseThickness * mesh.scale.z;

    EDITOR_STATE.changes.modified[wallId] = {
        x: parseFloat(mesh.position.x.toFixed(3)),
        z: parseFloat(mesh.position.z.toFixed(3)),
        rotY: parseFloat(mesh.rotation.y.toFixed(4)),
        scaleX: parseFloat(mesh.scale.x.toFixed(3)),
        scaleZ: parseFloat(mesh.scale.z.toFixed(3)),
        len: parseFloat(effectiveLen.toFixed(3)),
        thickness: parseFloat(effectiveThickness.toFixed(3)),
        building: mesh.userData.building || 1,
        floor: mesh.userData.floor || 1
    };

    saveEditorChanges();
}

// Добавление новой стены
function addNewWall() {
    const activeFloor = getActiveFloorNum();
    const activeBldg = getActiveBuildingNum();

    let targetGroup = null;
    if (activeBldg === 1 && bldg1FloorGroups[activeFloor]) targetGroup = bldg1FloorGroups[activeFloor];
    else if (activeBldg === 2 && bldg2FloorGroups[activeFloor]) targetGroup = bldg2FloorGroups[activeFloor];
    else if (activeBldg === 3 && bldg3FloorGroups[activeFloor]) targetGroup = bldg3FloorGroups[activeFloor];
    else if (activeBldg === 4 && bldg4FloorGroups[activeFloor]) targetGroup = bldg4FloorGroups[activeFloor];
    else targetGroup = floorGroups[activeFloor] || scene;

    // Координаты размещения: центр текущего обзора камеры
    let posX = controls ? controls.target.x : 0;
    let posZ = controls ? controls.target.z : 0;

    // Привязываем к сетке
    if (EDITOR_STATE.snap > 0) {
        posX = Math.round(posX / EDITOR_STATE.snap) * EDITOR_STATE.snap;
        posZ = Math.round(posZ / EDITOR_STATE.snap) * EDITOR_STATE.snap;
    }

    const newId = `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const wallData = {
        id: newId,
        building: activeBldg,
        floor: activeFloor,
        x: posX,
        z: posZ,
        rotY: 0,
        len: 3.0,
        thickness: 0.18,
        scaleX: 1,
        scaleZ: 1,
        isDoor: false
    };

    const mesh = recreateAddedWall(wallData);
    EDITOR_STATE.changes.added.push(wallData);

    pushHistory({
        type: 'add',
        mesh: mesh,
        wallData: wallData
    });

    saveEditorChanges();
    selectWall(mesh);
    showToast(`➕ Добавлена новая стена (Корпус ${activeBldg}, Этаж ${activeFloor})`);
    if (typeof requestRender === 'function') requestRender(30);
}

// Дублирование выбранной стены
function duplicateSelectedWall() {
    const mesh = EDITOR_STATE.selected;
    if (!mesh) {
        showToast('Сначала выберите стену для дублирования');
        return;
    }

    const bldg = mesh.userData.building || getActiveBuildingNum();
    const floor = mesh.userData.floor || getActiveFloorNum();
    const baseLen = mesh.userData.len || 3.0;
    const baseThickness = mesh.userData.thickness || 0.18;

    const offset = EDITOR_STATE.snap > 0 ? Math.max(0.5, EDITOR_STATE.snap * 2) : 0.8;
    const newId = `custom_dup_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const wallData = {
        id: newId,
        building: bldg,
        floor: floor,
        x: parseFloat((mesh.position.x + offset).toFixed(3)),
        z: parseFloat((mesh.position.z + offset).toFixed(3)),
        rotY: mesh.rotation.y,
        len: baseLen,
        thickness: baseThickness,
        scaleX: mesh.scale.x,
        scaleZ: mesh.scale.z,
        isDoor: !!mesh.userData.isDoor
    };

    const newMesh = recreateAddedWall(wallData);
    EDITOR_STATE.changes.added.push(wallData);

    pushHistory({
        type: 'add',
        mesh: newMesh,
        wallData: wallData
    });

    saveEditorChanges();
    selectWall(newMesh);
    showToast('📋 Стена продублирована');
    if (typeof requestRender === 'function') requestRender(30);
}

// Удаление выбранной стены
function deleteSelectedWall() {
    const mesh = EDITOR_STATE.selected;
    if (!mesh) {
        showToast('Сначала выберите стену для удаления');
        return;
    }

    const wallId = mesh.userData.wallId;
    const isCustom = mesh.userData.isCustomAdded;

    // Скрываем меш
    mesh.visible = false;
    mesh.userData.isDeleted = true;

    deselectWall();

    if (isCustom) {
        // Если это стена, добавленная пользователем — удаляем из added
        const idx = EDITOR_STATE.changes.added.findIndex(item => item.id === wallId);
        let removedItem = null;
        if (idx !== -1) {
            removedItem = EDITOR_STATE.changes.added.splice(idx, 1)[0];
        }
        pushHistory({
            type: 'delete_custom',
            mesh: mesh,
            wallData: removedItem
        });
    } else {
        // Если это стена исходной модели — добавляем в deleted
        if (!EDITOR_STATE.changes.deleted.includes(wallId)) {
            EDITOR_STATE.changes.deleted.push(wallId);
        }
        // Удаляем из модифицированных, если была там
        delete EDITOR_STATE.changes.modified[wallId];

        pushHistory({
            type: 'delete',
            mesh: mesh,
            wallId: wallId
        });
    }

    saveEditorChanges();
    showToast('🗑️ Стена удалена');
    if (typeof requestRender === 'function') requestRender(30);
}

// Поворот выбранной стены на 90 градусов
function rotateSelectedBy90(direction = 1) {
    const mesh = EDITOR_STATE.selected;
    if (!mesh) return;

    const prevRot = mesh.rotation.y;
    mesh.rotation.y += (Math.PI / 2) * direction;

    commitSelectedTransform();
    saveEditorChanges();
    updateInspectorUI();
    if (typeof requestRender === 'function') requestRender(15);
}

// Интерактивное рисование стены по 2 кликам
function startDrawingWall() {
    deselectWall();
    EDITOR_STATE.isDrawing = true;
    EDITOR_STATE.drawStartPoint = null;

    const btn = document.getElementById('btn-editor-draw-wall');
    if (btn) btn.classList.add('active', 'bg-emerald-600', 'text-white');

    renderer.domElement.style.cursor = 'crosshair';
    showToast('✏️ Кликните точку 1 (начало стены)');
}

function cancelDrawingWall() {
    EDITOR_STATE.isDrawing = false;
    EDITOR_STATE.drawStartPoint = null;

    if (EDITOR_STATE.drawPreviewMesh) {
        scene.remove(EDITOR_STATE.drawPreviewMesh);
        if (EDITOR_STATE.drawPreviewMesh.geometry) EDITOR_STATE.drawPreviewMesh.geometry.dispose();
        EDITOR_STATE.drawPreviewMesh = null;
    }

    const btn = document.getElementById('btn-editor-draw-wall');
    if (btn) btn.classList.remove('active', 'bg-emerald-600', 'text-white');

    renderer.domElement.style.cursor = 'grab';
    if (typeof requestRender === 'function') requestRender(15);
}

function handleDrawingClick() {
    const groundPoint = getFloorIntersection();
    if (!groundPoint) return;

    if (!EDITOR_STATE.drawStartPoint) {
        // Точка 1
        EDITOR_STATE.drawStartPoint = groundPoint.clone();
        showToast('📍 Точка 1 зафиксирована. Кликните точку 2 (конец стены)');
    } else {
        // Точка 2: Завершаем построение
        const p1 = EDITOR_STATE.drawStartPoint;
        const p2 = groundPoint;

        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const len = Math.hypot(dx, dz);

        if (len < 0.2) {
            showToast('Стена слишком короткая (<0.2м)');
            cancelDrawingWall();
            return;
        }

        const cx = (p1.x + p2.x) / 2;
        const cz = (p1.z + p2.z) / 2;
        const angle = -Math.atan2(dz, dx);

        const activeFloor = getActiveFloorNum();
        const activeBldg = getActiveBuildingNum();
        const newId = `custom_drawn_${Date.now()}`;

        const wallData = {
            id: newId,
            building: activeBldg,
            floor: activeFloor,
            x: parseFloat(cx.toFixed(3)),
            z: parseFloat(cz.toFixed(3)),
            rotY: parseFloat(angle.toFixed(4)),
            len: parseFloat(len.toFixed(3)),
            thickness: 0.18,
            scaleX: 1,
            scaleZ: 1,
            isDoor: false
        };

        const mesh = recreateAddedWall(wallData);
        EDITOR_STATE.changes.added.push(wallData);

        pushHistory({
            type: 'add',
            mesh: mesh,
            wallData: wallData
        });

        saveEditorChanges();
        cancelDrawingWall();
        selectWall(mesh);
        showToast(`✅ Стена построена (длина ${len.toFixed(2)} м)`);
        if (typeof requestRender === 'function') requestRender(30);
    }
}

function updateDrawingPreview(e) {
    const groundPoint = getFloorIntersection();
    if (!groundPoint || !EDITOR_STATE.drawStartPoint) return;

    const p1 = EDITOR_STATE.drawStartPoint;
    const p2 = groundPoint;

    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    const len = Math.hypot(dx, dz);
    if (len < 0.05) return;

    const cx = (p1.x + p2.x) / 2;
    const cz = (p1.z + p2.z) / 2;
    const angle = -Math.atan2(dz, dx);
    const h = STATE.wallHeight || 2.4;
    const wallFloorY = getActiveFloorHeight();

    if (!EDITOR_STATE.drawPreviewMesh) {
        const geom = new THREE.BoxGeometry(1, 1, 0.18);
        EDITOR_STATE.drawPreviewMesh = new THREE.Mesh(geom, MATERIALS.drawPreviewWall || MATERIALS.wall);
        scene.add(EDITOR_STATE.drawPreviewMesh);
    }

    const mesh = EDITOR_STATE.drawPreviewMesh;
    mesh.scale.set(len, h, 1);
    mesh.position.set(cx, wallFloorY + h / 2, cz);
    mesh.rotation.y = angle;

    if (typeof requestRender === 'function') requestRender(10);
}

// Получение точки пересечения луча курсора с горизонтальной плоскостью активного этажа
function getFloorIntersection() {
    const floorY = getActiveFloorHeight();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -floorY);
    const pt = new THREE.Vector3();

    if (editorRaycaster.ray.intersectPlane(plane, pt)) {
        // Привязка к шагу сетки
        if (EDITOR_STATE.snap > 0) {
            pt.x = Math.round(pt.x / EDITOR_STATE.snap) * EDITOR_STATE.snap;
            pt.z = Math.round(pt.z / EDITOR_STATE.snap) * EDITOR_STATE.snap;
        }
        return pt;
    }
    return null;
}

// Определение активного этажа и его высоты
function getActiveFloorNum() {
    if (STATE.mode && !isNaN(parseInt(STATE.mode))) {
        return parseInt(STATE.mode);
    }
    if (STATE.sliceMaxFloor && STATE.sliceMaxFloor >= 1 && STATE.sliceMaxFloor <= 7) {
        return STATE.sliceMaxFloor;
    }
    return 1;
}

function getActiveFloorHeight() {
    const floorNum = getActiveFloorNum();
    const step = typeof BASE_FLOOR_STEP !== 'undefined' ? BASE_FLOOR_STEP : 2.65;
    return (floorNum - 1) * step;
}

function getActiveBuildingNum() {
    if (STATE.buildingFilter && !isNaN(parseInt(STATE.buildingFilter))) {
        return parseInt(STATE.buildingFilter);
    }
    return 1;
}

// История отмены: push
function pushHistory(action) {
    EDITOR_STATE.history.push(action);
    if (EDITOR_STATE.history.length > 50) EDITOR_STATE.history.shift();
    EDITOR_STATE.redoStack = []; // Очищаем Redo при новом действии
    updateEditorBadge();
}

// Undo
function undoEditorAction() {
    if (EDITOR_STATE.history.length === 0) {
        showToast('Нет действий для отмены');
        return;
    }

    const action = EDITOR_STATE.history.pop();
    EDITOR_STATE.redoStack.push(action);

    if (action.type === 'transform') {
        const mesh = action.mesh;
        if (mesh && action.prev) {
            mesh.position.x = action.prev.x;
            mesh.position.z = action.prev.z;
            mesh.rotation.y = action.prev.rotY;
            mesh.scale.x = action.prev.scaleX;
            mesh.scale.z = action.prev.scaleZ;
            mesh.userData._prevTransform = { ...action.prev };

            // Обновляем changes.modified
            const wallId = action.wallId;
            if (EDITOR_STATE.changes.modified[wallId]) {
                EDITOR_STATE.changes.modified[wallId].x = action.prev.x;
                EDITOR_STATE.changes.modified[wallId].z = action.prev.z;
                EDITOR_STATE.changes.modified[wallId].rotY = action.prev.rotY;
                EDITOR_STATE.changes.modified[wallId].scaleX = action.prev.scaleX;
                EDITOR_STATE.changes.modified[wallId].scaleZ = action.prev.scaleZ;
            }
        }
    } else if (action.type === 'delete') {
        const mesh = action.mesh;
        if (mesh) {
            mesh.visible = true;
            mesh.userData.isDeleted = false;
        }
        const idx = EDITOR_STATE.changes.deleted.indexOf(action.wallId);
        if (idx !== -1) EDITOR_STATE.changes.deleted.splice(idx, 1);
    } else if (action.type === 'delete_custom') {
        const mesh = action.mesh;
        if (mesh) {
            mesh.visible = true;
            mesh.userData.isDeleted = false;
        }
        if (action.wallData) {
            EDITOR_STATE.changes.added.push(action.wallData);
        }
    } else if (action.type === 'add') {
        const mesh = action.mesh;
        if (mesh) {
            mesh.visible = false;
            mesh.userData.isDeleted = true;
        }
        const id = action.wallData ? action.wallData.id : null;
        if (id) {
            const idx = EDITOR_STATE.changes.added.findIndex(item => item.id === id);
            if (idx !== -1) EDITOR_STATE.changes.added.splice(idx, 1);
        }
    }

    saveEditorChanges();
    updateInspectorUI();
    showToast('↩️ Действие отменено (Undo)');
    if (typeof requestRender === 'function') requestRender(20);
}

// Redo
function redoEditorAction() {
    if (EDITOR_STATE.redoStack.length === 0) {
        showToast('Нет действий для повтора');
        return;
    }

    const action = EDITOR_STATE.redoStack.pop();
    EDITOR_STATE.history.push(action);

    if (action.type === 'transform') {
        const mesh = action.mesh;
        if (mesh && action.current) {
            mesh.position.x = action.current.x;
            mesh.position.z = action.current.z;
            mesh.rotation.y = action.current.rotY;
            mesh.scale.x = action.current.scaleX;
            mesh.scale.z = action.current.scaleZ;
            mesh.userData._prevTransform = { ...action.current };

            const wallId = action.wallId;
            if (EDITOR_STATE.changes.modified[wallId]) {
                EDITOR_STATE.changes.modified[wallId].x = action.current.x;
                EDITOR_STATE.changes.modified[wallId].z = action.current.z;
                EDITOR_STATE.changes.modified[wallId].rotY = action.current.rotY;
                EDITOR_STATE.changes.modified[wallId].scaleX = action.current.scaleX;
                EDITOR_STATE.changes.modified[wallId].scaleZ = action.current.scaleZ;
            }
        }
    } else if (action.type === 'delete') {
        const mesh = action.mesh;
        if (mesh) {
            mesh.visible = false;
            mesh.userData.isDeleted = true;
        }
        if (!EDITOR_STATE.changes.deleted.includes(action.wallId)) {
            EDITOR_STATE.changes.deleted.push(action.wallId);
        }
    } else if (action.type === 'delete_custom') {
        const mesh = action.mesh;
        if (mesh) {
            mesh.visible = false;
            mesh.userData.isDeleted = true;
        }
        if (action.wallData) {
            const idx = EDITOR_STATE.changes.added.findIndex(item => item.id === action.wallData.id);
            if (idx !== -1) EDITOR_STATE.changes.added.splice(idx, 1);
        }
    } else if (action.type === 'add') {
        const mesh = action.mesh;
        if (mesh) {
            mesh.visible = true;
            mesh.userData.isDeleted = false;
        }
        if (action.wallData) {
            EDITOR_STATE.changes.added.push(action.wallData);
        }
    }

    saveEditorChanges();
    updateInspectorUI();
    showToast('↪️ Действие возвращено (Redo)');
    if (typeof requestRender === 'function') requestRender(20);
}

// Клавиатурные сокращения
function onEditorKeyDown(e) {
    // Игнорируем нажатия, когда курсор в текстовом поле input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Включение/выключение редактора по клавише E
    if (e.key === 'e' || e.key === 'E' || e.key === 'у' || e.key === 'У') {
        if (!e.ctrlKey && !e.altKey && !e.metaKey) {
            toggleEditor();
            return;
        }
    }

    if (!EDITOR_STATE.enabled) return;

    // Undo: Ctrl+Z
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z' || e.key === 'я' || e.key === 'Я') && !e.shiftKey) {
        e.preventDefault();
        undoEditorAction();
        return;
    }

    // Redo: Ctrl+Y или Ctrl+Shift+Z
    if ((e.ctrlKey || e.metaKey) && ((e.key === 'y' || e.key === 'Y') || (e.shiftKey && (e.key === 'z' || e.key === 'Z')))) {
        e.preventDefault();
        redoEditorAction();
        return;
    }

    // Дублирование: Ctrl+D
    if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В')) {
        e.preventDefault();
        duplicateSelectedWall();
        return;
    }

    // Удаление: Delete или Backspace
    if (e.key === 'Delete' || e.key === 'Backspace') {
        if (EDITOR_STATE.selected) {
            e.preventDefault();
            deleteSelectedWall();
            return;
        }
    }

    // Escape: снятие выделения или отмена рисования
    if (e.key === 'Escape') {
        if (EDITOR_STATE.isDrawing) {
            cancelDrawingWall();
        } else {
            deselectWall();
        }
        return;
    }

    // Режимы трансформации
    if (e.key === 'w' || e.key === 'W' || e.key === 'g' || e.key === 'G') {
        setTransformMode('translate');
    } else if (e.key === 'r' || e.key === 'R') {
        setTransformMode('rotate');
    } else if (e.key === 's' || e.key === 'S') {
        setTransformMode('scale');
    }
}

// Сброс всех изменений к заводскому виду
function resetAllEditorChanges() {
    if (!confirm('Вы уверены, что хотите сбросить ВСЕ внесённые правки стен к исходному виду модели?')) {
        return;
    }

    localStorage.removeItem(EDITOR_STORAGE_KEY);
    EDITOR_STATE.changes = { modified: {}, deleted: [], added: [] };
    EDITOR_STATE.history = [];
    EDITOR_STATE.redoStack = [];

    // Перезагрузка страницы для чистого восстановления
    window.location.reload();
}

// Генерация экспортного JS-кода
function generateExportJSCode() {
    const { modified, deleted, added } = EDITOR_STATE.changes;
    const lines = [];

    lines.push('// ==========================================');
    lines.push('// ЭКСПОРТ ИЗМЕНЕНИЙ СТЕН 3D-МОДЕЛИ КОЛЛЕДЖА');
    lines.push(`// Сгенерировано: ${new Date().toLocaleString('ru-RU')}`);
    lines.push('// ==========================================\n');

    // 1. Добавленные стены
    if (added && added.length > 0) {
        lines.push('// --- 1. НОВЫЕ ДОБАВЛЕННЫЕ СТЕНЫ ---');
        added.forEach((item, idx) => {
            const bldg = item.building || 1;
            const floor = item.floor || 1;
            const groupName = `bldg${bldg}FloorGroups[${floor}]`;
            const x = item.x.toFixed(2);
            const z = item.z.toFixed(2);
            const len = (item.len * (item.scaleX || 1)).toFixed(2);
            const thickness = (item.thickness * (item.scaleZ || 1)).toFixed(2);
            const rotDeg = THREE.MathUtils.radToDeg(item.rotY || 0).toFixed(1);

            // Крайние точки стены
            const half = len / 2;
            const cos = Math.cos(-item.rotY || 0);
            const sin = Math.sin(-item.rotY || 0);
            const x1 = (item.x - cos * half).toFixed(2);
            const z1 = (item.z - sin * half).toFixed(2);
            const x2 = (item.x + cos * half).toFixed(2);
            const z2 = (item.z + sin * half).toFixed(2);

            lines.push(`// Новая стена #${idx + 1} (Корпус ${bldg}, Этаж ${floor}, поворот ${rotDeg}°):`);
            lines.push(`addArbitraryWallSegment(${groupName}, ${x1}, ${z1}, ${x2}, ${z2}, ${thickness}, ${item.isDoor ? 'true' : 'false'});`);
            lines.push('');
        });
    }

    // 2. Модифицированные стены
    const modKeys = Object.keys(modified || {});
    if (modKeys.length > 0) {
        lines.push('// --- 2. ПЕРЕМЕЩЕННЫЕ / ИЗМЕНЕННЫЕ СТЕНЫ ---');
        modKeys.forEach((id, idx) => {
            const m = modified[id];
            const bldg = m.building || 1;
            const floor = m.floor || 1;
            const groupName = `bldg${bldg}FloorGroups[${floor}]`;

            const len = m.len || 3.0;
            const thickness = m.thickness || 0.18;
            const half = len / 2;
            const cos = Math.cos(-m.rotY || 0);
            const sin = Math.sin(-m.rotY || 0);
            const x1 = (m.x - cos * half).toFixed(2);
            const z1 = (m.z - sin * half).toFixed(2);
            const x2 = (m.x + cos * half).toFixed(2);
            const z2 = (m.z + sin * half).toFixed(2);

            lines.push(`// Модификация #${idx + 1} (${id}) -> Корпус ${bldg}, Этаж ${floor}:`);
            lines.push(`addArbitraryWallSegment(${groupName}, ${x1}, ${z1}, ${x2}, ${z2}, ${thickness.toFixed(2)});`);
            lines.push('');
        });
    }

    // 3. Удаленные стены
    if (deleted && deleted.length > 0) {
        lines.push('// --- 3. УДАЛЕННЫЕ СТЕНЫ ИЗ ИСХОДНОЙ МОДЕЛИ ---');
        deleted.forEach((id, idx) => {
            lines.push(`// Удалить/закомментировать стену #${idx + 1}: ${id}`);
        });
        lines.push('');
    }

    if (lines.length <= 4) {
        return '// Изменений нет. Включите режим редактора, передвиньте или добавьте стены.';
    }

    return lines.join('\n');
}

// Открытие модального окна экспорта
function openExportModal() {
    const modal = document.getElementById('editor-export-modal');
    if (!modal) return;

    const jsCode = generateExportJSCode();
    const jsonCode = JSON.stringify(EDITOR_STATE.changes, null, 2);

    const txtJs = document.getElementById('editor-export-js');
    const txtJson = document.getElementById('editor-export-json');
    const statsEl = document.getElementById('editor-export-stats');

    if (txtJs) txtJs.value = jsCode;
    if (txtJson) txtJson.value = jsonCode;

    const modCount = Object.keys(EDITOR_STATE.changes.modified).length;
    const delCount = EDITOR_STATE.changes.deleted.length;
    const addCount = EDITOR_STATE.changes.added.length;

    if (statsEl) {
        statsEl.innerHTML = `
            <div class="flex flex-wrap items-center gap-3 text-xs">
                <span class="px-2 py-1 rounded bg-sky-950/80 border border-sky-700/60 text-sky-200">
                    ↔️ Изменено: <strong>${modCount}</strong>
                </span>
                <span class="px-2 py-1 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-200">
                    ➕ Добавлено: <strong>${addCount}</strong>
                </span>
                <span class="px-2 py-1 rounded bg-rose-950/80 border border-rose-700/60 text-rose-200">
                    🗑️ Удалено: <strong>${delCount}</strong>
                </span>
            </div>
        `;
    }

    modal.classList.remove('hidden');
}

function closeExportModal() {
    const modal = document.getElementById('editor-export-modal');
    if (modal) modal.classList.add('hidden');
}

// Импорт JSON
function importEditorJSON() {
    const raw = prompt('Вставьте JSON с сохранёнными изменениями редактора:');
    if (!raw) return;

    try {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.modified || parsed.deleted || parsed.added)) {
            localStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(parsed));
            showToast('✅ Изменения успешно импортированы! Перезагрузка...');
            setTimeout(() => window.location.reload(), 600);
        } else {
            alert('Некорректный формат JSON данных');
        }
    } catch (e) {
        alert('Ошибка парсинга JSON: ' + e.message);
    }
}

// Скачивание JSON файла
function downloadExportFile() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(EDITOR_STATE.changes, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `college3d_edits_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
    dlAnchor.remove();
}

// Всплывающие уведомления (Toast)
function showToast(message) {
    let toast = document.getElementById('editor-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'editor-toast';
        toast.className = 'fixed bottom-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none glass-panel px-4 py-2 rounded-xl text-xs text-slate-100 font-medium shadow-2xl transition-all duration-300 opacity-0 translate-y-3';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.remove('opacity-0', 'translate-y-3');
    toast.classList.add('opacity-100', 'translate-y-0');

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', 'translate-y-3');
    }, 2800);
}

// Обновление бейджа количества правок
function updateEditorBadge() {
    const badge = document.getElementById('editor-changes-badge');
    if (!badge) return;

    const total = Object.keys(EDITOR_STATE.changes.modified).length +
        EDITOR_STATE.changes.deleted.length +
        EDITOR_STATE.changes.added.length;

    if (total > 0) {
        badge.textContent = total;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// Обновление панели инспектора параметров выделенного объекта
function updateInspectorUI() {
    const card = document.getElementById('editor-inspector-card');
    if (!card) return;

    const mesh = EDITOR_STATE.selected;
    if (!mesh) {
        card.classList.add('hidden');
        return;
    }

    card.classList.remove('hidden');

    const bldg = mesh.userData.building || 1;
    const floor = mesh.userData.floor || 1;
    const isDoor = !!mesh.userData.isDoor;
    const baseLen = mesh.userData.len || 3.0;
    const baseThickness = mesh.userData.thickness || 0.18;

    const curLen = (baseLen * mesh.scale.x).toFixed(2);
    const curThickness = (baseThickness * mesh.scale.z).toFixed(2);
    const curX = mesh.position.x.toFixed(2);
    const curZ = mesh.position.z.toFixed(2);
    const deg = Math.round(THREE.MathUtils.radToDeg(mesh.rotation.y) % 360);

    const titleEl = document.getElementById('inspector-title');
    if (titleEl) {
        titleEl.textContent = `${isDoor ? '🚪 Дверной проём' : '🧱 Стена'} (Корпус ${bldg}, Этаж ${floor})`;
    }

    const inpX = document.getElementById('inspector-pos-x');
    const inpZ = document.getElementById('inspector-pos-z');
    const inpLen = document.getElementById('inspector-len');
    const inpRot = document.getElementById('inspector-rot');
    const inpThick = document.getElementById('inspector-thickness');

    if (inpX) inpX.value = curX;
    if (inpZ) inpZ.value = curZ;
    if (inpLen) inpLen.value = curLen;
    if (inpRot) inpRot.value = deg;
    if (inpThick) inpThick.value = curThickness;
}

// Применение правок из инпутов инспектора
function applyInspectorInput(prop, val) {
    const mesh = EDITOR_STATE.selected;
    if (!mesh) return;

    const num = parseFloat(val);
    if (isNaN(num)) return;

    const baseLen = mesh.userData.len || 3.0;
    const baseThickness = mesh.userData.thickness || 0.18;

    if (prop === 'x') mesh.position.x = num;
    else if (prop === 'z') mesh.position.z = num;
    else if (prop === 'rot') mesh.rotation.y = THREE.MathUtils.degToRad(num);
    else if (prop === 'len') mesh.scale.x = Math.max(0.05, num / baseLen);
    else if (prop === 'thickness') mesh.scale.z = Math.max(0.02, num / baseThickness);

    commitSelectedTransform();
    saveEditorChanges();
    if (typeof requestRender === 'function') requestRender(15);
}

// Создание плавающей панели редактора и модалки экспорта в DOM
function createEditorDOM() {
    // 1. Плавающая панель редактора
    const panel = document.createElement('div');
    panel.id = 'editor-floating-panel';
    panel.className = 'ui-overlay hidden fixed top-16 left-3 md:left-4 z-30 glass-panel rounded-2xl p-3 w-[calc(100vw-24px)] md:w-80 shadow-2xl flex flex-col gap-2.5 text-xs border border-sky-500/30';
    panel.innerHTML = `
        <!-- Шапка панели -->
        <div class="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
            <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                <span class="font-bold text-slate-100 uppercase tracking-wider text-[11px]">Редактор стен</span>
            </div>
            <div class="flex items-center gap-1">
                <button id="btn-editor-undo" title="Отменить (Ctrl+Z)" class="btn-interactive p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                </button>
                <button id="btn-editor-redo" title="Повторить (Ctrl+Y)" class="btn-interactive p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                    </svg>
                </button>
                <button id="btn-editor-close" title="Закрыть редактор (E)" class="btn-interactive p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- Тулбар режимов гизмо: Перемещение / Вращение / Масштаб -->
        <div class="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            <button class="editor-mode-btn btn-interactive flex-1 py-1.5 px-2 rounded-lg text-center font-medium active text-[11px] transition" data-mode="translate" title="Перемещение по полу (G)">
                ↔️ Двигать
            </button>
            <button class="editor-mode-btn btn-interactive flex-1 py-1.5 px-2 rounded-lg text-center font-medium text-[11px] transition" data-mode="rotate" title="Вращение вокруг вертикали (R)">
                🔄 Поворот
            </button>
            <button class="editor-mode-btn btn-interactive flex-1 py-1.5 px-2 rounded-lg text-center font-medium text-[11px] transition" data-mode="scale" title="Растяжение длины (S)">
                📏 Длина
            </button>
        </div>

        <!-- Быстрые действия со стенами -->
        <div class="grid grid-cols-2 gap-1.5">
            <button id="btn-editor-add-wall" class="btn-interactive py-1.5 px-2 rounded-lg bg-sky-950/80 hover:bg-sky-900 border border-sky-600/60 text-sky-200 font-medium flex items-center justify-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Новая стена</span>
            </button>
            <button id="btn-editor-draw-wall" class="btn-interactive py-1.5 px-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-slate-200 font-medium flex items-center justify-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Нарисовать</span>
            </button>
        </div>

        <!-- Привязка к сетке (Snap) -->
        <div class="flex items-center justify-between bg-slate-900/40 px-2.5 py-1.5 rounded-lg border border-slate-800 text-[11px]">
            <span class="text-slate-400">Сетка (Snap):</span>
            <div class="flex items-center gap-1">
                <select id="editor-snap-select" class="bg-slate-800 text-slate-200 rounded px-1.5 py-0.5 border border-slate-700 text-[11px] outline-none">
                    <option value="0.05">0.05 м</option>
                    <option value="0.1" selected>0.10 м</option>
                    <option value="0.25">0.25 м</option>
                    <option value="0.5">0.50 м</option>
                    <option value="1.0">1.00 м</option>
                    <option value="0">Без сетки</option>
                </select>
            </div>
        </div>

        <!-- Инспектор параметров выделенной стены -->
        <div id="editor-inspector-card" class="hidden flex flex-col gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-sky-500/40 shadow-inner">
            <div class="flex items-center justify-between pb-1 border-b border-slate-800">
                <span id="inspector-title" class="font-semibold text-sky-200 text-[11px] truncate">Стена</span>
                <span class="text-[9px] text-slate-400 font-mono bg-slate-800 px-1 py-0.5 rounded">ID</span>
            </div>

            <!-- Координаты X и Z -->
            <div class="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                    <label class="text-slate-400 block mb-0.5">Позиция X (м):</label>
                    <input id="inspector-pos-x" type="number" step="0.1" class="w-full bg-slate-800 text-slate-100 rounded px-2 py-1 border border-slate-700 text-xs font-mono">
                </div>
                <div>
                    <label class="text-slate-400 block mb-0.5">Позиция Z (м):</label>
                    <input id="inspector-pos-z" type="number" step="0.1" class="w-full bg-slate-800 text-slate-100 rounded px-2 py-1 border border-slate-700 text-xs font-mono">
                </div>
            </div>

            <!-- Длина и Угол -->
            <div class="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                    <label class="text-slate-400 block mb-0.5">Длина (м):</label>
                    <input id="inspector-len" type="number" step="0.1" min="0.1" class="w-full bg-slate-800 text-slate-100 rounded px-2 py-1 border border-slate-700 text-xs font-mono">
                </div>
                <div>
                    <label class="text-slate-400 block mb-0.5">Поворот (°):</label>
                    <div class="flex items-center gap-1">
                        <input id="inspector-rot" type="number" step="15" class="w-full bg-slate-800 text-slate-100 rounded px-2 py-1 border border-slate-700 text-xs font-mono">
                        <button id="btn-inspector-rot90" title="Повернуть на 90°" class="btn-interactive px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px]">
                            ⟳90°
                        </button>
                    </div>
                </div>
            </div>

            <!-- Толщина -->
            <div class="flex items-center justify-between text-[11px]">
                <label class="text-slate-400">Толщина (м):</label>
                <input id="inspector-thickness" type="number" step="0.02" min="0.05" class="w-24 bg-slate-800 text-slate-100 rounded px-2 py-0.5 border border-slate-700 text-xs font-mono text-right">
            </div>

            <!-- Действия: Дублировать / Удалить -->
            <div class="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800">
                <button id="btn-inspector-dup" class="btn-interactive py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center font-medium">
                    📋 Дублировать
                </button>
                <button id="btn-inspector-del" class="btn-interactive py-1 px-2 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/60 text-center font-medium">
                    🗑️ Удалить
                </button>
            </div>
        </div>

        <!-- Кнопки экспорта правок и сброса -->
        <div class="flex items-center gap-1.5 pt-1 border-t border-slate-700/60">
            <button id="btn-editor-export" class="btn-interactive flex-1 py-1.5 px-2 rounded-lg bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-600/70 text-emerald-200 font-semibold flex items-center justify-center gap-1.5 shadow-sm">
                <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>Экспорт правок</span>
            </button>
            <button id="btn-editor-reset" title="Сбросить все правки к оригиналу" class="btn-interactive p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700/80">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
    `;

    document.body.appendChild(panel);

    // 2. Модальное окно экспорта кода
    const modal = document.createElement('div');
    modal.id = 'editor-export-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 md:p-6 hidden';
    modal.innerHTML = `
        <div class="glass-panel w-full max-w-2xl rounded-2xl p-4 md:p-6 shadow-2xl flex flex-col gap-4 border border-sky-500/40 max-h-[92vh] overflow-hidden">
            <div class="flex items-center justify-between pb-2 border-b border-slate-700/60">
                <div>
                    <h2 class="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                        <span>💾 Экспорт изменений 3D-модели</span>
                    </h2>
                    <p class="text-[11px] text-slate-400 mt-0.5">Скопируйте сгенерированный код или передайте файл разработчику</p>
                </div>
                <button id="btn-close-export-modal" class="btn-interactive p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Статистика изменений -->
            <div id="editor-export-stats"></div>

            <!-- Вкладки JS / JSON -->
            <div class="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button id="tab-btn-js" class="btn-interactive py-1 px-3 rounded-lg bg-sky-500 text-slate-950 font-bold text-xs">
                    JavaScript код
                </button>
                <button id="tab-btn-json" class="btn-interactive py-1 px-3 rounded-lg bg-slate-800 text-slate-300 font-medium text-xs hover:bg-slate-700">
                    JSON данные
                </button>
            </div>

            <!-- Поле с кодом JS -->
            <div id="export-pane-js" class="flex-1 flex flex-col gap-2 overflow-hidden">
                <textarea id="editor-export-js" readonly class="w-full h-64 md:h-80 bg-slate-950 text-sky-200 font-mono text-xs p-3 rounded-xl border border-slate-800 custom-scroll outline-none select-all"></textarea>
                <div class="flex items-center justify-between gap-2">
                    <button id="btn-copy-export-js" class="btn-interactive flex-1 py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        <span>Скопировать JS-код в буфер</span>
                    </button>
                </div>
            </div>

            <!-- Поле с JSON -->
            <div id="export-pane-json" class="hidden flex-1 flex flex-col gap-2 overflow-hidden">
                <textarea id="editor-export-json" readonly class="w-full h-64 md:h-80 bg-slate-950 text-emerald-200 font-mono text-xs p-3 rounded-xl border border-slate-800 custom-scroll outline-none select-all"></textarea>
                <div class="flex items-center justify-between gap-2">
                    <button id="btn-copy-export-json" class="btn-interactive flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        <span>Скопировать JSON</span>
                    </button>
                    <button id="btn-download-export-json" class="btn-interactive py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 border border-slate-700">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Скачать файл</span>
                    </button>
                    <button id="btn-import-export-json" class="btn-interactive py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 border border-slate-700">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
                        </svg>
                        <span>Импорт</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Привязываем события DOM
    bindEditorEvents();
}

// Привязка обработчиков событий элементов UI редактора
function bindEditorEvents() {
    // Режимы трансформации
    document.querySelectorAll('.editor-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => setTransformMode(btn.dataset.mode));
    });

    // Добавление / Рисование / Дублирование / Удаление
    const btnAdd = document.getElementById('btn-editor-add-wall');
    if (btnAdd) btnAdd.addEventListener('click', addNewWall);

    const btnDraw = document.getElementById('btn-editor-draw-wall');
    if (btnDraw) {
        btnDraw.addEventListener('click', () => {
            if (EDITOR_STATE.isDrawing) cancelDrawingWall();
            else startDrawingWall();
        });
    }

    const btnUndo = document.getElementById('btn-editor-undo');
    if (btnUndo) btnUndo.addEventListener('click', undoEditorAction);

    const btnRedo = document.getElementById('btn-editor-redo');
    if (btnRedo) btnRedo.addEventListener('click', redoEditorAction);

    const btnClose = document.getElementById('btn-editor-close');
    if (btnClose) btnClose.addEventListener('click', () => toggleEditor(false));

    const snapSelect = document.getElementById('editor-snap-select');
    if (snapSelect) {
        snapSelect.addEventListener('change', (e) => setSnapGrid(e.target.value));
    }

    // Инспектор
    const btnDup = document.getElementById('btn-inspector-dup');
    if (btnDup) btnDup.addEventListener('click', duplicateSelectedWall);

    const btnDel = document.getElementById('btn-inspector-del');
    if (btnDel) btnDel.addEventListener('click', deleteSelectedWall);

    const btnRot90 = document.getElementById('btn-inspector-rot90');
    if (btnRot90) btnRot90.addEventListener('click', () => rotateSelectedBy90(1));

    // Инпуты инспектора
    const inpX = document.getElementById('inspector-pos-x');
    if (inpX) inpX.addEventListener('change', (e) => applyInspectorInput('x', e.target.value));

    const inpZ = document.getElementById('inspector-pos-z');
    if (inpZ) inpZ.addEventListener('change', (e) => applyInspectorInput('z', e.target.value));

    const inpLen = document.getElementById('inspector-len');
    if (inpLen) inpLen.addEventListener('change', (e) => applyInspectorInput('len', e.target.value));

    const inpRot = document.getElementById('inspector-rot');
    if (inpRot) inpRot.addEventListener('change', (e) => applyInspectorInput('rot', e.target.value));

    const inpThick = document.getElementById('inspector-thickness');
    if (inpThick) inpThick.addEventListener('change', (e) => applyInspectorInput('thickness', e.target.value));

    // Экспорт / Сброс
    const btnExport = document.getElementById('btn-editor-export');
    if (btnExport) btnExport.addEventListener('click', openExportModal);

    const btnReset = document.getElementById('btn-editor-reset');
    if (btnReset) btnReset.addEventListener('click', resetAllEditorChanges);

    // Модальное окно
    const btnCloseModal = document.getElementById('btn-close-export-modal');
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeExportModal);

    const tabJs = document.getElementById('tab-btn-js');
    const tabJson = document.getElementById('tab-btn-json');
    const paneJs = document.getElementById('export-pane-js');
    const paneJson = document.getElementById('export-pane-json');

    if (tabJs && tabJson && paneJs && paneJson) {
        tabJs.addEventListener('click', () => {
            tabJs.className = 'btn-interactive py-1 px-3 rounded-lg bg-sky-500 text-slate-950 font-bold text-xs';
            tabJson.className = 'btn-interactive py-1 px-3 rounded-lg bg-slate-800 text-slate-300 font-medium text-xs hover:bg-slate-700';
            paneJs.classList.remove('hidden');
            paneJson.classList.add('hidden');
        });

        tabJson.addEventListener('click', () => {
            tabJson.className = 'btn-interactive py-1 px-3 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs';
            tabJs.className = 'btn-interactive py-1 px-3 rounded-lg bg-slate-800 text-slate-300 font-medium text-xs hover:bg-slate-700';
            paneJson.classList.remove('hidden');
            paneJs.classList.add('hidden');
        });
    }

    const btnCopyJs = document.getElementById('btn-copy-export-js');
    if (btnCopyJs) {
        btnCopyJs.addEventListener('click', () => {
            const txt = document.getElementById('editor-export-js');
            if (txt) {
                txt.select();
                navigator.clipboard.writeText(txt.value);
                showToast('📋 JS-код скопирован в буфер обмена!');
            }
        });
    }

    const btnCopyJson = document.getElementById('btn-copy-export-json');
    if (btnCopyJson) {
        btnCopyJson.addEventListener('click', () => {
            const txt = document.getElementById('editor-export-json');
            if (txt) {
                txt.select();
                navigator.clipboard.writeText(txt.value);
                showToast('📋 JSON скопирован в буфер обмена!');
            }
        });
    }

    const btnDownload = document.getElementById('btn-download-export-json');
    if (btnDownload) btnDownload.addEventListener('click', downloadExportFile);

    const btnImport = document.getElementById('btn-import-export-json');
    if (btnImport) btnImport.addEventListener('click', importEditorJSON);
}
