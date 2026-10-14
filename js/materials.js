// ==========================================
// МАТЕРИАЛЫ СЦЕНЫ THREE.JS
// ==========================================

const MATERIALS = {
    slab: new THREE.MeshStandardMaterial({
        color: 0xd8dce2,
        roughness: 0.85,
        metalness: 0.05,
        transparent: false,
        opacity: 1.0
    }),
    coreSlab: new THREE.MeshStandardMaterial({
        color: 0xcbd2dc,
        roughness: 0.85,
        metalness: 0.05,
        transparent: false,
        opacity: 1.0,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
    }),
    wall: new THREE.MeshStandardMaterial({
        color: 0xeceff3,
        roughness: 0.6,
        metalness: 0.05
    }),
    doorThin: new THREE.MeshStandardMaterial({
        color: 0x8c96a6,
        roughness: 0.5,
        metalness: 0.1
    }),
    stair: new THREE.MeshStandardMaterial({
        color: 0xbac2cc,
        roughness: 0.7,
        metalness: 0.08
    }),
    elevatorCar: new THREE.MeshStandardMaterial({
        color: 0xb0b8c4,
        roughness: 0.75
    }),
    edgeMain: new THREE.LineBasicMaterial({ color: 0x5c6470, linewidth: 1 }),
    edgeDoor: new THREE.LineBasicMaterial({ color: 0x64748b, linewidth: 1 }),
    guideLine: new THREE.LineDashedMaterial({
        color: 0x94a3b8,
        dashSize: 0.45,
        gapSize: 0.3,
        transparent: true,
        opacity: 0.6
    }),
    stairAxisLine: new THREE.LineDashedMaterial({
        color: 0x10b981,
        dashSize: 0.5,
        gapSize: 0.25,
        transparent: true,
        opacity: 0.9
    }),
    stairBoxEdge: new THREE.LineBasicMaterial({
        color: 0x34d399,
        transparent: true,
        opacity: 0.65
    })
};
