// ==========================================
// ОБРАБОТКА ПОЛЬЗОВАТЕЛЬСКОГО ИНТЕРФЕЙСА (UI)
// ==========================================

function updateExplodeButtonStyle() {
    const btnExplode = document.getElementById('btn-explode');
    if (!btnExplode) return;

    if (STATE.exploded && (STATE.mode === 'all' || STATE.mode === 'slice') && STATE.explodeGap > 0.2) {
        btnExplode.classList.add('explode-btn-active');
        btnExplode.innerHTML = '<span class="flex items-center justify-center gap-1.5"><svg class="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg> Собрать этажи</span>';
    } else {
        btnExplode.classList.remove('explode-btn-active');
        btnExplode.innerHTML = '<span class="flex items-center justify-center gap-1.5"><svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg> Разнести этажи</span>';
    }
}

function setBuildingFilter(bFilter) {
    STATE.buildingFilter = bFilter;
    document.querySelectorAll('.bldg-btn').forEach(b => b.classList.remove('active'));
    const targetBtn = document.getElementById('btn-bldg-' + bFilter);
    if (targetBtn) targetBtn.classList.add('active');

    // Камера сохраняет текущую точку обзора и зум пользователя без сброса

    recalcTargetPositions();
    updateAlignmentGuides();
    updateStairValidationAxes();
    saveSettings();
}

function setSliceFloor(newFloor) {
    newFloor = Math.max(1, Math.min(7, Math.round(newFloor)));
    STATE.sliceMaxFloor = newFloor;

    const sliderSlice = document.getElementById('slider-slice');
    const valSlice = document.getElementById('slice-val');
    if (sliderSlice) sliderSlice.value = newFloor;
    if (valSlice) valSlice.textContent = newFloor === 1 ? '1 эт.' : `1–${newFloor} эт.`;

    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));

    const subtitle = document.getElementById('status-subtitle');

    if (newFloor === 7) {
        STATE.mode = 'all';
        const btnAll = document.getElementById('btn-mode-all');
        if (btnAll) btnAll.classList.add('active');
        if (subtitle) subtitle.textContent = 'Все этажи комплекса: Корпус 1 (1–7 эт.) + Корпус 2 (1–3 эт.) + Корпус 3 (1–2 эт.) + Корпус 4 (1–3 эт.)';
    } else {
        STATE.mode = 'slice';
        if (subtitle) {
            const cutInfo = (newFloor === 6) ? '7-й этаж срезан' : `этажи ${(newFloor + 1)}–7 срезаны`;
            subtitle.textContent = `Срез сверху: отображаются этажи 1–${newFloor} (${cutInfo})`;
        }
    }

    recalcTargetPositions();
    updateAlignmentGuides();
    updateStairValidationAxes();
    updateExplodeButtonStyle();
    saveSettings();
}

function setMode(newMode) {
    STATE.mode = newMode;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));

    const subtitle = document.getElementById('status-subtitle');
    const sliderSlice = document.getElementById('slider-slice');
    const valSlice = document.getElementById('slice-val');

    if (newMode === 'all') {
        STATE.sliceMaxFloor = 7;
        if (sliderSlice) sliderSlice.value = 7;
        if (valSlice) valSlice.textContent = '1–7 эт.';
        const btnAll = document.getElementById('btn-mode-all');
        if (btnAll) btnAll.classList.add('active');
        if (subtitle) subtitle.textContent = 'Все этажи комплекса: Корпус 1 (1–7 эт.) + Корпус 2 (1–3 эт.) + Корпус 3 (1–2 эт.) + Корпус 4 (1–3 эт.)';
        // Сохраняем положение камеры без сброса
    } else if (newMode === 'sideBySide') {
        const btnSide = document.getElementById('btn-mode-side');
        if (btnSide) btnSide.classList.add('active');
        if (subtitle) subtitle.textContent = 'Сравнение рядом: Все этажи на одном уровне без наложений';
        STATE.targetControlsCenter = new THREE.Vector3(10, 0.5, 0);
        STATE.targetCamPos = new THREE.Vector3(10, 155, 95);
    } else {
        const btnFloor = document.getElementById('btn-mode-' + newMode);
        if (btnFloor) btnFloor.classList.add('active');
        if (subtitle) subtitle.textContent = FLOOR_DESCRIPTIONS[newMode] || '';
        // Сохраняем положение камеры без сброса
    }

    recalcTargetPositions();
    updateAlignmentGuides();
    updateStairValidationAxes();
    updateExplodeButtonStyle();
    saveSettings();
}

const SETTINGS_KEY = 'college_3d_complex_settings_v1';

function saveSettings() {
    try {
        const payload = {
            preset: STATE.preset || 'balance',
            showShadows: STATE.showShadows ?? true,
            wallHeight: STATE.wallHeight,
            slabOpacity: STATE.slabOpacity,
            showDoors: STATE.showDoors,
            showLabels: STATE.showLabels,
            smartLabelOcclusion: STATE.smartLabelOcclusion,
            showRoof: STATE.showRoof,
            showTerritory: STATE.showTerritory,
            showStairAxes: STATE.showStairAxes,
            showGuides: STATE.showGuides,
            showEdges: STATE.showEdges,
            buildingFilter: STATE.buildingFilter,
            mode: STATE.mode,
            sliceMaxFloor: STATE.sliceMaxFloor,
            explodeGap: STATE.explodeGap,
            exploded: STATE.exploded
        };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
    } catch (e) {
        console.warn('LocalStorage save error:', e);
    }
}

function restoreSavedSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return;
        const s = JSON.parse(raw);
        if (typeof s.preset === 'string') STATE.preset = s.preset;
        if (typeof s.showShadows === 'boolean') STATE.showShadows = s.showShadows;
        if (typeof s.wallHeight === 'number') STATE.wallHeight = s.wallHeight;
        if (typeof s.slabOpacity === 'number') STATE.slabOpacity = s.slabOpacity;
        if (typeof s.showDoors === 'boolean') STATE.showDoors = s.showDoors;
        if (typeof s.showLabels === 'boolean') STATE.showLabels = s.showLabels;
        if (typeof s.smartLabelOcclusion === 'boolean') STATE.smartLabelOcclusion = s.smartLabelOcclusion;
        if (typeof s.showRoof === 'boolean') STATE.showRoof = s.showRoof;
        if (typeof s.showTerritory === 'boolean') STATE.showTerritory = s.showTerritory;
        if (typeof s.showStairAxes === 'boolean') STATE.showStairAxes = s.showStairAxes;
        if (typeof s.showGuides === 'boolean') STATE.showGuides = s.showGuides;
        if (typeof s.showEdges === 'boolean') STATE.showEdges = s.showEdges;
        if (typeof s.buildingFilter === 'string') STATE.buildingFilter = s.buildingFilter;
        if (typeof s.mode === 'string') STATE.mode = s.mode;
        if (typeof s.sliceMaxFloor === 'number') STATE.sliceMaxFloor = s.sliceMaxFloor;
        if (typeof s.explodeGap === 'number') STATE.explodeGap = s.explodeGap;
        if (typeof s.exploded === 'boolean') STATE.exploded = s.exploded;
    } catch (e) {
        console.warn('LocalStorage load error:', e);
    }
}

function setupUI() {
    // Восстанавливаем сохранённые настройки из LocalStorage
    restoreSavedSettings();

    // 1. Кнопки пресетов графики и производительности
    document.getElementById('btn-preset-eco')?.addEventListener('click', () => applyPreset('eco'));
    document.getElementById('btn-preset-balance')?.addEventListener('click', () => applyPreset('balance'));
    document.getElementById('btn-preset-ultra')?.addEventListener('click', () => applyPreset('ultra'));
    if (typeof applyPreset === 'function') {
        applyPreset(STATE.preset || 'balance');
    }

    // 2. Выбор корпуса
    document.getElementById('btn-bldg-both')?.addEventListener('click', () => setBuildingFilter('both'));
    document.getElementById('btn-bldg-1')?.addEventListener('click', () => setBuildingFilter('1'));
    document.getElementById('btn-bldg-2')?.addEventListener('click', () => setBuildingFilter('2'));
    document.getElementById('btn-bldg-3')?.addEventListener('click', () => setBuildingFilter('3'));
    document.getElementById('btn-bldg-4')?.addEventListener('click', () => setBuildingFilter('4'));
    setBuildingFilter(STATE.buildingFilter || 'both');

    // 3. Режим этажей
    document.getElementById('btn-mode-all')?.addEventListener('click', () => setMode('all'));
    document.getElementById('btn-mode-side')?.addEventListener('click', () => setMode('sideBySide'));
    for (let f = 1; f <= 7; f++) {
        document.getElementById('btn-mode-' + f)?.addEventListener('click', () => setMode(String(f)));
    }

    // 4. Срез этажей сверху вниз
    const sliderSlice = document.getElementById('slider-slice');
    sliderSlice?.addEventListener('input', e => {
        setSliceFloor(parseInt(e.target.value, 10));
    });

    if (STATE.mode === 'slice') {
        setSliceFloor(STATE.sliceMaxFloor || 7);
    } else {
        setMode(STATE.mode || 'all');
    }

    // 5. Взрывной эффект (разнос этажей)
    const btnExplode = document.getElementById('btn-explode');
    const sliderExplode = document.getElementById('slider-explode');
    const valExplode = document.getElementById('explode-val');

    if (sliderExplode) sliderExplode.value = STATE.explodeGap || 0;
    if (valExplode) valExplode.textContent = (STATE.explodeGap || 0).toFixed(1) + ' м';

    btnExplode?.addEventListener('click', () => {
        if (STATE.mode !== 'all' && STATE.mode !== 'slice') {
            setSliceFloor(STATE.sliceMaxFloor || 7);
            STATE.exploded = true;
        } else {
            STATE.exploded = !STATE.exploded;
        }

        if (STATE.exploded && STATE.explodeGap < 1.0) {
            STATE.explodeGap = 5.5;
        } else if (!STATE.exploded) {
            STATE.explodeGap = 0.0;
        }

        if (sliderExplode) sliderExplode.value = STATE.explodeGap;
        if (valExplode) valExplode.textContent = STATE.explodeGap.toFixed(1) + ' м';

        recalcTargetPositions();
        updateExplodeButtonStyle();
        saveSettings();
    });

    sliderExplode?.addEventListener('input', e => {
        const v = parseFloat(e.target.value);
        STATE.explodeGap = v;
        STATE.exploded = v > 0.1;
        if (valExplode) valExplode.textContent = v.toFixed(1) + ' м';
        if (STATE.mode !== 'all' && STATE.mode !== 'slice') {
            setSliceFloor(STATE.sliceMaxFloor || 7);
        } else {
            recalcTargetPositions();
            updateExplodeButtonStyle();
        }
        saveSettings();
    });

    // 6. Высота стен
    const sliderHeight = document.getElementById('slider-wall-height');
    const valHeight = document.getElementById('wall-height-val');
    if (sliderHeight) sliderHeight.value = STATE.wallHeight;
    if (valHeight) valHeight.textContent = STATE.wallHeight.toFixed(2) + ' м';

    sliderHeight?.addEventListener('input', e => {
        STATE.wallHeight = parseFloat(e.target.value);
        if (valHeight) valHeight.textContent = STATE.wallHeight.toFixed(2) + ' м';
        updateWallHeights();
        saveSettings();
    });

    // 7. Непрозрачность перекрытий
    const sliderSlabOpacity = document.getElementById('slider-slab-opacity');
    const valSlabOpacity = document.getElementById('slab-opacity-val');
    if (sliderSlabOpacity) sliderSlabOpacity.value = STATE.slabOpacity;
    if (valSlabOpacity) valSlabOpacity.textContent = Math.round(STATE.slabOpacity * 100) + '%';
    const isTrans = STATE.slabOpacity < 0.99;
    MATERIALS.slab.transparent = isTrans;
    MATERIALS.coreSlab.transparent = isTrans;
    MATERIALS.slab.opacity = STATE.slabOpacity;
    MATERIALS.coreSlab.opacity = STATE.slabOpacity;
    MATERIALS.slab.needsUpdate = true;
    MATERIALS.coreSlab.needsUpdate = true;

    sliderSlabOpacity?.addEventListener('input', e => {
        STATE.slabOpacity = parseFloat(e.target.value);
        if (valSlabOpacity) valSlabOpacity.textContent = Math.round(STATE.slabOpacity * 100) + '%';
        const trans = STATE.slabOpacity < 0.99;
        MATERIALS.slab.transparent = trans;
        MATERIALS.coreSlab.transparent = trans;
        MATERIALS.slab.opacity = STATE.slabOpacity;
        MATERIALS.coreSlab.opacity = STATE.slabOpacity;
        MATERIALS.slab.needsUpdate = true;
        MATERIALS.coreSlab.needsUpdate = true;
        recalcTargetPositions();
        saveSettings();
    });

    // 8. Чекбоксы переключателей
    const tDoors = document.getElementById('toggle-doors');
    if (tDoors) tDoors.checked = STATE.showDoors;
    tDoors?.addEventListener('change', e => {
        STATE.showDoors = e.target.checked;
        updateWallHeights();
        saveSettings();
    });

    const tLabels = document.getElementById('toggle-labels');
    if (tLabels) tLabels.checked = STATE.showLabels;
    tLabels?.addEventListener('change', e => {
        STATE.showLabels = e.target.checked;
        updateLabelsVisibility();
        saveSettings();
    });

    const tSmartOcc = document.getElementById('toggle-smart-occlusion');
    if (tSmartOcc) tSmartOcc.checked = STATE.smartLabelOcclusion;
    tSmartOcc?.addEventListener('change', e => {
        STATE.smartLabelOcclusion = e.target.checked;
        updateLabelsVisibility();
        saveSettings();
    });

    const tRoof = document.getElementById('toggle-roof');
    if (tRoof) tRoof.checked = STATE.showRoof;
    tRoof?.addEventListener('change', e => {
        STATE.showRoof = e.target.checked;
        updateRoofsVisibility();
        saveSettings();
    });

    const tTerritory = document.getElementById('toggle-territory');
    if (tTerritory) tTerritory.checked = STATE.showTerritory;
    tTerritory?.addEventListener('change', e => {
        STATE.showTerritory = e.target.checked;
        updateTerritoryVisibility();
        saveSettings();
    });

    const tStairAxes = document.getElementById('toggle-stair-axes');
    if (tStairAxes) tStairAxes.checked = STATE.showStairAxes;
    tStairAxes?.addEventListener('change', e => {
        STATE.showStairAxes = e.target.checked;
        updateStairValidationAxes();
        saveSettings();
    });

    const tGuides = document.getElementById('toggle-guides');
    if (tGuides) tGuides.checked = STATE.showGuides;
    tGuides?.addEventListener('change', e => {
        STATE.showGuides = e.target.checked;
        updateAlignmentGuides();
        saveSettings();
    });

    const tEdges = document.getElementById('toggle-edges');
    if (tEdges) tEdges.checked = STATE.showEdges;
    wallEdges.forEach(line => line.visible = STATE.showEdges);
    doorEdges.forEach(line => line.visible = STATE.showEdges);
    tEdges?.addEventListener('change', e => {
        STATE.showEdges = e.target.checked;
        wallEdges.forEach(line => line.visible = STATE.showEdges);
        doorEdges.forEach(line => line.visible = STATE.showEdges);
        if (typeof requestRender === 'function') requestRender(15);
        saveSettings();
    });

    const tShadows = document.getElementById('toggle-shadows');
    if (tShadows) tShadows.checked = STATE.showShadows;
    if (renderer && renderer.shadowMap) {
        renderer.shadowMap.enabled = STATE.showShadows;
        renderer.shadowMap.needsUpdate = true;
    }
    tShadows?.addEventListener('change', e => {
        STATE.showShadows = e.target.checked;
        if (renderer && renderer.shadowMap) {
            renderer.shadowMap.enabled = STATE.showShadows;
            renderer.shadowMap.needsUpdate = true;
        }
        if (typeof requestRender === 'function') requestRender(20);
        saveSettings();
    });

    // 9. Кнопки ракурсов
    document.getElementById('btn-view-3d')?.addEventListener('click', () => {
        const cx = getActiveCenterX();
        const cz = getActiveCenterZ();
        const maxF = STATE.mode === 'slice' ? STATE.sliceMaxFloor : (STATE.mode === 'all' ? 7 : 1);
        const midY = ((STATE.mode === 'all' || STATE.mode === 'slice') && STATE.exploded)
            ? (STATE.wallHeight + STATE.explodeGap) * (maxF / 2)
            : (STATE.wallHeight * 0.45 * maxF);
        STATE.targetCamPos = new THREE.Vector3(cx - 24, 56 + midY, cz + 56);
        STATE.targetControlsCenter = new THREE.Vector3(cx, midY, cz);
    });

    document.getElementById('btn-view-top')?.addEventListener('click', () => {
        const cx = getActiveCenterX();
        const cz = getActiveCenterZ();
        const distY = STATE.mode === 'sideBySide' ? 160 : 75;
        STATE.targetCamPos = new THREE.Vector3(cx, distY, cz + 0.01);
        STATE.targetControlsCenter = new THREE.Vector3(cx, 0, cz);
    });

    document.getElementById('btn-view-side')?.addEventListener('click', () => {
        const cx = getActiveCenterX();
        const cz = getActiveCenterZ();
        const maxF = STATE.mode === 'slice' ? STATE.sliceMaxFloor : (STATE.mode === 'all' ? 7 : 1);
        const midY = ((STATE.mode === 'all' || STATE.mode === 'slice') && STATE.exploded)
            ? (STATE.wallHeight + STATE.explodeGap) * (maxF / 2)
            : (STATE.wallHeight * 0.5 * maxF);
        STATE.targetCamPos = new THREE.Vector3(cx, midY + 14, cz + 72);
        STATE.targetControlsCenter = new THREE.Vector3(cx, midY, cz);
    });

    document.getElementById('btn-view-305')?.addEventListener('click', () => {
        const maxF = STATE.mode === 'slice' ? STATE.sliceMaxFloor : (STATE.mode === 'all' ? 7 : 1);
        const midY = ((STATE.mode === 'all' || STATE.mode === 'slice') && STATE.exploded)
            ? (STATE.wallHeight + STATE.explodeGap) * Math.min(2, maxF) * 0.75
            : 3.5;
        STATE.targetCamPos = new THREE.Vector3(36.0, midY + 34, -2.0);
        STATE.targetControlsCenter = new THREE.Vector3(36.0, midY, -28.0);
    });

    // Горячая клавиша H / Р — скрыть/показать весь интерфейс (с поддержкой обеих раскладок)
    window.addEventListener('keydown', e => {
        if (e.target && (e.target.tagName === 'TEXTAREA' || (e.target.tagName === 'INPUT' && e.target.type !== 'range' && e.target.type !== 'checkbox'))) {
            return;
        }
        if (e.code === 'KeyH' || e.key === 'h' || e.key === 'H' || e.key === 'р' || e.key === 'Р') {
            document.body.classList.toggle('ui-hidden');
        }
    });

    updateExplodeButtonStyle();
}

