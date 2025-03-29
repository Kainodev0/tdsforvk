/**
 * Система визуализации конуса зрения и тумана войны в стиле Darkwood
 * Использует Rapier.js для расчета рейкастов и Three.js для отображения
 */
export class VisionSystem {
    /**
     * @param {Object} options - настройки системы визуализации
     * @param {Object} options.scene - Three.js сцена
     * @param {Object} options.world - Rapier.js мир физики
     * @param {Object} options.player - игрок, для которого отображается конус зрения
     * @param {number} options.fov - угол обзора в градусах (по умолчанию 90)
     * @param {number} options.rayCount - количество лучей (по умолчанию 60)
     * @param {number} options.maxDistance - максимальная дистанция обзора (по умолчанию 50)
     * @param {boolean} options.memoryEnabled - сохранение посещенных областей (по умолчанию true)
     * @param {boolean} options.blurEdges - размытие краев конуса зрения (по умолчанию true)
     */
    constructor(options) {
        // Проверяем наличие обязательных параметров
        if (!options.scene || !options.player) {
            console.error('VisionSystem: не указаны обязательные параметры (scene, player)');
            return;
        }

        this.scene = options.scene;
        this.world = options.world;
        this.player = options.player;
        
        // Настройки по умолчанию
        this.fov = options.fov || 90; // угол обзора в градусах
        this.rayCount = options.rayCount || 60; // количество лучей
        this.maxDistance = options.maxDistance || 50; // максимальная дистанция обзора
        this.memoryEnabled = options.memoryEnabled !== undefined ? options.memoryEnabled : true; // сохранение посещенных областей
        this.blurEdges = options.blurEdges !== undefined ? options.blurEdges : true; // размытие краев конуса зрения
        
        // Внутренние переменные
        this.visibilityMask = null; // маска для затемнения невидимых областей
        this.visibilityGroup = null; // группа для всех элементов системы видимости
        this.memoryMask = null; // маска для посещенных областей
        this.visibilityShape = null; // форма для вырезания конуса видимости
        this.memoryGrid = []; // сетка для отслеживания посещенных областей
        this.cellSize = options.cellSize || 5; // размер ячейки для карты посещенных областей
        this.gridResolution = Math.ceil(1000 / this.cellSize); // разрешение сетки для карты (1000 - размер игрового мира)
        
        // Флаг инициализации
        this.isInitialized = false;

        // Инициализация
        this.init();
    }
    
    /**
     * Инициализация системы видимости
     */
    init() {
        try {
            this.initVisibilityMask();
            
            if (this.memoryEnabled) {
                this.initMemoryMap();
            }
            
            this.isInitialized = true;
            console.log('VisionSystem: успешно инициализирована');
        } catch (error) {
            console.error('VisionSystem: ошибка при инициализации:', error);
        }
    }

    /**
     * Инициализация маски видимости
     */
    initVisibilityMask() {
        // Создаем группу для системы видимости
        this.visibilityGroup = new THREE.Group();
        this.scene.add(this.visibilityGroup);
        
        // Создаем большой черный прямоугольник, покрывающий весь мир
        const worldSize = 1000; // размер игрового мира
        const maskGeometry = new THREE.PlaneGeometry(worldSize * 1.5, worldSize * 1.5);
        const maskMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.9, // Немного увеличим непрозрачность для лучшего затемнения
            side: THREE.DoubleSide,
            depthTest: false, // отключаем тест глубины, чтобы маска всегда была видна
            depthWrite: false // отключаем запись глубины
        });
        
        this.visibilityMask = new THREE.Mesh(maskGeometry, maskMaterial);
        this.visibilityMask.rotation.x = -Math.PI / 2; // поворачиваем горизонтально
        this.visibilityMask.position.y = 0.2; // немного выше земли
        this.visibilityMask.renderOrder = 999; // рендерим маску последней
        this.visibilityGroup.add(this.visibilityMask);
        
        // Создаем форму для вырезания конуса видимости
        this.visibilityShape = new THREE.Shape();
        // Изначально пустая форма, будет обновляться в методе update
    }
    
    /**
     * Инициализация карты посещенных областей
     */
    initMemoryMap() {
        // Создаем сетку для карты посещенных областей
        this.memoryGrid = new Array(this.gridResolution);
        for (let i = 0; i < this.gridResolution; i++) {
            this.memoryGrid[i] = new Array(this.gridResolution).fill(0);
        }
        
        // Создаем маску для посещенных областей (серая полупрозрачная)
        const memoryMaskGeometry = new THREE.PlaneGeometry(1000 * 1.5, 1000 * 1.5, this.gridResolution, this.gridResolution);
        const memoryMaskMaterial = new THREE.MeshBasicMaterial({
            color: 0xAAAAAA,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false,
            vertexColors: true // включаем поддержку цветов вершин
        });
        
        this.memoryMask = new THREE.Mesh(memoryMaskGeometry, memoryMaskMaterial);
        this.memoryMask.rotation.x = -Math.PI / 2;
        this.memoryMask.position.y = 0.1; // немного ниже маски видимости
        this.memoryMask.renderOrder = 998; // рендерим перед маской видимости
        this.visibilityGroup.add(this.memoryMask);
        
        // Инициализируем цвета вершин (полностью непрозрачные)
        const colors = [];
        const positions = memoryMaskGeometry.attributes.position.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            colors.push(0, 0, 0); // RGB, полностью черный = непрозрачный
        }
        
        memoryMaskGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }
    
    /**
     * Обновление конуса видимости
     */
    update() {
        if (!this.isInitialized || !this.player || !this.world) return;
        
        try {
            // Получаем актуальные данные от игрока
            const playerPos = this.player.position;
            const direction = this.player.getViewDirection();
            // Пытаемся получить текущий угол обзора, если метод существует
            const viewAngle = typeof this.player.getViewAngle === 'function' 
                ? this.player.getViewAngle() 
                : this.fov;
            
            // Получаем мировую позицию игрока
            const origin = {
                x: playerPos.x,
                y: playerPos.y + 1.0, // на уровне "глаз" игрока
                z: playerPos.z
            };
            
            // Вычисляем направление взгляда игрока в радианах
            const directionAngle = Math.atan2(direction.x, direction.z);
            const halfFov = (viewAngle / 2) * (Math.PI / 180); // половина угла обзора в радианах
            
            // Формируем список углов для выпуска лучей
            const angles = [];
            for (let i = 0; i < this.rayCount; i++) {
                const angle = directionAngle - halfFov + (i / (this.rayCount - 1)) * 2 * halfFov;
                angles.push(angle);
            }
            
            // Вычисляем точки контура видимой области
            const points = [];
            
            // Первая точка - позиция игрока
            points.push(new THREE.Vector2(0, 0));
            
            // Выпускаем лучи и находим точки пересечения
            angles.forEach(angle => {
                // Для каждого угла получаем единичный вектор направления
                const dir = {
                    x: Math.sin(angle),
                    y: 0,  // луч идет горизонтально
                    z: Math.cos(angle)
                };
                
                // Выполняем рейкаст
                let endPoint;
                
                // Проверяем доступные методы в world
                if (typeof this.world.castRayAndGetNormal === 'function') {
                    // Новый способ рейкаста, рекомендуемый Rapier.js
                    const raycastResult = this.world.castRayAndGetNormal(
                        origin, 
                        dir, 
                        this.maxDistance, 
                        true
                    );
                    
                    const hit = raycastResult.hasHit ? raycastResult : null;
                    
                    if (hit !== null && hit.hasHit) {
                        // Луч столкнулся с препятствием
                        const hitDistance = hit.toi; // дистанция до точки столкновения
                        
                        // Немного уменьшаем дистанцию, чтобы избежать артефактов
                        const safeDistance = hitDistance * 0.99;
                        
                        // Вычисляем координаты точки пересечения
                        endPoint = {
                            x: origin.x + dir.x * safeDistance,
                            z: origin.z + dir.z * safeDistance
                        };
                    } else {
                        // Луч не встретил препятствий, берем максимальную дистанцию
                        endPoint = {
                            x: origin.x + dir.x * this.maxDistance,
                            z: origin.z + dir.z * this.maxDistance
                        };
                    }
                } else if (typeof this.world.castRay === 'function') {
                    // Старый способ рейкаста
                    const ray = new RAPIER.Ray(origin, dir);
                    const hit = this.world.castRay(ray, this.maxDistance, true);
                    
                    if (hit !== null) {
                        // Луч столкнулся с препятствием
                        const hitDistance = hit.toi * this.maxDistance * 0.99;
                        
                        // Вычисляем координаты точки пересечения
                        endPoint = {
                            x: origin.x + dir.x * hitDistance,
                            z: origin.z + dir.z * hitDistance
                        };
                    } else {
                        // Луч не встретил препятствий, берем максимальную дистанцию
                        endPoint = {
                            x: origin.x + dir.x * this.maxDistance,
                            z: origin.z + dir.z * this.maxDistance
                        };
                    }
                } else {
                    // Если методы рейкаста недоступны, просто берем максимальную дистанцию
                    console.warn('VisionSystem: методы рейкаста недоступны, используем максимальную дистанцию');
                    endPoint = {
                        x: origin.x + dir.x * this.maxDistance,
                        z: origin.z + dir.z * this.maxDistance
                    };
                }
                
                // Добавляем точку в список (относительно позиции игрока)
                points.push(new THREE.Vector2(
                    endPoint.x - origin.x,
                    endPoint.z - origin.z
                ));
                
                // Обновляем карту посещенных областей
                if (this.memoryEnabled) {
                    this.markVisitedArea(endPoint.x, endPoint.z);
                }
            });
            
            // Добавляем последнюю точку, чтобы замкнуть форму
            points.push(points[1].clone());
            
            // Создаем форму конуса видимости
            this.updateVisibilityShape(points);
            
            // Обновляем карту посещенных областей
            if (this.memoryEnabled) {
                this.updateMemoryMap();
            }
        } catch (error) {
            console.error('VisionSystem: ошибка при обновлении:', error);
        }
    }
    
    /**
     * Обновление формы видимости
     * @param {Array} points - точки контура видимой области
     */
    updateVisibilityShape(points) {
        // Проверяем валидность точек
        if (!points || points.length < 3) {
            console.warn('VisionSystem: недостаточно точек для создания формы видимости');
            return;
        }
        
        try {
            // Создаем новую форму
            const shape = new THREE.Shape();
            
            // Перемещаемся в первую точку
            shape.moveTo(points[0].x, points[0].y);
            
            // Добавляем остальные точки
            for (let i = 1; i < points.length; i++) {
                shape.lineTo(points[i].x, points[i].y);
            }
            
            // Создаем внешний контур (большой прямоугольник)
            const worldSize = this.maxDistance * 2;
            const outerShape = new THREE.Shape();
            outerShape.moveTo(-worldSize, -worldSize);
            outerShape.lineTo(worldSize, -worldSize);
            outerShape.lineTo(worldSize, worldSize);
            outerShape.lineTo(-worldSize, worldSize);
            outerShape.lineTo(-worldSize, -worldSize);
            
            // Вырезаем конус видимости из внешнего контура
            outerShape.holes.push(shape);
            
            // Обновляем геометрию маски
            if (this.visibilityMask) {
                // Удаляем старую геометрию
                if (this.visibilityMask.geometry) {
                    this.visibilityMask.geometry.dispose();
                }
                
                // Создаем новую геометрию
                this.visibilityMask.geometry = new THREE.ShapeGeometry(outerShape);
                
                // Перемещаем маску в позицию игрока
                const playerPos = this.player.position;
                this.visibilityMask.position.set(playerPos.x, 0.2, playerPos.z);
            }
        } catch (error) {
            console.error('VisionSystem: ошибка при обновлении формы видимости:', error);
        }
    }
    
    /**
     * Отметка посещенной области на карте
     * @param {Number} x - координата X
     * @param {Number} z - координата Z
     */
    markVisitedArea(x, z) {
        // Преобразуем мировые координаты в координаты сетки
        const gridX = Math.floor((x + 500) / this.cellSize);
        const gridZ = Math.floor((z + 500) / this.cellSize);
        
        // Проверяем, что координаты находятся в пределах сетки
        if (gridX >= 0 && gridX < this.gridResolution && gridZ >= 0 && gridZ < this.gridResolution) {
            // Отмечаем ячейку как посещенную
            this.memoryGrid[gridX][gridZ] = 1;
            
            // Отмечаем соседние ячейки для плавного перехода
            for (let dx = -1; dx <= 1; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const nx = gridX + dx;
                    const nz = gridZ + dz;
                    
                    if (nx >= 0 && nx < this.gridResolution && nz >= 0 && nz < this.gridResolution) {
                        // Устанавливаем значение не меньше 0.7 для соседних ячеек
                        this.memoryGrid[nx][nz] = Math.max(this.memoryGrid[nx][nz], 0.7);
                    }
                }
            }
        }
    }
    
    /**
     * Обновление карты посещенных областей
     */
    updateMemoryMap() {
        if (!this.memoryEnabled || !this.memoryMask) return;
        
        try {
            // Получаем текущую геометрию
            const geometry = this.memoryMask.geometry;
            
            // Получаем атрибут цвета
            let colors = geometry.attributes.color;
            
            // Если атрибут не существует, создаем его
            if (!colors) {
                const positions = geometry.attributes.position.array;
                const colorsArray = new Float32Array(positions.length);
                colors = new THREE.BufferAttribute(colorsArray, 3);
                geometry.setAttribute('color', colors);
            }
            
            // Обновляем цвета вершин на основе карты посещенных областей
            const positions = geometry.attributes.position.array;
            
            for (let i = 0, j = 0; i < positions.length; i += 3, j++) {
                // Получаем координаты вершины
                const x = positions[i];
                const z = positions[i + 2];
                
                // Преобразуем мировые координаты в координаты сетки
                const gridX = Math.floor((x + 500) / this.cellSize);
                const gridZ = Math.floor((z + 500) / this.cellSize);
                
                // Проверяем, что координаты находятся в пределах сетки
                if (gridX >= 0 && gridX < this.gridResolution && gridZ >= 0 && gridZ < this.gridResolution) {
                    // Получаем значение ячейки (0 - не посещена, 1 - посещена)
                    const visited = this.memoryGrid[gridX][gridZ];
                    
                    // Устанавливаем цвет вершины
                    colors.array[i] = visited;     // R (0-1)
                    colors.array[i + 1] = visited; // G (0-1)
                    colors.array[i + 2] = visited; // B (0-1)
                }
            }
            
            // Отмечаем атрибут цвета как требующий обновления
            colors.needsUpdate = true;
        } catch (error) {
            console.error('VisionSystem: ошибка при обновлении карты посещенных областей:', error);
        }
    }
    
    /**
     * Очистка ресурсов системы
     */
    dispose() {
        try {
            // Удаляем маску видимости
            if (this.visibilityMask) {
                if (this.visibilityMask.geometry) {
                    this.visibilityMask.geometry.dispose();
                }
                if (this.visibilityMask.material) {
                    this.visibilityMask.material.dispose();
                }
                this.visibilityGroup.remove(this.visibilityMask);
            }
            
            // Удаляем маску посещенных областей
            if (this.memoryMask) {
                if (this.memoryMask.geometry) {
                    this.memoryMask.geometry.dispose();
                }
                if (this.memoryMask.material) {
                    this.memoryMask.material.dispose();
                }
                this.visibilityGroup.remove(this.memoryMask);
            }
            
            // Удаляем группу видимости
            if (this.visibilityGroup) {
                this.scene.remove(this.visibilityGroup);
            }
            
            // Сбрасываем переменные
            this.visibilityMask = null;
            this.memoryMask = null;
            this.visibilityGroup = null;
            this.memoryGrid = [];
            this.isInitialized = false;
            
            console.log('VisionSystem: ресурсы успешно освобождены');
        } catch (error) {
            console.error('VisionSystem: ошибка при освобождении ресурсов:', error);
        }
    }
}