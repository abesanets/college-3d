// ==========================================
// ОБРАБОТКА ПОЛЬЗОВАТЕЛЬСКОГО ИНТЕРФЕЙСА (UI)
// ==========================================

function updateExplodeButtonStyle() {
    const btnExplode = document.getElementById('btn-explode');
    if (!btnExplode) return;

    if (STATE.exploded && STATE.mode === 'all' && STATE.explodeGap > 0.2) {
        btnExplode.classList.add('explode-btn-active');
        btnExplode.innerHTML = '<span>💥 Сложить этажи вместе</span>';
    } else {
        btnExplode.classList.remove('explode-btn-active');
        btnExplode.innerHTML = '<span>💥 Взрывной эффект</span>';
    }
}

function setBuildingFilter(bFilter) {
    STATE.buildingFilter = bFilter;
    document.querySelectorAll('.bldg-btn').forEach(b => b.classList.remove('active'));
    const targetBtn = document.getElementById('btn-bldg-' + bFilter);
    if (targetBtn) targetBtn.classList.add('active');

    const cx = getActiveCenterX();
    const cz = getActiveCenterZ();
    const midY = (STATE.mode === 'all' && STATE.exploded) ? (STATE.wallHeight + STATE.explodeGap) * 2.5 : 2.5;
    STATE.targetControlsCenter = new THREE.Vector3(cx, midY, cz);

    recalcTargetPositions();
    updateAlignmentGuides();
    updateStairValidationAxes();
}

function setMode(newMode) {
    STATE.mode = newMode;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));

    const subtitle = document.getElementById('status-subtitle');
    const cx = getActiveCenterX();
    const cz = getActiveCenterZ();

    if (newMode === 'all') {
        const btnAll = document.getElementById('btn-mode-all');
        if (btnAll) btnAll.classList.add('active');
        if (subtitle) subtitle.textContent = 'Все этажи комплекса: Корпус 1 (1–7 эт.) + Корпус 2 (1–3 эт.) + Корпус 3 (1–2 эт.) + Корпус 4 (1–3 эт.)';
        const midY = STATE.exploded ? (STATE.wallHeight + STATE.explodeGap) * 3 : STATE.wallHeight * 3;
        STATE.targetControlsCenter = new THREE.Vector3(cx, midY, cz);
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
        STATE.targetControlsCenter = new THREE.Vector3(cx, 0.5, cz);
    }

    recalcTargetPositions();
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

    // Взрывной эффект (разнос этажей)
    const btnExplode = document.getElementById('btn-explode');
    const sliderExplode = document.getElementById('slider-explode');
    const valExplode = document.getElementById('explode-val');

    btnExplode?.addEventListener('click', () => {
        if (STATE.mode !== 'all') {
            setMode('all');
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

        const midY = STATE.exploded ? (STATE.wallHeight + STATE.explodeGap) * 3 : STATE.wallHeight * 3;
        STATE.targetControlsCenter = new THREE.Vector3(getActiveCenterX(), midY, getActiveCenterZ());
    });

    sliderExplode?.addEventListener('input', e => {
        const v = parseFloat(e.target.value);
        STATE.explodeGap = v;
        STATE.exploded = v > 0.1;
        if (valExplode) valExplode.textContent = v.toFixed(1) + ' м';
        if (STATE.mode !== 'all') {
            setMode('all');
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
        const midY = (STATE.mode === 'all' && STATE.exploded) ? (STATE.wallHeight + STATE.explodeGap) * 3 : 3.0;
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
        const midY = (STATE.mode === 'all' && STATE.exploded) ? (STATE.wallHeight + STATE.explodeGap) * 3 : 3.5;
        STATE.targetCamPos = new THREE.Vector3(cx, midY + 14, cz + 72);
        STATE.targetControlsCenter = new THREE.Vector3(cx, midY, cz);
    });

    document.getElementById('btn-view-305')?.addEventListener('click', () => {
        const midY = (STATE.mode === 'all' && STATE.exploded) ? (STATE.wallHeight + STATE.explodeGap) * 1.5 : 3.5;
        STATE.targetCamPos = new THREE.Vector3(36.0, midY + 34, -2.0);
        STATE.targetControlsCenter = new THREE.Vector3(36.0, midY, -28.0);
    });

    updateExplodeButtonStyle();
}
