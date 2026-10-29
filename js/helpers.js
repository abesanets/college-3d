// ==========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ПОСТРОЕНИЯ 3D-ГЕОМЕТРИИ
// С ПОДДЕРЖКОЙ УМНОГО СКРЫТИЯ ВНУТРЕННОСТЕЙ ЭТАЖЕЙ
// ==========================================

function addFloorRect(targetGroup, x1, z1, x2, z2, isCore = false) {
    const w = Math.abs(x2 - x1);
    const d = Math.abs(z2 - z1);
    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;

    const thickness = 0.16;
    const geom = new THREE.BoxGeometry(w, thickness, d);
    const mat = isCore ? MATERIALS.coreSlab : MATERIALS.slab;
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(cx, -thickness / 2 + (isCore ? 0.008 : 0), cz);
    mesh.receiveShadow = true;
    mesh.userData.isFloorSlab = true;
    mesh.userData.isInterior = false;
    mesh.userData.isExterior = true;
    targetGroup.add(mesh);
    slabMeshes.push(mesh);

    const edges = new THREE.EdgesGeometry(geom);
    const line = new THREE.LineSegments(edges, MATERIALS.edgeMain);
    line.userData.isFloorSlab = true;
    line.userData.isInterior = false;
    line.userData.isExterior = true;
    mesh.add(line);
}

function addFloorPolygon(targetGroup, points, isCore = false) {
    if (!points || points.length < 3) return;
    const shape = new THREE.Shape();
    shape.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i][0], points[i][1]);
    }
    shape.closePath();

    const thickness = 0.16;
    const geom = new THREE.ExtrudeGeometry(shape, {
        depth: thickness,
        bevelEnabled: false
    });
    geom.rotateX(Math.PI / 2);

    const mat = isCore ? MATERIALS.coreSlab : MATERIALS.slab;
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(0, (isCore ? 0.008 : 0), 0);
    mesh.receiveShadow = true;
    mesh.userData.isFloorSlab = true;
    mesh.userData.isInterior = false;
    mesh.userData.isExterior = true;
    targetGroup.add(mesh);
    slabMeshes.push(mesh);

    const edges = new THREE.EdgesGeometry(geom);
    const line = new THREE.LineSegments(edges, MATERIALS.edgeMain);
    line.userData.isFloorSlab = true;
    line.userData.isInterior = false;
    line.userData.isExterior = true;
    mesh.add(line);
}

function addWallLine(targetGroup, x1, z1, x2, z2, openings = [], wallThickness = 0.18) {
    const isHorizontal = Math.abs(z2 - z1) < 0.001;
    const startCoord = isHorizontal ? Math.min(x1, x2) : Math.min(z1, z2);
    const endCoord = isHorizontal ? Math.max(x1, x2) : Math.max(z1, z2);
    const fixedCoord = isHorizontal ? z1 : x1;
    const angle = isHorizontal ? 0 : Math.PI / 2;

    const isOuterWall = wallThickness >= 0.20;

    const sorted = [...openings].sort((a, b) => a.from - b.from);
    let cursor = startCoord;

    for (const op of sorted) {
        const oStart = Math.max(startCoord, op.from);
        const oEnd = Math.min(endCoord, op.to);

        if (oStart > cursor + 0.02) {
            createWallSegment(targetGroup, cursor, oStart, fixedCoord, isHorizontal, angle, wallThickness, false, isOuterWall);
        }

        if (op.type !== 'open') {
            const isExteriorDoor = op.isExterior !== undefined ? op.isExterior : isOuterWall;
            createWallSegment(targetGroup, oStart, oEnd, fixedCoord, isHorizontal, angle, 0.09, true, isExteriorDoor);
        }

        cursor = oEnd;
    }

    if (cursor < endCoord - 0.02) {
        createWallSegment(targetGroup, cursor, endCoord, fixedCoord, isHorizontal, angle, wallThickness, false, isOuterWall);
    }
}

function addArbitraryWallSegment(targetGroup, x1, z1, x2, z2, thickness = 0.18, isDoor = false, isExterior = false) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    if (len <= 0.01) return;

    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;
    const angle = Math.atan2(dz, dx);

    const geom = new THREE.BoxGeometry(len, 1, thickness);
    const mat = isDoor ? MATERIALS.doorThin : MATERIALS.wall;
    const mesh = new THREE.Mesh(geom, mat);

    const h = STATE.wallHeight;
    mesh.scale.y = h + WALL_SINK;
    mesh.position.set(cx, (h - WALL_SINK) / 2, cz);
    mesh.rotation.y = -angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const effectiveExterior = isExterior || (thickness >= 0.20);
    mesh.userData.isExterior = effectiveExterior;
    mesh.userData.isInterior = !effectiveExterior && (isDoor || (thickness < 0.20));
    mesh.userData.isDoor = isDoor;
    mesh.userData.isWall = !isDoor;
    mesh.userData.len = len;
    mesh.userData.thickness = thickness;
    mesh.userData.angle = angle;
    mesh.userData.initialX = cx;
    mesh.userData.initialZ = cz;
    mesh.userData.initialLen = len;
    mesh.userData.initialThickness = thickness;
    mesh.userData.initialAngle = angle;
    const bNum = (targetGroup && targetGroup.userData && targetGroup.userData.building) || 1;
    const fNum = (targetGroup && targetGroup.userData && targetGroup.userData.floor) || 1;
    mesh.userData.building = bNum;
    mesh.userData.floor = fNum;
    mesh.userData.targetGroup = targetGroup;
    mesh.userData.wallId = 'b' + bNum + '_f' + fNum + '_' + cx.toFixed(2) + '_' + cz.toFixed(2) + '_' + len.toFixed(2) + '_' + angle.toFixed(2) + '_' + (isDoor ? 'd' : 'w');
    if (typeof window !== 'undefined') {
        if (!window.WALL_REGISTRY) window.WALL_REGISTRY = new Map();
        window.WALL_REGISTRY.set(mesh.userData.wallId, mesh);
    }
    targetGroup.add(mesh);

    const edgeGeom = new THREE.EdgesGeometry(geom);
    const edgeLine = new THREE.LineSegments(edgeGeom, isDoor ? MATERIALS.edgeDoor : MATERIALS.edgeMain);
    edgeLine.userData.isExterior = effectiveExterior;
    edgeLine.userData.isInterior = mesh.userData.isInterior;
    edgeLine.userData.isDoor = isDoor;
    mesh.add(edgeLine);

    if (isDoor) {
        doorMeshes.push(mesh);
        doorEdges.push(edgeLine);
    } else {
        wallMeshes.push(mesh);
        wallEdges.push(edgeLine);
    }
}

function createWallSegment(targetGroup, c1, c2, fixedCoord, isHorizontal, angle, thickness, isDoor, isExterior = false) {
    const len = Math.abs(c2 - c1);
    if (len <= 0.01) return;

    const mid = (c1 + c2) / 2;
    const cx = isHorizontal ? mid : fixedCoord;
    const cz = isHorizontal ? fixedCoord : mid;

    const geom = new THREE.BoxGeometry(len, 1, thickness);
    const mat = isDoor ? MATERIALS.doorThin : MATERIALS.wall;
    const mesh = new THREE.Mesh(geom, mat);

    const h = STATE.wallHeight;
    mesh.scale.y = h + WALL_SINK;
    mesh.position.set(cx, (h - WALL_SINK) / 2, cz);
    mesh.rotation.y = -angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.isExterior = isExterior;
    mesh.userData.isInterior = !isExterior && (isDoor || (thickness < 0.20));
    mesh.userData.isDoor = isDoor;
    mesh.userData.isWall = !isDoor;
    mesh.userData.len = len;
    mesh.userData.thickness = thickness;
    mesh.userData.angle = angle;
    mesh.userData.initialX = cx;
    mesh.userData.initialZ = cz;
    mesh.userData.initialLen = len;
    mesh.userData.initialThickness = thickness;
    mesh.userData.initialAngle = angle;
    const bNum_c = (targetGroup && targetGroup.userData && targetGroup.userData.building) || 1;
    const fNum_c = (targetGroup && targetGroup.userData && targetGroup.userData.floor) || 1;
    mesh.userData.building = bNum_c;
    mesh.userData.floor = fNum_c;
    mesh.userData.targetGroup = targetGroup;
    mesh.userData.wallId = 'b' + bNum_c + '_f' + fNum_c + '_' + cx.toFixed(2) + '_' + cz.toFixed(2) + '_' + len.toFixed(2) + '_' + angle.toFixed(2) + '_' + (isDoor ? 'd' : 'w');
    if (typeof window !== 'undefined') {
        if (!window.WALL_REGISTRY) window.WALL_REGISTRY = new Map();
        window.WALL_REGISTRY.set(mesh.userData.wallId, mesh);
    }
    targetGroup.add(mesh);

    const edgeGeom = new THREE.EdgesGeometry(geom);
    const edgeLine = new THREE.LineSegments(edgeGeom, isDoor ? MATERIALS.edgeDoor : MATERIALS.edgeMain);
    edgeLine.userData.isExterior = isExterior;
    edgeLine.userData.isInterior = mesh.userData.isInterior;
    edgeLine.userData.isDoor = isDoor;
    mesh.add(edgeLine);

    if (isDoor) {
        doorMeshes.push(mesh);
        doorEdges.push(edgeLine);
    } else {
        wallMeshes.push(mesh);
        wallEdges.push(edgeLine);
    }
}

function addSquareColumn(targetGroup, cx, cz, size = 0.28, isExterior = false) {
    const geom = new THREE.BoxGeometry(size, 1, size);
    const mesh = new THREE.Mesh(geom, MATERIALS.wall);
    const h = STATE.wallHeight;
    mesh.scale.y = h;
    mesh.position.set(cx, h / 2, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.isExterior = isExterior;
    mesh.userData.isInterior = !isExterior;
    mesh.userData.isColumn = true;
    targetGroup.add(mesh);

    const edgeGeom = new THREE.EdgesGeometry(geom);
    const edgeLine = new THREE.LineSegments(edgeGeom, MATERIALS.edgeMain);
    edgeLine.userData.isExterior = isExterior;
    edgeLine.userData.isInterior = !isExterior;
    edgeLine.userData.isColumn = true;
    mesh.add(edgeLine);

    wallMeshes.push(mesh);
    wallEdges.push(edgeLine);
}

function addRoomLabel3D(targetGroup, floorNum, text, x, z, isSmall = false, isWide = false, buildingNum = 1, customScale = 1.0) {
    const canvas = document.createElement('canvas');
    const lines = text.split('\n');
    const isMultiLine = lines.length > 1;
    const width = isWide ? 420 : (isSmall ? 180 : 240);
    const height = isMultiLine ? 148 : (isSmall ? 88 : 108);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const r = 20;
    ctx.fillStyle = buildingNum === 4
        ? 'rgba(254, 248, 238, 0.98)'
        : (buildingNum === 3
            ? 'rgba(238, 250, 244, 0.98)'
            : (buildingNum === 2 ? 'rgba(240, 246, 255, 0.98)' : 'rgba(245, 248, 252, 0.98)'));
    ctx.strokeStyle = buildingNum === 4
        ? '#855836'
        : (buildingNum === 3
            ? '#3b6e5c'
            : (buildingNum === 2 ? '#3b82f6' : '#475569'));
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(width - r, 0);
    ctx.quadraticCurveTo(width, 0, width, r);
    ctx.lineTo(width, height - r);
    ctx.quadraticCurveTo(width, height, width - r, height);
    ctx.lineTo(r, height);
    ctx.quadraticCurveTo(0, height, 0, height - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (isMultiLine) {
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 38px Inter, sans-serif';
        ctx.fillText(lines[0], width / 2, height * 0.36);

        ctx.fillStyle = '#475569';
        ctx.font = '600 24px Inter, sans-serif';
        ctx.fillText(lines[1], width / 2, height * 0.72);
    } else {
        ctx.fillStyle = '#0f172a';
        const fontSize = isSmall ? 36 : (isWide ? 44 : 40);
        ctx.font = 'bold ' + fontSize + 'px Inter, sans-serif';
        ctx.fillText(text, width / 2, height / 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    const baseW = isWide ? 3.0 : (isSmall ? 1.15 : 1.65);
    const planeW = baseW * customScale;
    const planeH = planeW * (height / width);
    const geom = new THREE.PlaneGeometry(planeW, planeH);

    const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
        side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.rotation.x = -Math.PI / 2;
    // Плашка точно прилипает к полу комнаты своего этажа
    mesh.position.set(x, 0.02, z);
    mesh.userData.isInterior = true;
    targetGroup.add(mesh);

    labelSprites.push({
        mesh,
        floor: floorNum,
        building: buildingNum,
        localX: x,
        localZ: z
    });
}

// Алиас для обратной совместимости
const addRoomLabel = addRoomLabel3D;

function buildElevatorShaftCross(targetGroup, x1, z1, x2, z2) {
    const w = Math.abs(x2 - x1);
    const d = Math.abs(z2 - z1);
    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;

    const geom = new THREE.BoxGeometry(w, 0.08, d);
    const mesh = new THREE.Mesh(geom, MATERIALS.elevatorCar);
    mesh.position.set(cx, 0.04, cz);
    mesh.userData.isInterior = true;
    targetGroup.add(mesh);

    const edges = new THREE.EdgesGeometry(geom);
    mesh.add(new THREE.LineSegments(edges, MATERIALS.edgeMain));

    const pts = [
        new THREE.Vector3(x1, 0.09, z1),
        new THREE.Vector3(x2, 0.09, z2),
        new THREE.Vector3(x2, 0.09, z1),
        new THREE.Vector3(x1, 0.09, z2)
    ];
    const crossGeom = new THREE.BufferGeometry().setFromPoints(pts);
    const crossLine = new THREE.LineSegments(crossGeom, MATERIALS.edgeMain);
    crossLine.userData.isInterior = true;
    targetGroup.add(crossLine);
}

function registerDynamicStairStep(targetGroup, geom, sx, cz, heightRatio, yOffset = 0, isExterior = false) {
    const mesh = new THREE.Mesh(geom, MATERIALS.stair);
    const stepH = Math.max(0.06, STATE.wallHeight * heightRatio);
    mesh.scale.y = stepH;
    mesh.position.set(sx, (stepH / 2) + yOffset, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const effectiveIsExterior = isExterior || (yOffset < -0.05);
    mesh.userData.isInterior = !effectiveIsExterior;
    mesh.userData.isExterior = effectiveIsExterior;
    mesh.userData.isStair = true;

    const edges = new THREE.EdgesGeometry(geom);
    const edgeLine = new THREE.LineSegments(edges, MATERIALS.edgeMain);
    edgeLine.userData.isInterior = !effectiveIsExterior;
    edgeLine.userData.isExterior = effectiveIsExterior;
    edgeLine.userData.isStair = true;
    mesh.add(edgeLine);
    targetGroup.add(mesh);

    stairMeshes.push({ mesh, heightRatio, yOffset });
}

function buildStaircaseUnit(targetGroup, zTop, zBottom, zMid, isUpperStaircase) {
    addWallLine(targetGroup, 10.2, zMid, 14.6, zMid, [], 0.08);

    const stepsCount = 10;
    const startX = 10.2;
    const endX = 14.6;
    const stepDepth = (endX - startX) / stepsCount;

    const flights = [
        { z1: zTop + 0.12, z2: zMid - 0.06, dir: isUpperStaircase ? 1 : -1 },
        { z1: zMid + 0.06, z2: zBottom - 0.12, dir: isUpperStaircase ? -1 : 1 }
    ];

    flights.forEach(fl => {
        const flightW = Math.abs(fl.z2 - fl.z1);
        const cz = (fl.z1 + fl.z2) / 2;

        for (let i = 0; i < stepsCount; i++) {
            const ratio = fl.dir === 1 ? (i + 1) / stepsCount : (stepsCount - i) / stepsCount;
            const heightRatio = ratio * 0.52;
            const sx = startX + (i + 0.5) * stepDepth;

            const geom = new THREE.BoxGeometry(stepDepth * 0.96, 1, flightW);
            registerDynamicStairStep(targetGroup, geom, sx, cz, heightRatio, 0);
        }
    });

    // Межэтажная разворотная площадка у наружной стены
    const landingGeom = new THREE.BoxGeometry(1.4, 1, Math.abs(zBottom - zTop));
    registerDynamicStairStep(targetGroup, landingGeom, 15.3, (zTop + zBottom) / 2, 0.26, 0);
}

function buildCorridorStepsRight(targetGroup) {
    const stepW = 0.28;
    const z1 = -6.1;
    const z2 = -3.6;
    const depthZ = Math.abs(z2 - z1);
    const cz = (z1 + z2) / 2;

    for (let i = 0; i < 3; i++) {
        const sx = 14.3 + i * stepW;
        const heightRatio = 0.055 * (i + 1);
        const geom = new THREE.BoxGeometry(stepW * 0.95, 1, depthZ);
        registerDynamicStairStep(targetGroup, geom, sx, cz, heightRatio, 0);
    }
}

function addRoofRect(targetGroup, x1, z1, x2, z2, buildingNum = 1) {
    const w = Math.abs(x2 - x1);
    const d = Math.abs(z2 - z1);
    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;
    const thickness = 0.16;

    const geom = new THREE.BoxGeometry(w, thickness, d);
    const mesh = new THREE.Mesh(geom, MATERIALS.roof);
    mesh.position.set(cx, STATE.wallHeight + thickness / 2, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.isRoof = true;
    mesh.userData.isExterior = true;
    mesh.userData.isInterior = false;
    mesh.visible = STATE.showRoof;

    const edges = new THREE.EdgesGeometry(geom);
    const line = new THREE.LineSegments(edges, MATERIALS.edgeRoof);
    line.userData.isRoof = true;
    line.userData.isExterior = true;
    line.userData.isInterior = false;
    mesh.add(line);

    targetGroup.add(mesh);
    roofMeshes.push({ mesh, thickness, building: buildingNum });
}
