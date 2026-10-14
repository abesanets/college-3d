// ==========================================
// КОРПУС 3 (Этажи 1–2)
// ==========================================

        // Двухмаршевая (или одномаршевая для ЛК №2 на 1 эт.) лестница для Корпуса 3 на западной стороне (X от -1.6 до 4.6)
        function buildB3Staircase(targetGroup, xWest, xEast, zNorth, zSouth, singleFlight = false) {
            addFloorRect(targetGroup, xWest, zNorth, xEast, zSouth, true);
            const zMid = (zNorth + zSouth) / 2;
            const xStart = xWest + 0.95;
            const xEnd = xEast - 0.95;

            if (!singleFlight) {
                addWallLine(targetGroup, xStart, zMid, xEnd, zMid, [], 0.08);
            } else {
                addWallLine(targetGroup, xStart, zMid, xEnd, zMid, [], 0.08);
                addWallLine(targetGroup, xStart, zNorth + 0.1, xStart, zMid, [], 0.08);
            }

            const steps = 9;
            const stepW = (xEnd - xStart) / steps;
            const dFlight = (zSouth - zNorth) / 2 - 0.16;

            for (let m = 0; m < (singleFlight ? 1 : 2); m++) {
                const cz = m === 0 ? (zNorth + zMid) / 2 : (zMid + zSouth) / 2;
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

        // Открытое уличное крыльцо для 1-го этажа Корпуса 3 на западном фасаде (площадка + открытые ступени БЕЗ боковых стен)
        function buildB3ExteriorPorchWest(targetGroup, zNorth, zSouth, xOuter, xWall, stepsDir = 'west') {
            const porchW = Math.abs(xWall - xOuter);
            const steps = 5;

            if (stepsDir === 'west') {
                // Площадка у стены и широкие ступени на запад (крыльцо у 108/109)
                const xLandingWest = xWall - porchW * 0.45;
                addFloorRect(targetGroup, xLandingWest, zNorth, xWall, zSouth, true);
                const stepSpanX = Math.abs(xLandingWest - xOuter);
                const sDepth = stepSpanX / steps;
                const cz = (zNorth + zSouth) / 2;
                const dz = Math.abs(zSouth - zNorth);
                for (let i = 0; i < steps; i++) {
                    const sx = xLandingWest - (i + 0.5) * sDepth;
                    const heightRatio = 0.03 + ((steps - i) / steps) * 0.12;
                    const geom = new THREE.BoxGeometry(sDepth * 0.94, 1, dz);
                    registerDynamicStairStep(targetGroup, geom, sx, cz, heightRatio, -0.14, true);
                }
            } else if (stepsDir === 'south') {
                // Площадка у выхода из ЛК №1 и ступени с южной стороны
                addFloorRect(targetGroup, xOuter, zNorth, xWall, zSouth, true);
                const stepSpanZ = 1.25;
                const sDepth = stepSpanZ / steps;
                const cx = (xWall + xOuter) / 2;
                for (let i = 0; i < steps; i++) {
                    const sz = zSouth + (i + 0.5) * sDepth;
                    const heightRatio = 0.03 + ((steps - i) / steps) * 0.12;
                    const geom = new THREE.BoxGeometry(porchW, 1, sDepth * 0.94);
                    registerDynamicStairStep(targetGroup, geom, cx, sz, heightRatio, -0.14, true);
                }
            }
        }

        /**
         * КОРПУС 3 — ЭТАЖ 1 (Габариты: X [-1.6..14.0], Z [-61.6..-14.0], вплотную к Корпусу 1 на Z = -14.0)
         * Точное совпадение с планом 1-го этажа:
         * - Большой Г-образный зал 103 на юге (огибает 104 и 102 до восточной стены X = 14.0) с тамбуром у Z = -14.0
         * - Выход во двор между 102 и 105 с внутренним тамбуром на две двустворчатые двери
         * - На западе: ЛК №2 (короткий одномаршевый подъём), 106, 107, боковой коридор и тамбур 108/109 с широким крыльцом
         * - П-образный узел из 3 санузлов (два внешних + малый центральный у коридора)
         * - ЛК №1 (двухмаршевая с выходом на крыльцо), 114, 114А (Г-образная), торцевой тамбур и залы 117 / 116
         */
        function buildBuilding3Floor1(targetGroup) {
            const OUTER_T = 0.24;
            const INNER_T = 0.18;

            // Основная плита перекрытия 1-го этажа Корпуса 3
            addFloorRect(targetGroup, B3_X_WEST, B3_Z_NORTH, B3_X_EAST, B3_Z_SOUTH, false);

            // Открытые внешние площадки и крыльца на 1-м этаже (без боковых стен):
            // 1) Восточная площадка у выхода из холла 112 (X [14.0..15.6], Z [-47.8..-44.2])
            addFloorRect(targetGroup, B3_X_EAST, -47.8, 15.6, -44.2, true);
            // 2) Западное крыльцо со ступенями на юг у ЛК №1 (X [-3.4..-1.6], Z [-47.8..-45.0])
            buildB3ExteriorPorchWest(targetGroup, B3_SHAFT_NORTH_Z1, -45.0, -3.4, B3_X_WEST, 'south');
            // 3) Западное широкое крыльцо со ступенями на запад у тамбура 108/109 (X [-3.8..-1.6], Z [-40.4..-34.8])
            buildB3ExteriorPorchWest(targetGroup, -40.4, -34.8, -3.8, B3_X_WEST, 'west');

            // --- ВНЕШНИЙ ПЕРИМЕТР СТЕН КОРПУСА 3 (ЭТАЖ 1) ---
            addWallLine(targetGroup, B3_X_WEST, B3_Z_SOUTH, B3_X_EAST, B3_Z_SOUTH, [], OUTER_T);
            addWallLine(targetGroup, B3_X_WEST, B3_Z_NORTH, B3_X_EAST, B3_Z_NORTH, [], OUTER_T);

            // Западная внешняя стена X = -1.6 (два двустворчатых выхода на крыльца)
            addWallLine(targetGroup, B3_X_WEST, B3_Z_NORTH, B3_X_WEST, B3_Z_SOUTH, [
                { from: -47.2, to: -45.4, type: 'door' }, // Двустворчатый выход из ЛК №1 на крыльцо
                { from: -37.8, to: -36.0, type: 'door' }  // Двустворчатый выход из тамбура у 108/109 на крыльцо
            ], OUTER_T);

            // Восточная внешняя стена X = 14.0 (два двустворчатых выхода во двор)
            addWallLine(targetGroup, B3_X_EAST, B3_Z_NORTH, B3_X_EAST, B3_Z_SOUTH, [
                { from: -46.9, to: -45.1, type: 'door' }, // Двустворчатый выход из 112 на восточную площадку
                { from: -29.5, to: -27.7, type: 'door' }  // Двустворчатый выход из коридора между 102 и 105
            ], OUTER_T);

            // --- ЮЖНЫЙ ЗАЛ 103 (Г-образный: Z от -26.8 до -14.0 на западе и Z от -22.0 до -14.0 на востоке) ---
            // Прямоугольный выступ-тамбур у южной торцевой стены зала 103 (X [4.2..9.0], Z [-17.4..-14.0])
            addWallLine(targetGroup, 4.2, -17.4, 4.2, B3_Z_SOUTH, [], INNER_T);
            addWallLine(targetGroup, 9.0, -17.4, 9.0, B3_Z_SOUTH, [], INNER_T);
            addWallLine(targetGroup, 4.2, -17.4, 9.0, -17.4, [
                { from: 5.5, to: 7.7, type: 'door' } // Двустворчатая дверь на северной грани тамбура
            ], INNER_T);

            // Северная стена зала 103 и вход из центрального коридора (Z = -26.8, X [-1.6..7.2])
            addWallLine(targetGroup, B3_X_WEST, B3_SHAFT_SOUTH_Z2, B3_X_CORR_E, B3_SHAFT_SOUTH_Z2, [
                { from: 5.0, to: 6.8, type: 'door' } // Двустворчатая дверь из коридора в зал 103
            ], INNER_T);

            // Кабинеты 104 (Z [-24.4..-22.0]) и 102 (Z [-26.8..-24.4]), вдающиеся в зал 103 справа (X [7.2..14.0])
            addWallLine(targetGroup, B3_X_CORR_E, -26.8, B3_X_CORR_E, -22.0, [
                { from: -26.2, to: -25.0, type: 'door' }, // Дверь в 102 из зала 103
                { from: -23.8, to: -22.6, type: 'door' }  // Дверь в 104 из зала 103
            ], INNER_T);
            addWallLine(targetGroup, B3_X_CORR_E, -22.0, B3_X_EAST, -22.0, [], INNER_T); // Южная стена 104 (ниже неё зал 103 идет до X=14.0)
            addWallLine(targetGroup, B3_X_CORR_E, -24.4, B3_X_EAST, -24.4, [], INNER_T); // Перегородка между 104 и 102
            addWallLine(targetGroup, B3_X_CORR_E, -26.8, B3_X_EAST, -26.8, [
                { from: 7.8, to: 9.0, type: 'door' },   // Левая дверь в 102 из бокового прохода
                { from: 9.6, to: 10.8, type: 'door' }   // Правая дверь в 102 из бокового прохода
            ], INNER_T);

            // --- ЗАПАДНЫЙ РЯД (X от -1.6 до 4.6): ЛК №2, 106, 107, боковой проход, 109/108, С/У, ЛК №1, 114, 114А, 117 ---
            // Западная стена главного коридора X = 4.6 (от Z = -55.2 до Z = -26.8)
            addWallLine(targetGroup, B3_X_CORR_W, -55.2, B3_X_CORR_W, B3_SHAFT_SOUTH_Z2, [
                { from: -54.8, to: -53.6, type: 'door' }, // Дверь в 114А
                { from: -52.2, to: -50.6, type: 'door' }, // Двустворчатая дверь в 114
                { from: -46.9, to: -45.1, type: 'door' }, // Двустворчатая дверь в ЛК №1 (северная шахта)
                { from: -43.9, to: -42.9, type: 'door' }, // Дверь в северный С/У
                { from: -42.4, to: -41.4, type: 'door' }, // Дверь в малый средний С/У
                { from: -40.9, to: -39.9, type: 'door' }, // Дверь в южный С/У
                { from: -39.2, to: -38.0, type: 'door' }, // Дверь в 109
                { from: -36.8, to: -35.0, type: 'open' }, // Открытый поворот коридора на запад к тамбуру 108/109 и входу в 107
                { from: -31.8, to: -30.6, type: 'door' }, // Дверь в 106
                { from: -29.5, to: -27.7, type: 'door' }  // Двустворчатая дверь в ЛК №2 (южная шахта)
            ], INNER_T);

            // Южная шахта лестницы: ЛК №2 (X [-1.6..4.6], Z [-30.4..-26.8]) — на 1 этаже короткий одномаршевый подъём (singleFlight = true)
            addWallLine(targetGroup, B3_X_WEST, B3_SHAFT_SOUTH_Z1, B3_X_CORR_W, B3_SHAFT_SOUTH_Z1, [], INNER_T);
            buildB3Staircase(targetGroup, B3_X_WEST + 0.1, B3_X_CORR_W - 0.1, B3_SHAFT_SOUTH_Z1 + 0.1, B3_SHAFT_SOUTH_Z2 - 0.1, true);

            // Кабинет 106 (Z [-32.6..-30.4]) и Кабинет 107 (Z [-35.0..-32.6])
            addWallLine(targetGroup, B3_X_WEST, -32.6, B3_X_CORR_W, -32.6, [], INNER_T);
            addWallLine(targetGroup, B3_X_WEST, -35.0, B3_X_CORR_W, -35.0, [
                { from: 1.2, to: 2.4, type: 'door' } // Дверь в 107 из бокового западного прохода
            ], INNER_T);

            // Узел бокового прохода, тамбура западного входа, 108 и 109 (Z [-39.6..-35.0])
            // Боковой коридор идёт от X = 4.6 до X = 0.8 (Z [-36.8..-35.0]), далее влево тамбур выхода (X [-1.6..0.8], Z [-38.0..-35.0])
            addWallLine(targetGroup, 0.8, -36.8, B3_X_CORR_W, -36.8, [], INNER_T); // Северная стена бокового прохода (отделяет 109)
            addWallLine(targetGroup, 0.8, -39.6, 0.8, -35.0, [
                { from: -36.5, to: -35.3, type: 'door' } // Дверь из бокового прохода в тамбур западного крыльца
            ], INNER_T);
            // Перегородка между тамбуром крыльца и маленькой комнатой 108 (Z = -38.0, X [-1.6..0.8])
            addWallLine(targetGroup, B3_X_WEST, -38.0, 0.8, -38.0, [
                { from: -0.9, to: 0.3, type: 'door' } // Дверь из тамбура в 108
            ], INNER_T);
            // Капитальная стена между 108/109 и блоком С/У (Z = -39.6, X [-1.6..4.6])
            addWallLine(targetGroup, B3_X_WEST, -39.6, B3_X_CORR_W, -39.6, [], INNER_T);

            // Блок из 3-х Санузлов С/У (Z [-44.2..-39.6], X [-1.6..4.6]):
            // Малый центральный С/У у коридора (X [2.0..4.6], Z [-42.8..-41.0]) и два больших С/У, смыкающихся по Z = -41.9 слева от него
            addFloorRect(targetGroup, B3_X_WEST, B3_SHAFT_NORTH_Z2, B3_X_CORR_W, -39.6, true);
            addWallLine(targetGroup, 2.0, -42.8, B3_X_CORR_W, -42.8, [], 0.14);
            addWallLine(targetGroup, 2.0, -41.0, B3_X_CORR_W, -41.0, [], 0.14);
            addWallLine(targetGroup, 2.0, -42.8, 2.0, -41.0, [], 0.14);
            addWallLine(targetGroup, B3_X_WEST, -41.9, 2.0, -41.9, [], 0.14);
            addWallLine(targetGroup, B3_X_WEST, B3_SHAFT_NORTH_Z2, B3_X_CORR_W, B3_SHAFT_NORTH_Z2, [], INNER_T); // Z = -44.2

            // Северная шахта лестницы: ЛК №1 (X [-1.6..4.6], Z [-47.8..-44.2]) — двухмаршевая лестница
            addWallLine(targetGroup, B3_X_WEST, B3_SHAFT_NORTH_Z1, B3_X_CORR_W, B3_SHAFT_NORTH_Z1, [], INNER_T); // Z = -47.8
            buildB3Staircase(targetGroup, B3_X_WEST + 0.1, B3_X_CORR_W - 0.1, B3_SHAFT_NORTH_Z1 + 0.1, B3_SHAFT_NORTH_Z2 - 0.1, false);

            // Кабинет 114 (Z [-53.4..-47.8]) и Г-образный кабинет 114А (Z [-55.8..-53.4], с выступом 114 у коридора)
            addWallLine(targetGroup, B3_X_WEST, -53.4, 2.6, -53.4, [], INNER_T);
            addWallLine(targetGroup, 2.6, -54.4, 2.6, -53.4, [
                { from: -54.3, to: -53.5, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 2.6, -54.4, B3_X_CORR_W, -54.4, [], INNER_T);
            addWallLine(targetGroup, B3_X_WEST, -55.8, B3_X_CORR_W, -55.8, [], INNER_T);

            // --- ВОСТОЧНЫЙ РЯД (X от 7.2 до 14.0): проход во двор, 105, 111, 111А, 112, 113А, 113, 116 ---
            // Восточная стена главного коридора X = 7.2 (от Z = -55.2 до Z = -26.8)
            addWallLine(targetGroup, B3_X_CORR_E, -55.2, B3_X_CORR_E, B3_SHAFT_SOUTH_Z2, [
                { from: -52.2, to: -50.4, type: 'door' }, // Двустворчатая дверь в 113
                { from: -49.0, to: -47.8, type: 'door' }, // Дверь в 113А
                { from: -46.9, to: -45.1, type: 'door' }, // Двустворчатая дверь в 112
                { from: -43.8, to: -42.6, type: 'door' }, // Дверь в 111А
                { from: -38.4, to: -37.2, type: 'door' }, // Дверь в зал 111
                { from: -31.8, to: -30.6, type: 'door' }, // Дверь в 105
                { from: -30.4, to: -26.8, type: 'open' }  // Открытый проход в восточный коридор-тамбур выхода во двор
            ], INNER_T);

            // Внутренняя перегородка с двустворчатой дверью в проходе между 102 и 105 (X = 11.4, Z [-30.4..-26.8])
            addWallLine(targetGroup, 11.4, -30.4, 11.4, -26.8, [
                { from: -29.5, to: -27.7, type: 'door' }
            ], INNER_T);

            // Кабинет 105 (Z [-32.8..-30.4])
            addWallLine(targetGroup, B3_X_CORR_E, -30.4, B3_X_EAST, -30.4, [], INNER_T);
            addWallLine(targetGroup, B3_X_CORR_E, -32.8, B3_X_EAST, -32.8, [], INNER_T);

            // Большой зал 111 (Z [-42.0..-32.8]) и смежный 111А (Z [-44.2..-42.0])
            addWallLine(targetGroup, B3_X_CORR_E, -42.0, B3_X_EAST, -42.0, [
                { from: 9.6, to: 10.8, type: 'door' } // Внутренняя дверь между 111 и 111А
            ], INNER_T);
            addWallLine(targetGroup, B3_X_CORR_E, -44.2, B3_X_EAST, -44.2, [], INNER_T);

            // Помещение 112 и Г-образный тамбур восточного выхода (Z [-47.8..-44.2], X [7.2..14.0])
            // Внутренний выступ тамбура в северо-западном углу 112 (X [7.2..11.2], Z [-47.8..-45.6])
            addWallLine(targetGroup, B3_X_CORR_E, -45.6, 11.2, -45.6, [
                { from: 7.8, to: 9.0, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 11.2, -47.8, 11.2, -45.6, [
                { from: -47.3, to: -46.1, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, B3_X_CORR_E, -47.8, B3_X_EAST, -47.8, [], INNER_T);

            // Кабинет 113А (Z [-50.0..-47.8]) и зал 113 (Z [-55.2..-50.0])
            addWallLine(targetGroup, B3_X_CORR_E, -50.0, B3_X_EAST, -50.0, [
                { from: 7.8, to: 9.0, type: 'door' } // Дверь между 113А и 113 у коридора
            ], INNER_T);
            addWallLine(targetGroup, B3_X_CORR_E, -55.2, B3_X_EAST, -55.2, [], INNER_T);

            // --- СЕВЕРНЫЙ ТОРЦЕВОЙ УЗЕЛ: ТАМБУР И ЗАЛЫ 117 (запад) / 116 (восток) (Z от -61.6 до -55.2) ---
            // Тамбур в конце коридора (X [3.2..6.2], Z [-57.4..-55.2]) и стена между 117 и 116 (X = 6.2, Z [-61.6..-55.2])
            addWallLine(targetGroup, 3.2, -57.4, 3.2, -55.8, [
                { from: -57.1, to: -56.0, type: 'door' } // Дверь из тамбура налево в 117
            ], INNER_T);
            addWallLine(targetGroup, 3.2, -57.4, 6.2, -57.4, [
                { from: 3.6, to: 4.8, type: 'door' } // Южная/северная дверь тамбура в 117
            ], INNER_T);
            addWallLine(targetGroup, 4.6, -55.2, 7.2, -55.2, [
                { from: 5.0, to: 6.8, type: 'door' } // Двустворчатая дверь из коридора в северный тамбур
            ], INNER_T);
            addWallLine(targetGroup, 6.2, B3_Z_NORTH, 6.2, -55.2, [
                { from: -57.1, to: -55.7, type: 'door' } // Двустворчатая/широкая дверь из тамбура направо в 116
            ], INNER_T);

            // 3D-плашки помещений 1-го этажа Корпуса 3 (buildingId = 3)
            addRoomLabel(targetGroup, 1, '103', 3.2, -20.5, false, false, 3, 1.05);
            addRoomLabel(targetGroup, 1, '104', 10.6, -23.2, true, false, 3, 0.90);
            addRoomLabel(targetGroup, 1, '102', 10.6, -25.6, true, false, 3, 0.90);
            addRoomLabel(targetGroup, 1, '105', 10.6, -31.6, true, false, 3, 0.90);
            addRoomLabel(targetGroup, 1, '111', 10.6, -37.4, false, false, 3, 1.05);
            addRoomLabel(targetGroup, 1, '111А', 10.6, -43.1, true, false, 3, 0.90);
            addRoomLabel(targetGroup, 1, '112', 9.2, -44.9, true, false, 3, 0.85);
            addRoomLabel(targetGroup, 1, '113А', 10.6, -48.9, true, false, 3, 0.90);
            addRoomLabel(targetGroup, 1, '113', 10.6, -52.6, false, false, 3, 1.0);
            addRoomLabel(targetGroup, 1, '116', 10.1, -58.4, false, false, 3, 1.05);

            addRoomLabel(targetGroup, 1, 'ЛК№2', 0.2, -28.6, true, false, 3, 0.88);
            addRoomLabel(targetGroup, 1, '106', 1.5, -31.5, true, false, 3, 0.90);
            addRoomLabel(targetGroup, 1, '107', 1.5, -33.8, true, false, 3, 0.90);
            addRoomLabel(targetGroup, 1, '109', 2.7, -38.2, true, false, 3, 0.88);
            addRoomLabel(targetGroup, 1, '108', -0.4, -38.8, true, false, 3, 0.78);
            addRoomLabel(targetGroup, 1, 'С/У', 0.2, -40.7, true, false, 3, 0.78);
            addRoomLabel(targetGroup, 1, 'С/У', 3.3, -41.9, true, false, 3, 0.76);
            addRoomLabel(targetGroup, 1, 'С/У', 0.2, -43.1, true, false, 3, 0.78);
            addRoomLabel(targetGroup, 1, 'ЛК№1', 1.5, -46.0, true, false, 3, 0.88);
            addRoomLabel(targetGroup, 1, '114', 1.5, -50.6, false, false, 3, 1.0);
            addRoomLabel(targetGroup, 1, '114А', 0.8, -54.6, true, false, 3, 0.90);
            addRoomLabel(targetGroup, 1, '117', 1.5, -58.7, false, false, 3, 1.05);
        }

        /**
         * КОРПУС 3 — ЭТАЖ 2 (Габариты: X [-1.6..14.0], Z [-61.6..-14.0], ВПЛОТНУЮ к Корпусу 1 без перемычки!)
         * Точное совпадение с планом 2-го этажа:
         * - На юге (Z [-19.8..-14.0]) коридор чуть шире (X [4.2..7.6]) со ступенями подъёма от дверей стыка и узкими торцевыми отсеками по бокам (Z [-15.2..-14.0])
         * - На Z = -19.8 стены коридора делают аккуратную ступеньку внутрь до X [4.6..7.2] (поэтому 201 и 202 имеют характерный выступ у коридора)
         * - Западный ряд: 201, 201А, ЛК №1 (Z [-30.4..-26.8]), 205, 205А, ЛК №2 (Z [-47.8..-44.2]), 207 (со ступенькой коридора до X = 4.2), 209 (до X = 4.9), 209А
         * - Восточный ряд: 202, 202А, 204, 206, 208, 208А, восточный эркер со ступенями в середине (Z [-46.8..-44.2]), 210, 212А, и Г-образный зал 212 (продлевается на северном торце до X = 4.9!)
         */
        function buildBuilding3Floor2(targetGroup) {
            const OUTER_T = 0.24;
            const INNER_T = 0.18;

            // 1. Основная плита перекрытия 2-го этажа Корпуса 3 (вплотную к Корпусу 1 на Z = -14.0)
            addFloorRect(targetGroup, B3_X_WEST, B3_Z_NORTH, B3_X_EAST, B3_Z_SOUTH, false);

            // Восточный эркер с лестничным маршем посередине (между 208А и 210: X [14.0..15.6], Z [-46.8..-44.2])
            addFloorRect(targetGroup, B3_X_EAST, -46.8, 15.6, -44.2, true);

            // --- ВНЕШНИЙ ПЕРИМЕТР СТЕН КОРПУСА 3 (ЭТАЖ 2) ---
            // Собственная южная торцевая стена Корпуса 3 (Z = -14.0) с двустворчатой дверью стыка X [4.9..6.9]
            addWallLine(targetGroup, B3_X_WEST, B3_Z_SOUTH, B3_X_EAST, B3_Z_SOUTH, [
                { from: 4.9, to: 6.9, type: 'door' }
            ], OUTER_T);

            // Северная торцевая стена Z = -61.6
            addWallLine(targetGroup, B3_X_WEST, B3_Z_NORTH, B3_X_EAST, B3_Z_NORTH, [], OUTER_T);

            // Западная внешняя стена X = -1.6
            addWallLine(targetGroup, B3_X_WEST, B3_Z_NORTH, B3_X_WEST, B3_Z_SOUTH, [], OUTER_T);

            // Восточная внешняя стена X = 14.0 (с открытым проёмом в восточный эркер Z [-46.8..-44.2])
            addWallLine(targetGroup, B3_X_EAST, B3_Z_NORTH, B3_X_EAST, B3_Z_SOUTH, [
                { from: -46.8, to: -44.2, type: 'open' }
            ], OUTER_T);
            // Внешние стены восточного эркера X [14.0..15.6], Z [-46.8..-44.2] (в торце X = 15.6 дверь в переход к Корпусу 4)
            addWallLine(targetGroup, B3_X_EAST, -46.8, 15.6, -46.8, [], OUTER_T);
            addWallLine(targetGroup, B3_X_EAST, -44.2, 15.6, -44.2, [], OUTER_T);
            addWallLine(targetGroup, 15.6, -46.8, 15.6, -44.2, [
                { from: -46.3, to: -44.7, type: 'door' }
            ], OUTER_T);

            // --- УЗЕЛ СТЫКА, УЗКИЕ ТОРЦЕВЫЕ ОТСЕКИ И СТУПЕНИ В ЮЖНОЙ ЧАСТИ (Z от -19.8 до -14.0) ---
            // Узкие торцевые секции по бокам от входа (Z = -15.2, слева от коридора X [-1.6..4.2] и справа X [7.6..14.0])
            addWallLine(targetGroup, B3_X_WEST, -15.2, 4.2, -15.2, [], INNER_T);
            addWallLine(targetGroup, 7.6, -15.2, B3_X_EAST, -15.2, [], INNER_T);

            // Расширенная южная часть коридора (X = 4.2 слева и X = 7.6 справа, от Z = -19.8 до Z = -14.0)
            // с маленькими выступами-заплечиками на Z = -15.2 как на чертеже
            addWallLine(targetGroup, 4.2, -19.8, 4.2, B3_Z_SOUTH, [], INNER_T);
            addWallLine(targetGroup, 7.6, -19.8, 7.6, B3_Z_SOUTH, [], INNER_T);
            addWallLine(targetGroup, 4.2, -15.2, 4.6, -15.2, [], INNER_T);
            addWallLine(targetGroup, 7.2, -15.2, 7.6, -15.2, [], INNER_T);

            // Ступеньки-изломы стен коридора на Z = -19.8 (переход от X [4.2..7.6] к основному коридору X [4.6..7.2])
            addWallLine(targetGroup, 4.2, -19.8, B3_X_CORR_W, -19.8, [], INNER_T);
            addWallLine(targetGroup, B3_X_CORR_E, -19.8, 7.6, -19.8, [], INNER_T);

            // Ступени подъёма в расширенной части коридора (X [4.2..7.6], Z [-18.2..-16.6])
            const southCorrW = 7.6 - 4.2;
            const southCorrCx = (4.2 + 7.6) / 2;
            for (let i = 0; i < 5; i++) {
                const sz = -18.2 + i * 0.30;
                const heightRatio = 0.04 * (i + 1);
                const geom = new THREE.BoxGeometry(southCorrW * 0.96, 1, 0.28);
                registerDynamicStairStep(targetGroup, geom, southCorrCx, sz, heightRatio, 0);
            }

            // --- СТЕНЫ ЦЕНТРАЛЬНОГО КОРИДОРА 2-ГО ЭТАЖА ---
            // 1) Западная стена коридора X = 4.6 на участке от Z = -47.8 до Z = -19.8 (вдоль 201, 201А, ЛК №1, 205, 205А, ЛК №2)
            addWallLine(targetGroup, B3_X_CORR_W, B3_SHAFT_NORTH_Z1, B3_X_CORR_W, -19.8, [
                { from: -46.9, to: -45.1, type: 'door' }, // Двустворчатая дверь в ЛК №2 (северная шахта)
                { from: -43.5, to: -42.3, type: 'door' }, // Дверь в 205А
                { from: -41.2, to: -39.6, type: 'door' }, // Двустворчатая дверь в 205 (северная)
                { from: -32.6, to: -31.0, type: 'door' }, // Двустворчатая дверь в 205 (южная)
                { from: -29.5, to: -27.7, type: 'door' }, // Двустворчатая дверь в ЛК №1 (южная шахта)
                { from: -26.4, to: -24.8, type: 'door' }, // Двустворчатая дверь в 201А
                { from: -23.8, to: -22.2, type: 'door' }  // Двустворчатая дверь в 201
            ], INNER_T);

            // 2) Ступенька коридора у каб. 207 (Z от -52.2 до -47.8: стена смещена на запад до X = 4.2, как на плане)
            addWallLine(targetGroup, 4.2, B3_SHAFT_NORTH_Z1, B3_X_CORR_W, B3_SHAFT_NORTH_Z1, [], INNER_T);
            addWallLine(targetGroup, 4.2, -52.2, 4.2, B3_SHAFT_NORTH_Z1, [
                { from: -50.8, to: -49.2, type: 'door' } // Двустворчатая дверь в 207
            ], INNER_T);

            // 3) Ступенька коридора у каб. 209 и 209А (Z от -61.6 до -52.2: стена выступает до X = 4.9, смыкаясь с торцом зала 212)
            addWallLine(targetGroup, 4.2, -52.2, 4.9, -52.2, [], INNER_T);
            addWallLine(targetGroup, 4.9, B3_Z_NORTH, 4.9, -52.2, [
                { from: -60.4, to: -59.2, type: 'door' }, // Дверь в 209А
                { from: -54.0, to: -52.8, type: 'door' }  // Дверь в 209
            ], INNER_T);

            // 4) Восточная стена коридора X = 7.2 (от Z = -61.6 до Z = -19.8): вдоль 202, 202А, 204, 206, 208, 208А, эркера, 210, 212А, 212
            // Внимание: зал 212 на севере шире остальных комнат и доходит на западе до X = 4.9 (закрывая торец коридора),
            // поэтому стена вдоль коридора у 212 идет по Z = -53.8 (от X = 7.2) и далее по X = 7.2!
            addWallLine(targetGroup, B3_X_CORR_E, -53.8, B3_X_CORR_E, -19.8, [
                { from: -53.2, to: -52.0, type: 'door' }, // Дверь в 212А
                { from: -50.4, to: -49.2, type: 'door' }, // Дверь в 210
                { from: -46.4, to: -44.6, type: 'door' }, // Двустворчатая дверь в проход с восточным эркером
                { from: -43.5, to: -42.3, type: 'door' }, // Дверь в 208А
                { from: -40.8, to: -39.2, type: 'door' }, // Северная двустворчатая дверь в 208
                { from: -34.2, to: -33.0, type: 'door' }, // Южная дверь в 208
                { from: -31.4, to: -29.8, type: 'door' }, // Двустворчатая дверь в 206
                { from: -29.0, to: -27.4, type: 'door' }, // Двустворчатая дверь в 204
                { from: -26.4, to: -25.2, type: 'door' }, // Дверь в 202А
                { from: -23.8, to: -22.6, type: 'door' }  // Дверь в 202
            ], INNER_T);

            // Продолжение восточной стены коридора вдоль зала 212 (X = 7.2, Z от -61.6 до -53.8, с двустворчатым входом в 212)
            addWallLine(targetGroup, B3_X_CORR_E, B3_Z_NORTH, B3_X_CORR_E, -53.8, [
                { from: -56.2, to: -54.4, type: 'door' } // Двустворчатая дверь из коридора в зал 212
            ], INNER_T);
            // Торцевая перегородка в северном конце коридора (соединяет X = 4.9 и X = 7.2 у Z = -61.6)
            addWallLine(targetGroup, 4.9, B3_Z_NORTH, B3_X_CORR_E, B3_Z_NORTH, [], OUTER_T);

            // --- ПОПЕРЕЧНЫЕ СТЕНЫ ЗАПАДНОГО РЯДА (X от -1.6 до 4.6): 201, 201А, ЛК №1, 205, 205А, ЛК №2, 207, 209, 209А ---
            addWallLine(targetGroup, B3_X_WEST, -24.4, B3_X_CORR_W, -24.4, [
                { from: -1.1, to: 0.1, type: 'door' } // Дверь между 201 и 201А у западной внешней стены
            ], INNER_T);
            addWallLine(targetGroup, B3_X_WEST, B3_SHAFT_SOUTH_Z2, B3_X_CORR_W, B3_SHAFT_SOUTH_Z2, [], INNER_T); // Z = -26.8

            // Южная шахта лестницы: ЛК №1 (X [-1.6..4.6], Z [-30.4..-26.8]) — ЕДИНАЯ С ЛК №2 1-ГО ЭТАЖА
            addWallLine(targetGroup, B3_X_WEST, B3_SHAFT_SOUTH_Z1, B3_X_CORR_W, B3_SHAFT_SOUTH_Z1, [], INNER_T); // Z = -30.4
            buildB3Staircase(targetGroup, B3_X_WEST + 0.1, B3_X_CORR_W - 0.1, B3_SHAFT_SOUTH_Z1 + 0.1, B3_SHAFT_SOUTH_Z2 - 0.1, false);

            // Зал 205 (Z [-41.8..-30.4]) и узкий кабинет 205А (Z [-44.2..-41.8])
            addWallLine(targetGroup, B3_X_WEST, -41.8, B3_X_CORR_W, -41.8, [
                { from: 2.8, to: 4.0, type: 'door' } // Дверь между 205 и 205А у коридора
            ], INNER_T);
            addWallLine(targetGroup, B3_X_WEST, B3_SHAFT_NORTH_Z2, B3_X_CORR_W, B3_SHAFT_NORTH_Z2, [], INNER_T); // Z = -44.2

            // Северная шахта лестницы: ЛК №2 (X [-1.6..4.6], Z [-47.8..-44.2]) — ЕДИНАЯ С ЛК №1 1-ГО ЭТАЖА
            addWallLine(targetGroup, B3_X_WEST, B3_SHAFT_NORTH_Z1, 4.2, B3_SHAFT_NORTH_Z1, [], INNER_T); // Z = -47.8
            buildB3Staircase(targetGroup, B3_X_WEST + 0.1, B3_X_CORR_W - 0.1, B3_SHAFT_NORTH_Z1 + 0.1, B3_SHAFT_NORTH_Z2 - 0.1, false);

            // Кабинет 207 (Z [-52.2..-47.8]), 209 (Z [-58.6..-52.2]) и 209А (Z [-61.6..-58.6])
            addWallLine(targetGroup, B3_X_WEST, -52.2, 4.2, -52.2, [], INNER_T);
            addWallLine(targetGroup, B3_X_WEST, -58.6, 4.9, -58.6, [
                { from: 3.1, to: 4.3, type: 'door' } // Дверь между 209 и 209А
            ], INNER_T);

            // --- ПОПЕРЕЧНЫЕ СТЕНЫ ВОСТОЧНОГО РЯДА (X от 7.2 до 14.0): 202, 202А, 204, 206, 208, 208А, эркер, 210, 212А, 212 ---
            addWallLine(targetGroup, B3_X_CORR_E, -24.4, B3_X_EAST, -24.4, [
                { from: 7.8, to: 9.0, type: 'door' } // Дверь между 202 и 202А
            ], INNER_T);
            addWallLine(targetGroup, B3_X_CORR_E, -26.8, B3_X_EAST, -26.8, [], INNER_T); // Между 202А и 204
            addWallLine(targetGroup, B3_X_CORR_E, -29.2, B3_X_EAST, -29.2, [], INNER_T); // Между 204 и 206
            addWallLine(targetGroup, B3_X_CORR_E, -31.8, B3_X_EAST, -31.8, [], INNER_T); // Между 206 и 208
            addWallLine(targetGroup, B3_X_CORR_E, -41.8, B3_X_EAST, -41.8, [
                { from: 7.8, to: 9.0, type: 'door' } // Дверь между 208 и 208А
            ], INNER_T);
            addWallLine(targetGroup, B3_X_CORR_E, -44.2, B3_X_EAST, -44.2, [], INNER_T); // Южная стена прохода с восточным эркером (-44.2)

            // Ступени посередине прохода к восточному эркеру (X [11.8..13.2], Z [-46.8..-44.2]), как на чертеже
            const bayDepthZ = 2.6 - 0.28;
            const bayCz = -45.5;
            for (let i = 0; i < 4; i++) {
                const sx = 13.0 - i * 0.34;
                const heightRatio = 0.045 * (i + 1);
                const geom = new THREE.BoxGeometry(0.32, 1, bayDepthZ);
                registerDynamicStairStep(targetGroup, geom, sx, bayCz, heightRatio, 0);
            }

            addWallLine(targetGroup, B3_X_CORR_E, -46.8, B3_X_EAST, -46.8, [], INNER_T); // Северная стена прохода с восточным эркером (-46.8)
            addWallLine(targetGroup, B3_X_CORR_E, -51.4, B3_X_EAST, -51.4, [], INNER_T); // Между 210 и 212А
            addWallLine(targetGroup, B3_X_CORR_E, -53.8, B3_X_EAST, -53.8, [
                { from: 8.0, to: 9.2, type: 'door' } // Дверь из 212А в зал 212
            ], INNER_T);

            // 3D-плашки помещений 2-го этажа Корпуса 3 (buildingId = 3)
            addRoomLabel(targetGroup, 2, '201', 1.5, -19.8, false, false, 3, 1.0);
            addRoomLabel(targetGroup, 2, '201А', 1.5, -25.6, true, false, 3, 0.90);
            addRoomLabel(targetGroup, 2, 'ЛК№1', 1.5, -28.6, true, false, 3, 0.90);
            addRoomLabel(targetGroup, 2, '205', 1.5, -36.1, false, false, 3, 1.05);
            addRoomLabel(targetGroup, 2, '205А', 1.5, -43.0, true, false, 3, 0.90);
            addRoomLabel(targetGroup, 2, 'ЛК№2', 1.5, -46.0, true, false, 3, 0.90);
            addRoomLabel(targetGroup, 2, '207', 1.3, -50.0, false, false, 3, 0.95);
            addRoomLabel(targetGroup, 2, '209', 1.6, -55.4, false, false, 3, 1.0);
            addRoomLabel(targetGroup, 2, '209А', 1.6, -60.1, true, false, 3, 0.90);

            addRoomLabel(targetGroup, 2, '202', 10.6, -19.8, false, false, 3, 1.0);
            addRoomLabel(targetGroup, 2, '202А', 10.6, -25.6, true, false, 3, 0.90);
            addRoomLabel(targetGroup, 2, '204', 10.6, -28.0, true, false, 3, 0.90);
            addRoomLabel(targetGroup, 2, '206', 10.6, -30.5, true, false, 3, 0.90);
            addRoomLabel(targetGroup, 2, '208', 10.6, -36.8, false, false, 3, 1.05);
            addRoomLabel(targetGroup, 2, '208А', 10.6, -43.0, true, false, 3, 0.90);
            addRoomLabel(targetGroup, 2, '210', 10.6, -49.1, false, false, 3, 0.95);
            addRoomLabel(targetGroup, 2, '212А', 10.6, -52.6, true, false, 3, 0.90);
            addRoomLabel(targetGroup, 2, '212', 10.6, -57.7, false, false, 3, 1.05);
        }

