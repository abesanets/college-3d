// ==========================================
// ГЛАВНЫЙ МОДУЛЬ СЦЕНЫ, СБОРКИ И ЦИКЛА РЕНДЕРИНГА
// ==========================================

function init() {
    const container = document.getElementById('canvas-container');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x16191e);

    camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.2, 700);
    camera.position.set(16, 68, 56);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Инициализация кастомных контролов с зумом к позиции курсора
    controls = initControls(camera, renderer.domElement);

    // Освещение сцены
    const ambientLight = new THREE.AmbientLight(0xdbe2ea, 0.76);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.58);
    dirLight1.position.set(35, 95, 45);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    dirLight1.shadow.camera.near = 5;
    dirLight1.shadow.camera.far = 280;
    const d = 85;
    dirLight1.shadow.camera.left = -d;
    dirLight1.shadow.camera.right = d;
    dirLight1.shadow.camera.top = d;
    dirLight1.shadow.camera.bottom = -d;
    dirLight1.shadow.bias = -0.0005;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x94a3b8, 0.32);
    dirLight2.position.set(-35, 55, -45);
    scene.add(dirLight2);

    // Чертёжная сетка в основании
    const grid = new THREE.GridHelper(320, 320, 0x2e3540, 0x20252d);
    grid.position.set(15, -0.18, -18);
    scene.add(grid);

    // Создаём группы для 1–7 этажей и подгруппы Корпусов 1, 2, 3 и 4
    for (let f = 1; f <= 7; f++) {
        floorGroups[f] = new THREE.Group();
        bldg1FloorGroups[f] = new THREE.Group();
        bldg2FloorGroups[f] = new THREE.Group();
        bldg3FloorGroups[f] = new THREE.Group();
        bldg4FloorGroups[f] = new THREE.Group();
        floorGroups[f].add(bldg1FloorGroups[f]);
        floorGroups[f].add(bldg2FloorGroups[f]);
        floorGroups[f].add(bldg3FloorGroups[f]);
        floorGroups[f].add(bldg4FloorGroups[f]);
        scene.add(floorGroups[f]);
    }
    alignmentGuidesGroup = new THREE.Group();
    scene.add(alignmentGuidesGroup);

    stairValidationGroup = new THREE.Group();
    scene.add(stairValidationGroup);

    // Сборка Корпуса 1 (Этажи 1–7)
    buildFloor1(bldg1FloorGroups[1]);
    buildFloor2(bldg1FloorGroups[2]);
    buildFloor3(bldg1FloorGroups[3]);
    buildFloor4(bldg1FloorGroups[4]);
    buildFloor5(bldg1FloorGroups[5]);
    buildFloor6(bldg1FloorGroups[6]);
    buildFloor7(bldg1FloorGroups[7]);

    // Сборка Корпуса 2 (Этажи 1–3)
    buildBuilding2Floor1(bldg2FloorGroups[1]);
    buildBuilding2Floor2(bldg2FloorGroups[2]);
    buildBuilding2Floor3(bldg2FloorGroups[3]);

    // Сборка Корпуса 3 (Этажи 1–2)
    buildBuilding3Floor1(bldg3FloorGroups[1]);
    buildBuilding3Floor2(bldg3FloorGroups[2]);

    // Сборка Корпуса 4 (Этажи 1–3) и переходов 2-го этажа к Корпусу 3 и Корпусу 2
    buildBuilding4Floor1(bldg4FloorGroups[1]);
    buildBuilding4Floor2(bldg4FloorGroups[2]);
    buildBuilding4Floor3(bldg4FloorGroups[3]);

    buildAlignmentGuides();
    buildStairValidationAxes();

    recalcTargetPositions();
    for (let f = 1; f <= 7; f++) {
        floorGroups[f].position.copy(STATE.targetPos[f]);
    }

    updateLabelsVisibility();
    updateAlignmentGuides();
    updateStairValidationAxes();
    setupUI();

    window.addEventListener('resize', onWindowResize);
    animate();
}

function buildStairValidationAxes() {
    STAIR_SHAFTS_VALIDATION.forEach(s => {
        const cx = (s.x1 + s.x2) / 2;
        const cz = (s.z1 + s.z2) / 2;
        const w = Math.abs(s.x2 - s.x1);
        const d = Math.abs(s.z2 - s.z1);

        const pts = [
            new THREE.Vector3(cx, -0.5, cz),
            new THREE.Vector3(cx, 25, cz)
        ];
        const lineGeom = new THREE.BufferGeometry().setFromPoints(pts);
        const centerLine = new THREE.Line(lineGeom, MATERIALS.stairAxisLine);
        centerLine.computeLineDistances();
        stairValidationGroup.add(centerLine);

        const boxGeom = new THREE.BoxGeometry(w, 1, d);
        const boxEdges = new THREE.EdgesGeometry(boxGeom);
        const wireframeBox = new THREE.LineSegments(boxEdges, MATERIALS.stairBoxEdge);
        wireframeBox.position.set(cx, 1, cz);
        stairValidationGroup.add(wireframeBox);

        stairValidationItems.push({ ...s, cx, cz, centerLine, wireframeBox });
    });
}

function updateStairValidationAxes() {
    const show = STATE.showStairAxes && (STATE.mode === 'all' || STATE.mode === 'slice');
    stairValidationGroup.visible = show;
    if (!show) return;

    const botY = floorGroups[1].position.y;
    const maxActiveF = STATE.mode === 'slice' ? STATE.sliceMaxFloor : 7;

    stairValidationItems.forEach(item => {
        const effectiveMax = Math.min(item.maxFloor, maxActiveF);
        const visibleByBuilding =
            (effectiveMax >= 1) &&
            (STATE.buildingFilter === 'both' ||
            (STATE.buildingFilter === '1' && item.bldg === 1) ||
            (STATE.buildingFilter === '2' && item.bldg === 2) ||
            (STATE.buildingFilter === '3' && item.bldg === 3) ||
            (STATE.buildingFilter === '4' && item.bldg === 4));

        item.centerLine.visible = visibleByBuilding;
        item.wireframeBox.visible = visibleByBuilding;
        if (!visibleByBuilding) return;

        const topY = floorGroups[effectiveMax].position.y + STATE.wallHeight;
        const totalH = Math.max(0.5, topY - botY);

        const posAttr = item.centerLine.geometry.attributes.position;
        posAttr.setXYZ(0, item.cx, botY - 0.3, item.cz);
        posAttr.setXYZ(1, item.cx, topY + 0.8, item.cz);
        posAttr.needsUpdate = true;
        item.centerLine.computeLineDistances();

        item.wireframeBox.scale.y = totalH;
        item.wireframeBox.position.set(item.cx, botY + totalH / 2, item.cz);
    });
}

function buildAlignmentGuides() {
    const corners = [
        // Корпус 1 (все 7 этажей)
        { gx: -14.0, gz: -4.0, maxFloor: 7, bldg: 1 },
        { gx: -14.0, gz: 14.0, maxFloor: 7, bldg: 1 },
        { gx: 12.5, gz: 14.0, maxFloor: 7, bldg: 1 },
        { gx: 16.0, gz: -14.0, maxFloor: 7, bldg: 1 },
        { gx: -10.0, gz: -14.0, maxFloor: 7, bldg: 1 },
        // Корпус 2 (этажи 1–3)
        { gx: B2_X_START, gz: B2_Z_TOP, maxFloor: 3, bldg: 2 },
        { gx: B2_X_START, gz: B2_Z_BOT, maxFloor: 3, bldg: 2 },
        { gx: B2_X_END, gz: B2_Z_TOP, maxFloor: 3, bldg: 2 },
        { gx: B2_X_END, gz: B2_Z_BOT, maxFloor: 3, bldg: 2 },
        // Корпус 3 (этажи 1–2)
        { gx: B3_X_WEST, gz: B3_Z_SOUTH, maxFloor: 2, bldg: 3 },
        { gx: B3_X_EAST, gz: B3_Z_SOUTH, maxFloor: 2, bldg: 3 },
        { gx: B3_X_WEST, gz: B3_Z_NORTH, maxFloor: 2, bldg: 3 },
        { gx: B3_X_EAST, gz: B3_Z_NORTH, maxFloor: 2, bldg: 3 },
        // Корпус 4 (этажи 1–3)
        { gx: B4_X_WEST, gz: B4_Z_SOUTH, maxFloor: 3, bldg: 4 },
        { gx: B4_X_EAST, gz: B4_Z_SOUTH, maxFloor: 3, bldg: 4 },
        { gx: B4_X_WEST, gz: B4_Z_NORTH, maxFloor: 3, bldg: 4 },
        { gx: B4_X_EAST, gz: B4_Z_NORTH, maxFloor: 3, bldg: 4 }
    ];

    corners.forEach(item => {
        const pts = [
            new THREE.Vector3(item.gx, 0, item.gz),
            new THREE.Vector3(item.gx, 10, item.gz)
        ];
        const geom = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(geom, MATERIALS.guideLine);
        line.computeLineDistances();
        alignmentGuidesGroup.add(line);
        guideLines.push({ ...item, line });
    });
}

function updateAlignmentGuides() {
    const show = STATE.showGuides && (STATE.mode === 'all' || STATE.mode === 'slice');
    alignmentGuidesGroup.visible = show;
    if (!show) return;

    const botY = floorGroups[1].position.y;
    const maxActiveF = STATE.mode === 'slice' ? STATE.sliceMaxFloor : 7;

    guideLines.forEach(item => {
        const effectiveMax = Math.min(item.maxFloor, maxActiveF);
        const visibleByBuilding =
            (effectiveMax >= 1) &&
            (STATE.buildingFilter === 'both' ||
            (STATE.buildingFilter === '1' && item.bldg === 1) ||
            (STATE.buildingFilter === '2' && item.bldg === 2) ||
            (STATE.buildingFilter === '3' && item.bldg === 3) ||
            (STATE.buildingFilter === '4' && item.bldg === 4));

        item.line.visible = visibleByBuilding;
        if (!visibleByBuilding) return;

        const topY = floorGroups[effectiveMax].position.y + STATE.wallHeight;
        const posAttr = item.line.geometry.attributes.position;
        posAttr.setXYZ(0, item.gx, botY, item.gz);
        posAttr.setXYZ(1, item.gx, topY, item.gz);
        posAttr.needsUpdate = true;
        item.line.computeLineDistances();
    });
}

function isPointInFloorFootprint(lx, lz, floorNum, bldId = null) {
    const m = 0.22;
    const showB1 = STATE.buildingFilter === 'both' || STATE.buildingFilter === '1';
    const showB2 = STATE.buildingFilter === 'both' || STATE.buildingFilter === '2';
    const showB3 = STATE.buildingFilter === 'both' || STATE.buildingFilter === '3';
    const showB4 = STATE.buildingFilter === 'both' || STATE.buildingFilter === '4';

    if (showB1 && (!bldId || bldId === 1)) {
        if (lx >= -10.0 - m && lx <= 16.0 + m && lz >= -14.0 - m && lz <= -4.0 + m) return true;
        if (lx >= -14.0 - m && lx <= 16.0 + m && lz >= -4.0 - m && lz <= 4.0 + m) return true;
        if (lx >= -14.0 - m && lx <= 12.5 + m && lz >= 4.0 - m && lz <= 14.0 + m) return true;
        if (floorNum <= 3) {
            if (lx >= 16.0 - m && lx <= 20.4 + m && lz >= -9.5 - m && lz <= -2.2 + m) return true;
        }
    }

    if (showB2 && (!bldId || bldId === 2) && floorNum <= 3) {
        if (lx >= B2_X_START - m && lx <= B2_X_END + m && lz >= B2_Z_TOP - m && lz <= B2_Z_BOT + m) return true;
    }

    if (showB3 && (!bldId || bldId === 3) && floorNum <= 2) {
        if (lx >= B3_X_WEST - m && lx <= B3_X_EAST + m && lz >= B3_Z_NORTH - m && lz <= B3_Z_SOUTH + m) return true;
        if (lx >= B3_X_EAST - m && lx <= 15.6 + m && lz >= -47.6 - m && lz <= -44.0 + m) return true;
    }

    if (showB4 && (!bldId || bldId === 4) && floorNum <= 3) {
        if (lx >= B4_X_WEST - m && lx <= B4_X_EAST + m && lz >= B4_Z_NORTH - m && lz <= B4_Z_SOUTH + m) return true;
        if (lx >= B4_LK2_X1 - m && lx <= B4_LK2_X2 + m && lz >= B4_LK2_Z1 - m && lz <= B4_LK2_Z2 + m) return true;
        if (lx >= B4_LK3_X1 - m && lx <= B4_LK3_X2 + m && lz >= B4_LK3_Z1 - m && lz <= B4_LK3_Z2 + m) return true;
        if (lx >= B4_LK1_X1 - m && lx <= B4_LK1_X2 + m && lz >= B4_LK1_Z1 - m && lz <= B4_LK1_Z2 + m) return true;
        if (floorNum === 2) {
            if (lx >= 15.6 - m && lx <= B4_X_WEST + m && lz >= -46.8 - m && lz <= -44.2 + m) return true;
            if (lx >= 36.2 - m && lx <= B4_LK1_X1 + m && lz >= B4_Z_SOUTH - m && lz <= B2_Z_TOP + m) return true;
        }
    }
    return false;
}

const _tempLabelWorldPos = new THREE.Vector3();
function isLabelOccludedByUpperSlabs(labelItem, floorNum = null, bldId = null) {
    const f = floorNum !== null ? floorNum : labelItem.floor;
    const fg = floorGroups[f];
    if (!fg || !fg.visible) return true;

    if (labelItem.isVector3) {
        _tempLabelWorldPos.copy(labelItem);
    } else {
        _tempLabelWorldPos.set(
            fg.position.x + labelItem.localX,
            fg.position.y + labelItem.mesh.position.y,
            fg.position.z + labelItem.localZ
        );
    }

    const camPos = camera.position;
    const dy = _tempLabelWorldPos.y - camPos.y;

    for (let u = f + 1; u <= 7; u++) {
        const ug = floorGroups[u];
        if (!ug || !ug.visible) continue;

        const checkHeights = [ug.position.y, ug.position.y + STATE.wallHeight * 0.55];
        for (let i = 0; i < checkHeights.length; i++) {
            const planeY = checkHeights[i];
            if ((camPos.y > planeY && _tempLabelWorldPos.y < planeY) ||
                (camPos.y < planeY && _tempLabelWorldPos.y > planeY)) {
                const t = (planeY - camPos.y) / dy;
                if (t > 0.01 && t < 0.99) {
                    const hitX = camPos.x + t * (_tempLabelWorldPos.x - camPos.x) - ug.position.x;
                    const hitZ = camPos.z + t * (_tempLabelWorldPos.z - camPos.z) - ug.position.z;
                    if (isPointInFloorFootprint(hitX, hitZ, u, bldId)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function updateLabelsVisibility() {
    const showB1 = STATE.buildingFilter === 'both' || STATE.buildingFilter === '1';
    const showB2 = STATE.buildingFilter === 'both' || STATE.buildingFilter === '2';
    const showB3 = STATE.buildingFilter === 'both' || STATE.buildingFilter === '3';
    const showB4 = STATE.buildingFilter === 'both' || STATE.buildingFilter === '4';

    labelSprites.forEach(item => {
        if (!STATE.showLabels) {
            item.mesh.visible = false;
            return;
        }
        if (item.building === 1 && !showB1) {
            item.mesh.visible = false;
            return;
        }
        if (item.building === 2 && !showB2) {
            item.mesh.visible = false;
            return;
        }
        if (item.building === 3 && !showB3) {
            item.mesh.visible = false;
            return;
        }
        if (item.building === 4 && !showB4) {
            item.mesh.visible = false;
            return;
        }

        if (STATE.mode !== 'all' && STATE.mode !== 'slice' && STATE.mode !== 'sideBySide') {
            const activeFloor = parseInt(STATE.mode, 10);
            item.mesh.visible = (item.floor === activeFloor);
            return;
        }

        if (STATE.mode === 'slice' && item.floor > STATE.sliceMaxFloor) {
            item.mesh.visible = false;
            return;
        }

        if (STATE.mode === 'sideBySide' || (STATE.exploded && STATE.explodeGap > 0.2)) {
            item.mesh.visible = true;
            return;
        }

        if (!STATE.smartLabelOcclusion) {
            item.mesh.visible = true;
        } else {
            item.mesh.visible = !isLabelOccludedByUpperSlabs(item, item.floor, item.building);
        }
    });
}

// ==========================================
// ОПТИМИЗАЦИЯ: УМНОЕ СКРЫТИЕ ВНУТРЕННИХ СТЕН
// В режиме стопки скрываются ТОЛЬКО скрытые внутренние перегородки комнат,
// а внешние несущие стены (фасад) и плиты перекрытий ВСЕГДА остаются видимыми!
// ==========================================
function updateFloorsInteriorVisibility() {
    const isStack = (STATE.mode === 'all' || STATE.mode === 'slice') && (!STATE.exploded || STATE.explodeGap < 0.2) && (STATE.slabOpacity > 0.85);

    function setGroupInteriorVisibility(group, isTopFloor) {
        if (!group) return;
        // Внутренние стены и двери показываются, если этажи разнесены взрывом, либо это верхний этаж, либо плиты полупрозрачные
        const showInterior = !isStack || isTopFloor;

        group.traverse(child => {
            if (!child.userData) return;

            // Скрываем/показываем ТОЛЬКО внутренние перегородки, двери, ступени и таблички кабинетов
            if (child.userData.isInterior === true) {
                if (child.userData.isDoor) {
                    child.visible = showInterior && STATE.showDoors;
                } else {
                    child.visible = showInterior;
                }
            }
            // ВНЕШНИЕ СТЕНЫ и ПЛИТЫ ПЕРЕКРЫТИЙ ВСЕГДА ВИДНЫ!
            else if (child.userData.isInterior === false) {
                child.visible = true;
            }
        });
    }

    const maxF = STATE.mode === 'slice' ? STATE.sliceMaxFloor : 7;
    // Корпус 1: верхний отображаемый этаж
    for (let f = 1; f <= 7; f++) {
        setGroupInteriorVisibility(bldg1FloorGroups[f], f === Math.min(7, maxF));
    }
    // Корпус 2: верхний отображаемый этаж
    for (let f = 1; f <= 3; f++) {
        setGroupInteriorVisibility(bldg2FloorGroups[f], f === Math.min(3, maxF));
    }
    // Корпус 3: верхний отображаемый этаж
    for (let f = 1; f <= 2; f++) {
        setGroupInteriorVisibility(bldg3FloorGroups[f], f === Math.min(2, maxF));
    }
    // Корпус 4: верхний отображаемый этаж
    for (let f = 1; f <= 3; f++) {
        setGroupInteriorVisibility(bldg4FloorGroups[f], f === Math.min(3, maxF));
    }
}

function recalcTargetPositions() {
    const stepH = STATE.wallHeight + 0.25 + (STATE.exploded ? STATE.explodeGap : 0);
    const showB1 = STATE.buildingFilter === 'both' || STATE.buildingFilter === '1';
    const showB2 = STATE.buildingFilter === 'both' || STATE.buildingFilter === '2';
    const showB3 = STATE.buildingFilter === 'both' || STATE.buildingFilter === '3';
    const showB4 = STATE.buildingFilter === 'both' || STATE.buildingFilter === '4';

    for (let f = 1; f <= 7; f++) {
        bldg1FloorGroups[f].visible = showB1;
        bldg2FloorGroups[f].visible = showB2 && (f <= 3);
        bldg3FloorGroups[f].visible = showB3 && (f <= 2);
        bldg4FloorGroups[f].visible = showB4 && (f <= 3);
    }

    if (STATE.mode === 'all' || STATE.mode === 'slice') {
        const maxF = STATE.mode === 'slice' ? STATE.sliceMaxFloor : 7;
        for (let f = 1; f <= 7; f++) {
            floorGroups[f].visible = (f <= maxF);
            STATE.targetPos[f].set(0, stepH * (f - 1), 0);
        }
    } else if (STATE.mode === 'sideBySide') {
        for (let f = 1; f <= 7; f++) {
            floorGroups[f].visible = true;
        }
        STATE.targetPos[1].set(-96, 0, 42);
        STATE.targetPos[2].set(0, 0, 42);
        STATE.targetPos[3].set(96, 0, 42);
        STATE.targetPos[4].set(-54, 0, -45);
        STATE.targetPos[5].set(-18, 0, -45);
        STATE.targetPos[6].set(18, 0, -45);
        STATE.targetPos[7].set(54, 0, -45);
    } else {
        const selectedFloor = parseInt(STATE.mode, 10);
        for (let f = 1; f <= 7; f++) {
            floorGroups[f].visible = (f === selectedFloor);
            if (f === selectedFloor) {
                STATE.targetPos[f].set(0, 0, 0);
            }
        }
    }

    // Применяем умную оптимизацию видимости внутренностей
    updateFloorsInteriorVisibility();
    updateLabelsVisibility();
}

function updateWallHeights() {
    wallMeshes.forEach(m => {
        m.scale.y = STATE.wallHeight;
        m.position.y = STATE.wallHeight / 2;
    });

    doorMeshes.forEach(m => {
        m.scale.y = STATE.wallHeight;
        m.position.y = STATE.wallHeight / 2;
        m.visible = STATE.showDoors;
    });

    stairMeshes.forEach(st => {
        const stepH = Math.max(0.06, STATE.wallHeight * st.heightRatio);
        st.mesh.scale.y = stepH;
        st.mesh.position.y = (stepH / 2) + st.yOffset;
    });

    labelSprites.forEach(item => {
        item.mesh.position.y = 0.02;
    });

    recalcTargetPositions();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Оптимизированный цикл анимации:
// вызываем тяжелые проверки окклюзии меток не вслепую, а каждые несколько кадров
let frameCounter = 0;

function animate() {
    requestAnimationFrame(animate);

    for (let f = 1; f <= 7; f++) {
        floorGroups[f].position.lerp(STATE.targetPos[f], 0.11);
    }

    if (STATE.targetCamPos) {
        camera.position.lerp(STATE.targetCamPos, 0.12);
        if (camera.position.distanceTo(STATE.targetCamPos) < 0.15) {
            STATE.targetCamPos = null;
        }
    }
    if (STATE.targetControlsCenter) {
        controls.target.lerp(STATE.targetControlsCenter, 0.12);
        if (controls.target.distanceTo(STATE.targetControlsCenter) < 0.1) {
            STATE.targetControlsCenter = null;
        }
    }

    frameCounter++;
    if (frameCounter % 3 === 0) {
        updateAlignmentGuides();
        updateStairValidationAxes();
        updateLabelsVisibility();
    }

    controls.update();
    renderer.render(scene, camera);
}

window.onload = init;
