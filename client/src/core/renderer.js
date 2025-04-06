// client/src/core/renderer.js
import * as THREE from 'three'; // Убедитесь, что импорт Three.js есть
import { GeometryValidator } from '../utils/geometry-validator.js';

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
        this.visionSystem = null;
        this.temporaryObjects = []; // Временные объекты (лучи, эффекты)
        
        // Флаг для оптимизации валидации
        this.needsValidation = true;
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
        
        // Инициализируем пустой объект для системы видимости
        // Она будет инициализирована позже в Game.initVisionSystem()
        this.visionSystem = null;
        
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
    
        // Устанавливаем флаг для валидации
        this.needsValidation = true;
    
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
    
    // Валидация геометрии сцены только если необходимо
    if (this.needsValidation) {
        GeometryValidator.validateScene(this.scene);
        this.needsValidation = false;
    }
    
    // Обновляем систему видимости, если она инициализирована и есть игрок
    if (this.visionSystem && player) {
        this.visionSystem.update();
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
    
        // Устанавливаем флаг для валидации
        this.needsValidation = true;
    
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
    
        // Устанавливаем флаг для валидации
        this.needsValidation = true;
    
        return npcMesh;
    }
}