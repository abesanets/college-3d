// ==========================================
// КОРПУС 1 (Этажи 1–7)
// ==========================================

        function buildCommonStructure(targetGroup, floorNum, hasRightExtension = false, topWallOpenings = []) {
            const OUTER_T = 0.24;
            const INNER_T = 0.18;

            // 1. Плиты перекрытия базового контура
            addFloorRect(targetGroup, -10.0, -14.0, 16.0, -4.0, false);
            addFloorRect(targetGroup, -14.0, -4.0, -5.8, 14.0, false);
            addFloorRect(targetGroup, -5.8, -4.0, 16.0, 4.0, false);
            addFloorRect(targetGroup, -5.8, 4.0, 12.5, 14.0, false);

            // Правый выступ (для 1, 2 и 3 этажей: каб. 305 и Переход в корпус №2)
            if (hasRightExtension) {
                addFloorRect(targetGroup, 16.0, -9.5, 20.4, -2.2, false);
            }

            // Выделенная тонировка центрального ядра и лестниц
            addFloorRect(targetGroup, -1.2, -4.0, 8.6, 4.0, true);
            addFloorRect(targetGroup, 8.6, -3.5, 16.0, 3.8, true);

            // 2. Внешний периметр стен
            addWallLine(targetGroup, -10.0, -14.0, 16.0, -14.0, topWallOpenings, OUTER_T);
            addWallLine(targetGroup, -10.0, -14.0, -10.0, -4.0, [], OUTER_T);
            addWallLine(targetGroup, -14.0, -4.0, -10.0, -4.0, [], OUTER_T);
            addWallLine(targetGroup, -14.0, -4.0, -14.0, 14.0, [], OUTER_T);
            addWallLine(targetGroup, -14.0, 14.0, 12.5, 14.0, [], OUTER_T);
            addWallLine(targetGroup, 12.5, 4.0, 12.5, 14.0, [], OUTER_T);
            addWallLine(targetGroup, 12.5, 4.0, 16.0, 4.0, [], OUTER_T);

            if (!hasRightExtension) {
                addWallLine(targetGroup, 16.0, -14.0, 16.0, 4.0, [], OUTER_T);
            } else {
                addWallLine(targetGroup, 16.0, -14.0, 16.0, 4.0, [
                    { from: -5.6, to: -4.0, type: 'door' }
                ], OUTER_T);

                addWallLine(targetGroup, 16.0, -9.5, 20.4, -9.5, [], OUTER_T);
                addWallLine(targetGroup, 16.0, -2.2, 20.4, -2.2, [], OUTER_T);
                addWallLine(targetGroup, 20.4, -9.5, 20.4, -2.2, [
                    { from: -6.5, to: -5.1, type: 'door' }
                ], OUTER_T);
            }

            // 3. Центральное ядро: Лифты и Санузлы (X [-1.2..8.6], Z [-4.0..4.0])
            // Северная стена ядра со входом в северный С/У
            addWallLine(targetGroup, -1.2, -4.0, 8.6, -4.0, [
                { from: 4.9, to: 5.9, type: 'door' }
            ], INNER_T);

            // Западная стена ядра: двустворчатый вход в лифтовой холл
            addWallLine(targetGroup, -1.2, -4.0, -1.2, 4.0, [
                { from: 0.8, to: 2.6, type: 'door' }
            ], INNER_T);

            // Южная стена ядра со входом в шлюз южного С/У
            addWallLine(targetGroup, -1.2, 4.0, 8.6, 4.0, [
                { from: 7.2, to: 8.2, type: 'door' }
            ], INNER_T);

            // Восточная стена ядра (разделяет С/У и лестничный блок)
            addWallLine(targetGroup, 8.6, -4.0, 8.6, 4.0, [], INNER_T);

            // --- ШАХТЫ ЛИФТОВ ---
            // Левый грузопассажирский лифт (X [-0.9..1.4], Z [-3.8..-1.0])
            addWallLine(targetGroup, -0.9, -3.8, 1.4, -3.8, [], INNER_T);
            addWallLine(targetGroup, -0.9, -3.8, -0.9, -1.0, [], INNER_T);
            addWallLine(targetGroup, 1.4, -3.8, 1.4, -1.0, [], INNER_T);
            addWallLine(targetGroup, -0.9, -1.0, 1.4, -1.0, [
                { from: -0.2, to: 1.0, type: 'door' }
            ], INNER_T);
            buildElevatorShaftCross(targetGroup, -0.85, -3.7, 1.35, -1.1);

            // Правый пассажирский лифт (X [2.0..4.6], Z [-3.3..-1.0])
            addWallLine(targetGroup, 2.0, -3.3, 4.6, -3.3, [], INNER_T);
            addWallLine(targetGroup, 2.0, -3.3, 2.0, -1.0, [], INNER_T);
            addWallLine(targetGroup, 4.6, -3.3, 4.6, -1.0, [], INNER_T);
            addWallLine(targetGroup, 2.0, -1.0, 4.6, -1.0, [
                { from: 2.5, to: 3.7, type: 'door' }
            ], INNER_T);
            buildElevatorShaftCross(targetGroup, 2.05, -3.2, 4.55, -1.1);

            // Пилон между шахтами лифтов
            addWallLine(targetGroup, 1.4, -1.0, 2.0, -1.0, [], 0.12);
            addWallLine(targetGroup, 1.4, -1.0, 1.4, -0.6, [], 0.12);
            addWallLine(targetGroup, 2.0, -1.0, 2.0, -0.6, [], 0.12);
            addWallLine(targetGroup, 1.4, -0.6, 2.0, -0.6, [], 0.12);

            // Разделительная капитальная стена между лифтовым холлом и санузлами
            addWallLine(targetGroup, 4.8, -4.0, 4.8, 4.0, [], INNER_T);

            // --- САНИТАРНЫЙ БЛОК (С/У) ---
            // Центральная капитальная стена между северным и южным С/У
            addWallLine(targetGroup, 4.8, 0.0, 8.6, 0.0, [], INNER_T);

            // 1) СЕВЕРНЫЙ С/У (Z [-4.0..0.0]): предбанник с севера, кабинки одна за другой по оси X
            // Перегородка кабинного блока со входами в кабинки из предбанника
            addWallLine(targetGroup, 5.7, -1.6, 8.6, -1.6, [
                { from: 5.9, to: 6.9, type: 'door' },
                { from: 7.3, to: 8.3, type: 'door' }
            ], 0.12);
            // Торцевая стенка кабинок
            addWallLine(targetGroup, 5.7, -1.6, 5.7, 0.0, [], 0.12);
            // Поперечная перегородка между кабинками
            addWallLine(targetGroup, 7.1, -1.6, 7.1, 0.0, [], 0.12);

            // 2) ЮЖНЫЙ С/У (Z [0.0..4.0]): шлюз у восточной стены, предбанник и кабинки бок о бок по оси Z
            // Стена шлюза/тамбура с дверью в предбанник
            addWallLine(targetGroup, 4.8, 2.6, 8.6, 2.6, [
                { from: 5.0, to: 6.0, type: 'door' }
            ], 0.12);
            // Стена входов в кабинки из предбанника
            addWallLine(targetGroup, 6.4, 0.0, 6.4, 2.6, [
                { from: 0.3, to: 1.2, type: 'door' },
                { from: 1.5, to: 2.4, type: 'door' }
            ], 0.12);
            // Разделительная перегородка между двумя кабинками
            addWallLine(targetGroup, 6.4, 1.3, 8.6, 1.3, [], 0.12);

            // 4. Две параллельные лестничные клетки ЛК№1 и ЛК№2
            // Северная стена ЛК№1 со входом из северного коридора
            addWallLine(targetGroup, 8.6, -3.8, 16.0, -3.8, [
                { from: 8.8, to: 10.0, type: 'door' }
            ], INNER_T);

            // Центральная противопожарная разделительная стена между ЛК№1 и ЛК№2
            addWallLine(targetGroup, 8.6, 0.0, 16.0, 0.0, [], INNER_T);

            // Южная стена ЛК№2 со входом из южного коридора
            addWallLine(targetGroup, 8.6, 3.8, 16.0, 3.8, [
                { from: 8.8, to: 10.0, type: 'door' }
            ], INNER_T);

            // Лестничные марши с входными и межэтажными площадками
            buildStaircaseUnit(targetGroup, -3.8, 0.0, -1.9, true);
            buildStaircaseUnit(targetGroup, 0.0, 3.8, 1.9, false);

            // Общие плашки ядра и лестниц
            addRoomLabel3D(targetGroup, floorNum, 'С/У', 6.2, -2.8, true);
            addRoomLabel3D(targetGroup, floorNum, 'С/У', 5.6, 1.3, true);
            addRoomLabel3D(targetGroup, floorNum, 'ЛК№1', 9.4, -1.9, true);
            addRoomLabel3D(targetGroup, floorNum, 'ЛК№2', 9.4, 1.9, true);
            addRoomLabel3D(targetGroup, floorNum, 'Лифтовой\nхолл', 1.8, 1.5, false, true);
        }

        function buildFloor7(targetGroup) {
            buildCommonStructure(targetGroup, 7, false);
            const INNER_T = 0.18;

            addWallLine(targetGroup, -10.0, -6.2, 16.0, -6.2, [
                { from: -3.2, to: -2.0, type: 'door' },
                { from: -1.0, to: 0.2, type: 'door' },
                { from: 6.8, to: 9.0, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, -2.2, -14.0, -2.2, -8.8, [], INNER_T);
            addWallLine(targetGroup, 1.6, -14.0, 1.6, -8.8, [], INNER_T);

            addWallLine(targetGroup, -2.2, -8.8, 5.4, -8.8, [
                { from: -0.9, to: 0.2, type: 'door' },
                { from: 3.0, to: 4.1, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, 1.6, -11.4, 5.4, -11.4, [
                { from: 3.0, to: 4.1, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, 5.4, -14.0, 5.4, -6.2, [
                { from: -13.3, to: -12.1, type: 'door' },
                { from: -8.2, to: -7.0, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, -10.0, -4.0, -5.8, -4.0, [], INNER_T);
            addWallLine(targetGroup, -14.0, 0.5, -5.8, 0.5, [], INNER_T);
            addWallLine(targetGroup, -5.8, -4.0, -5.8, 14.0, [
                { from: -2.2, to: -1.0, type: 'door' },
                { from: 2.2, to: 4.2, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, -5.8, 7.2, 12.5, 7.2, [
                { from: -4.6, to: -3.4, type: 'door' },
                { from: -0.6, to: 1.4, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, -1.6, 7.2, -1.6, 14.0, [
                { from: 9.6, to: 10.8, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, 8.6, 9.4, 12.5, 9.4, [], INNER_T);
            addWallLine(targetGroup, 8.6, 9.4, 8.6, 14.0, [
                { from: 10.8, to: 12.0, type: 'open' }
            ], INNER_T);

            addRoomLabel3D(targetGroup, 7, '703', -6.2, -10.2);
            addRoomLabel3D(targetGroup, 7, '703А', -0.3, -11.4);
            addRoomLabel3D(targetGroup, 7, '704', 10.6, -10.2);
            addRoomLabel3D(targetGroup, 7, '702А', -9.9, -1.8);
            addRoomLabel3D(targetGroup, 7, '702', -9.9, 7.2);
            addRoomLabel3D(targetGroup, 7, '701А', -3.7, 10.8);
            addRoomLabel3D(targetGroup, 7, '701', 3.5, 10.8);
        }

        function buildFloor6(targetGroup) {
            buildCommonStructure(targetGroup, 6, false);
            const INNER_T = 0.18;

            addWallLine(targetGroup, -10.0, -6.2, 16.0, -6.2, [
                { from: -1.4, to: 0.6, type: 'door' },
                { from: 2.9, to: 4.1, type: 'door' },
                { from: 6.8, to: 9.0, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, 1.6, -14.0, 1.6, -6.2, [
                { from: -8.0, to: -6.8, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, 5.4, -14.0, 5.4, -6.2, [
                { from: -8.0, to: -6.8, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, 1.6, -8.6, 5.4, -8.6, [
                { from: 2.9, to: 4.1, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, -10.0, -4.0, -5.8, -4.0, [], INNER_T);
            addWallLine(targetGroup, -14.0, 0.0, -5.8, 0.0, [
                { from: -9.2, to: -8.0, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, -5.8, -4.0, -5.8, 14.0, [
                { from: -2.2, to: -1.0, type: 'door' },
                { from: 1.8, to: 3.8, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, -5.8, 7.2, 12.5, 7.2, [
                { from: -4.6, to: -3.4, type: 'door' },
                { from: -1.4, to: 0.6, type: 'door' },
                { from: 9.2, to: 10.4, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, -2.2, 7.2, -2.2, 14.0, [], INNER_T);
            addWallLine(targetGroup, 8.6, 7.2, 8.6, 14.0, [], INNER_T);

            addRoomLabel3D(targetGroup, 6, '604', -4.2, -10.2);
            addRoomLabel3D(targetGroup, 6, '604А', 3.5, -11.4);
            addRoomLabel3D(targetGroup, 6, '605', 10.6, -10.2);
            addRoomLabel3D(targetGroup, 6, '603А', -9.9, -2.0);
            addRoomLabel3D(targetGroup, 6, '603', -9.9, 7.0);
            addRoomLabel3D(targetGroup, 6, '602А', -4.0, 10.8);
            addRoomLabel3D(targetGroup, 6, '602', 3.2, 10.8);
            addRoomLabel3D(targetGroup, 6, '601', 10.5, 10.8);
        }

        function buildFloor5(targetGroup) {
            buildCommonStructure(targetGroup, 5, false);
            const INNER_T = 0.18;

            addWallLine(targetGroup, -10.0, -6.2, 16.0, -6.2, [
                { from: -1.4, to: 0.6, type: 'door' },
                { from: 2.9, to: 4.1, type: 'door' },
                { from: 6.8, to: 9.0, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, 1.6, -14.0, 1.6, -6.2, [
                { from: -8.0, to: -6.8, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, 5.4, -14.0, 5.4, -6.2, [
                { from: -8.0, to: -6.8, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, 1.6, -8.6, 5.4, -8.6, [
                { from: 2.9, to: 4.1, type: 'open' }
            ], INNER_T);

            addWallLine(targetGroup, -5.8, -6.2, -5.8, -4.0, [
                { from: -5.6, to: -4.4, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, -10.0, -4.0, -5.8, -4.0, [], INNER_T);
            addWallLine(targetGroup, -14.0, 0.0, -5.8, 0.0, [], INNER_T);
            addWallLine(targetGroup, -5.8, -4.0, -5.8, 14.0, [
                { from: -2.2, to: -1.0, type: 'door' },
                { from: 1.8, to: 3.8, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, -5.8, 7.2, 12.5, 7.2, [
                { from: -4.6, to: -3.4, type: 'door' },
                { from: -1.4, to: 0.6, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, -2.2, 7.2, -2.2, 14.0, [], INNER_T);

            addRoomLabel3D(targetGroup, 5, '503', -4.2, -10.2);
            addRoomLabel3D(targetGroup, 5, '503А', 3.5, -11.4);
            addRoomLabel3D(targetGroup, 5, '504', 10.6, -10.2);
            addRoomLabel3D(targetGroup, 5, '502А', -9.9, -2.0);
            addRoomLabel3D(targetGroup, 5, '502', -9.9, 7.0);
            addRoomLabel3D(targetGroup, 5, '501А', -4.0, 10.8);
            addRoomLabel3D(targetGroup, 5, '501', 5.2, 10.8);
        }

        function buildFloor4(targetGroup) {
            // 4 этаж: сопоставлен с типовым внешним контуром (как 5, 6, 7 этажи) с поворотом исходного плана на 90° CW
            buildCommonStructure(targetGroup, 4, false);
            const INNER_T = 0.18;

            // 1. Северный блок: помещения 403, 403А и 404 (Z [-14.0..-6.2])
            // Южная стена северного ряда вдоль коридора
            addWallLine(targetGroup, -10.0, -6.2, 16.0, -6.2, [
                { from: -1.4, to: 0.6, type: 'door' }, // Двустворчатый вход в 403
                { from: 2.9, to: 4.1, type: 'door' },  // Вход в тамбур перед 403А
                { from: 6.8, to: 9.0, type: 'door' }   // Двустворчатый вход в 404
            ], INNER_T);

            // Вертикальные перегородки между 403, 403А и 404
            addWallLine(targetGroup, 1.6, -14.0, 1.6, -6.2, [
                { from: -8.0, to: -6.8, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, 5.4, -14.0, 5.4, -6.2, [
                { from: -8.0, to: -6.8, type: 'door' }
            ], INNER_T);

            // Внутренняя стенка тамбура перед 403А
            addWallLine(targetGroup, 1.6, -8.6, 5.4, -8.6, [
                { from: 2.9, to: 4.1, type: 'door' }
            ], INNER_T);

            // 2. Западный блок: кабинеты 402А (вверху), 401А (посередине) и 402 (внизу в углу)
            addWallLine(targetGroup, -10.0, -4.0, -5.8, -4.0, [], INNER_T);

            // Стена западного ряда вдоль коридора со входами в кабинеты
            addWallLine(targetGroup, -5.8, -4.0, -5.8, 14.0, [
                { from: -1.8, to: -0.6, type: 'door' }, // Вход в 402А
                { from: 3.2, to: 4.4, type: 'door' },   // Вход в 401А
                { from: 8.5, to: 10.5, type: 'door' }   // Вход в 402
            ], INNER_T);

            // Перегородка между 402А и 401А
            addWallLine(targetGroup, -14.0, 1.5, -5.8, 1.5, [], INNER_T);

            // Перегородка между 401А и 402
            addWallLine(targetGroup, -14.0, 7.2, -5.8, 7.2, [], INNER_T);

            // 3. Южный блок: большой зал 401 (цельное открытое пространство X [-5.8..12.5], Z [7.2..14.0])
            addWallLine(targetGroup, -5.8, 7.2, 12.5, 7.2, [
                { from: -1.5, to: 0.5, type: 'door' }, // Первый вход в 401
                { from: 7.5, to: 9.5, type: 'door' }   // Второй вход в 401
            ], INNER_T);

            // Подписи помещений 4 этажа
            addRoomLabel3D(targetGroup, 4, '403', -4.2, -10.2);
            addRoomLabel3D(targetGroup, 4, '403А', 3.5, -11.4);
            addRoomLabel3D(targetGroup, 4, '404', 10.6, -10.2);
            addRoomLabel3D(targetGroup, 4, '402А', -9.9, -1.2);
            addRoomLabel3D(targetGroup, 4, '401А', -9.9, 4.3);
            addRoomLabel3D(targetGroup, 4, '402', -9.9, 10.6);
            addRoomLabel3D(targetGroup, 4, '401', 3.5, 10.6, false, true);
        }

        function buildFloor3(targetGroup) {
            buildCommonStructure(targetGroup, 3, true);
            const INNER_T = 0.18;

            addWallLine(targetGroup, -10.0, -6.2, 16.0, -6.2, [
                { from: -1.4, to: 0.6, type: 'door' },
                { from: 6.8, to: 9.0, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, 1.6, -14.0, 1.6, -6.2, [
                { from: -8.0, to: -6.8, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, 5.4, -14.0, 5.4, -6.2, [
                { from: -8.0, to: -6.8, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, 1.6, -8.6, 5.4, -8.6, [
                { from: 2.9, to: 4.1, type: 'door' }
            ], INNER_T);

            buildCorridorStepsRight(targetGroup);

            addWallLine(targetGroup, -5.8, -6.2, -5.8, -4.0, [
                { from: -5.6, to: -4.4, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, -10.0, -4.0, -5.8, -4.0, [], INNER_T);
            addWallLine(targetGroup, -14.0, 0.0, -5.8, 0.0, [
                { from: -8.0, to: -6.8, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, -5.8, -4.0, -5.8, 14.0, [
                { from: -2.2, to: -1.0, type: 'door' },
                { from: 1.8, to: 3.8, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, -5.8, 7.2, 12.5, 7.2, [
                { from: -4.6, to: -3.4, type: 'door' },
                { from: -1.4, to: 0.6, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, -2.2, 7.2, -2.2, 14.0, [
                { from: 8.2, to: 9.4, type: 'door' }
            ], INNER_T);

            addRoomLabel3D(targetGroup, 3, '303', -4.2, -10.2);
            addRoomLabel3D(targetGroup, 3, '303А', 3.5, -11.4);
            addRoomLabel3D(targetGroup, 3, '304', 10.6, -10.2);
            addRoomLabel3D(targetGroup, 3, '305', 18.2, -5.8);
            addRoomLabel3D(targetGroup, 3, '302А', -9.9, -2.0);
            addRoomLabel3D(targetGroup, 3, '302', -9.9, 7.0);
            addRoomLabel3D(targetGroup, 3, '301А', -4.0, 10.8);
            addRoomLabel3D(targetGroup, 3, '301', 5.2, 10.8);
        }

        function buildFloor2(targetGroup) {
            // На верхней внешней стене (Z = -14.0) двустворчатый выход из коридора X [4.9..6.9] ведёт в переход к Корпусу 3
            buildCommonStructure(targetGroup, 2, true, [
                { from: 4.9, to: 6.9, type: 'door' }
            ]);
            const INNER_T = 0.18;

            addWallLine(targetGroup, -10.0, -6.2, 16.0, -6.2, [
                { from: -3.8, to: -2.6, type: 'door' },
                { from: 4.6, to: 7.2, type: 'open' },
                { from: 13.0, to: 14.2, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, -5.8, -6.2, -5.8, -4.0, [
                { from: -5.6, to: -4.4, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, -0.4, -14.0, -0.4, -6.2, [], INNER_T);
            addWallLine(targetGroup, -0.4, -11.4, 4.6, -11.4, [], INNER_T);

            addWallLine(targetGroup, 4.6, -14.0, 4.6, -6.2, [
                { from: -13.1, to: -11.9, type: 'door' },
                { from: -8.2, to: -7.0, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, 1.55, -8.85, 2.05, -8.85, [], 0.14);
            addWallLine(targetGroup, 1.55, -8.35, 2.05, -8.35, [], 0.14);
            addWallLine(targetGroup, 1.55, -8.85, 1.55, -8.35, [], 0.14);
            addWallLine(targetGroup, 2.05, -8.85, 2.05, -8.35, [], 0.14);
            addWallLine(targetGroup, 3.3, -8.5, 4.6, -8.5, [], INNER_T);

            addWallLine(targetGroup, 7.2, -14.0, 7.2, -6.2, [
                { from: -13.1, to: -11.9, type: 'door' },
                { from: -8.2, to: -7.0, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, 7.2, -9.4, 16.0, -9.4, [], INNER_T);
            addWallLine(targetGroup, 12.2, -9.4, 12.2, -6.2, [], INNER_T);

            buildCorridorStepsRight(targetGroup);

            addWallLine(targetGroup, -10.0, -4.0, -5.8, -4.0, [], INNER_T);

            addWallLine(targetGroup, -5.8, -4.0, -5.8, 14.0, [
                { from: -2.0, to: -0.9, type: 'door' },
                { from: 0.6, to: 1.7, type: 'door' },
                { from: 4.5, to: 5.7, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, -14.0, -0.4, -5.8, -0.4, [], INNER_T);
            addWallLine(targetGroup, -7.6, -4.0, -7.6, -0.4, [
                { from: -2.0, to: -0.9, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, -7.6, -2.3, -5.8, -2.3, [
                { from: -7.2, to: -6.2, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, -14.0, 3.2, -5.8, 3.2, [
                { from: -10.8, to: -9.6, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, -8.2, -0.4, -8.2, 3.2, [
                { from: 0.9, to: 2.1, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, -14.0, 7.2, -5.8, 7.2, [
                { from: -7.4, to: -6.2, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, -14.0, 11.2, -11.2, 11.2, [], INNER_T);
            addWallLine(targetGroup, -9.5, 7.2, -9.5, 8.2, [], INNER_T);
            addArbitraryWallSegment(targetGroup, -9.5, 8.2, -9.5, 9.2, 0.06, true);
            addWallLine(targetGroup, -9.5, 9.2, -9.5, 9.5, [], INNER_T);
            addArbitraryWallSegment(targetGroup, -11.2, 11.2, -9.5, 9.5, INNER_T, false);

            addWallLine(targetGroup, -5.8, 7.2, 12.5, 7.2, [
                { from: -4.6, to: -3.4, type: 'door' },
                { from: -2.0, to: -0.9, type: 'door' },
                { from: 9.2, to: 10.4, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, -2.6, 7.2, -2.6, 14.0, [], INNER_T);

            addWallLine(targetGroup, -0.4, 7.2, -0.4, 9.4, [
                { from: 8.0, to: 9.1, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, -2.6, 9.4, 4.0, 9.4, [
                { from: -2.1, to: -1.0, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 1.4, 9.4, 1.4, 14.0, [], INNER_T);

            addWallLine(targetGroup, 4.0, 7.2, 4.0, 14.0, [
                { from: 11.2, to: 12.6, type: 'open' }
            ], INNER_T);

            addRoomLabel3D(targetGroup, 2, '208', -5.2, -10.2);
            addRoomLabel3D(targetGroup, 2, '210', 2.1, -12.7);
            addRoomLabel3D(targetGroup, 2, '209', 1.8, -10.0);
            addRoomLabel3D(targetGroup, 2, '211', 11.6, -11.7);
            addRoomLabel3D(targetGroup, 2, '212', 9.7, -7.8);
            addRoomLabel3D(targetGroup, 2, '213', 14.1, -7.8);
            addRoomLabel3D(targetGroup, 2, 'Переход в\nкорпус №2', 18.2, -5.8, false, true);
            addRoomLabel3D(targetGroup, 2, '207', -11.2, -2.2);
            addRoomLabel3D(targetGroup, 2, '206', -11.2, 1.4);
            addRoomLabel3D(targetGroup, 2, '204', -10.2, 5.2);
            addRoomLabel3D(targetGroup, 2, '205', -8.0, 12.2);
            addRoomLabel3D(targetGroup, 2, '203', -4.2, 11.5);
            addRoomLabel3D(targetGroup, 2, '202', -0.6, 11.8);
            addRoomLabel3D(targetGroup, 2, '201', 8.5, 11.5);
        }

        // Вспомогательная функция для отрисовки квадратных колонн (для 1 и 2 этажей)
        function buildSquareColumn(targetGroup, cx, cz, size = 0.5, thickness = 0.14) {
            const h = size / 2;
            addWallLine(targetGroup, cx - h, cz - h, cx + h, cz - h, [], thickness);
            addWallLine(targetGroup, cx - h, cz + h, cx + h, cz + h, [], thickness);
            addWallLine(targetGroup, cx - h, cz - h, cx - h, cz + h, [], thickness);
            addWallLine(targetGroup, cx + h, cz - h, cx + h, cz + h, [], thickness);
        }

        function buildFloor1(targetGroup) {
            const OUTER_T = 0.24;
            const INNER_T = 0.18;

            // 1. Плиты перекрытия 1 этажа (с полигоном под скос, чтобы пол не выпирал)
            addFloorRect(targetGroup, -10.0, -14.0, 16.0, -4.0, false);
            // Левое крыло: полигон точно повторяет скошенную наружную стену
            addFloorPolygon(targetGroup, [
                [-14.0, -4.0],
                [-5.8, -4.0],
                [-5.8, 14.0],
                [-10.5, 14.0],
                [-14.0, 10.5]
            ], false);

            addFloorRect(targetGroup, -5.8, -4.0, 16.0, 4.0, false);
            addFloorRect(targetGroup, -5.8, 4.0, 8.6, 14.0, false);
            // Правый выступ (переход)
            addFloorRect(targetGroup, 16.0, -9.5, 20.4, -2.2, false);
            // Юго-восточная входная группа и крыльцо
            addFloorRect(targetGroup, 3.6, 14.0, 8.6, 15.2, false);
            addFloorRect(targetGroup, 8.6, 4.0, 18.8, 15.2, true);

            // Тонировка ядра и лестниц
            addFloorRect(targetGroup, -1.2, -4.0, 8.6, 4.0, true);
            addFloorRect(targetGroup, 8.6, -3.8, 16.0, 3.8, true);

            // 2. Внешний периметр стен 1 этажа
            // Верхняя стена (с двустворчатым выходом из коридора 105)
            addWallLine(targetGroup, -10.0, -14.0, 16.0, -14.0, [
                { from: 4.9, to: 6.9, type: 'door' }
            ], OUTER_T);
            addWallLine(targetGroup, -10.0, -14.0, -10.0, -4.0, [], OUTER_T);
            addWallLine(targetGroup, -14.0, -4.0, -10.0, -4.0, [], OUTER_T);

            // Левая внешняя стена со скошенным юго-западным углом (пол точно под ней)
            addWallLine(targetGroup, -14.0, -4.0, -14.0, 10.5, [], OUTER_T);
            addArbitraryWallSegment(targetGroup, -14.0, 10.5, -10.5, 14.0, OUTER_T, false);
            addWallLine(targetGroup, -10.5, 14.0, 3.6, 14.0, [], OUTER_T);

            // Правая внешняя стена и правый тамбур-выступ
            addWallLine(targetGroup, 16.0, -14.0, 16.0, 4.0, [
                { from: -5.6, to: -4.0, type: 'door' }
            ], OUTER_T);
            addWallLine(targetGroup, 16.0, -9.5, 20.4, -9.5, [], OUTER_T);
            addWallLine(targetGroup, 16.0, -2.2, 20.4, -2.2, [], OUTER_T);
            addWallLine(targetGroup, 20.4, -9.5, 20.4, -2.2, [
                { from: -6.5, to: -5.1, type: 'door' }
            ], OUTER_T);

            // 3. Северный блок: 102, 106, 105, два С/У и 107 (Z [-14.0..-6.2])
            // Южная стена северного ряда вдоль главного коридора
            addWallLine(targetGroup, -10.0, -6.2, 16.0, -6.2, [
                { from: -3.8, to: -0.4, type: 'door' }, // Широкий двустворчатый вход в зал 102
                { from: 4.9, to: 6.9, type: 'door' },   // Двустворчатый вход в проходной коридор 105
                { from: 13.0, to: 14.2, type: 'door' }  // Вход в кабинет 107
            ], INNER_T);

            // Стена между 102 и 106
            addWallLine(targetGroup, 1.0, -14.0, 1.0, -6.2, [], INNER_T);

            // Стена между 106 и коридором 105 (с дверью в 106)
            addWallLine(targetGroup, 4.6, -14.0, 4.6, -6.2, [
                { from: -10.6, to: -9.4, type: 'door' }
            ], INNER_T);

            // Колонна и перегородка внутри 106
            buildSquareColumn(targetGroup, 1.8, -7.2, 0.5, 0.14);
            addWallLine(targetGroup, 3.2, -8.5, 4.6, -8.5, [], INNER_T);

            // Блок санузлов между коридором 105 и кабинетом 107 (X [7.4..11.2], Z [-14.0..-6.2])
            addWallLine(targetGroup, 7.4, -14.0, 7.4, -6.2, [
                { from: -13.6, to: -12.5, type: 'door' },
                { from: -7.7, to: -6.6, type: 'door' }
            ], INNER_T);

            addWallLine(targetGroup, 11.2, -14.0, 11.2, -6.2, [], INNER_T);

            // Внутренняя планировка верхнего и нижнего С/У
            addWallLine(targetGroup, 7.4, -10.1, 11.2, -10.1, [], INNER_T);
            addWallLine(targetGroup, 8.8, -12.4, 8.8, -7.8, [
                { from: -12.2, to: -11.3, type: 'door' },
                { from: -11.0, to: -10.2, type: 'door' },
                { from: -10.0, to: -9.1, type: 'door' },
                { from: -8.8, to: -7.9, type: 'door' }
            ], 0.12);
            addWallLine(targetGroup, 7.4, -12.4, 11.2, -12.4, [], 0.12);
            addWallLine(targetGroup, 8.8, -11.25, 11.2, -11.25, [], 0.12);
            addWallLine(targetGroup, 8.8, -8.95, 11.2, -8.95, [], 0.12);
            addWallLine(targetGroup, 7.4, -7.8, 11.2, -7.8, [], 0.12);

            // 4. Центральное ядро 1 этажа: Лифты, холл 103, кабинеты 103 и 104
            // Западная стена ядра
            addWallLine(targetGroup, -1.2, -4.0, -1.2, 4.0, [
                { from: 0.6, to: 2.2, type: 'door' }
            ], INNER_T);

            // Южная стена ядра (переход из 103 в 101)
            addWallLine(targetGroup, -1.2, 4.0, 8.6, 4.0, [
                { from: 1.5, to: 3.3, type: 'door' }
            ], INNER_T);

            // Шахты лифтов (сохранены по стояку здания)
            addWallLine(targetGroup, -0.9, -3.8, 1.4, -3.8, [], INNER_T);
            addWallLine(targetGroup, -0.9, -3.8, -0.9, -1.0, [], INNER_T);
            addWallLine(targetGroup, 1.4, -3.8, 1.4, -1.0, [], INNER_T);
            addWallLine(targetGroup, -0.9, -1.0, 1.4, -1.0, [
                { from: -0.2, to: 1.0, type: 'door' }
            ], INNER_T);
            buildElevatorShaftCross(targetGroup, -0.85, -3.7, 1.35, -1.1);

            addWallLine(targetGroup, 2.0, -3.3, 4.6, -3.3, [], INNER_T);
            addWallLine(targetGroup, 2.0, -3.3, 2.0, -1.0, [], INNER_T);
            addWallLine(targetGroup, 4.6, -3.3, 4.6, -1.0, [], INNER_T);
            addWallLine(targetGroup, 2.0, -1.0, 4.6, -1.0, [
                { from: 2.5, to: 3.7, type: 'door' }
            ], INNER_T);
            buildElevatorShaftCross(targetGroup, 2.05, -3.2, 4.55, -1.1);

            // Пилон у лифтов
            buildSquareColumn(targetGroup, 1.7, -0.8, 0.5, 0.12);

            // Кабинеты 103 (малое) и 104 строго по плану:
            // расположены между лифтами и ЛК№1, со входами из просторного холла 103
            addWallLine(targetGroup, 4.6, -3.8, 4.6, -1.0, [], INNER_T);
            addWallLine(targetGroup, 4.6, -2.4, 7.4, -2.4, [], INNER_T); // разделитель между 103 и 104
            addWallLine(targetGroup, 7.4, -3.8, 7.4, -1.0, [
                { from: -3.5, to: -2.6, type: 'door' }, // вход в 104 из холла 103
                { from: -2.2, to: -1.3, type: 'door' }  // вход в малую 103 из холла 103
            ], INNER_T);

            // 5. Лестничные клетки ЛК№1 и ЛК№2 (X [7.4..16.0], Z [-3.8..0.0])
            // Северная стена со входами из коридора 105
            addWallLine(targetGroup, 7.4, -3.8, 16.0, -3.8, [
                { from: 8.0, to: 9.4, type: 'door' },   // вход в ЛК№1
                { from: 11.2, to: 13.0, type: 'door' }  // сквозной проход через ЛК№2
            ], INNER_T);

            // Южная стена ЛК со входами из холла 103
            addWallLine(targetGroup, 7.4, 0.0, 16.0, 0.0, [
                { from: 8.0, to: 9.4, type: 'door' },   // вход в ЛК№1
                { from: 11.2, to: 13.0, type: 'door' }  // сквозной проход из холла в ЛК№2
            ], INNER_T);

            // Разделительная стена между ЛК№1 и ЛК№2
            addWallLine(targetGroup, 10.2, -3.8, 10.2, 0.0, [], INNER_T);

            // В ЛК№1 лестничный марш
            buildStaircaseUnit(targetGroup, -3.8, 0.0, -1.9, true);

            // 6. Западный зал с колоннами и южная входная группа (101 + тамбуры)
            addWallLine(targetGroup, -14.0, 0.5, -11.2, 0.5, [], INNER_T);

            // Две опорные колонны по линии X = -5.8 и нижняя перегородка
            buildSquareColumn(targetGroup, -5.8, 0.5, 0.6, INNER_T);
            buildSquareColumn(targetGroup, -5.8, 7.2, 0.6, INNER_T);
            addWallLine(targetGroup, -5.8, 7.5, -5.8, 14.0, [], INNER_T);

            // Помещение 101 под ядром (X [-0.2..8.6], Z [4.0..7.5])
            addWallLine(targetGroup, -0.2, 4.0, -0.2, 7.5, [], INNER_T);
            addWallLine(targetGroup, -0.2, 7.5, 8.6, 7.5, [
                { from: 1.5, to: 3.3, type: 'door' }
            ], INNER_T);

            // Правый выходной тамбур (X [8.6..12.5], Z [0.0..7.5])
            addWallLine(targetGroup, 8.6, 0.0, 8.6, 7.5, [
                { from: 1.2, to: 2.8, type: 'door' }  // вход из холла 103
            ], INNER_T);
            addWallLine(targetGroup, 8.6, 7.5, 12.5, 7.5, [], OUTER_T);

            // Выходная дверь из тамбура на крыльцо наружной лестницы
            addWallLine(targetGroup, 12.5, 0.0, 12.5, 7.5, [
                { from: 4.6, to: 6.6, type: 'door' }
            ], OUTER_T);

            // Двойной южный входной тамбур (X [3.6..8.6], Z [7.5..15.2])
            addWallLine(targetGroup, 3.6, 7.5, 3.6, 15.2, [
                { from: 8.2, to: 10.4, type: 'door' },
                { from: 11.8, to: 14.0, type: 'door' }
            ], INNER_T);
            addWallLine(targetGroup, 3.6, 11.2, 8.6, 11.2, [], INNER_T);
            addWallLine(targetGroup, 3.6, 15.2, 8.6, 15.2, [
                { from: 4.8, to: 7.4, type: 'door' }
            ], OUTER_T);

            // 7. Наружная входная лестница крыльца (X [12.5..18.8], Z [4.0..15.2])
            // Ограждающие стены/парапеты крыльца
            addWallLine(targetGroup, 12.5, 4.0, 18.8, 4.0, [], OUTER_T);
            addWallLine(targetGroup, 18.8, 4.0, 18.8, 15.2, [], OUTER_T);
            addWallLine(targetGroup, 12.5, 7.5, 12.5, 15.2, [], OUTER_T);

            // Ступени широкой наружной лестницы со спуском вниз на юг
            const porchStepCount = 13;
            const porchZStart = 7.5;
            const porchZEnd = 15.0;
            const porchDepth = (porchZEnd - porchZStart) / porchStepCount;
            const porchWidth = 18.8 - 12.5;
            const porchCX = (12.5 + 18.8) / 2;

            for (let i = 0; i < porchStepCount; i++) {
                const cz = porchZStart + (i + 0.5) * porchDepth;
                const ratio = ((porchStepCount - i) / porchStepCount) * 0.15;
                const geom = new THREE.BoxGeometry(porchWidth * 0.98, 1, porchDepth * 0.96);
                registerDynamicStairStep(targetGroup, geom, porchCX, cz, ratio, 0, true);
            }

            // 8. Подписи помещений 1 этажа
            addRoomLabel3D(targetGroup, 1, '102', -4.5, -10.2);
            addRoomLabel3D(targetGroup, 1, '106', 2.8, -10.2);
            addRoomLabel3D(targetGroup, 1, '105', 6.0, -10.2);
            addRoomLabel3D(targetGroup, 1, 'С/У', 9.3, -13.2, true);
            addRoomLabel3D(targetGroup, 1, 'С/У', 9.3, -7.0, true);
            addRoomLabel3D(targetGroup, 1, '107', 13.6, -10.2);
            addRoomLabel3D(targetGroup, 1, '104', 6.0, -3.1, true);
            addRoomLabel3D(targetGroup, 1, '103', 6.0, -1.7, true);
            addRoomLabel3D(targetGroup, 1, '103\n(Холл)', 3.2, 1.5, false, true);
            addRoomLabel3D(targetGroup, 1, '101', 4.2, 5.8);
            addRoomLabel3D(targetGroup, 1, 'ЛК№1', 8.8, -1.9, true);
            addRoomLabel3D(targetGroup, 1, 'ЛК№2', 12.0, -1.9, true);
        }

