// client/src/core/game.js

// Импорт основных модулей
import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';
import { NetworkManager } from './network.js';
import { Player } from '../entities/player.js';
import { HUD } from '../ui/hud.js';
import { InventoryUI } from '../ui/inventory.js';
import { PhysicsManager } from '../physics/physics-manager.js';
import { VisionSystem } from '../physics/vision-system.js';

/**
 * Основной класс игры, управляющий всеми компонентами
 */
class Game {
    constructor() {
        this.isRunning = false;
        this.isLoading = true;
        this.currentScene = 'loading'; // loading, menu, game
        
        // Элементы DOM
        this.loadingScreen = document.getElementById('loading-screen');
        this.mainMenu = document.getElementById('main-menu');
        this.gameCanvas = document.getElementById('game-canvas');
        this.hudElement = document.getElementById('hud');
        this.inventoryScreen = document.getElementById('inventory-screen');
        
        // Инициализация основных модулей
        this.renderer = new Renderer(this.gameCanvas);
        this.input = new InputHandler();
        this.network = new NetworkManager();
        this.physics = new PhysicsManager();
        
        // Состояние игры
        this.player = null;
        this.entities = [];
        this.ui = {
            hud: new HUD(this.hudElement),
            inventory: new InventoryUI(this.inventoryScreen)
        };
        
        // Игровой таймер и физика
        this.gameTime = 0;
        this.physicsUpdateRate = 1/60; // 60 обновлений физики в секунду
        this.physicsAccumulator = 0;
        
        // Параметры видимости
        this.fogOfWarEnabled = true;
        this.visibilitySystemEnabled = true;
        
        // Привязка контекста this к методам
        this.update = this.update.bind(this);
        this.fixedUpdate = this.fixedUpdate.bind(this);
        this.startGame = this.startGame.bind(this);
        
        // Настройка обработчиков событий
        this.setupEventListeners();
        
        // Запуск игрового цикла
        this.lastFrameTime = 0;
        
        // Инициализация загрузки ресурсов
        this.loadResources().then(() => {
            this.showMainMenu();
        });
    }
    
    /**
     * Загрузка игровых ресурсов
     */
    async loadResources() {
        // Инициализируем физику
        const physicsInitialized = await this.physics.init();
        if (!physicsInitialized) {
            console.error('Не удалось инициализировать физику');
        }
        
        // В реальной игре здесь будет загрузка моделей, текстур и т.д.
        return new Promise(resolve => {
            // Имитация загрузки (в реальной игре здесь будет загрузка assets)
            setTimeout(() => {
                console.log('Ресурсы загружены');
                this.isLoading = false;
                resolve();
            }, 2000);
        });
    }
    
    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        // Обработчики для главного меню
        document.getElementById('start-game').addEventListener('click', this.startGame);
        document.getElementById('settings').addEventListener('click', () => {
            console.log('Настройки');
            // В будущем здесь будет открытие меню настроек
        });
        
        // Обработчик для закрытия инвентаря
        document.getElementById('close-inventory').addEventListener('click', () => {
            this.hideInventory();
        });
        
        // Обработчики клавиш
        this.input.addKeyCallback('KeyI', () => {
            if (this.currentScene === 'game') {
                this.toggleInventory();
            }
        });
        
        // Обработчик ESC для паузы
        this.input.addKeyCallback('Escape', () => {
            if (this.currentScene === 'game') {
                this.togglePause();
            }
        });
        
        // Интеграция с VK (если доступно)
        if (window.vkBridge) {
            try {
                window.vkBridge.send('VKWebAppInit');
                console.log('VK Bridge initialized');
            } catch (e) {
                console.error('Error initializing VK Bridge:', e);
            }
        }
        
        // Обработчик изменения размера окна
        window.addEventListener('resize', () => {
            if (this.renderer) {
                // Перерисовываем сцену при изменении размера окна
                this.renderer.render(this.player);
            }
        });
    }
    
    /**
     * Показать главное меню
     */
    showMainMenu() {
        this.loadingScreen.classList.add('hidden');
        this.mainMenu.classList.remove('hidden');
        this.currentScene = 'menu';
    }
    
    /**
     * Начать игру
     */
    startGame() {
        this.mainMenu.classList.add('hidden');
        this.gameCanvas.classList.remove('hidden');
        this.hudElement.classList.remove('hidden');
        
        this.isRunning = true;
        this.currentScene = 'game';
        
        // Инициализация сцены
        this.renderer.setupScene();
        
        // Создание тестовых стен для демонстрации системы видимости
        this.createTestWalls();
        
        // Создание игрока
        this.player = new Player({
            position: { x: 0, y: 0, z: 0 },
            renderer: this.renderer,
            input: this.input,
            game: this
        });
        
        // Инициализация системы видимости
        this.initVisionSystem();
        
        // Подключение к серверу (в прототипе локально)
        this.network.connect().then(() => {
            console.log('Подключено к серверу');
            // В прототипе не будем подключаться к реальному серверу
        }).catch(error => {
            console.error('Ошибка подключения:', error);
            // Локальный режим для прототипа
        });
        
        // Запуск игрового цикла
        this.lastFrameTime = performance.now();
        requestAnimationFrame(this.update);
    }
    
    /**
     * Метод для инициализации системы видимости
     */
    initVisionSystem() {
        if (!this.renderer || !this.renderer.scene || !this.player) return;
        
        // Создаем систему видимости
        const visionSystem = new VisionSystem({
            scene: this.renderer.scene,
            world: this.physics.getWorld(),
            player: this.player,
            fov: 90, // Начальный угол обзора
            rayCount: 60, // Количество лучей
            maxDistance: 50, // Максимальная дистанция видимости
            memoryEnabled: true, // Запоминать посещенные области
            blurEdges: true // Размытие краев видимости
        });
        
        // Сохраняем систему видимости в рендерере
        this.renderer.visionSystem = visionSystem;
        
        console.log('Система видимости инициализирована');
    }
    
    /**
     * Метод для создания тестовых стен
     */
    createTestWalls() {
        if (!this.physics || !this.physics.isReady() || !this.renderer || !this.renderer.scene) {
            console.error('Физика или рендерер не готовы для создания стен');
            return;
        }
        
        // Создаем материал для стен
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.7,
            metalness: 0.2
        });
        
        // Функция для создания стены
        const createWall = (x, z, width, depth, height = 3) => {
            // Создаем геометрию
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const mesh = new THREE.Mesh(geometry, wallMaterial);
            
            // Устанавливаем позицию
            mesh.position.set(x, height / 2, z);
            
            // Добавляем на сцену
            this.renderer.scene.add(mesh);
            
            // Создаем физический коллайдер
            this.physics.createObstacle({
                position: { x, y: height / 2, z },
                size: { x: width, y: height, z: depth },
                object: mesh
            });
            
            return mesh;
        };
        
        // Создаем стены лабиринта
        // Горизонтальные стены
        createWall(0, -20, 40, 1);
        createWall(-20, 0, 1, 40);
        createWall(20, 0, 1, 40);
        createWall(0, 20, 40, 1);
        
        // Внутренние стены
        createWall(-10, -10, 1, 20);
        createWall(10, 10, 20, 1);
        createWall(10, -5, 1, 10);
        createWall(-5, 5, 10, 1);
        
        // Препятствия
        createWall(-15, -15, 3, 3);
        createWall(15, -15, 3, 3);
        createWall(15, 15, 3, 3);
        createWall(-15, 15, 3, 3);
        
        console.log('Тестовые стены созданы');
    }
    
    /**
     * Переключение состояния паузы
     */
    togglePause() {
        if (this.isRunning) {
            this.pauseGame();
        } else {
            this.resumeGame();
        }
    }
    
    /**
     * Остановить игру (пауза)
     */
    pauseGame() {
        this.isRunning = false;
        this.input.disableGameControls();
        
        // Здесь можно добавить отображение меню паузы
        console.log('Игра на паузе');
    }
    
    /**
     * Возобновить игру
     */
    resumeGame() {
        this.isRunning = true;
        this.input.enableGameControls();
        
        // Скрываем меню паузы
        console.log('Игра возобновлена');
        
        // Перезапускаем игровой цикл
        this.lastFrameTime = performance.now();
        requestAnimationFrame(this.update);
    }
    
    /**
     * Обновление с фиксированным шагом для физики
     * @param {number} deltaTime - фиксированный шаг времени 
     */
    fixedUpdate(deltaTime) {
        // Обновляем физику на стороне сервера (в прототипе не используется)
        if (this.network && this.network.isConnected) {
            // Отправка состояния на сервер
        }
        
        // Обновляем состояние сущностей (NPC и др.)
        this.entities.forEach(entity => {
            if (entity.fixedUpdate) {
                entity.fixedUpdate(deltaTime);
            }
        });
    }
    
    /**
     * Обновление состояния игры
     * @param {number} timestamp - текущий таймстамп
     */
    update(timestamp) {
        if (!this.isRunning) return;
        
        // Расчет дельты времени для стабильной анимации
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        
        // Ограничиваем deltaTime для предотвращения больших скачков
        const clampedDeltaTime = Math.min(deltaTime, 0.1);
        
        // Увеличиваем игровое время
        this.gameTime += clampedDeltaTime;
        
        // Обновление физики с фиксированным шагом
        this.physicsAccumulator += clampedDeltaTime;
        while (this.physicsAccumulator >= this.physicsUpdateRate) {
            // Обновляем физический мир
            if (this.physics) {
                this.physics.update(this.physicsUpdateRate);
            }
            
            this.fixedUpdate(this.physicsUpdateRate);
            this.physicsAccumulator -= this.physicsUpdateRate;
        }
        
        // Обновление игрока
        if (this.player) {
            this.player.update(clampedDeltaTime);
        }
        
        // Обновление других сущностей
        this.entities.forEach(entity => entity.update(clampedDeltaTime));
        
        // Рендеринг сцены с передачей игрока для системы видимости
        this.renderer.render(this.player);
        
        // Обновление UI
        this.updateUI();
        
        // Продолжение игрового цикла
        requestAnimationFrame(this.update);
    }
    
    /**
     * Обновление пользовательского интерфейса
     */
    updateUI() {
        // Обновляем HUD
        if (this.player && this.ui.hud) {
            this.ui.hud.update({
                health: this.player.health,
                ammo: this.player.ammo,
                weapon: this.player.weapon
            });
        }
    }
    
    /**
     * Переключение инвентаря
     */
    toggleInventory() {
        if (this.inventoryScreen.classList.contains('hidden')) {
            this.showInventory();
        } else {
            this.hideInventory();
        }
    }
    
    /**
     * Показать инвентарь
     */
    showInventory() {
        this.inventoryScreen.classList.remove('hidden');
        this.ui.inventory.show();
        this.input.disableGameControls();
    }
    
    /**
     * Скрыть инвентарь
     */
    hideInventory() {
        this.inventoryScreen.classList.add('hidden');
        this.ui.inventory.hide();
        this.input.enableGameControls();
    }
    
    /**
     * Добавление сущности в игру
     * @param {Object} entity - сущность для добавления
     */
    addEntity(entity) {
        this.entities.push(entity);
    }
    
    /**
     * Удаление сущности из игры
     * @param {Object} entity - сущность для удаления
     */
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }
    }
    
    /**
     * Завершение игры
     */
    endGame() {
        this.isRunning = false;
        this.currentScene = 'menu';
        
        // Очистка ресурсов
        this.entities = [];
        
        // Удаляем систему видимости
        if (this.renderer && this.renderer.visionSystem) {
            this.renderer.visionSystem.dispose();
            this.renderer.visionSystem = null;
        }
        
        // Очищаем физику
        if (this.physics) {
            this.physics.dispose();
        }
        
        if (this.player) {
            this.player = null;
        }
        
        // Отображение главного меню
        this.gameCanvas.classList.add('hidden');
        this.hudElement.classList.add('hidden');
        this.mainMenu.classList.remove('hidden');
        
        console.log('Игра завершена');
    }
}

// Экспорт для доступа из других модулей
export { Game };

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Создаем игровой объект
    window.game = new Game();
});