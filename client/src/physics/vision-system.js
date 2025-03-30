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
     * @param {number} options.rayCount - количество лучей (по умолчанию 50)
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
        this.fov = options.fov !== undefined ? options.fov : 90; // угол обзора в градусах
        this.rayCount = options.rayCount || 50; // количество лучей
        this.maxDistance = options.maxDistance || 50; // максимальная дистанция обзора
        this.memoryEnabled = options.memoryEnabled !== undefined ? options.memoryEnabled : true; // сохранение посещенных областей
        this.blurEdges = options.blurEdges !== undefined ? options.blurEdges : true; // размытие краев конуса зрения
        
        // Константы для динамической настройки угла обзора
        this.normalFov = 90; // нормальный угол обзора в градусах
        this.aimingFov = 45; // угол обзора при прицеливании
        this.runningFov = 70; // угол обзора при беге
        
        // Внутренние переменные
        this.visibilityMask = null; // маска для затемнения невидимых областей
        this.memoryMask = null; // маска для посещенных областей
        this.visibilityShape = null; // форма для вырезания конуса видимости
        this.currentVisionMesh = null; // текущая область конуса видимости
        
        // Для хранения информации о посещенных зонах
        this.cellSize = options.cellSize || 5; // размер ячейки для карты посещенных областей
        this.gridSize = 1000; // размер игрового мира
        this.gridResolution = Math.ceil(this.gridSize / this.cellSize); // разрешение сетки
        this.memoryGrid = new Array(this.gridResolution); // сетка посещенных областей
        
        // Инициализация сетки памяти
        for (let i = 0; i < this.gridResolution; i++) {
            this.memoryGrid[i] = new Array(this.gridResolution).fill(0);
        }
        
        // Группа для всех элементов системы видимости
        this.visibilityGroup = new THREE.Group();
        this.scene.add(this.visibilityGroup);
        
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
            console.log('VisionSystem: начало инициализации...');
            
            // Создаем слои видимости
            this.initVisibilityLayers();
            
            this.isInitialized = true;
            console.log('VisionSystem: успешно инициализирована');
        } catch (error) {
            console.error('VisionSystem: ошибка при инициализации:', error);
        }
    }

    /**
     * Инициализация слоев видимости
     */
    initVisibilityLayers() {
        // 1. Создаем слой тумана войны (полностью закрывает карту)
        this.createFogOfWarLayer();
        
        // 2. Создаем слой памяти (посещенные области в черно-белом)
        this.createMemoryLayer();
        
        // 3. Создаем слой текущей видимости (конус зрения)
        this.createVisionConeLayer();
    }
    
    /**
     * Создание слоя тумана войны
     */
    createFogOfWarLayer() {
        // Создаем большой черный прямоугольник, покрывающий весь мир
        const fogGeometry = new THREE.PlaneGeometry(this.gridSize * 1.5, this.gridSize * 1.5);
        const fogMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.95,
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false
        });
        
        this.fogOfWarMesh = new THREE.Mesh(fogGeometry, fogMaterial);
        this.fogOfWarMesh.rotation.x = -Math.PI / 2; // горизонтально
        this.fogOfWarMesh.position.y = 0.3; // немного выше остальных слоев
        this.fogOfWarMesh.renderOrder = 997; // рендерим под остальными слоями
        this.visibilityGroup.add(this.fogOfWarMesh);
    }
    
    /**
     * Создание слоя памяти (посещенные области)
     */
    createMemoryLayer() {
        // Создаем сетку для отображения посещенных областей
        const gridGeometry = new THREE.PlaneGeometry(
            this.gridSize * 1.5, 
            this.gridSize * 1.5,
            this.gridResolution,
            this.gridResolution
        );
        
        // Материал для посещенных областей (чёрно-белый)
        const memoryMaterial = new THREE.ShaderMaterial({
            uniforms: {
                opacity: { value: 0.7 },
                colorInfluence: { value: 0.2 } // насколько сильно сохраняется цвет (0 = полностью ЧБ, 1 = цветной)
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float opacity;
                uniform float colorInfluence;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    // В реальной реализации здесь будет использоваться текстура с рендера сцены
                    // Для прототипа просто делаем ЧБ эффект
                    gl_FragColor = vec4(0.3, 0.3, 0.3, opacity);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false
        });
        
        this.memoryMesh = new THREE.Mesh(gridGeometry, memoryMaterial);
        this.memoryMesh.rotation.x = -Math.PI / 2; // горизонтально
        this.memoryMesh.position.y = 0.2; // выше земли, но ниже тумана
        this.memoryMesh.renderOrder = 998; // рендерим между туманом и конусом видимости
        this.visibilityGroup.add(this.memoryMesh);
        
        // Создаем атрибут видимости для вершин
        const visibilityAttribute = new Float32Array(gridGeometry.attributes.position.count);
        for (let i = 0; i < visibilityAttribute.length; i++) {
            visibilityAttribute[i] = 0.0; // изначально все вершины невидимы
        }
        
        gridGeometry.setAttribute('visibility', new THREE.BufferAttribute(visibilityAttribute, 1));
    }
    
    /**
     * Создание слоя конуса видимости
     */
    createVisionConeLayer() {
        // Создаем базовую геометрию (будет обновляться каждый кадр)
        const initialShape = new THREE.Shape();
        initialShape.moveTo(0, 0);
        initialShape.lineTo(5, 5);
        initialShape.lineTo(-5, 5);
        initialShape.lineTo(0, 0);
        
        // Маска для затемнения невидимых областей
        const maskMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
            depthTest: false,
            depthWrite: false
        });
        
        // Создаем пустую маску (будет обновляться каждый кадр)
        const worldSize = this.gridSize * 1.5;
        const maskGeometry = new THREE.PlaneGeometry(worldSize, worldSize);
        this.visibilityMask = new THREE.Mesh(maskGeometry, maskMaterial);
        this.visibilityMask.rotation.x = -Math.PI / 2; // горизонтально
        this.visibilityMask.position.y = 0.1; // ниже всех остальных слоёв
        this.visibilityMask.renderOrder = 999; // рендерим последним
        this.visibilityGroup.add(this.visibilityMask);
    }
    
    /**
     * Обновление конуса видимости
     */
    update() {
        if (!this.isInitialized || !this.player || !this.world) return;
        
        try {
            // Получаем актуальные данные от игрока
            const playerPos = this.player.position;
            let playerDirection = { x: 0, z: -1 }; // направление по умолчанию
            
            // Пытаемся получить текущее направление взгляда, если метод существует
            if (typeof this.player.getViewDirection === 'function') {
                playerDirection = this.player.getViewDirection();
            }
            
            // Определяем текущий угол обзора в зависимости от состояния игрока
            let currentFov = this.normalFov;
            if (this.player.isAiming) {
                currentFov = this.aimingFov;
            } else if (this.player.isRunning) {
                currentFov = this.runningFov;
            }
            // Преобразуем угол из градусов в радианы
            const fovRadians = (currentFov * Math.PI) / 180;
            
            // Вычисляем направление взгляда игрока в радианах
            const directionAngle = Math.atan2(playerDirection.x, playerDirection.z);
            
            // Обновляем маску видимости
            this.updateVisionMask(playerPos, directionAngle, fovRadians);
            
            // Обновляем карту памяти
            if (this.memoryEnabled) {
                this.updateMemoryMap(playerPos, directionAngle, fovRadians);
            }
        } catch (error) {
            console.error('VisionSystem: ошибка при обновлении:', error);
        }
    }
    
    /**
     * Обновление маски видимости (конуса зрения)
     * @param {Object} playerPos - позиция игрока
     * @param {number} directionAngle - угол направления взгляда в радианах
     * @param {number} fovRadians - угол обзора в радианах
     */
    updateVisionMask(playerPos, directionAngle, fovRadians) {
        // Половина угла обзора
        const halfFov = fovRadians / 2;
        
        // Определяем точку старта лучей
        const origin = {
            x: playerPos.x,
            y: playerPos.y + 1.0, // на уровне "глаз" игрока
            z: playerPos.z
        };
        
        // Формируем список углов для выпуска лучей
        const angles = [];
        for (let i = 0; i < this.rayCount; i++) {
            const angle = directionAngle - halfFov + (i / (this.rayCount - 1)) * fovRadians;
            angles.push(angle);
        }
        
        // Вычисляем точки контура видимой области
        const points = [];
        
        // Добавляем первую точку - позиция игрока
        points.push(new THREE.Vector2(0, 0));
        
        // Выпускаем лучи и находим точки пересечения
        angles.forEach(angle => {
            // Единичный вектор направления в горизонтальной плоскости
            const dir = {
                x: Math.sin(angle),
                y: 0,
                z: Math.cos(angle)
            };
            
            // Выполняем рейкаст
            let endPoint;
            
            if (this.world && typeof this.world.castRay === 'function') {
                // Создаем луч Rapier
                const ray = new RAPIER.Ray(origin, dir);
                // Выполняем рейкаст в физическом мире
                const hit = this.world.castRay(ray, this.maxDistance, true);
                
                if (hit !== null) {
                    // Луч столкнулся с препятствием
                    const hitDist = hit.toi; // time of impact
                    const impactDistance = hitDist * this.maxDistance * 0.99;
                    
                    // Конечная точка чуть ближе точки столкновения
                    endPoint = {
                        x: origin.x + dir.x * impactDistance,
                        z: origin.z + dir.z * impactDistance
                    };
                } else {
                    // Луч не встретил препятствий
                    endPoint = {
                        x: origin.x + dir.x * this.maxDistance,
                        z: origin.z + dir.z * this.maxDistance
                    };
                }
            } else if (this.world && typeof this.world.castRayAndGetNormal === 'function') {
                // Альтернативный метод рейкастинга
                const raycastResult = this.world.castRayAndGetNormal(
                    origin, 
                    dir, 
                    this.maxDistance, 
                    true
                );
                
                const hit = raycastResult.hasHit ? raycastResult : null;
                
                if (hit !== null && hit.hasHit) {
                    const hitDistance = hit.toi;
                    const safeDistance = hitDistance * 0.99;
                    
                    endPoint = {
                        x: origin.x + dir.x * safeDistance,
                        z: origin.z + dir.z * safeDistance
                    };
                } else {
                    endPoint = {
                        x: origin.x + dir.x * this.maxDistance,
                        z: origin.z + dir.z * this.maxDistance
                    };
                }
            } else {
                // Если рейкастинг недоступен, используем максимальную дистанцию
                endPoint = {
                    x: origin.x + dir.x * this.maxDistance,
                    z: origin.z + dir.z * this.maxDistance
                };
            }
            
            // Добавляем точку в список
            points.push(new THREE.Vector2(
                endPoint.x - origin.x,
                endPoint.z - origin.z
            ));
            
            // Отмечаем область как посещенную
            if (this.memoryEnabled) {
                this.markVisitedArea(endPoint.x, endPoint.z);
            }
        });
        
        // Добавляем последнюю точку, замыкающую форму
        points.push(points[1].clone());
        
        // Создаем форму конуса видимости
        this.updateVisibilityShape(points, playerPos);
    }
    
    /**
     * Обновление формы видимости
     * @param {Array} points - точки контура видимой области
     * @param {Object} playerPos - позиция игрока
     */
    updateVisibilityShape(points, playerPos) {
        // Проверяем валидность точек
        if (!points || points.length < 3) {
            console.warn('VisionSystem: недостаточно точек для создания формы видимости');
            return;
        }
        
        try {
            // Создаем форму конуса видимости
            const shape = new THREE.Shape();
            shape.moveTo(points[0].x, points[0].y);
            
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
            
            // Вырезаем форму конуса
            outerShape.holes.push(shape);
            
            // Обновляем геометрию маски
            if (this.visibilityMask) {
                // Удаляем старую геометрию
                if (this.visibilityMask.geometry) {
                    this.visibilityMask.geometry.dispose();
                }
                
                // Создаем новую геометрию
                this.visibilityMask.geometry = new THREE.ShapeGeometry(outerShape);
                
                // Перемещаем в позицию игрока
                this.visibilityMask.position.set(playerPos.x, 0.1, playerPos.z);
            }
        } catch (error) {
            console.error('VisionSystem: ошибка при обновлении формы видимости:', error);
        }
    }
    
    /**
     * Отметка области как посещенной
     * @param {number} x - координата X в мировом пространстве
     * @param {number} z - координата Z в мировом пространстве
     */
    markVisitedArea(x, z) {
        // Преобразуем мировые координаты в координаты сетки
        const halfGridSize = this.gridSize / 2;
        const gridX = Math.floor((x + halfGridSize) / this.cellSize);
        const gridZ = Math.floor((z + halfGridSize) / this.cellSize);
        
        // Проверяем, что координаты внутри сетки
        if (gridX >= 0 && gridX < this.gridResolution && 
            gridZ >= 0 && gridZ < this.gridResolution) {
            
            // Отмечаем область как посещенную
            this.memoryGrid[gridX][gridZ] = 1;
            
            // Отмечаем соседние ячейки для плавного перехода
            const radius = 1; // радиус влияния в ячейках сетки
            
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dz = -radius; dz <= radius; dz++) {
                    const nx = gridX + dx;
                    const nz = gridZ + dz;
                    
                    if (nx >= 0 && nx < this.gridResolution && 
                        nz >= 0 && nz < this.gridResolution) {
                        
                        // Устанавливаем значение не меньше 0.7 для соседних ячеек
                        this.memoryGrid[nx][nz] = Math.max(this.memoryGrid[nx][nz], 0.7);
                    }
                }
            }
        }
    }
    
    /**
     * Обновление карты памяти
     * @param {Object} playerPos - позиция игрока
     * @param {number} directionAngle - угол направления взгляда
     * @param {number} fovRadians - угол обзора в радианах
     */
    updateMemoryMap(playerPos, directionAngle, fovRadians) {
        if (!this.memoryEnabled || !this.memoryMesh) return;
        
        try {
            // Обновляем сетку памяти на маске тумана войны
            if (this.fogOfWarMesh && this.fogOfWarMesh.material) {
                // Здесь обычно используется шейдер или другой метод для 
                // обновления маски на основе сетки памяти
                
                // В этой реализации для простоты мы просто накладываем
                // маску поверх тех областей, которые не посещены

                // Обновляем непрозрачность маски памяти в зависимости от стейта
                // В полной реализации здесь было бы обновление шейдера
                
                // Дополнительное: создание отверстий в тумане войны на основе сетки памяти
                // Создаем геометрию для вырезания посещенных областей из тумана войны
                // (Для прототипа не реализуем полностью)
            }

            // В полной реализации здесь было бы обновление шейдера
            // на основе карты посещенных областей
        } catch (error) {
            console.error('VisionSystem: ошибка при обновлении карты памяти:', error);
        }
    }
    
    /**
     * Изменение угла обзора
     * @param {number} fov - новый угол обзора в градусах
     */
    setFov(fov) {
        this.fov = fov;
    }
    
    /**
     * Изменение максимальной дистанции видимости
     * @param {number} distance - новая максимальная дистанция
     */
    setMaxDistance(distance) {
        this.maxDistance = distance;
    }
    
    /**
     * Изменение количества лучей
     * @param {number} count - новое количество лучей
     */
    setRayCount(count) {
        this.rayCount = count;
    }
    
    /**
     * Очистка карты памяти (сброс посещенных областей)
     */
    clearMemory() {
        if (!this.memoryEnabled) return;
        
        // Сбрасываем сетку памяти
        for (let i = 0; i < this.gridResolution; i++) {
            for (let j = 0; j < this.gridResolution; j++) {
                this.memoryGrid[i][j] = 0;
            }
        }
        
        console.log('VisionSystem: карта памяти очищена');
    }
    
    /**
     * Освобождение ресурсов системы
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
            
            // Удаляем маску памяти
            if (this.memoryMesh) {
                if (this.memoryMesh.geometry) {
                    this.memoryMesh.geometry.dispose();
                }
                if (this.memoryMesh.material) {
                    this.memoryMesh.material.dispose();
                }
                this.visibilityGroup.remove(this.memoryMesh);
            }
            
            // Удаляем маску тумана войны
            if (this.fogOfWarMesh) {
                if (this.fogOfWarMesh.geometry) {
                    this.fogOfWarMesh.geometry.dispose();
                }
                if (this.fogOfWarMesh.material) {
                    this.fogOfWarMesh.material.dispose();
                }
                this.visibilityGroup.remove(this.fogOfWarMesh);
            }
            
            // Удаляем группу видимости
            if (this.visibilityGroup) {
                this.scene.remove(this.visibilityGroup);
            }
            
            // Сбрасываем переменные
            this.visibilityMask = null;
            this.memoryMesh = null;
            this.fogOfWarMesh = null;
            this.visibilityGroup = null;
            this.memoryGrid = [];
            this.isInitialized = false;
            
            console.log('VisionSystem: ресурсы успешно освобождены');
        } catch (error) {
            console.error('VisionSystem: ошибка при освобождении ресурсов:', error);
        }
    }
}