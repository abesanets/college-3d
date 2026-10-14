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
}

function setupUI() {
    // Выбор корпуса
    document.getElementById('btn-bldg-both')?.addEventListener('click', () => setBuildingFilter('both'));
    document.getElementById('btn-bldg-1')?.addEventListener('click', () => setBuildingFilter('1'));
    document.getElementById('btn-bldg-2')?.addEventListener('click', () => setBuildingFilter('2'));
    document.getElementById('btn-bldg-3')?.addEventListener('click', () => setBuildingFilter('3'));
    document.getElementById('btn-bldg-4')?.addEventListener('click', () => setBuildingFilter('4'));

    // Режим этажей
    document.getElementById('btn-mode-all')?.addEventListener('click', () => setMode('all'));
    document.getElementById('btn-mode-side')?.addEventListener('click', () => setMode('sideBySide'));
    for (let f = 1; f <= 7; f++) {
        document.getElementById('btn-mode-' + f)?.addEventListener('click', () => setMode(String(f)));
    }

    // Срез этажей сверху вниз
    const sliderSlice = document.getElementById('slider-slice');
    sliderSlice?.addEventListener('input', e => {
        setSliceFloor(parseInt(e.target.value, 10));
    });

    // Взрывной эффект (разнос этажей)
    const btnExplode = document.getElementById('btn-explode');
    const sliderExplode = document.getElementById('slider-explode');
    const valExplode = document.getElementById('explode-val');

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
    });

    // Высота стен
    const sliderHeight = document.getElementById('slider-wall-height');
    const valHeight = document.getElementById('wall-height-val');
    sliderHeight?.addEventListener('input', e => {
        STATE.wallHeight = parseFloat(e.target.value);
        if (valHeight) valHeight.textContent = STATE.wallHeight.toFixed(2) + ' м';
        updateWallHeights();
    });

    // Непрозрачность перекрытий
    const sliderSlabOpacity = document.getElementById('slider-slab-opacity');
    const valSlabOpacity = document.getElementById('slab-opacity-val');
    sliderSlabOpacity?.addEventListener('input', e => {
        STATE.slabOpacity = parseFloat(e.target.value);
        if (valSlabOpacity) valSlabOpacity.textContent = Math.round(STATE.slabOpacity * 100) + '%';
        const isTrans = STATE.slabOpacity < 0.99;
        MATERIALS.slab.transparent = isTrans;
        MATERIALS.coreSlab.transparent = isTrans;
        MATERIALS.slab.opacity = STATE.slabOpacity;
        MATERIALS.coreSlab.opacity = STATE.slabOpacity;
        MATERIALS.slab.needsUpdate = true;
        MATERIALS.coreSlab.needsUpdate = true;
        // Обновляем видимость внутренностей при изменении прозрачности
        recalcTargetPositions();
    });

    // Чекбоксы переключателей
    document.getElementById('toggle-doors')?.addEventListener('change', e => {
        STATE.showDoors = e.target.checked;
        updateWallHeights();
    });

    document.getElementById('toggle-labels')?.addEventListener('change', e => {
        STATE.showLabels = e.target.checked;
        updateLabelsVisibility();
    });

    document.getElementById('toggle-smart-occlusion')?.addEventListener('change', e => {
        STATE.smartLabelOcclusion = e.target.checked;
        updateLabelsVisibility();
    });

    document.getElementById('toggle-roof')?.addEventListener('change', e => {
        STATE.showRoof = e.target.checked;
        updateRoofsVisibility();
    });

    document.getElementById('toggle-stair-axes')?.addEventListener('change', e => {
        STATE.showStairAxes = e.target.checked;
        updateStairValidationAxes();
    });

    document.getElementById('toggle-guides')?.addEventListener('change', e => {
        STATE.showGuides = e.target.checked;
        updateAlignmentGuides();
    });

    document.getElementById('toggle-edges')?.addEventListener('change', e => {
        STATE.showEdges = e.target.checked;
        wallEdges.forEach(line => line.visible = STATE.showEdges);
        doorEdges.forEach(line => line.visible = STATE.showEdges);
    });

    // Кнопки ракурсов
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
