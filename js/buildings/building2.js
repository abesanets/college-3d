// ==========================================
// КОРПУС 2 (Этажи 1–3)
// ==========================================

        function buildB2Staircase(targetGroup, x1, x2, zTop, zBot) {
            addFloorRect(targetGroup, x1, zTop, x2, zBot, true);
            const xMid = (x1 + x2) / 2;
            const zStart = zTop + 0.85;
            const zEnd = zBot - 0.85;
            addWallLine(targetGroup, xMid, zStart, xMid, zEnd, [], 0.08);

            const steps = 9;
            const stepD = (zEnd - zStart) / steps;
            const wFlight = (x2 - x1) / 2 - 0.16;

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
        }

        function buildB2ExteriorPorch(targetGroup, x1, x2, zNorth, hasSteps = true) {
            const w = Math.abs(x2 - x1);
            const cx = (x1 + x2) / 2;

            if (!hasSteps) {
                addFloorRect(targetGroup, x1, zNorth, x2, B2_Z_TOP, true);
                return;
            }

            const zLandingNorth = B2_Z_TOP - (B2_Z_TOP - zNorth) * 0.42;
            addFloorRect(targetGroup, x1, zLandingNorth, x2, B2_Z_TOP, true);

            const steps = 6;
            const totalStepsDepth = Math.abs(zLandingNorth - zNorth);
            const sDepth = totalStepsDepth / steps;

            for (let i = 0; i < steps; i++) {
                const sz = zNorth + (i + 0.5) * sDepth;
                const heightRatio = 0.03 + ((i + 1) / steps) * 0.12;
                const geom = new THREE.BoxGeometry(w, 1, sDepth * 0.95);
                registerDynamicStairStep(targetGroup, geom, cx, sz, heightRatio, -0.14, true);
            }
        }

        function buildBuilding2Floor1(targetGroup) {
            const OUTER_T = 0.24;
            const INNER_T = 0.18;

            addFloorRect(targetGroup, B2_X_START, B2_Z_TOP, B2_X_END, B2_Z_BOT, false);

            buildB2ExteriorPorch(targetGroup, B2_LK3_X1, 22.8, -17.0, true);
            buildB2ExteriorPorch(targetGroup, B2_LK2_X1, B2_LK2_X2, -15.4, true);

            addWallLine(targetGroup, B2_X_START, B2_Z_TOP, B2_X_START, B2_Z_BOT, [
                { from: -6.5, to: -5.1, type: 'door' }
            ], OUTER_T);

            addWallLine(targetGroup, B2_X_START, B2_Z_TOP, B2_X_END, B2_Z_TOP, [
                { from: 20.9, to: 22.2, type: 'door' },
                { from: 42.1, to: 43.3, type: 'door' },
                { from: 43.9, to: 45.1, type: 'door' },
                { from: 64.8, to: 66.1, type: 'door' }
            ], OUTER_T);

            addWallLine(targetGroup, B2_X_START, B2_Z_BOT, B2_X_END, B2_Z_BOT, [], OUTER_T);
            addWallLine(targetGroup, B2_X_END, B2_Z_TOP, B2_X_END, B2_Z_BOT, [], OUTER_T);

            addWallLine(targetGroup, B2_X_START, B2_Z_CORR_TOP, B2_X_END, B2_Z_CORR_TOP, [
                { from: 24.2, to: 25.4, type: 'door' },
                { from: 33.0, to: 34.2, type: 'door' },
                { from: 39.6, to: 40.8, type: 'door' },
                { from: 42.6, to: 44.6, type: 'door' },
                { from: 45.4, to: 48.0, type: 'open' },
                { from: 49.0, to: 50.8, type: 'door' },
                { from: 58.6, to: 59.8, type: 'door' },
                { from: 61.8, to: 63.0, type: 'door' },
                { from: 65.1, to: 67.1, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, B2_X_START, B2_LK3_Z_BOT, 27.4, B2_LK3_Z_BOT, [], INNER_T);
            addWallLine(targetGroup, B2_LK3_X2, B2_Z_TOP, B2_LK3_X2, B2_LK3_Z_BOT, [
                { from: -12.4, to: -11.2, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 27.4, B2_Z_TOP, 27.4, B2_Z_CORR_TOP, [
                { from: -12.4, to: -11.2, type: 'door' }
            ], INNER_T);
            buildB2Staircase(targetGroup, B2_LK3_X1 + 0.15, B2_LK3_X2 - 0.15, B2_Z_TOP + 0.15, B2_LK3_Z_BOT - 0.15);

            addWallLine(targetGroup, 38.6, B2_Z_TOP, 38.6, B2_Z_CORR_TOP, [], INNER_T);

            addWallLine(targetGroup, B2_LK2_X1, B2_Z_TOP, B2_LK2_X1, B2_Z_CORR_TOP, [], INNER_T);
            addWallLine(targetGroup, 38.6, -9.8, B2_LK2_X1, -9.8, [
                { from: 39.0, to: 40.1, type: 'door' }
            ], 0.14);
            addWallLine(targetGroup, 40.2, -11.6, B2_LK2_X1, -11.6, [], 0.14);

            addWallLine(targetGroup, B2_LK2_X2, B2_Z_TOP, B2_LK2_X2, B2_Z_CORR_TOP, [], INNER_T);
            buildB2Staircase(targetGroup, B2_LK2_X1 + 0.1, B2_LK2_X2 - 0.1, B2_Z_TOP + 0.1, B2_Z_CORR_TOP - 0.1);

            addWallLine(targetGroup, 48.0, B2_Z_TOP, 48.0, B2_Z_CORR_TOP, [], INNER_T);
            addWallLine(targetGroup, 58.2, B2_Z_TOP, 58.2, B2_Z_CORR_TOP, [
                { from: -9.2, to: -8.0, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, 61.2, B2_Z_TOP, 61.2, B2_Z_CORR_TOP, [], INNER_T);

            addWallLine(targetGroup, B2_LK1_X1, B2_Z_TOP, B2_LK1_X1, B2_Z_CORR_TOP, [], INNER_T);
            addFloorRect(targetGroup, 61.2, B2_Z_TOP, B2_LK1_X1, B2_Z_CORR_TOP, true);
            addWallLine(targetGroup, 61.2, -9.6, B2_LK1_X1, -9.6, [
                { from: 61.6, to: 62.6, type: 'door' }
            ], 0.14);
            addWallLine(targetGroup, 62.7, -12.0, B2_LK1_X1, -12.0, [], 0.12);
            addWallLine(targetGroup, 62.7, -10.8, B2_LK1_X1, -10.8, [], 0.12);

            buildB2Staircase(targetGroup, B2_LK1_X1 + 0.1, B2_LK1_X2 - 0.15, B2_Z_TOP + 0.1, B2_Z_CORR_TOP - 0.1);

            addWallLine(targetGroup, B2_X_START, B2_Z_CORR_BOT, B2_X_END, B2_Z_CORR_BOT, [
                { from: 22.0, to: 23.2, type: 'door' },
                { from: 31.2, to: 33.0, type: 'door' },
                { from: 46.4, to: 48.2, type: 'door' },
                { from: 55.8, to: 57.6, type: 'door' },
                { from: 65.2, to: 66.4, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, 38.6, B2_Z_CORR_BOT, 38.6, B2_Z_BOT, [], INNER_T);
            addWallLine(targetGroup, 54.8, B2_Z_CORR_BOT, 54.8, B2_Z_BOT, [], INNER_T);
            addWallLine(targetGroup, B2_LK1_X1, B2_Z_CORR_BOT, B2_LK1_X1, B2_Z_BOT, [], INNER_T);

            [23.8, 27.0].forEach(cx => addSquareColumn(targetGroup, cx, -7.4, 0.36));
            [23.8, 27.0, 30.2, 33.6, 36.8, 42.6, 45.6, 48.8, 52.0].forEach(cx => addSquareColumn(targetGroup, cx, -4.2, 0.36));

            addRoomLabel3D(targetGroup, 1, 'ЛК№3', 22.6, -12.1, true, false, 2, 0.92);
            addRoomLabel3D(targetGroup, 1, '103', 23.9, -8.8, false, false, 2, 0.95);
            addRoomLabel3D(targetGroup, 1, '105', 33.0, -10.5, false, false, 2, 1.0);
            addRoomLabel3D(targetGroup, 1, '107', 40.2, -8.4, true, false, 2, 0.90);
            addRoomLabel3D(targetGroup, 1, 'ЛК№2', 43.6, -12.5, true, false, 2, 0.90);
            addRoomLabel3D(targetGroup, 1, '109', 53.1, -10.5, false, false, 2, 1.0);
            addRoomLabel3D(targetGroup, 1, '111', 59.7, -10.5, true, false, 2, 0.90);
            addRoomLabel3D(targetGroup, 1, 'С/У', 62.7, -11.6, true, false, 2, 0.85);
            addRoomLabel3D(targetGroup, 1, 'С/У', 62.7, -8.3, true, false, 2, 0.85);
            addRoomLabel3D(targetGroup, 1, 'ЛК№1', 66.1, -12.5, true, false, 2, 0.90);
            addRoomLabel3D(targetGroup, 1, '104', 29.5, -0.5, false, false, 2, 1.05);
            addRoomLabel3D(targetGroup, 1, '106', 46.7, -0.5, false, false, 2, 1.05);
            addRoomLabel3D(targetGroup, 1, '108', 59.5, -0.5, false, false, 2, 1.0);
            addRoomLabel3D(targetGroup, 1, '110', 66.1, -0.5, true, false, 2, 0.92);
        }

        function buildBuilding2Floor2(targetGroup) {
            const OUTER_T = 0.24;
            const INNER_T = 0.18;

            addFloorRect(targetGroup, B2_X_START, B2_Z_TOP, B2_X_END, B2_Z_BOT, false);

            addWallLine(targetGroup, B2_X_START, B2_Z_TOP, B2_X_START, B2_Z_BOT, [
                { from: -6.5, to: -5.1, type: 'door' }
            ], OUTER_T);

            addWallLine(targetGroup, B2_X_START, B2_Z_TOP, B2_X_END, B2_Z_TOP, [
                { from: 36.5, to: 38.5, type: 'door' } // Северный выход 2-го этажа Корпуса 2 (проход X [36.2..38.8] между 205 и С/У)
            ], OUTER_T);
            addWallLine(targetGroup, B2_X_START, B2_Z_BOT, B2_X_END, B2_Z_BOT, [], OUTER_T);
            addWallLine(targetGroup, B2_X_END, B2_Z_TOP, B2_X_END, B2_Z_BOT, [], OUTER_T);

            addWallLine(targetGroup, B2_X_START, B2_Z_CORR_TOP, B2_X_END, B2_Z_CORR_TOP, [
                { from: 24.0, to: 25.2, type: 'door' },
                { from: 32.2, to: 34.0, type: 'door' },
                { from: 36.2, to: 38.8, type: 'open' },
                { from: 39.1, to: 40.1, type: 'door' },
                { from: 40.5, to: 41.5, type: 'door' },
                { from: 42.6, to: 44.6, type: 'door' },
                { from: 46.0, to: 47.8, type: 'door' },
                { from: 57.6, to: 59.4, type: 'door' },
                { from: 61.4, to: 62.6, type: 'door' },
                { from: 65.1, to: 67.1, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, 23.4, B2_Z_TOP, 23.4, B2_Z_CORR_TOP, [
                { from: -9.6, to: -8.2, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 26.4, B2_Z_TOP, 26.4, B2_Z_CORR_TOP, [], INNER_T);
            addWallLine(targetGroup, 36.2, B2_Z_TOP, 36.2, B2_Z_CORR_TOP, [], INNER_T);

            addFloorRect(targetGroup, 38.8, B2_Z_TOP, B2_LK2_X1, B2_Z_CORR_TOP, true);
            addWallLine(targetGroup, 38.8, B2_Z_TOP, 38.8, B2_Z_CORR_TOP, [], INNER_T);
            addWallLine(targetGroup, B2_LK2_X1, B2_Z_TOP, B2_LK2_X1, B2_Z_CORR_TOP, [], INNER_T);
            addWallLine(targetGroup, 40.3, -9.8, 40.3, B2_Z_CORR_TOP, [], 0.14);
            addWallLine(targetGroup, 40.3, -12.6, B2_LK2_X1, -12.6, [], 0.12);
            addWallLine(targetGroup, 40.3, -11.2, B2_LK2_X1, -11.2, [], 0.12);
            addWallLine(targetGroup, 40.3, -9.8, B2_LK2_X1, -9.8, [], 0.12);

            addWallLine(targetGroup, B2_LK2_X2, B2_Z_TOP, B2_LK2_X2, B2_Z_CORR_TOP, [], INNER_T);
            buildB2Staircase(targetGroup, B2_LK2_X1 + 0.1, B2_LK2_X2 - 0.1, B2_Z_TOP + 0.1, B2_Z_CORR_TOP - 0.1);

            addWallLine(targetGroup, 48.4, B2_Z_TOP, 48.4, B2_Z_CORR_TOP, [], INNER_T);
            addWallLine(targetGroup, 60.6, B2_Z_TOP, 60.6, B2_Z_CORR_TOP, [], INNER_T);

            addWallLine(targetGroup, B2_LK1_X1, B2_Z_TOP, B2_LK1_X1, B2_Z_CORR_TOP, [], INNER_T);
            addWallLine(targetGroup, 60.6, -9.8, B2_LK1_X1, -9.8, [
                { from: 61.0, to: 62.2, type: 'door' }
            ], INNER_T);

            buildB2Staircase(targetGroup, B2_LK1_X1 + 0.1, B2_LK1_X2 - 0.15, B2_Z_TOP + 0.1, B2_Z_CORR_TOP - 0.1);

            addWallLine(targetGroup, B2_X_START, B2_Z_CORR_BOT, B2_X_END, B2_Z_CORR_BOT, [
                { from: 21.3, to: 22.5, type: 'door' },
                { from: 24.3, to: 25.5, type: 'door' },
                { from: 27.2, to: 29.0, type: 'door' },
                { from: 39.6, to: 40.8, type: 'door' },
                { from: 41.8, to: 45.4, type: 'open' },
                { from: 46.2, to: 47.6, type: 'door' },
                { from: 49.2, to: 51.0, type: 'door' },
                { from: 61.6, to: 63.4, type: 'door' }
            ], INNER_T);

            [23.4, 26.4, 38.8, B2_LK2_X1, B2_LK2_X2, 48.4, 57.6].forEach(vx => {
                addWallLine(targetGroup, vx, B2_Z_CORR_BOT, vx, B2_Z_BOT, [], INNER_T);
            });

            [22.6, 23.6, 51.4, 54.2, 56.8].forEach(cx => addSquareColumn(targetGroup, cx, -7.4, 0.36));
            [29.5, 32.5, 35.5, 45.8, 51.4, 54.4, 60.8, 63.8].forEach(cx => addSquareColumn(targetGroup, cx, -4.2, 0.36));

            addRoomLabel3D(targetGroup, 2, '203', 24.9, -10.5, true, false, 2, 0.90);
            addRoomLabel3D(targetGroup, 2, '205', 31.3, -10.5, false, false, 2, 1.0);
            addRoomLabel3D(targetGroup, 2, 'С/У', 39.5, -8.4, true, false, 2, 0.80);
            addRoomLabel3D(targetGroup, 2, 'С/У', 41.0, -8.4, true, false, 2, 0.80);
            addRoomLabel3D(targetGroup, 2, 'ЛК№2', 43.6, -12.5, true, false, 2, 0.88);
            addRoomLabel3D(targetGroup, 2, '209', 46.9, -10.5, true, false, 2, 0.90);
            addRoomLabel3D(targetGroup, 2, '211', 54.5, -10.5, false, false, 2, 1.05);
            addRoomLabel3D(targetGroup, 2, '213', 62.4, -8.4, true, false, 2, 0.90);
            addRoomLabel3D(targetGroup, 2, 'ЛК№1', 66.1, -12.5, true, false, 2, 0.88);

            addRoomLabel3D(targetGroup, 2, '202', 21.9, -0.5, true, false, 2, 0.90);
            addRoomLabel3D(targetGroup, 2, '204', 24.9, -0.5, true, false, 2, 0.90);
            addRoomLabel3D(targetGroup, 2, '206', 32.6, -0.5, false, false, 2, 1.05);
            addRoomLabel3D(targetGroup, 2, '208', 40.3, -0.5, true, false, 2, 0.90);
            addRoomLabel3D(targetGroup, 2, '210', 46.9, -0.5, true, false, 2, 0.90);
            addRoomLabel3D(targetGroup, 2, '212', 53.0, -0.5, false, false, 2, 1.05);
            addRoomLabel3D(targetGroup, 2, '214', 62.8, -0.5, false, false, 2, 1.05);
        }

        function buildBuilding2Floor3(targetGroup) {
            const OUTER_T = 0.24;
            const INNER_T = 0.18;

            addFloorRect(targetGroup, B2_X_START, B2_Z_TOP, B2_X_END, B2_Z_BOT, false);

            addWallLine(targetGroup, B2_X_START, B2_Z_TOP, B2_X_START, B2_Z_BOT, [], OUTER_T);
            addWallLine(targetGroup, B2_X_START, B2_Z_TOP, B2_X_END, B2_Z_TOP, [], OUTER_T);
            addWallLine(targetGroup, B2_X_START, B2_Z_BOT, B2_X_END, B2_Z_BOT, [], OUTER_T);
            addWallLine(targetGroup, B2_X_END, B2_Z_TOP, B2_X_END, B2_Z_BOT, [], OUTER_T);

            addWallLine(targetGroup, 23.2, B2_Z_TOP, 23.2, B2_Z_CORR_BOT, [], INNER_T);

            addWallLine(targetGroup, 23.2, -9.8, 25.6, -9.8, [
                { from: 23.8, to: 25.0, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, 25.6, B2_Z_CORR_TOP, B2_LK1_X1, B2_Z_CORR_TOP, [
                { from: 26.6, to: 27.9, type: 'door' },
                { from: 29.9, to: 31.2, type: 'door' },
                { from: 33.2, to: 34.5, type: 'door' },
                { from: 36.5, to: 37.8, type: 'door' },
                { from: 39.1, to: 40.1, type: 'door' },
                { from: 40.5, to: 41.5, type: 'door' },
                { from: B2_LK2_X1, to: B2_LK2_X2, type: 'open' },
                { from: B2_LK2_X2, to: 48.4, type: 'open' },
                { from: 51.2, to: 52.6, type: 'door' },
                { from: 56.4, to: 57.8, type: 'door' },
                { from: 61.8, to: 63.2, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, 25.6, B2_Z_TOP, 25.6, B2_Z_CORR_TOP, [
                { from: -12.6, to: -11.2, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 28.9, B2_Z_TOP, 28.9, B2_Z_CORR_TOP, [], INNER_T);
            addWallLine(targetGroup, 32.2, B2_Z_TOP, 32.2, B2_Z_CORR_TOP, [], INNER_T);
            addWallLine(targetGroup, 35.5, B2_Z_TOP, 35.5, B2_Z_CORR_TOP, [
                { from: -12.6, to: -11.2, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 38.8, B2_Z_TOP, 38.8, B2_Z_CORR_TOP, [
                { from: -12.8, to: -11.4, type: 'door' }
            ], INNER_T);

            addFloorRect(targetGroup, 38.8, B2_Z_TOP, B2_LK2_X1, B2_Z_CORR_TOP, true);
            addWallLine(targetGroup, B2_LK2_X1, B2_Z_TOP, B2_LK2_X1, B2_Z_CORR_TOP, [], INNER_T);
            addWallLine(targetGroup, 38.8, -10.2, B2_LK2_X1, -10.2, [], 0.14);
            addWallLine(targetGroup, 40.3, -10.2, 40.3, B2_Z_CORR_TOP, [], 0.14);

            addWallLine(targetGroup, B2_LK2_X2, B2_Z_TOP, B2_LK2_X2, B2_Z_CORR_TOP, [], INNER_T);
            buildB2Staircase(targetGroup, B2_LK2_X1 + 0.1, B2_LK2_X2 - 0.1, B2_Z_TOP + 0.1, B2_Z_CORR_TOP - 0.1);
            addWallLine(targetGroup, B2_LK2_X1, B2_Z_CORR_TOP, B2_LK2_X1, B2_Z_CORR_BOT, [
                { from: -6.4, to: -5.2, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, B2_LK2_X2, B2_Z_CORR_TOP, B2_LK2_X2, B2_Z_CORR_BOT, [
                { from: -6.4, to: -5.2, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, 48.4, B2_Z_TOP, 48.4, B2_Z_CORR_TOP, [], INNER_T);
            addWallLine(targetGroup, 54.6, B2_Z_TOP, 54.6, B2_Z_CORR_TOP, [], INNER_T);
            addWallLine(targetGroup, 61.0, B2_Z_TOP, 61.0, B2_Z_CORR_TOP, [], INNER_T);
            addWallLine(targetGroup, B2_LK1_X1, B2_Z_TOP, B2_LK1_X1, B2_Z_CORR_BOT, [
                { from: -6.4, to: -5.2, type: 'door' }
            ], INNER_T);

            buildB2Staircase(targetGroup, B2_LK1_X1 + 0.1, B2_LK1_X2 - 0.15, B2_Z_TOP + 0.1, B2_Z_CORR_TOP - 0.1);

            addWallLine(targetGroup, B2_X_START, B2_Z_CORR_BOT, B2_X_END, B2_Z_CORR_BOT, [
                { from: 21.1, to: 22.5, type: 'door' },
                { from: 24.0, to: 25.3, type: 'door' },
                { from: 36.2, to: 37.5, type: 'door' },
                { from: 46.2, to: 48.0, type: 'door' },
                { from: 61.8, to: 63.2, type: 'door' },
                { from: 66.4, to: 67.6, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, B2_LK2_X1, B2_Z_CORR_BOT, B2_LK2_X1, B2_Z_BOT, [], INNER_T);
            addWallLine(targetGroup, 54.6, B2_Z_CORR_BOT, 54.6, B2_Z_BOT, [], INNER_T);
            addWallLine(targetGroup, B2_LK1_X1, B2_Z_CORR_BOT, B2_LK1_X1, B2_Z_BOT, [], INNER_T);

            addWallLine(targetGroup, 66.1, B2_Z_CORR_BOT, 66.1, -0.5, [
                { from: -3.0, to: -1.6, type: 'door' }
            ], 0.14);
            addWallLine(targetGroup, B2_LK1_X1, -0.5, B2_X_END, -0.5, [
                { from: 66.4, to: 67.6, type: 'door' }
            ], 0.14);

            addRoomLabel3D(targetGroup, 3, '302', 21.8, -9.2, true, false, 2, 0.90);
            addRoomLabel3D(targetGroup, 3, '304', 27.25, -10.5, true, false, 2, 0.90);
            addRoomLabel3D(targetGroup, 3, '305', 30.55, -10.5, true, false, 2, 0.90);
            addRoomLabel3D(targetGroup, 3, '306', 33.85, -10.5, true, false, 2, 0.90);
            addRoomLabel3D(targetGroup, 3, '307', 37.15, -10.5, true, false, 2, 0.90);
            addRoomLabel3D(targetGroup, 3, 'С/У', 39.55, -8.5, true, false, 2, 0.78);
            addRoomLabel3D(targetGroup, 3, 'С/У', 41.05, -8.5, true, false, 2, 0.78);
            addRoomLabel3D(targetGroup, 3, 'ЛК№2', 43.6, -12.5, true, false, 2, 0.88);
            addRoomLabel3D(targetGroup, 3, '313', 51.5, -10.5, false, false, 2, 1.0);
            addRoomLabel3D(targetGroup, 3, '314', 57.8, -10.5, false, false, 2, 1.0);
            addRoomLabel3D(targetGroup, 3, '315', 62.6, -10.5, true, false, 2, 0.90);
            addRoomLabel3D(targetGroup, 3, 'ЛК№1', 66.1, -12.5, true, false, 2, 0.88);

            addRoomLabel3D(targetGroup, 3, '308', 31.1, -0.5, false, false, 2, 1.1);
            addRoomLabel3D(targetGroup, 3, '312', 48.2, -0.5, false, false, 2, 1.05);
            addRoomLabel3D(targetGroup, 3, '316', 59.4, -0.5, false, false, 2, 1.05);
            addRoomLabel3D(targetGroup, 3, '318', 65.15, -2.5, true, false, 2, 0.82);
        }

