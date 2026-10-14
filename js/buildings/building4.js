// ==========================================
// КОРПУС 4 (Этажи 1–3 + переходы)
// ==========================================

        // Двухмаршевая лестница для Корпуса 4 (поддерживает продольную и поперечную ориентацию маршей)
        function buildB4Staircase(targetGroup, x1, x2, z1, z2, alongZ = true) {
            addFloorRect(targetGroup, x1, z1, x2, z2, true);
            const steps = 9;

            if (alongZ) {
                const xMid = (x1 + x2) / 2;
                const zStart = z1 + 0.65;
                const zEnd = z2 - 0.65;
                addWallLine(targetGroup, xMid, zStart, xMid, zEnd, [], 0.08);
                const stepD = (zEnd - zStart) / steps;
                const wFlight = (x2 - x1) / 2 - 0.14;

                for (let m = 0; m < 2; m++) {
                    const cx = m === 0 ? (x1 + xMid) / 2 : (xMid + x2) / 2;
                    const dir = m === 0 ? 1 : -1;
                    for (let i = 0; i < steps; i++) {
                        const ratio = dir === 1 ? (i + 1) / steps : (steps - i) / steps;
                        const heightRatio = ratio * 0.52;
                        const sz = zStart + (i + 0.5) * stepD;
                        const geom = new THREE.BoxGeometry(wFlight, 1, stepD * 0.94);
                        registerDynamicStairStep(targetGroup, geom, cx, sz, heightRatio, 0);
                    }
                }
            } else {
                const zMid = (z1 + z2) / 2;
                const xStart = x1 + 0.75;
                const xEnd = x2 - 0.75;
                addWallLine(targetGroup, xStart, zMid, xEnd, zMid, [], 0.08);
                const stepW = (xEnd - xStart) / steps;
                const dFlight = (z2 - z1) / 2 - 0.14;

                for (let m = 0; m < 2; m++) {
                    const cz = m === 0 ? (z1 + zMid) / 2 : (zMid + z2) / 2;
                    const dir = m === 0 ? -1 : 1;
                    for (let i = 0; i < steps; i++) {
                        const ratio = dir === 1 ? (i + 1) / steps : (steps - i) / steps;
                        const heightRatio = ratio * 0.52;
                        const sx = xStart + (i + 0.5) * stepW;
                        const geom = new THREE.BoxGeometry(stepW * 0.94, 1, dFlight);
                        registerDynamicStairStep(targetGroup, geom, sx, cz, heightRatio, 0);
                    }
                }
            }
        }

        // Открытое уличное крыльцо для 1-го этажа Корпуса 4 (без боковых стен)
        function buildB4ExteriorPorch(targetGroup, x1, z1, x2, z2, stepDir = 'south') {
            addFloorRect(targetGroup, x1, z1, x2, z2, true);
            const steps = 5;
            if (stepDir === 'south') {
                const w = Math.abs(x2 - x1);
                const cx = (x1 + x2) / 2;
                const sDepth = 1.25 / steps;
                for (let i = 0; i < steps; i++) {
                    const sz = z2 + (i + 0.5) * sDepth;
                    const heightRatio = 0.03 + ((steps - i) / steps) * 0.12;
                    const geom = new THREE.BoxGeometry(w, 1, sDepth * 0.94);
                    registerDynamicStairStep(targetGroup, geom, cx, sz, heightRatio, -0.14, true);
                }
            } else if (stepDir === 'east') {
                const d = Math.abs(z2 - z1);
                const cz = (z1 + z2) / 2;
                const sWidth = 1.35 / steps;
                for (let i = 0; i < steps; i++) {
                    const sx = x2 + (i + 0.5) * sWidth;
                    const heightRatio = 0.03 + ((steps - i) / steps) * 0.12;
                    const geom = new THREE.BoxGeometry(sWidth * 0.94, 1, d);
                    registerDynamicStairStep(targetGroup, geom, sx, cz, heightRatio, -0.14, true);
                }
            } else if (stepDir === 'west') {
                const d = Math.abs(z2 - z1);
                const cz = (z1 + z2) / 2;
                const sWidth = 1.35 / steps;
                for (let i = 0; i < steps; i++) {
                    const sx = x1 - (i + 0.5) * sWidth;
                    const heightRatio = 0.03 + ((steps - i) / steps) * 0.12;
                    const geom = new THREE.BoxGeometry(sWidth * 0.94, 1, d);
                    registerDynamicStairStep(targetGroup, geom, sx, cz, heightRatio, -0.14, true);
                }
            } else if (stepDir === 'north') {
                const w = Math.abs(x2 - x1);
                const cx = (x1 + x2) / 2;
                const sDepth = 1.25 / steps;
                for (let i = 0; i < steps; i++) {
                    const sz = z1 - (i + 0.5) * sDepth;
                    const heightRatio = 0.03 + ((steps - i) / steps) * 0.12;
                    const geom = new THREE.BoxGeometry(w, 1, sDepth * 0.94);
                    registerDynamicStairStep(targetGroup, geom, cx, sz, heightRatio, -0.14, true);
                }
            }
        }

        /**
         * КОРПУС 4 — ЭТАЖ 1 (БЕЗ надземных переходов!)
         * Координаты синхронизированы со сдвигом Корпуса 4 вверх по X (+6.8 м относительно прежнего положения, S = +4.2),
         * чтобы все 3 сквозные шахты лестниц (ЛК №1, ЛК №2, ЛК №3) на 100% совпадали со 2-м и 3-м этажами!
         */
        function buildBuilding4Floor1(targetGroup) {
            const OUTER_T = 0.24;
            const INNER_T = 0.18;
            const S = 4.2; // Сдвиг по X для идеального совпадения со 2-м этажом (B4_X_WEST = 32.4)

            // --- 1. ПЛИТЫ ПЕРЕКРЫТИЯ 1-ГО ЭТАЖА (БЕЗ ДЫРОК В ПОЛУ!) ---
            addFloorRect(targetGroup, 28.2 + S, -59.6, 34.8 + S, -58.0, false); // Комната 10
            addFloorRect(targetGroup, 29.2 + S, -58.0, 34.8 + S, -54.8, false); // Комнаты 9 и 8
            addFloorRect(targetGroup, 30.2 + S, -54.8, 34.8 + S, -50.0, false); // Комнаты 7, 6, 5
            addFloorRect(targetGroup, 28.2 + S, -50.0, 34.8 + S, -46.8, false); // Комната 4
            addFloorRect(targetGroup, 34.8 + S, -61.2, 37.2 + S, -59.6, false); // Тамбур северного входа у комнаты 10

            // Основной блок помещений 12–24, 18, 19 (X [39.0..61.4], Z [-58.4..-41.8])
            addFloorRect(targetGroup, 34.8 + S, -58.4, 57.2 + S, -41.8, false);
            // Выступ комнат 22 и 23 на севере (X [51.8..61.4], Z [-61.6..-58.4])
            addFloorRect(targetGroup, 47.6 + S, -61.6, 57.2 + S, -58.4, false);

            // Правая нижняя часть (104, 103, холл, блок раздевалок 11, 105, 3, 2, 1): X [32.4..45.6], Z [-46.8..-27.4]
            addFloorRect(targetGroup, B4_X_WEST, -46.8, 45.6, B4_Z_SOUTH, false);

            // Большой зал столовой 102 (X [42.4..64.4], Z [-41.8..-27.4]) — выпирает вверх дальше зала 24 (61.4)!
            addFloorRect(targetGroup, 42.4, -41.8, 64.4, B4_Z_SOUTH, false);

            // Выступающие лестничные клетки и уличные крыльца 1-го этажа:
            // 1) ЛК №2 (X [27.8..32.4], Z [-49.8..-46.8]) + входной тамбур правее неё (X [29.2..32.4], Z [-46.8..-44.2])
            addFloorRect(targetGroup, B4_LK2_X1, B4_LK2_Z1, B4_LK2_X2, B4_LK2_Z2, true);
            addFloorRect(targetGroup, 29.2, B4_LK2_Z2, B4_X_WEST, -44.2, false);
            buildB4ExteriorPorch(targetGroup, 28.8, -51.5, 31.4, B4_LK2_Z1, 'north');
            buildB4ExteriorPorch(targetGroup, 27.6, -46.8, 29.2, -44.2, 'west');

            // 2) ЛК №3 (X [61.4..69.0], Z [-49.8..-45.4]) + верхний подход к столовой 102 (X [61.4..64.4], Z [-45.4..-41.8])
            addFloorRect(targetGroup, B4_LK3_X1, B4_LK3_Z1, B4_LK3_X2, B4_LK3_Z2, true);
            addFloorRect(targetGroup, B4_LK3_X1, B4_LK3_Z2, 64.4, -41.8, false);

            // 3) Правый нижний узел (Z = -27.4):
            // Входной тамбур с крыльцом (X [36.2..38.8], между 103 и ЛК №1), а ВЫШЕ него — сквозная шахта ЛК №1 (X [38.8..42.4], Z [-31.2..-24.4])!
            addFloorRect(targetGroup, 36.2, -29.0, B4_LK1_X1, -26.2, false);
            buildB4ExteriorPorch(targetGroup, 36.2, -26.2, B4_LK1_X1, -24.4, 'south');
            addFloorRect(targetGroup, B4_LK1_X1, B4_LK1_Z1, B4_LK1_X2, B4_LK1_Z2, true);

            // --- 2. ОПОРНЫЕ СТОЛБЫ (КОЛОННЫ) ПОД НАВИСАЮЩЕЙ ЧАСТЬЮ СПОРТЗАЛА 206 (С ВОСТОКА И СЕВЕРА) ---
            [34.7, 38.2, 42.7, 47.2, 50.7].forEach(cx => {
                addSquareColumn(targetGroup, cx, -61.2, 0.42, true);
            });
            [-61.2, -57.5, -53.8, -50.2].forEach(cz => {
                addSquareColumn(targetGroup, 65.6, cz, 0.42, true);
            });

            // --- 3. СТЕНЫ ЛЕСТНИЧНЫХ КЛЕТОК И ВНЕШНЕГО ПЕРИМЕТРА 1-ГО ЭТАЖА ---
            // Шахта ЛК №2 (X [27.8..32.4], Z [-49.8..-46.8])
            addWallLine(targetGroup, B4_LK2_X1, B4_LK2_Z1, B4_LK2_X2, B4_LK2_Z1, [
                { from: 29.4, to: 30.8, type: 'door' }
            ], OUTER_T);
            addWallLine(targetGroup, B4_LK2_X1, B4_LK2_Z1, B4_LK2_X1, B4_LK2_Z2, [], OUTER_T);
            addWallLine(targetGroup, B4_LK2_X1, B4_LK2_Z2, B4_LK2_X2, B4_LK2_Z2, [
                { from: 30.4, to: 31.8, type: 'door' }
            ], OUTER_T);
            buildB4Staircase(targetGroup, B4_LK2_X1 + 0.1, B4_LK2_X2 - 0.1, B4_LK2_Z1 + 0.1, B4_LK2_Z2 - 0.1, false);

            // Входной тамбур правее ЛК №2 (X [29.2..32.4], Z [-46.8..-44.2])
            addWallLine(targetGroup, 29.2, -46.8, 29.2, -44.2, [
                { from: -46.1, to: -44.9, type: 'door' }
            ], OUTER_T);
            addWallLine(targetGroup, 29.2, -44.2, B4_X_WEST, -44.2, [], OUTER_T);

            // Шахта ЛК №3 (X [61.4..69.0], Z [-49.8..-45.4]) — единая со 2-м и 3-м этажами!
            addWallLine(targetGroup, B4_LK3_X1, B4_LK3_Z1, B4_LK3_X2, B4_LK3_Z1, [], OUTER_T);
            addWallLine(targetGroup, 64.4, B4_LK3_Z2, B4_LK3_X2, B4_LK3_Z2, [], OUTER_T);
            addWallLine(targetGroup, B4_LK3_X2, B4_LK3_Z1, B4_LK3_X2, B4_LK3_Z2, [
                { from: -48.4, to: -46.8, type: 'door' }
            ], OUTER_T);
            addWallLine(targetGroup, 64.4, B4_LK3_Z2, 64.4, -41.8, [], OUTER_T);
            buildB4Staircase(targetGroup, B4_LK3_X1 + 0.1, B4_X_EAST - 0.1, B4_LK3_Z1 + 0.1, B4_LK3_Z2 - 0.1, false);

            // Шахта ЛК №1 (X [38.8..42.4], Z [-31.2..-24.4]) — единая со 2-м и 3-м этажами!
            addWallLine(targetGroup, B4_LK1_X1, B4_LK1_Z1, B4_LK1_X1, B4_LK1_Z2, [], OUTER_T);
            addWallLine(targetGroup, B4_LK1_X2, B4_LK1_Z1, B4_LK1_X2, B4_LK1_Z2, [], OUTER_T);
            addWallLine(targetGroup, B4_LK1_X1, B4_LK1_Z2, B4_LK1_X2, B4_LK1_Z2, [], OUTER_T);
            addWallLine(targetGroup, B4_LK1_X1, B4_LK1_Z1, B4_LK1_X2, B4_LK1_Z1, [
                { from: 39.8, to: 41.4, type: 'door' }
            ], INNER_T);
            buildB4Staircase(targetGroup, B4_LK1_X1 + 0.1, B4_LK1_X2 - 0.1, B4_LK1_Z1 + 0.1, B4_LK1_Z2 - 0.1, true);

            // Входной тамбур с двойными дверями НИЖЕ ЛК №1 (X [36.2..38.8], Z [-29.0..-26.2], под переходом 2-го этажа!)
            addWallLine(targetGroup, 36.2, -29.0, B4_LK1_X1, -29.0, [
                { from: 36.8, to: 38.2, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 36.2, -26.2, B4_LK1_X1, -26.2, [
                { from: 36.8, to: 38.2, type: 'door' }
            ], OUTER_T);
            addWallLine(targetGroup, 36.2, -29.0, 36.2, -26.2, [], OUTER_T);

            // Ступенчатый нижний фасад вдоль комнат 104, 103 и 4–10:
            addWallLine(targetGroup, B4_X_WEST, -50.0, B4_X_WEST, B4_Z_SOUTH, [
                { from: B4_LK2_Z1, to: B4_LK2_Z2, type: 'open' },
                { from: -46.2, to: -44.8, type: 'door' }
            ], OUTER_T);
            addWallLine(targetGroup, B4_X_WEST, -50.0, 30.2 + S, -50.0, [], OUTER_T);
            addWallLine(targetGroup, 30.2 + S, -54.8, 30.2 + S, -50.0, [], OUTER_T);
            addWallLine(targetGroup, 29.2 + S, -54.8, 30.2 + S, -54.8, [], OUTER_T);
            addWallLine(targetGroup, 29.2 + S, -58.0, 29.2 + S, -54.8, [], OUTER_T);
            addWallLine(targetGroup, B4_X_WEST, -58.0, 29.2 + S, -58.0, [], OUTER_T);
            addWallLine(targetGroup, B4_X_WEST, -59.6, B4_X_WEST, -58.0, [], OUTER_T);

            // Левый (северный) внешний контур 1-го этажа:
            addWallLine(targetGroup, B4_X_WEST, -59.6, 34.8 + S, -59.6, [], OUTER_T);
            addWallLine(targetGroup, 34.8 + S, -61.2, 34.8 + S, -59.6, [], OUTER_T);
            addWallLine(targetGroup, 34.8 + S, -61.2, 37.2 + S, -61.2, [
                { from: 35.4 + S, to: 36.6 + S, type: 'door' }
            ], OUTER_T);
            addWallLine(targetGroup, 37.2 + S, -61.2, 37.2 + S, -58.4, [], OUTER_T);
            addWallLine(targetGroup, 37.2 + S, -58.4, 47.6 + S, -58.4, [
                { from: 38.8 + S, to: 40.2 + S, type: 'door' },
                { from: 41.8 + S, to: 43.2 + S, type: 'door' }
            ], OUTER_T);
            addWallLine(targetGroup, 47.6 + S, -61.6, 47.6 + S, -58.4, [], OUTER_T);
            addWallLine(targetGroup, 47.6 + S, -61.6, 57.2 + S, -61.6, [], OUTER_T);

            // Верхняя стена блока 23, 24, 19, 18 (X = 61.4, Z [-61.6..-41.8])
            addWallLine(targetGroup, 57.2 + S, -61.6, 57.2 + S, -41.8, [
                { from: -49.0, to: -46.2, type: 'open' },
                { from: -44.2, to: -42.8, type: 'door' }
            ], OUTER_T);

            // Выступающий верхний контур столовой 102 (X = 64.4, Z [-41.8..-27.4]) с дверью к ЛК №3
            addWallLine(targetGroup, 61.4, -41.8, 64.4, -41.8, [
                { from: 62.0, to: 63.6, type: 'door' }
            ], OUTER_T);
            addWallLine(targetGroup, 64.4, -41.8, 64.4, B4_Z_SOUTH, [], OUTER_T);

            // Правая внешняя стена Z = -27.4
            addWallLine(targetGroup, B4_X_WEST, B4_Z_SOUTH, 64.4, B4_Z_SOUTH, [
                { from: 36.2, to: B4_LK1_X2, type: 'open' }
            ], OUTER_T);

            // --- 4. ВНУТРЕННИЕ ПЕРЕГОРОДКИ 1-ГО ЭТАЖА КОРПУСА 4 ---
            addWallLine(targetGroup, B4_X_WEST, -44.2, 36.2, -44.2, [], INNER_T);
            addWallLine(targetGroup, B4_X_WEST, -35.6, 36.2, -35.6, [], INNER_T);
            addWallLine(targetGroup, 36.2, -44.2, 36.2, -29.0, [
                { from: -38.4, to: -36.8, type: 'door' },
                { from: -33.6, to: -32.0, type: 'door' }
            ], INNER_T);

            // Столовая 102 (X [42.4..64.4], Z [-41.8..-27.4])
            addWallLine(targetGroup, 42.4, -41.8, 61.4, -41.8, [
                { from: 56.2, to: 57.8, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 42.4, -41.8, 42.4, B4_Z_SOUTH, [
                { from: -38.8, to: -37.0, type: 'door' },
                { from: -34.2, to: -32.4, type: 'door' }
            ], INNER_T);

            // Центральный блок раздевалок и санузлов перед столовой: 11, 105, 3, 2, 1, 1 (X [37.4..42.4], Z [-46.8..-35.6])
            addWallLine(targetGroup, 37.4, -46.8, 42.4, -46.8, [
                { from: 41.0, to: 42.1, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 37.4, -35.6, 42.4, -35.6, [
                { from: 38.0, to: 39.4, type: 'open' },
                { from: 40.4, to: 41.8, type: 'open' }
            ], INNER_T);
            addWallLine(targetGroup, 37.4, -46.8, 37.4, -35.6, [
                { from: -43.6, to: -42.4, type: 'door' },
                { from: -41.2, to: -40.0, type: 'door' },
                { from: -39.2, to: -38.0, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 42.4, -46.8, 42.4, -41.8, [
                { from: -45.8, to: -44.6, type: 'door' },
                { from: -43.4, to: -42.2, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, 37.4, -44.0, 42.4, -44.0, [
                { from: 41.0, to: 42.1, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 39.8, -44.0, 39.8, -41.4, [], INNER_T);
            addWallLine(targetGroup, 40.8, -46.8, 40.8, -44.0, [
                { from: -45.8, to: -44.6, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 37.4, -41.4, 42.4, -41.4, [], INNER_T);
            addWallLine(targetGroup, 37.4, -39.6, 42.4, -39.6, [], INNER_T);
            addWallLine(targetGroup, 37.4, -37.8, 42.4, -37.8, [], INNER_T);
            addWallLine(targetGroup, 40.0, -41.4, 40.0, -37.8, [
                { from: -40.9, to: -40.0, type: 'door' },
                { from: -39.1, to: -38.2, type: 'door' }
            ], 0.12);
            addWallLine(targetGroup, 40.0, -40.5, 42.4, -40.5, [], 0.12);
            addWallLine(targetGroup, 40.0, -38.7, 42.4, -38.7, [], 0.12);

            // Отдельно стоящий в холле кабинет 12
            addWallLine(targetGroup, 34.6 + S, -51.8, 37.6 + S, -51.8, [], INNER_T);
            addWallLine(targetGroup, 34.6 + S, -47.4, 37.6 + S, -47.4, [], INNER_T);
            addWallLine(targetGroup, 34.6 + S, -51.8, 34.6 + S, -47.4, [
                { from: -50.8, to: -49.6, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 37.6 + S, -51.8, 37.6 + S, -47.4, [], INNER_T);

            // Помещение 14 вдоль левой стены столовой 102 + холл и комн. 18
            addWallLine(targetGroup, 42.4, -44.6, 49.2 + S, -44.6, [], INNER_T);
            addWallLine(targetGroup, 49.2 + S, -44.6, 49.2 + S, -41.8, [
                { from: -43.8, to: -42.6, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 51.4 + S, -44.6, 57.2 + S, -44.6, [], INNER_T);
            addWallLine(targetGroup, 51.4 + S, -44.6, 51.4 + S, -41.8, [
                { from: -43.8, to: -42.6, type: 'door' }
            ], INNER_T);

            // Ряд кабинетов 15, 16, 17 и комната 19
            addWallLine(targetGroup, 38.8 + S, -49.8, 49.2 + S, -49.8, [
                { from: 40.0 + S, to: 41.2 + S, type: 'door' },
                { from: 43.4 + S, to: 44.6 + S, type: 'door' },
                { from: 46.8 + S, to: 48.0 + S, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 38.8 + S, -49.8, 38.8 + S, -44.6, [], INNER_T);
            addWallLine(targetGroup, 42.3 + S, -49.8, 42.3 + S, -44.6, [], INNER_T);
            addWallLine(targetGroup, 45.8 + S, -49.8, 45.8 + S, -44.6, [], INNER_T);
            addWallLine(targetGroup, 49.2 + S, -49.8, 49.2 + S, -44.6, [
                { from: -46.4, to: -45.2, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, 49.2 + S, -48.6, 57.2 + S, -48.6, [
                { from: 49.6 + S, to: 50.8 + S, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 51.0 + S, -48.6, 51.0 + S, -44.6, [
                { from: -47.0, to: -45.8, type: 'door' }
            ], INNER_T);

            // Ряд комнат 4, 5, 6, 7, 8, 9, 10 вдоль нижней стороны
            addWallLine(targetGroup, B4_X_WEST, -46.8, 34.8 + S, -46.8, [
                { from: 26.0 + S, to: 27.2 + S, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 34.8 + S, -59.6, 34.8 + S, -46.8, [
                { from: -59.0, to: -57.8, type: 'door' },
                { from: -56.8, to: -55.6, type: 'door' },
                { from: -54.4, to: -53.4, type: 'door' },
                { from: -52.8, to: -51.8, type: 'door' },
                { from: -51.2, to: -50.2, type: 'door' },
                { from: -49.0, to: -47.8, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 30.2 + S, -50.0, 34.8 + S, -50.0, [], INNER_T);
            addWallLine(targetGroup, 30.2 + S, -51.6, 34.8 + S, -51.6, [], INNER_T);
            addWallLine(targetGroup, 30.2 + S, -53.2, 34.8 + S, -53.2, [], INNER_T);
            addWallLine(targetGroup, 29.2 + S, -54.8, 34.8 + S, -54.8, [], INNER_T);
            addWallLine(targetGroup, 29.2 + S, -56.4, 34.8 + S, -56.4, [], INNER_T);
            addWallLine(targetGroup, B4_X_WEST, -58.0, 34.8 + S, -58.0, [], INNER_T);

            // Левый блок: комната 13, проход, комнаты 20 и 21, секции 22 и 23, зал 24
            addWallLine(targetGroup, 37.2 + S, -58.4, 37.2 + S, -53.4, [
                { from: -58.0, to: -56.8, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 37.2 + S, -57.4, 40.8 + S, -57.4, [
                { from: 38.4 + S, to: 39.6 + S, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 37.2 + S, -54.6, 40.8 + S, -54.6, [], INNER_T);
            addWallLine(targetGroup, 40.8 + S, -58.4, 40.8 + S, -53.4, [], INNER_T);

            addWallLine(targetGroup, 43.2 + S, -58.4, 43.2 + S, -53.4, [
                { from: -56.8, to: -55.6, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 45.4 + S, -58.4, 45.4 + S, -53.4, [], INNER_T);
            addWallLine(targetGroup, 47.6 + S, -58.4, 47.6 + S, -53.4, [
                { from: -57.8, to: -56.6, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 43.2 + S, -53.4, 47.6 + S, -53.4, [
                { from: 43.8 + S, to: 44.8 + S, type: 'open' },
                { from: 46.0 + S, to: 47.0 + S, type: 'open' }
            ], INNER_T);

            addWallLine(targetGroup, 47.6 + S, -58.4, 57.2 + S, -58.4, [
                { from: 51.0 + S, to: 52.4 + S, type: 'door' },
                { from: 55.2 + S, to: 56.6 + S, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 54.4 + S, -61.6, 54.4 + S, -58.4, [], INNER_T);

            // 3D-плашки помещений 1-го этажа Корпуса 4 (buildingId = 4)
            addRoomLabel(targetGroup, 1, 'ЛК№2', 30.1, -48.3, true, false, 4, 0.85);
            addRoomLabel(targetGroup, 1, 'ЛК№3', 64.8, -47.6, true, false, 4, 0.85);
            addRoomLabel(targetGroup, 1, 'ЛК№1', 40.6, -27.8, true, false, 4, 0.88);
            addRoomLabel(targetGroup, 1, '104', 34.3, -39.9, false, false, 4, 0.95);
            addRoomLabel(targetGroup, 1, '103', 34.3, -31.5, false, false, 4, 0.95);
            addRoomLabel(targetGroup, 1, '102', 53.4, -34.4, false, false, 4, 1.2);
            addRoomLabel(targetGroup, 1, '1', 39.9, -36.7, true, false, 4, 0.82);
            addRoomLabel(targetGroup, 1, '1', 38.7, -38.7, true, false, 4, 0.78);
            addRoomLabel(targetGroup, 1, '2', 38.7, -40.5, true, false, 4, 0.78);
            addRoomLabel(targetGroup, 1, '105', 38.6, -42.7, true, false, 4, 0.78);
            addRoomLabel(targetGroup, 1, '3', 41.1, -42.7, true, false, 4, 0.82);
            addRoomLabel(targetGroup, 1, '11', 39.1, -45.4, true, false, 4, 0.82);
            addRoomLabel(targetGroup, 1, '12', 40.3, -49.6, true, false, 4, 0.82);
            addRoomLabel(targetGroup, 1, '14', 47.9, -43.2, true, false, 4, 0.85);
            addRoomLabel(targetGroup, 1, '15', 44.7, -47.2, true, false, 4, 0.85);
            addRoomLabel(targetGroup, 1, '16', 48.2, -47.2, true, false, 4, 0.85);
            addRoomLabel(targetGroup, 1, '17', 51.7, -47.2, true, false, 4, 0.85);
            addRoomLabel(targetGroup, 1, '18', 58.5, -43.2, true, false, 4, 0.85);
            addRoomLabel(targetGroup, 1, '19', 58.3, -46.6, true, false, 4, 0.85);
            addRoomLabel(targetGroup, 1, '4', 35.7, -48.4, true, false, 4, 0.85);
            addRoomLabel(targetGroup, 1, '5', 36.7, -50.8, true, false, 4, 0.76);
            addRoomLabel(targetGroup, 1, '6', 36.7, -52.4, true, false, 4, 0.76);
            addRoomLabel(targetGroup, 1, '7', 36.7, -54.0, true, false, 4, 0.76);
            addRoomLabel(targetGroup, 1, '8', 36.2, -55.6, true, false, 4, 0.76);
            addRoomLabel(targetGroup, 1, '9', 36.2, -57.2, true, false, 4, 0.76);
            addRoomLabel(targetGroup, 1, '10', 35.7, -58.8, true, false, 4, 0.82);
            addRoomLabel(targetGroup, 1, '13', 43.2, -56.0, true, false, 4, 0.85);
            addRoomLabel(targetGroup, 1, '20', 48.5, -55.9, true, false, 4, 0.82);
            addRoomLabel(targetGroup, 1, '21', 50.7, -55.9, true, false, 4, 0.82);
            addRoomLabel(targetGroup, 1, '24', 56.6, -54.0, false, false, 4, 1.1);
            addRoomLabel(targetGroup, 1, '22', 55.2, -60.0, true, false, 4, 0.85);
            addRoomLabel(targetGroup, 1, '23', 60.0, -60.0, true, false, 4, 0.82);
        }

        /**
         * КОРПУС 4 — ЭТАЖ 2 + ДВА ПРЯМЫХ НАДЗЕМНЫХ ПЕРЕХОДА (К КОРПУСУ 3 И К КОРПУСУ 2):
         * Исправлено:
         * 1) Удлинён переход К3 ↔ К4 (X [15.6..32.4], Z [-46.8..-44.2]), за счёт чего Корпус 4 отодвинулся вверх по X (B4_X_WEST = 32.4).
         * 2) Теперь переход К4 ↔ К2 (X [36.2..38.8]) выходит СТРОГО МЕЖДУ углом каб. 201 (X [32.4..36.2]) и лестницей ЛК №1 (X [38.8..42.4])!
         * 3) Дальняя лестница ЛК №3 (X [61.4..69.0], Z [-49.8..-45.4]) выровнена в одну линию со стеной зала 206 (Z = -49.8) и лентой 210–212 (Z = -45.4), с двумя дверями в тамбур перед ней.
         * 4) Исправлен узел дверей между С/У и блоком 207/208 (аккуратный тамбур без перехлёста стен).
         */
        function buildBuilding4Floor2(targetGroup) {
            const OUTER_T = 0.24;
            const INNER_T = 0.18;

            // 1. Основная плита перекрытия 2-го этажа Корпуса 4 (X [32.4..66.0], Z [-61.6..-27.4])
            addFloorRect(targetGroup, B4_X_WEST, B4_Z_NORTH, B4_X_EAST, B4_Z_SOUTH, false);

            // Выступающие лестничные клетки Корпуса 4:
            addFloorRect(targetGroup, B4_LK2_X1, B4_LK2_Z1, B4_LK2_X2, B4_LK2_Z2, true);
            addFloorRect(targetGroup, B4_LK3_X1, B4_LK3_Z1, B4_LK3_X2, B4_LK3_Z2, true);
            addFloorRect(targetGroup, B4_LK1_X1, B4_LK1_Z1, B4_LK1_X2, B4_LK1_Z2, true);

            // --- ДВА ПРЯМЫХ НАДЗЕМНЫХ КОРИДОРА-ПЕРЕХОДА 2-ГО ЭТАЖА ---
            // 1) УДЛИНЁННЫЙ ПРЯМОЙ ПЕРЕХОД К3 ↔ К4 (X [15.6..32.4], Z [-46.8..-44.2]) — примыкает вплотную к ЛК №2 (X [27.8..32.4], Z [-49.8..-46.8])
            addFloorRect(targetGroup, 15.6, -46.8, B4_X_WEST, -44.2, false);
            addWallLine(targetGroup, 15.6, -46.8, B4_LK2_X1, -46.8, [], OUTER_T);
            addWallLine(targetGroup, 15.6, -44.2, B4_X_WEST, -44.2, [], OUTER_T);

            // 2) ПРЯМОЙ ПЕРЕХОД К4 ↔ К2 (X [36.2..38.8], Z [-27.4..-13.8]):
            // Расположен СТРОГО МЕЖДУ углом каб. 201 (X [32.4..36.2]) и лестницей ЛК №1 (X [38.8..42.4]), как на плане!
            addFloorRect(targetGroup, 36.2, B4_Z_SOUTH, B4_LK1_X1, B2_Z_TOP, false);
            addWallLine(targetGroup, 36.2, B4_Z_SOUTH, 36.2, B2_Z_TOP, [], OUTER_T);
            addWallLine(targetGroup, B4_LK1_X1, B4_LK1_Z2, B4_LK1_X1, B2_Z_TOP, [], OUTER_T);
            for (let i = 0; i < 4; i++) {
                const sz = -27.0 + i * 0.36;
                const heightRatio = 0.04 * (4 - i);
                const geom = new THREE.BoxGeometry(2.36, 1, 0.32);
                registerDynamicStairStep(targetGroup, geom, 37.5, sz, heightRatio, 0);
            }

            // --- ВНЕШНИЙ ПЕРИМЕТР И ЛЕСТНИЧНЫЕ КЛЕТКИ 2-ГО ЭТАЖА КОРПУСА 4 ---
            // Шахта ЛК №2 (X [27.8..32.4], Z [-49.8..-46.8]) — со сплошной общей стенкой Z = -46.8 и дверью у входа
            addWallLine(targetGroup, B4_LK2_X1, B4_LK2_Z1, B4_LK2_X2, B4_LK2_Z1, [], OUTER_T);
            addWallLine(targetGroup, B4_LK2_X1, B4_LK2_Z1, B4_LK2_X1, B4_LK2_Z2, [], OUTER_T);
            addWallLine(targetGroup, B4_LK2_X1, B4_LK2_Z2, B4_LK2_X2, B4_LK2_Z2, [
                { from: 30.9, to: 32.0, type: 'door' }
            ], INNER_T);
            buildB4Staircase(targetGroup, B4_LK2_X1 + 0.1, B4_LK2_X2 - 0.1, B4_LK2_Z1 + 0.1, B4_LK2_Z2 - 0.1, false);

            // Шахта дальней лестницы ЛК №3 (X [61.4..69.0], Z [-49.8..-45.4]):
            // Левая стена Z = -49.8 идёт ровно в створе со стеной спортзала 206, правая Z = -45.4 — в створе с рядом 210–212!
            addWallLine(targetGroup, B4_X_EAST, B4_LK3_Z1, B4_LK3_X2, B4_LK3_Z1, [], OUTER_T);
            addWallLine(targetGroup, B4_X_EAST, B4_LK3_Z2, B4_LK3_X2, B4_LK3_Z2, [], OUTER_T);
            addWallLine(targetGroup, B4_LK3_X2, B4_LK3_Z1, B4_LK3_X2, B4_LK3_Z2, [], OUTER_T);
            // Внутренние стенки предбанника перед ЛК №3 (X [61.4..63.2], Z [-49.8..-45.4]) с двумя дверями (слева и справа), как на плане
            addWallLine(targetGroup, B4_LK3_X1, B4_LK3_Z1, B4_X_EAST, B4_LK3_Z1, [
                { from: 61.7, to: 62.9, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, B4_LK3_X1, B4_LK3_Z2, B4_X_EAST, B4_LK3_Z2, [
                { from: 61.7, to: 62.9, type: 'door' }
            ], INNER_T);
            buildB4Staircase(targetGroup, 63.2, B4_LK3_X2 - 0.15, B4_LK3_Z1 + 0.1, B4_LK3_Z2 - 0.1, false);

            // Шахта ЛК №1 (X [38.8..42.4], Z [-31.2..-24.4]) — расположена ВЫШЕ перехода К4↔К2 (X [36.2..38.8]), 100% совпадает с 1 и 3 этажами!
            addWallLine(targetGroup, B4_LK1_X1, B4_LK1_Z1, B4_LK1_X1, B4_LK1_Z2, [], OUTER_T);
            addWallLine(targetGroup, B4_LK1_X2, B4_LK1_Z1, B4_LK1_X2, B4_LK1_Z2, [], OUTER_T);
            addWallLine(targetGroup, B4_LK1_X1, B4_LK1_Z2, B4_LK1_X2, B4_LK1_Z2, [], OUTER_T);
            addWallLine(targetGroup, B4_LK1_X1, B4_LK1_Z1, B4_LK1_X2, B4_LK1_Z1, [
                { from: 39.8, to: 41.4, type: 'door' }
            ], INNER_T);
            buildB4Staircase(targetGroup, B4_LK1_X1 + 0.1, B4_LK1_X2 - 0.1, B4_LK1_Z1 + 0.1, B4_LK1_Z2 - 0.1, true);

            // Нижняя внешняя стена Корпуса 4 (X = 32.4):
            addWallLine(targetGroup, B4_X_WEST, B4_Z_NORTH, B4_X_WEST, B4_Z_SOUTH, [
                { from: -49.2, to: -47.4, type: 'door' }, // Двустворчатая дверь из ЛК №2 в холл
                { from: -46.4, to: -44.6, type: 'door' }  // Двустворчатая дверь из Перехода в холл
            ], OUTER_T);

            // Верхняя внешняя стена Корпуса 4 (X = 66.0) с проёмом в ЛК №3 (Z [-49.8..-45.4])
            addWallLine(targetGroup, B4_X_EAST, B4_Z_NORTH, B4_X_EAST, B4_Z_SOUTH, [
                { from: B4_LK3_Z1, to: B4_LK3_Z2, type: 'open' }
            ], OUTER_T);

            // Левая внешняя стена зала 206 (Z = -61.6)
            addWallLine(targetGroup, B4_X_WEST, B4_Z_NORTH, B4_X_EAST, B4_Z_NORTH, [], OUTER_T);

            // Правая внешняя стена Корпуса 4 (Z = -27.4): двустворчатая дверь в переход К4↔К2 (X [36.5..38.5]) МЕЖДУ каб. 201 и ЛК №1 (X [38.8..42.4])!
            addWallLine(targetGroup, B4_X_WEST, B4_Z_SOUTH, B4_X_EAST, B4_Z_SOUTH, [
                { from: 36.5, to: 38.5, type: 'door' },
                { from: B4_LK1_X1, to: B4_LK1_X2, type: 'open' }
            ], OUTER_T);

            // --- ВНУТРЕННЯЯ ПЛАНИРОВКА 2-ГО ЭТАЖА КОРПУСА 4 ---
            // 1) Стена между залом 206 и центральным холлом / помещениями (Z = -49.8, от X = 32.4 до X = 61.4)
            addWallLine(targetGroup, B4_X_WEST, B4_Z_MID_N, B4_LK3_X1, B4_Z_MID_N, [
                { from: 33.4, to: 35.4, type: 'door' }, // Первая (нижняя) двустворчатая дверь из холла в зал 206
                { from: 36.6, to: 38.6, type: 'door' }, // Вторая (верхняя) двустворчатая дверь из холла в зал 206
                { from: 45.6, to: 47.6, type: 'door' }  // Двустворчатая дверь из Служеб. пом. в зал 206
            ], INNER_T);

            // Колонны по периметру зала 206
            [36.6, 41.2, 45.8, 50.4, 55.0, 59.6].forEach(cx => {
                addSquareColumn(targetGroup, cx, B4_Z_NORTH + 0.25, 0.38);
            });
            [-57.8, -53.8].forEach(cz => {
                addSquareColumn(targetGroup, B4_X_WEST + 0.25, cz, 0.38);
                addSquareColumn(targetGroup, B4_X_EAST - 0.25, cz, 0.38);
            });

            // 2) Блок двух С/У (X [39.8..43.2], Z [-49.8..-45.4]):
            // Симметричные входы снизу (на X = 39.8) и две кабинки внутри с боковыми дверями, правая стена С/У (Z = -45.4) глухая
            addFloorRect(targetGroup, 39.8, B4_Z_MID_N, 43.2, B4_Z_MID_S, true);
            addWallLine(targetGroup, 39.8, B4_Z_MID_N, 39.8, B4_Z_MID_S, [
                { from: -49.6, to: -48.6, type: 'door' },
                { from: -46.6, to: -45.6, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 39.8, B4_Z_MID_S, 43.2, B4_Z_MID_S, [], INNER_T);
            addWallLine(targetGroup, 43.2, B4_Z_MID_N, 43.2, B4_Z_MID_S, [], INNER_T);
            addWallLine(targetGroup, 39.8, -47.6, 43.2, -47.6, [], 0.14);
            addWallLine(targetGroup, 41.8, -48.5, 41.8, -46.7, [], 0.12);
            addWallLine(targetGroup, 39.8, -48.5, 41.8, -48.5, [
                { from: 40.2, to: 41.4, type: 'door' }
            ], 0.12);
            addWallLine(targetGroup, 39.8, -46.7, 41.8, -46.7, [
                { from: 40.2, to: 41.4, type: 'door' }
            ], 0.12);

            // 3) Остальная центральная лента (Z [-49.8..-45.4], X от 43.2 до 61.4):
            // Служеб. пом. (X [43.2..49.2]), 210 (X [49.2..53.2]), 211 (X [53.2..57.3]), 212 (X [57.3..61.4])
            addWallLine(targetGroup, 43.2, B4_Z_MID_S, B4_LK3_X1, B4_Z_MID_S, [
                { from: 51.6, to: 52.8, type: 'door' }, // Дверь в 210
                { from: 53.6, to: 54.6, type: 'door' }, // Дверь в тамбур 211
                { from: 60.0, to: 61.0, type: 'door' }  // Дверь в тамбур 212
            ], INNER_T);
            [49.2, 53.2, 57.3, B4_LK3_X1].forEach(xWall => {
                addWallLine(targetGroup, xWall, B4_Z_MID_N, xWall, B4_Z_MID_S, [], INNER_T);
            });
            addWallLine(targetGroup, 54.8, -46.6, 59.8, -46.6, [
                { from: 55.4, to: 56.6, type: 'door' },
                { from: 58.0, to: 59.2, type: 'door' }
            ], 0.12);
            addWallLine(targetGroup, 54.8, -46.6, 54.8, B4_Z_MID_S, [], 0.12);
            addWallLine(targetGroup, 59.8, -46.6, 59.8, B4_Z_MID_S, [], 0.12);

            // 4) Блок 207, 208, 209, 203 (X [39.2..51.0], Z [-43.6..-37.2]) и дверь отсечки коридора:
            // На плане дверь отсечки коридора стоит на X = 42.2 (Z [-45.4..-43.6]) между углом С/У и входом в тамбур 207/208, не перекрывая двери!
            const BX_BOT = 39.2, BX_207_208 = 42.8, BX_208_TOP = 46.6, BX_TOP = 51.0;
            const BZ_LEFT = -43.6, BZ_VEST = -41.8, BZ_CORR_END = -39.6, BZ_MID_209_203 = -40.4, BZ_RIGHT = -37.2;

            // Перегородка с дверью в коридоре между С/У и верхним углом тамбура 207/208 (X = 42.2, Z [-45.4..-43.6])
            addWallLine(targetGroup, 42.2, B4_Z_MID_S, 42.2, BZ_LEFT, [
                { from: -45.1, to: -43.9, type: 'door' }
            ], INNER_T);

            // Нижняя глухая стена 207 (X = 39.2, Z [-43.6..-37.2]) и правая стена всего блока (Z = -37.2, X [39.2..51.0])
            addWallLine(targetGroup, BX_BOT, BZ_LEFT, BX_BOT, BZ_RIGHT, [], INNER_T);
            addWallLine(targetGroup, BX_BOT, BZ_RIGHT, BX_TOP, BZ_RIGHT, [
                { from: 48.0, to: 49.4, type: 'door' } // Вход в 203 справа
            ], INNER_T);

            // Левая стена блока вдоль коридора (Z = -43.6): глухая у 207, открытая в нише [41.0..42.2], глухая у 208, с дверью в 209
            addWallLine(targetGroup, BX_BOT, BZ_LEFT, 41.0, BZ_LEFT, [], INNER_T);
            addWallLine(targetGroup, 44.2, BZ_LEFT, BX_TOP, BZ_LEFT, [
                { from: 48.0, to: 49.4, type: 'door' } // Вход в 209 слева из коридора
            ], INNER_T);

            // Входной предбанник в 207 и 208 (X [41.0..44.2], Z [-43.6..-41.8]):
            // Слева (на Z = -43.6) свободный вход из холла, а на нижней (X = 41.0) и верхней (X = 44.2) стенках — двери в 207 и 208, плюс входы в 2 узких коридорчика!
            addWallLine(targetGroup, 41.0, BZ_LEFT, 41.0, BZ_VEST, [
                { from: -43.3, to: -42.1, type: 'door' }
            ], 0.14);
            addWallLine(targetGroup, 44.2, BZ_LEFT, 44.2, BZ_VEST, [
                { from: -43.3, to: -42.1, type: 'door' }
            ], 0.14);

            // Два узких внутренних коридорчика (X [41.0..42.8] для 207 и X [42.8..44.2] для 208, Z [-41.8..-39.6])
            addWallLine(targetGroup, 41.0, BZ_VEST, 41.0, BZ_CORR_END, [], 0.14);
            addWallLine(targetGroup, 44.2, BZ_VEST, 44.2, BZ_CORR_END, [], 0.14);
            addWallLine(targetGroup, BX_207_208, BZ_VEST, BX_207_208, BZ_RIGHT, [], INNER_T); // Перегородка между 207 и 208
            addWallLine(targetGroup, 41.0, BZ_CORR_END, 44.2, BZ_CORR_END, [
                { from: 41.2, to: 42.5, type: 'door' },
                { from: 42.9, to: 44.0, type: 'door' }
            ], 0.14);

            // Горизонтальная стена между (207/208) и (209/203): X = 46.6, Z [-43.6..-37.2]
            addWallLine(targetGroup, BX_208_TOP, BZ_LEFT, BX_208_TOP, BZ_RIGHT, [], INNER_T);
            // Вертикальная перегородка между 209 и 203: Z = -40.4, X [46.6..51.0]
            addWallLine(targetGroup, BX_208_TOP, BZ_MID_209_203, BX_TOP, BZ_MID_209_203, [], INNER_T);

            // 5) Нижний ряд кабинетов (X [32.4..36.2], Z [-44.2..-27.4]): 205, две подсобки, 202, 201
            // Заканчивается ровно на X = 36.2, чтобы сразу выше 201 (между 36.2 и ЛК №1 38.8) выходил Переход К4 ↔ К2!
            addWallLine(targetGroup, B4_X_WEST, -44.2, 36.2, -44.2, [], INNER_T);
            addWallLine(targetGroup, 36.2, -44.2, 36.2, B4_Z_SOUTH, [
                { from: -40.2, to: -39.0, type: 'door' }, // Вход в 205
                { from: -35.8, to: -34.6, type: 'door' }, // Вход в 202
                { from: -30.0, to: -28.8, type: 'door' }  // Вход в 201
            ], INNER_T);
            addWallLine(targetGroup, B4_X_WEST, -38.4, 36.2, -38.4, [
                { from: 34.4, to: 35.6, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, B4_X_WEST, -36.4, 36.2, -36.4, [
                { from: 34.4, to: 35.6, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 34.2, -38.4, 34.2, -36.4, [], 0.14);
            addWallLine(targetGroup, B4_X_WEST, -31.4, 36.2, -31.4, [], INNER_T);

            // 6) Большой актовый зал 204 (X [51.0..66.0], Z [-41.8..-27.4]):
            addWallLine(targetGroup, BX_TOP, -41.8, B4_X_EAST, -41.8, [
                { from: 58.6, to: 60.4, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, BX_TOP, BZ_LEFT, BX_TOP, B4_Z_SOUTH, [
                { from: -36.8, to: -34.8, type: 'door' } // Двустворчатая дверь в актовый зал 204 рядом с 203
            ], INNER_T);
            [-34.2, -32.5, -30.8, -29.1].forEach(zRib => {
                addWallLine(targetGroup, BX_TOP - 1.15, zRib, BX_TOP, zRib, [], 0.16);
            });

            // ПОДИУМ (СЦЕНА) В ЗАЛЕ 204
            const stageX1 = 61.0, stageX2 = 65.6;
            const stageZ1 = -39.8, stageZ2 = -29.8;
            const mainStageGeom = new THREE.BoxGeometry(stageX2 - (stageX1 + 0.9), 1, stageZ2 - stageZ1);
            registerDynamicStairStep(targetGroup, mainStageGeom, (stageX1 + 0.9 + stageX2) / 2, (stageZ1 + stageZ2) / 2, 0.22, 0);
            const frontStageGeom = new THREE.BoxGeometry(0.92, 1, (stageZ2 - stageZ1) - 1.8);
            registerDynamicStairStep(targetGroup, frontStageGeom, stageX1 + 0.45, (stageZ1 + stageZ2) / 2, 0.22, 0);
            for (let i = 0; i < 4; i++) {
                const stepRatio = 0.05 * (i + 1);
                const stepGeom = new THREE.BoxGeometry(1.3, 1, 0.28);
                registerDynamicStairStep(targetGroup, stepGeom, stageX2 - 0.8, stageZ1 - 1.1 + i * 0.28, stepRatio, 0);
                registerDynamicStairStep(targetGroup, stepGeom, stageX2 - 0.8, stageZ2 + 1.1 - i * 0.28, stepRatio, 0);
            }

            // 3D-плашки помещений 2-го этажа Корпуса 4 и прямых переходов (buildingId = 4)
            addRoomLabel(targetGroup, 2, '206', 49.2, -55.7, false, false, 4, 1.2);
            addRoomLabel(targetGroup, 2, 'ЛК№2', 30.1, -48.3, true, false, 4, 0.85);
            addRoomLabel(targetGroup, 2, 'Переход\nК3 ↔ К4', 24.0, -45.5, false, true, 4, 0.85);
            addRoomLabel(targetGroup, 2, 'Переход\nК4 ↔ К2', 37.5, -20.6, false, true, 4, 0.85);
            addRoomLabel(targetGroup, 2, 'С/У', 42.4, -49.1, true, false, 4, 0.72);
            addRoomLabel(targetGroup, 2, 'С/У', 42.4, -46.1, true, false, 4, 0.72);
            addRoomLabel(targetGroup, 2, 'Служеб.\nпом.', 46.2, -47.6, true, false, 4, 0.88);
            addRoomLabel(targetGroup, 2, '210', 51.2, -47.6, true, false, 4, 0.88);
            addRoomLabel(targetGroup, 2, '211', 55.3, -48.2, true, false, 4, 0.85);
            addRoomLabel(targetGroup, 2, '212', 59.3, -48.2, true, false, 4, 0.85);
            addRoomLabel(targetGroup, 2, 'ЛК№3', 65.2, -47.6, true, false, 4, 0.85);

            addRoomLabel(targetGroup, 2, '205', 34.3, -41.3, true, false, 4, 0.90);
            addRoomLabel(targetGroup, 2, '202', 34.3, -33.9, true, false, 4, 0.90);
            addRoomLabel(targetGroup, 2, '201', 34.3, -29.4, true, false, 4, 0.88);
            addRoomLabel(targetGroup, 2, '207', 41.0, -38.4, true, false, 4, 0.85);
            addRoomLabel(targetGroup, 2, '208', 44.8, -38.4, true, false, 4, 0.85);
            addRoomLabel(targetGroup, 2, '209', 48.8, -42.0, true, false, 4, 0.85);
            addRoomLabel(targetGroup, 2, '203', 48.8, -38.8, true, false, 4, 0.85);
            addRoomLabel(targetGroup, 2, 'ЛК№1', 40.6, -27.8, true, false, 4, 0.88);
            addRoomLabel(targetGroup, 2, '204', 56.8, -34.5, false, false, 4, 1.15);
        }

        /**
         * КОРПУС 4 — ЭТАЖ 3 (Каркас внешнего периметра как у 2-го этажа + сквозные лестницы ЛК №1, ЛК №2, ЛК №3)
         */
        function buildBuilding4Floor3(targetGroup) {
            const OUTER_T = 0.24;
            const INNER_T = 0.18;

            // Основная плита перекрытия 3-го этажа Корпуса 4 (без переходов!)
            addFloorRect(targetGroup, B4_X_WEST, B4_Z_NORTH, B4_X_EAST, B4_Z_SOUTH, false);

            // Плиты трех сквозных лестничных клеток
            addFloorRect(targetGroup, B4_LK2_X1, B4_LK2_Z1, B4_LK2_X2, B4_LK2_Z2, true);
            addFloorRect(targetGroup, B4_LK3_X1, B4_LK3_Z1, B4_LK3_X2, B4_LK3_Z2, true);
            addFloorRect(targetGroup, B4_LK1_X1, B4_LK1_Z1, B4_LK1_X2, B4_LK1_Z2, true);

            // Внешний периметр стен 3-го этажа Корпуса 4
            addWallLine(targetGroup, B4_X_WEST, B4_Z_NORTH, B4_X_WEST, B4_Z_SOUTH, [
                { from: B4_LK2_Z1 + 0.4, to: B4_LK2_Z2 - 0.4, type: 'door' }
            ], OUTER_T);
            addWallLine(targetGroup, B4_X_EAST, B4_Z_NORTH, B4_X_EAST, B4_Z_SOUTH, [
                { from: B4_LK3_Z1, to: B4_LK3_Z2, type: 'open' }
            ], OUTER_T);
            addWallLine(targetGroup, B4_X_WEST, B4_Z_NORTH, B4_X_EAST, B4_Z_NORTH, [], OUTER_T);
            addWallLine(targetGroup, B4_X_WEST, B4_Z_SOUTH, B4_X_EAST, B4_Z_SOUTH, [
                { from: B4_LK1_X1, to: B4_LK1_X2, type: 'open' }
            ], OUTER_T);

            // Стены и марши ЛК №2 (западная)
            addWallLine(targetGroup, B4_LK2_X1, B4_LK2_Z1, B4_LK2_X2, B4_LK2_Z1, [], OUTER_T);
            addWallLine(targetGroup, B4_LK2_X1, B4_LK2_Z2, B4_LK2_X2, B4_LK2_Z2, [], OUTER_T);
            addWallLine(targetGroup, B4_LK2_X1, B4_LK2_Z1, B4_LK2_X1, B4_LK2_Z2, [], OUTER_T);
            buildB4Staircase(targetGroup, B4_LK2_X1 + 0.1, B4_LK2_X2 - 0.1, B4_LK2_Z1 + 0.1, B4_LK2_Z2 - 0.1, false);

            // Стены и марши ЛК №3 (верхняя)
            addWallLine(targetGroup, B4_X_EAST, B4_LK3_Z1, B4_LK3_X2, B4_LK3_Z1, [], OUTER_T);
            addWallLine(targetGroup, B4_X_EAST, B4_LK3_Z2, B4_LK3_X2, B4_LK3_Z2, [], OUTER_T);
            addWallLine(targetGroup, B4_LK3_X2, B4_LK3_Z1, B4_LK3_X2, B4_LK3_Z2, [], OUTER_T);
            buildB4Staircase(targetGroup, 63.2, B4_LK3_X2 - 0.15, B4_LK3_Z1 + 0.1, B4_LK3_Z2 - 0.1, false);

            // Стены и марши ЛК №1 (правая нижняя)
            addWallLine(targetGroup, B4_LK1_X1, B4_LK1_Z1, B4_LK1_X1, B4_LK1_Z2, [], OUTER_T);
            addWallLine(targetGroup, B4_LK1_X2, B4_LK1_Z1, B4_LK1_X2, B4_LK1_Z2, [], OUTER_T);
            addWallLine(targetGroup, B4_LK1_X1, B4_LK1_Z2, B4_LK1_X2, B4_LK1_Z2, [], OUTER_T);
            addWallLine(targetGroup, B4_LK1_X1, B4_LK1_Z1, B4_LK1_X2, B4_LK1_Z1, [
                { from: 39.8, to: 41.4, type: 'door' }
            ], INNER_T);
            buildB4Staircase(targetGroup, B4_LK1_X1 + 0.1, B4_LK1_X2 - 0.1, B4_LK1_Z1 + 0.1, B4_LK1_Z2 - 0.1, true);

            // 3D-плашки 3-го этажа Корпуса 4 (buildingId = 4)
            addRoomLabel(targetGroup, 3, '3 ЭТАЖ (КАРКАС)', 49.2, -44.5, false, true, 4, 1.15);
            addRoomLabel(targetGroup, 3, 'ЛК№2', 30.1, -48.3, true, false, 4, 0.85);
            addRoomLabel(targetGroup, 3, 'ЛК№3', 65.2, -47.6, true, false, 4, 0.85);
            addRoomLabel(targetGroup, 3, 'ЛК№1', 40.6, -27.8, true, false, 4, 0.88);
        }

