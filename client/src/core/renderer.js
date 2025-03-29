// client/src/core/renderer.js

/**
 * Класс отвечающий за рендеринг игры с использованием Three.js
 */
export class Renderer {
    /**
     * @param {HTMLCanvasElement} canvas - DOM элемент canvas для рендеринга
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.lights = [];
        this.models = {}; // Хранилище для загруженных моделей
        this.textures = {}; // Хранилище для загруженных текстур
        
        // Элементы для системы видимости
        this.visibilitySystem = null;
        this.fogOfWarSystem = null;
        this.temporaryObjects = []; // Временные объекты (лучи, эффекты)
    }

    /**
     * Настройка сцены, камеры и рендерера
     */
    setupScene() {
        // Создание сцены
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Цвет неба
        
        // Создание камеры (перспективная, вид сверху)
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(0, 30, 30); // Позиция над землей
        this.camera.lookAt(0, 0, 0); // Направлена на игрока
        
        // Создание рендерера
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        
        // Добавление освещения
        this.setupLights();
        
        // Создание земли
        this.createGround();
        
        // Инициализация системы видимости
        this.initVisibilitySystem();
        
        // Инициализация тумана войны
        this.initFogOfWar();
        
        // Обработчик изменения размера окна
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    /**
     * Настройка освещения сцены
     */
    setupLights() {
        // Основной направленный свет (имитация солнца)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 30, 10);
        directionalLight.castShadow = true;
        
        // Настройка теней
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        
        this.scene.add(directionalLight);
        this.lights.push(directionalLight);
        
        // Рассеянный свет (чтобы тени не были слишком темными)
        const ambientLight = new THREE.AmbientLight(0x505050, 0.7);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);
    }
    
    /**
     * Создание земли (простая поверхность для прототипа)
     */
    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x3e6539, // Зеленый цвет земли
            roughness: 1,
            metalness: 0
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // Разворот плоскости горизонтально
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        
        this.scene.add(ground);
    }
    
    /**
     * Инициализация системы видимости
     */
    initVisibilitySystem() {
        // Создаем группу для системы видимости
        this.visibilitySystem = new THREE.Group();
        this.scene.add(this.visibilitySystem);
        
        // Создаем шейдерный материал для эффекта чернобелого затемнения
        const visibilityShader = {
            uniforms: {
                tDiffuse: { value: null },
                viewAngle: { value: 90.0 },
                viewDirection: { value: new THREE.Vector2(0, 1) },
                playerPosition: { value: new THREE.Vector2(0, 0) },
                screenSize: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
            },
            vertexShader: `
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float viewAngle;
                uniform vec2 viewDirection;
                uniform vec2 playerPosition;
                uniform vec2 screenSize;
                
                varying vec2 vUv;
                
                void main() {
                    vec4 texel = texture2D(tDiffuse, vUv);
                    
                    // Преобразуем UV координаты в позицию в мировом пространстве
                    vec2 worldPos = vec2(
                        (vUv.x - 0.5) * screenSize.x,
                        (vUv.y - 0.5) * screenSize.y
                    );
                    
                    // Вектор от игрока к текущей точке
                    vec2 toPixel = worldPos - playerPosition;
                    
                    // Угол между направлением взгляда и вектором к точке
                    float angleToPixel = acos(dot(normalize(toPixel), normalize(viewDirection)));
                    angleToPixel = angleToPixel * 180.0 / 3.14159265359; // переводим в градусы
                    
                    // Если точка находится в конусе видимости
                    if (angleToPixel <= viewAngle / 2.0) {
                        gl_FragColor = texel; // Видимая область (цветная)
                    } else {
                        // Невидимая область (чернобелая и затемненная)
                        float gray = dot(texel.rgb, vec3(0.299, 0.587, 0.114));
                        gl_FragColor = vec4(gray * 0.3, gray * 0.3, gray * 0.3, 1.0);
                    }
                }
            `
        };
        
        // В будущем здесь будет создание post-process эффекта с шейдером
        // Для прототипа используем упрощенную геометрическую репрезентацию
        
        // Создаем сектор видимости (конус)
        this.createVisibilityCone();
    }
    
    /**
     * Создание конуса видимости
     */
    createVisibilityCone() {
        // Создаем конус видимости
        const angle = 90; // Угол в градусах
        const radius = 50; // Радиус видимости
        
        // Создаем геометрию сектора
        const segments = 32;
        const coneGeometry = new THREE.CircleGeometry(radius, segments, -angle / 2 * (Math.PI / 180), angle * (Math.PI / 180));
        
        // Создаем материал с прозрачностью
        const coneMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.1, // Очень низкая непрозрачность
            side: THREE.DoubleSide
        });
        
        // Создаем меш и поворачиваем его для вида сверху
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.rotation.x = -Math.PI / 2;
        cone.position.y = 0.1; // Немного выше земли
        
        // Добавляем в группу видимости
        this.visibilitySystem.add(cone);
        this.visibilityCone = cone;
    }
    
    /**
     * Инициализация тумана войны
     */
    initFogOfWar() {
        // Создаем сетку для тумана войны
        const width = 1000;
        const height = 1000;
        const resolution = 100; // Количество ячеек по каждой оси
        
        const geometry = new THREE.PlaneGeometry(width, height, resolution - 1, resolution - 1);
        
        // Создаем шейдерный материал для тумана войны
        const fogOfWarMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        // Создаем меш и поворачиваем его для вида сверху
        const fogOfWar = new THREE.Mesh(geometry, fogOfWarMaterial);
        fogOfWar.rotation.x = -Math.PI / 2;
        fogOfWar.position.y = 0.2; // Немного выше земли и конуса видимости
        
        // Данные для тумана войны
        this.fogOfWarData = {
            grid: [], // Двумерный массив с информацией о посещенных областях
            width: resolution,
            height: resolution,
            mesh: fogOfWar
        };
        
        // Инициализация сетки тумана войны
        this.initFogOfWarGrid();
        
        // Добавляем туман войны в сцену
        this.scene.add(fogOfWar);
        this.fogOfWarSystem = fogOfWar;
    }
    
    /**
     * Инициализация сетки тумана войны
     */
    initFogOfWarGrid() {
        const { width, height } = this.fogOfWarData;
        
        // Инициализация двумерного массива
        for (let x = 0; x < width; x++) {
            this.fogOfWarData.grid[x] = [];
            for (let z = 0; z < height; z++) {
                // Каждая ячейка: 0 - непосещено, 1 - посещено
                this.fogOfWarData.grid[x][z] = 0;
            }
        }
        
        // Создаем геометрию для обновления вершин
        this.updateFogOfWarGeometry();
    }
    
    /**
     * Обновление геометрии тумана войны
     */
    updateFogOfWarGeometry() {
        if (!this.fogOfWarData.mesh || !this.fogOfWarData.mesh.geometry) return;
        
        const geometry = this.fogOfWarData.mesh.geometry;
        const positions = geometry.attributes.position.array;
        const colors = new Float32Array(positions.length);
        
        // Обновляем цвет каждой вершины в зависимости от значения в сетке
        for (let i = 0, j = 0; i < positions.length; i += 3, j++) {
            const x = Math.floor((j % (this.fogOfWarData.width + 1)) / this.fogOfWarData.width * this.fogOfWarData.width);
            const z = Math.floor(j / (this.fogOfWarData.width + 1) / this.fogOfWarData.height * this.fogOfWarData.height);
            
            // Получаем значение из сетки (или 0, если за пределами)
            const visited = (this.fogOfWarData.grid[x] && this.fogOfWarData.grid[x][z]) || 0;
            
            // Устанавливаем прозрачность в зависимости от посещения
            // RGB одинаковые (черный), но альфа меняется
            colors[i] = 0;
            colors[i + 1] = 0;
            colors[i + 2] = visited === 1 ? 0 : 0.7; // 0 - посещено, 0.7 - непосещено
        }
        
        // Добавляем атрибут цвета
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Обновляем материал, чтобы использовать цвета вершин
        this.fogOfWarData.mesh.material = new THREE.MeshBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.7
        });
    }
    
    /**
     * Обновление тумана войны в зависимости от позиции игрока
     * @param {Object} playerPosition - позиция игрока
     * @param {Object} viewDirection - направление взгляда
     * @param {number} viewAngle - угол обзора
     * @param {number} viewDistance - дистанция обзора
     */
    updateFogOfWar(playerPosition, viewDirection, viewAngle, viewDistance) {
        if (!this.fogOfWarData || !this.fogOfWarData.grid) return;
        
        // Преобразуем мировые координаты в координаты сетки
        const gridX = Math.floor((playerPosition.x + 500) / 1000 * this.fogOfWarData.width);
        const gridZ = Math.floor((playerPosition.z + 500) / 1000 * this.fogOfWarData.height);
        
        // Радиус видимости в ячейках сетки
        const gridRadius = Math.floor(viewDistance / 1000 * this.fogOfWarData.width);
        
        // Открываем туман войны в области видимости
        const angleInRadians = viewAngle * Math.PI / 180;
        let updated = false;
        
        // Проверяем ячейки в квадрате вокруг игрока
        for (let x = Math.max(0, gridX - gridRadius); x < Math.min(this.fogOfWarData.width, gridX + gridRadius); x++) {
            for (let z = Math.max(0, gridZ - gridRadius); z < Math.min(this.fogOfWarData.height, gridZ + gridRadius); z++) {
                // Преобразуем координаты сетки обратно в мировые
                const worldX = (x / this.fogOfWarData.width) * 1000 - 500;
                const worldZ = (z / this.fogOfWarData.height) * 1000 - 500;
                
                // Вектор от игрока до ячейки
                const dx = worldX - playerPosition.x;
                const dz = worldZ - playerPosition.z;
                
                // Расстояние до ячейки
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                // Если ячейка в радиусе видимости
                if (distance <= viewDistance) {
                    // Угол между направлением взгляда и направлением на ячейку
                    const angle = Math.atan2(dz, dx) - Math.atan2(viewDirection.z, viewDirection.x);
                    const normalizedAngle = ((angle + Math.PI) % (2 * Math.PI)) - Math.PI; // Нормализация до [-PI, PI]
                    
                    // Если ячейка в конусе видимости
                    if (Math.abs(normalizedAngle) <= angleInRadians / 2) {
                        // Проверяем, не посещена ли уже эта ячейка
                        if (this.fogOfWarData.grid[x][z] === 0) {
                            // Постепенно открываем туман войны
                            this.fogOfWarData.grid[x][z] = 0.5; // Начинаем открывать
                            updated = true;
                            
                            // Полностью открываем через некоторое время
                            setTimeout(() => {
                                this.fogOfWarData.grid[x][z] = 1; // Полностью открыто
                                this.updateFogOfWarGeometry();
                            }, 300);
                        }
                    }
                }
            }
        }
        
        // Обновляем геометрию, если были изменения
        if (updated) {
            this.updateFogOfWarGeometry();
        }
    }
    
    /**
     * Обновление конуса видимости
     * @param {Object} playerPosition - позиция игрока
     * @param {Object} viewDirection - направление взгляда
     * @param {number} viewAngle - угол обзора
     */
    updateVisibilityCone(playerPosition, viewDirection, viewAngle) {
        if (!this.visibilityCone) return;
        
        // Обновляем позицию конуса
        this.visibilityCone.position.x = playerPosition.x;
        this.visibilityCone.position.z = playerPosition.z;
        
        // Обновляем угол конуса
        const angleInRadians = viewAngle * Math.PI / 180;
        
        // Создаем новую геометрию с обновленным углом
        const radius = 50; // Радиус видимости
        const segments = 32;
        const newGeometry = new THREE.CircleGeometry(radius, segments, 0, angleInRadians);
        
        // Заменяем геометрию
        this.visibilityCone.geometry.dispose();
        this.visibilityCone.geometry = newGeometry;
        
        // Поворачиваем конус в направлении взгляда
        const angle = Math.atan2(viewDirection.x, viewDirection.z);
        this.visibilityCone.rotation.set(-Math.PI / 2, 0, -angle);
    }
    
    /**
     * Создание временного луча для визуализации выстрела
     * @param {Object} start - начальная точка луча
     * @param {Object} end - конечная точка луча
     * @param {number} color - цвет луча
     * @param {number} duration - длительность отображения в миллисекундах
     */
    createTemporaryBeam(start, end, color = 0xFF0000, duration = 100) {
        // Создаем материал для луча
        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        // Создаем геометрию
        const geometry = new THREE.BufferGeometry();
        const points = [
            new THREE.Vector3(start.x, start.y, start.z),
            new THREE.Vector3(end.x, end.y, end.z)
        ];
        geometry.setFromPoints(points);
        
        // Создаем линию
        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
        
        // Добавляем в список временных объектов
        const tempObject = {
            object: line,
            endTime: Date.now() + duration
        };
        this.temporaryObjects.push(tempObject);
        
        // Устанавливаем таймер для удаления
        setTimeout(() => {
            this.removeTemporaryObject(tempObject);
        }, duration);
    }
    
    /**
     * Удаление временного объекта
     * @param {Object} tempObject - временный объект для удаления
     */
    removeTemporaryObject(tempObject) {
        if (!tempObject || !tempObject.object) return;
        
        // Удаляем со сцены
        this.scene.remove(tempObject.object);
        
        // Удаляем из списка
        const index = this.temporaryObjects.indexOf(tempObject);
        if (index !== -1) {
            this.temporaryObjects.splice(index, 1);
        }
        
        // Освобождаем ресурсы
        if (tempObject.object.geometry) {
            tempObject.object.geometry.dispose();
        }
        if (tempObject.object.material) {
            tempObject.object.material.dispose();
        }
    }
    
    /**
     * Очистка устаревших временных объектов
     */
    cleanTemporaryObjects() {
        const now = Date.now();
        
        // Удаляем устаревшие объекты
        this.temporaryObjects = this.temporaryObjects.filter(tempObj => {
            if (tempObj.endTime <= now) {
                this.scene.remove(tempObj.object);
                
                // Освобождаем ресурсы
                if (tempObj.object.geometry) {
                    tempObj.object.geometry.dispose();
                }
                if (tempObj.object.material) {
                    tempObj.object.material.dispose();
                }
                
                return false;
            }
            return true;
        });
    }
    
    /**
     * Добавление игрока на сцену
     * @param {Object} playerData - данные игрока
     * @returns {THREE.Object3D} - объект игрока
     */
    addPlayer(playerData) {
        // Создаем временную модель игрока (цилиндр)
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0x1E90FF, // Синий цвет для игрока
            roughness: 0.7
        });
        
        const playerMesh = new THREE.Mesh(geometry, material);
        playerMesh.position.copy(playerData.position);
        playerMesh.castShadow = true;
        playerMesh.receiveShadow = true;
        
        // Добавляем оружие (временное, упрощенное)
        const weaponGeometry = new THREE.BoxGeometry(0.1, 0.1, 1);
        const weaponMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.5
        });
        
        const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
        weapon.position.set(0.5, 0, 0.5); // Позиция относительно игрока
        playerMesh.add(weapon);
        
        this.scene.add(playerMesh);
        
        return playerMesh;
    }
    
    /**
     * Обновление камеры для следования за игроком
     * @param {Object} playerPosition - текущая позиция игрока
     */
    updateCamera(playerPosition) {
        if (!this.camera) return;
        
        // Устанавливаем позицию камеры над игроком
        this.camera.position.x = playerPosition.x;
        this.camera.position.z = playerPosition.z + 30; // Немного сзади
        
        // Направляем камеру на игрока
        this.camera.lookAt(playerPosition.x, playerPosition.y, playerPosition.z);
    }
    
    /**
     * Обновление трансформации объекта
     * @param {THREE.Object3D} object - объект для обновления
     * @param {Object} position - новая позиция
     * @param {Object} rotation - новое вращение
     */
    updateObjectTransform(object, position, rotation) {
        if (!object) return;
        
        // Обновляем позицию
        if (position) {
            object.position.x = position.x;
            object.position.y = position.y;
            object.position.z = position.z;
        }
        
        // Обновляем вращение
        if (rotation) {
            object.rotation.y = rotation.y;
        }
    }
    
    /**
     * Рендеринг сцены с учетом игрока
     * @param {Object} player - объект игрока для системы видимости
     */
    render(player) {
        if (!this.renderer || !this.scene || !this.camera) return;
        
        // Обновляем систему видимости, если есть игрок
        if (player) {
            const viewDirection = player.getViewDirection();
            const viewAngle = player.getViewAngle();
            const viewDistance = player.getViewDistance();
            
            // Обновляем конус видимости
            this.updateVisibilityCone(player.position, viewDirection, viewAngle);
            
            // Обновляем туман войны
            this.updateFogOfWar(player.position, viewDirection, viewAngle, viewDistance);
        }
        
        // Очищаем устаревшие временные объекты
        this.cleanTemporaryObjects();
        
        // Рендерим сцену
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Установка качества графики
     * @param {string} quality - уровень качества ('low', 'medium', 'high')
     */
    setQuality(quality) {
        if (!this.renderer) return;
        
        switch (quality) {
            case 'low':
                this.renderer.setPixelRatio(1);
                this.renderer.shadowMap.enabled = false;
                break;
            case 'medium':
                this.renderer.setPixelRatio(window.devicePixelRatio);
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = THREE.PCFShadowMap;
                break;
            case 'high':
                this.renderer.setPixelRatio(window.devicePixelRatio);
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                break;
        }
    }
    
    /**
     * Добавление предмета на сцену
     * @param {Object} itemData - данные предмета
     * @returns {THREE.Object3D} - объект предмета
     */
    addItem(itemData) {
        // Создаем упрощенную модель предмета (в зависимости от типа)
        let geometry, material;
        
        switch (itemData.type) {
            case 'weapon':
                geometry = new THREE.BoxGeometry(0.8, 0.3, 0.2);
                material = new THREE.MeshStandardMaterial({ color: 0xFF5722 });
                break;
            case 'medkit':
                geometry = new THREE.BoxGeometry(0.5, 0.3, 0.5);
                material = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
                break;
            case 'ammo':
                geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
                material = new THREE.MeshStandardMaterial({ color: 0xFFC107 });
                break;
            default:
                geometry = new THREE.SphereGeometry(0.3, 8, 8);
                material = new THREE.MeshStandardMaterial({ color: 0xCCCCCC });
        }
        
        // Создаем меш
        const itemMesh = new THREE.Mesh(geometry, material);
        itemMesh.position.copy(itemData.position);
        itemMesh.position.y = 0.2; // Чуть выше земли
        itemMesh.castShadow = true;
        itemMesh.receiveShadow = true;
        
        // Добавляем на сцену
        this.scene.add(itemMesh);
        
        return itemMesh;
    }
    
    /**
     * Добавление NPC на сцену
     * @param {Object} npcData - данные NPC
     * @returns {THREE.Object3D} - объект NPC
     */
    addNPC(npcData) {
        // Создаем модель NPC (цилиндр)
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 8);
        const material = new THREE.MeshStandardMaterial({
            color: npcData.type === 'enemy' ? 0xFF0000 : 0x00FF00,
            roughness: 0.7
        });
        
        const npcMesh = new THREE.Mesh(geometry, material);
        npcMesh.position.copy(npcData.position);
        npcMesh.castShadow = true;
        npcMesh.receiveShadow = true;
        
        this.scene.add(npcMesh);
        
        return npcMesh;
    }
}