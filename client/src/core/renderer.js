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
        this.camera.position.set(0, 15, 0); // Позиция над землей
        this.camera.lookAt(0, 0, 0); // Направлена вниз на игрока
        this.camera.rotation.z = Math.PI; // Разворот для правильного вида сверху
        
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
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        
        // Настройка теней
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        
        this.scene.add(directionalLight);
        this.lights.push(directionalLight);
        
        // Рассеянный свет (чтобы тени не были слишком темными)
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);
    }
    
    /**
     * Создание земли (временная поверхность для прототипа)
     */
    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
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
        
        // Добавим немного случайных объектов для демонстрации
        this.addDemoObjects();
    }
    
    /**
     * Добавление демонстрационных объектов (для прототипа)
     */
    addDemoObjects() {
        // Создаем несколько куб-контейнеров для лута
        for (let i = 0; i < 10; i++) {
            const size = 1;
            const geometry = new THREE.BoxGeometry(size, size, size);
            const material = new THREE.MeshStandardMaterial({
                color: 0x8B4513,
                roughness: 0.8
            });
            
            const box = new THREE.Mesh(geometry, material);
            
            // Случайное расположение
            const x = (Math.random() - 0.5) * 50;
            const z = (Math.random() - 0.5) * 50;
            box.position.set(x, 0, z);
            
            box.castShadow = true;
            box.receiveShadow = true;
            
            // Добавляем метаданные для идентификации как контейнер лута
            box.userData = {
                type: 'container',
                id: `container_${i}`,
                lootable: true
            };
            
            this.scene.add(box);
        }
        
        // Добавим примитивные стены для демонстрации коллизий
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 1
        });
        
        // Создаем стены по периметру
        const wallSize = 100;
        const wallHeight = 2;
        const wallThickness = 1;
        
        // Стена 1 (спереди)
        const wall1 = new THREE.Mesh(
            new THREE.BoxGeometry(wallSize, wallHeight, wallThickness),
            wallMaterial
        );
        wall1.position.set(0, wallHeight/2, wallSize/2);
        wall1.castShadow = true;
        wall1.receiveShadow = true;
        this.scene.add(wall1);
        
        // Стена 2 (сзади)
        const wall2 = new THREE.Mesh(
            new THREE.BoxGeometry(wallSize, wallHeight, wallThickness),
            wallMaterial
        );
        wall2.position.set(0, wallHeight/2, -wallSize/2);
        wall2.castShadow = true;
        wall2.receiveShadow = true;
        this.scene.add(wall2);
        
        // Стена 3 (слева)
        const wall3 = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, wallSize),
            wallMaterial
        );
        wall3.position.set(-wallSize/2, wallHeight/2, 0);
        wall3.castShadow = true;
        wall3.receiveShadow = true;
        this.scene.add(wall3);
        
        // Стена 4 (справа)
        const wall4 = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, wallSize),
            wallMaterial
        );
        wall4.position.set(wallSize/2, wallHeight/2, 0);
        wall4.castShadow = true;
        wall4.receiveShadow = true;
        this.scene.add(wall4);
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
     * Добавление NPC на сцену
     * @param {Object} npcData - данные NPC
     * @returns {THREE.Object3D} - объект NPC
     */
    addNPC(npcData) {
        // Создаем временную модель NPC (цилиндр)
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0xFF4500, // Оранжевый цвет для NPC
            roughness: 0.7
        });
        
        const npcMesh = new THREE.Mesh(geometry, material);
        npcMesh.position.copy(npcData.position);
        npcMesh.castShadow = true;
        npcMesh.receiveShadow = true;
        
        this.scene.add(npcMesh);
        
        return npcMesh;
    }
    
    /**
     * Добавление предмета на сцену
     * @param {Object} itemData - данные предмета
     * @returns {THREE.Object3D} - объект предмета
     */
    addItem(itemData) {
        let itemMesh;
        
        // В зависимости от типа предмета создаем разные модели
        switch(itemData.type) {
            case 'weapon':
                itemMesh = this.createWeaponItem(itemData);
                break;
            case 'medkit':
                itemMesh = this.createMedkitItem(itemData);
                break;
            case 'ammo':
                itemMesh = this.createAmmoItem(itemData);
                break;
            default:
                // По умолчанию - маленький куб
                const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
                const material = new THREE.MeshStandardMaterial({
                    color: 0xFFD700,
                    roughness: 0.5
                });
                itemMesh = new THREE.Mesh(geometry, material);
        }
        
        itemMesh.position.copy(itemData.position);
        itemMesh.castShadow = true;
        itemMesh.receiveShadow = true;
        
        // Добавляем метаданные
        itemMesh.userData = {
            ...itemData,
            type: 'item'
        };
        
        this.scene.add(itemMesh);
        
        return itemMesh;
    }
    
    /**
     * Создание модели оружия для отображения на земле
     * @param {Object} itemData - данные предмета
     * @returns {THREE.Object3D} - модель оружия
     */
    createWeaponItem(itemData) {
        const group = new THREE.Group();
        
        // Ствол
        const barrelGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.8);
        const barrelMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.5
        });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.z = 0.2;
        
        // Рукоятка
        const handleGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1);
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.8
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = -0.15;
        handle.position.z = -0.2;
        
        // Собираем модель
        group.add(barrel);
        group.add(handle);
        
        // Поворачиваем чтобы оружие лежало на земле
        group.rotation.x = Math.PI / 2;
        
        return group;
    }
    
    /**
     * Создание модели аптечки для отображения на земле
     * @param {Object} itemData - данные предмета
     * @returns {THREE.Object3D} - модель аптечки
     */
    createMedkitItem(itemData) {
        // Создаем аптечку (коробка с крестом)
        const boxGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.4);
        const boxMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.5
        });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        
        // Добавляем красный крест
        const crossGeometry1 = new THREE.BoxGeometry(0.3, 0.01, 0.1);
        const crossGeometry2 = new THREE.BoxGeometry(0.1, 0.01, 0.3);
        const crossMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF0000,
            roughness: 0.5
        });
        
        const crossPart1 = new THREE.Mesh(crossGeometry1, crossMaterial);
        const crossPart2 = new THREE.Mesh(crossGeometry2, crossMaterial);
        
        crossPart1.position.y = 0.11;
        crossPart2.position.y = 0.11;
        
        box.add(crossPart1);
        box.add(crossPart2);
        
        return box;
    }
    
    /**
     * Создание модели патронов для отображения на земле
     * @param {Object} itemData - данные предмета
     * @returns {THREE.Object3D} - модель патронов
     */
    createAmmoItem(itemData) {
        const group = new THREE.Group();
        
        // Создаем коробку патронов
        const boxGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.4);
        const boxMaterial = new THREE.MeshStandardMaterial({
            color: 0x556B2F,
            roughness: 0.5
        });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        
        group.add(box);
        
        return group;
    }
    
    /**
     * Обновление позиции и вращения объекта на сцене
     * @param {THREE.Object3D} object - объект для обновления
     * @param {Object} position - новая позиция
     * @param {Object} rotation - новое вращение
     */
    updateObjectTransform(object, position, rotation) {
        if (position) {
            object.position.copy(position);
        }
        
        if (rotation) {
            object.rotation.copy(rotation);
        }
    }
    
    /**
     * Обновление позиции камеры (следование за игроком)
     * @param {THREE.Vector3} targetPosition - позиция за которой следует камера
     */
    updateCamera(targetPosition) {
        if (!targetPosition) return;
        
        // Обновляем позицию камеры, чтобы следовать за игроком
        this.camera.position.x = targetPosition.x;
        this.camera.position.z = targetPosition.z + 10; // Немного позади
        this.camera.position.y = 15; // Высота над землей
        
        // Направляем камеру на игрока
        this.camera.lookAt(targetPosition);
    }
    
    /**
     * Рендеринг сцены
     */
    render() {
        if (!this.renderer || !this.scene || !this.camera) return;
        
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Загрузка модели
     * @param {string} path - путь к модели
     * @param {string} key - ключ под которым сохранить модель
     * @returns {Promise} - промис загрузки
     */
    loadModel(path, key) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.GLTFLoader();
            
            loader.load(
                path,
                (gltf) => {
                    this.models[key] = gltf;
                    resolve(gltf);
                },
                (xhr) => {
                    console.log(`${path}: ${(xhr.loaded / xhr.total) * 100}% loaded`);
                },
                (error) => {
                    console.error('Ошибка при загрузке модели:', error);
                    reject(error);
                }
            );
        });
    }
    
    /**
     * Загрузка текстуры
     * @param {string} path - путь к текстуре
     * @param {string} key - ключ под которым сохранить текстуру
     * @returns {Promise} - промис загрузки
     */
    loadTexture(path, key) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            
            loader.load(
                path,
                (texture) => {
                    this.textures[key] = texture;
                    resolve(texture);
                },
                (xhr) => {
                    console.log(`${path}: ${(xhr.loaded / xhr.total) * 100}% loaded`);
                },
                (error) => {
                    console.error('Ошибка при загрузке текстуры:', error);
                    reject(error);
                }
            );
        });
    }
}