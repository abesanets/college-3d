// ==========================================
// УПРАВЛЕНИЕ КАМЕРОЙ И ЗУМ К ТОЧКЕ КУРСОРА (POINTER ZOOM)
// ==========================================

let raycaster = null;
let mouseVec = null;
let floorPlane = null;
let isCtrlZooming = false;

function initControls(camera, domElement) {
    controls = new THREE.OrbitControls(camera, domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.01;
    controls.minDistance = 3;
    controls.maxDistance = 500;
    controls.target.set(16, 7.5, -14);

    raycaster = new THREE.Raycaster();
    mouseVec = new THREE.Vector2();
    floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // Зум к позиции курсора (BIM / CAD Zoom to Pointer)
    domElement.addEventListener('wheel', onPointerZoom, { passive: false });

    // Оповещение цикла рендеринга о движении камеры (On-Demand Render)
    controls.addEventListener('change', () => {
        if (typeof requestRender === 'function') {
            requestRender(15);
        }
    });

    return controls;
}

// Плавный программный зум для экранных кнопок (+ / -)
function zoomCamera(direction) {
    if (!controls || !camera) return;
    const factor = direction > 0 ? 0.82 : 1.22;
    const offset = camera.position.clone().sub(controls.target);
    const newDist = offset.length() * factor;

    if (newDist >= controls.minDistance && newDist <= controls.maxDistance) {
        camera.position.copy(controls.target).addScaledVector(offset, factor);
        if (typeof requestRender === 'function') {
            requestRender(20);
        }
    }
}

function onPointerZoom(event) {
    if (!controls || !camera) return;

    // Предотвращаем дефолтный скролл страницы
    event.preventDefault();

    const domElement = renderer.domElement;
    const rect = domElement.getBoundingClientRect();
    mouseVec.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseVec.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouseVec, camera);

    // Оптимизация: проверяем пересечение только с плитами перекрытий этажей (быстро, O(1))
    // вместо тяжелого рекурсивного обхода всех тысяч мешей сцены
    const targets = Array.isArray(slabMeshes) && slabMeshes.length > 0 ? slabMeshes : scene.children;
    const intersects = raycaster.intersectObjects(targets, false);
    let hitPoint = null;

    for (let i = 0; i < intersects.length; i++) {
        const hit = intersects[i];
        if (hit.object && hit.object.visible && hit.point) {
            hitPoint = hit.point.clone();
            break;
        }
    }

    // Если курсор смотрит мимо геометрии модели, берем пересечение с горизонтальной плоскостью на высоте таргета
    if (!hitPoint) {
        floorPlane.constant = -controls.target.y;
        const pt = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(floorPlane, pt)) {
            hitPoint = pt;
        }
    }

    if (hitPoint) {
        // Коэффициент зума: чувствительный и плавный
        const zoomIn = event.deltaY < 0;
        const factor = zoomIn ? 0.86 : 1.16;

        // Вектор от точки под курсором к камере и таргету
        const camToHit = camera.position.clone().sub(hitPoint);
        const targetToHit = controls.target.clone().sub(hitPoint);

        const newDist = camToHit.length() * factor;

        if (newDist >= controls.minDistance && newDist <= controls.maxDistance) {
            // Приближаем камеру вдоль луча к точке под курсором
            camera.position.copy(hitPoint).addScaledVector(camToHit, factor);
            
            // Также плавно смещаем фокусную точку таргета в сторону курсора
            controls.target.copy(hitPoint).addScaledVector(targetToHit, factor);

            if (typeof requestRender === 'function') {
                requestRender(20);
            }
        }
    }
}
