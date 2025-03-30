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

// Функция для логирования
function log(message) {
    if (typeof window !== 'undefined' && window.debugLog) {
        window.debugLog('Game', message);
    } else {
        console.log(`[Game] ${message}`);
    }
}

/**
 * Основной класс игры, управляющий всеми компонентами
 */
class Game {
    constructor() {
        log('Инициализация игры...');
        
        this.isRunning = false;
        this.isLoading = true;
        this.currentScene = 'loading'; // loading, menu, game
        
        // Элементы DOM
        this.loadingScreen = document.getElementById('loading-screen');
        this.mainMenu = document.getElementById('main-menu');
        this.gameCanvas = document.getElementById('game-canvas');
        this.hudElement = document.getElementById('hud');
        this.inventoryScreen = document.getElementById('inventory-screen');
        this.loadingStatus = document.getElementById('loading-status');
        
        // Обновляем статус загрузки
        this.updateLoadingStatus('Инициализация игры...');
        
        // Отлов глобальных ошибок
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handlePromiseError.bind(this));
        
        // Состояние игры
        this.player = null;
        this.entities = [];
        
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
        
        // Инициализация основных модулей с обработкой ошибок
        this.initModules()
            .then(() => {
                log('Основные модули инициализированы');
                return this.loadResources();
            })
            .then(() => {
                log('Ресурсы загружены');
                this.showMainMenu();
            })
            .catch(error => {
                log(`Ошибка инициализации: ${error.message}`);
                this.showErrorScreen(`Произошла ошибка при инициализации: ${error.message}`);
            });
    }
    
    /**
     * Инициализация основных модулей с проверкой на ошибки
     */
    async initModules() {
        try {
            this.updateLoadingStatus('Инициализация рендерера...');
            // Инициализация рендерера
            this.renderer = new Renderer(this.gameCanvas);
            
            this.updateLoadingStatus('Инициализация обработчика ввода...');
            // Инициализация обработчика ввода
            this.input = new InputHandler();
            
            this.updateLoadingStatus('Инициализация сетевого менеджера...');
            // Инициализация сетевого менеджера
            this.network = new NetworkManager();
            
            this.updateLoadingStatus('Инициализация физического движка...');
            // Инициализация физического движка
            this.physics = new PhysicsManager();
            
            this.updateLoadingStatus('Инициализация UI компонентов...');
            // Инициализация UI компонентов
            this.ui = {
                hud: this.hudElement ? new HUD(this.hudElement) : null,
                inventory: this.inventoryScreen ? new InventoryUI(this.inventoryScreen) : null
            };
            
            // Настройка обработчиков событий
            this.setupEventListeners();
            
            // Запуск игрового цикла
            this.lastFrameTime = 0;
            
            return true;
        } catch (error) {
            log(`Ошибка инициализации модулей: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Обновление статуса загрузки
     * @param {string} status - текст статуса
     */
    updateLoadingStatus(status) {
        if (this.loadingStatus) {
            this.loadingStatus.textContent = status;
        }
        log(status);
    }
    
    /**
     * Обработка глобальных ошибок
     * @param {ErrorEvent} event - событие ошибки
     */
    handleGlobalError(event) {
        log(`Глобальная ошибка: ${event.message} в ${event.filename}:${event.lineno}`);
        
        // Показываем сообщение об ошибке, если игра ещё не запущена
        if (this.currentScene === 'loading') {
            this.showErrorScreen(`Ошибка: ${event.message}`);
        }
        
        // Предотвращаем дополнительную обработку ошибки
        event.preventDefault();
    }
    
    /**
     * Обработка необработанных ошибок промисов
     * @param {PromiseRejectionEvent} event - событие отклонения промиса
     */
    handlePromiseError(event) {
        const errorMessage = event.reason?.message || 'Неизвестная ошибка Promise';
        log(`Необработанная ошибка Promise: ${errorMessage}`);
        
        // Показываем сообщение об ошибке, если игра ещё не запущена
        if (this.currentScene === 'loading') {
            this.showErrorScreen(`Ошибка асинхронной операции: ${errorMessage}`);
        }
        
        // Предотвращаем дополнительную обработку ошибки
        event.preventDefault();
    }
    
    /**
     * Показать экран ошибки
     * @param {string} message - сообщение об ошибке
     */
    showErrorScreen(message) {
        // Создаем экран ошибки, если он ещё не существует
        let errorScreen = document.getElementById('error-screen');
        if (!errorScreen) {
            errorScreen = document.createElement('div');
            errorScreen.id = 'error-screen';
            errorScreen.className = 'error-overlay';
            errorScreen.innerHTML = `
                <div class="error-container">
                    <h2>Произошла ошибка</h2>
                    <p id="error-message">${message}</p>
                    <button id="reload-button">Перезагрузить</button>
                </div>
            `;
            document.body.appendChild(errorScreen);
            
            // Добавляем обработчик для кнопки перезагрузки
            const reloadButton = document.getElementById('reload-button');
            if (reloadButton) {
                reloadButton.addEventListener('click', () => {
                    window.location.reload();
                });
            }
            
            // Добавляем стили для экрана ошибки
            const style = document.createElement('style');
            style.textContent = `
                .error-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.85);
                    z-index: 9999;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .error-container {
                    background-color: #333;
                    padding: 20px;
                    border: 2px solid #f44336;
                    max-width: 80%;
                    text-align: center;
                }
                .error-container h2 {
                    color: #f44336;
                    margin-bottom: 15px;
                }
                .error-container p {
                    color: #fff;
                    margin-bottom: 20px;
                    font-family: monospace;
                    white-space: pre-wrap;
                    text-align: left;
                }
                #reload-button {
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    cursor: pointer;
                    font-size: 16px;
                }
                #reload-button:hover {
                    background-color: #45a049;
                }
            `;
            document.head.appendChild(style);
        } else {
            // Обновляем сообщение об ошибке
            const errorMessage = document.getElementById('error-message');
            if (errorMessage) {
                errorMessage.textContent = message;
            }
        }
        
        // Скрываем экран загрузки
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
        }
    }
    
    /**
     * Загрузка игровых ресурсов
     */
    async loadResources() {
        this.updateLoadingStatus('Инициализация физического движка...');
        
        try {
            // Инициализируем физику
            const physicsInitialized = await this.physics.init();
            if (!physicsInitialized) {
                throw new Error('Не удалось инициализировать физику');
            }
            
            this.updateLoadingStatus('Физический движок инициализирован');
            
            // Здесь будет загрузка дополнительных ресурсов
            this.updateLoadingStatus('Загрузка игровых ресурсов...');
            
            // Имитация загрузки (в реальной игре здесь будет загрузка assets)
            await new Promise((resolve) => {
                setTimeout(() => {
                    this.isLoading = false;
                    resolve();
                }, 1000);
            });
            
            this.updateLoadingStatus('Все ресурсы загружены успешно');
            return true;
        } catch (error) {
            log(`Ошибка загрузки ресурсов: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        try {
            // Обработчики для главного меню
            const startGameButton = document.getElementById('start-game');
            if (startGameButton) {
                startGameButton.addEventListener('click', this.startGame);
            }
            
            const settingsButton = document.getElementById('settings');
            if (settingsButton) {
                settingsButton.addEventListener('click', () => {
                    log('Настройки');
                    // В будущем здесь будет открытие меню настроек
                });
            }
            
            // Обработчик для закрытия инвентаря
            const closeInventoryButton = document.getElementById('close-inventory');
            if (closeInventoryButton) {
                closeInventoryButton.addEventListener('click', () => {
                    this.hideInventory();
                });
            }
            
            // Обработчики клавиш
            if (this.input) {
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
            }
            
            // Интеграция с VK (если доступно)
            if (window.vkBridge) {
                try {
                    window.vkBridge.send('VKWebAppInit');
                    log('VK Bridge инициализирован');
                } catch (e) {
                    log(`Ошибка инициализации VK Bridge: ${e.message}`);
                }
            }
            
            // Обработчик изменения размера окна
            window.addEventListener('resize', () => {
                if (this.renderer) {
                    // Перерисовываем сцену при изменении размера окна
                    this.renderer.render(this.player);
                }
            });
            
            log('Обработчики событий настроены');
        } catch (error) {
            log(`Ошибка настройки обработчиков событий: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Показать главное меню
     */
    showMainMenu() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
        }
        if (this.mainMenu) {
            this.mainMenu.classList.remove('hidden');
        }
        this.currentScene = 'menu';
        log('Главное меню отображено');
    }
    
    /**
     * Начать игру
     */
    startGame() {
        try {
            log('Запуск игры...');
            
            if (this.mainMenu) {
                this.mainMenu.classList.add('hidden');
            }
            if (this.gameCanvas) {
                this.gameCanvas.classList.remove('hidden');
            }
            if (this.hudElement) {
                this.hudElement.classList.remove('hidden');
            }
            
            this.isRunning = true;
            this.currentScene = 'game';
            
            // Инициализация сцены
            if (this.renderer) {
                this.renderer.setupScene();
                log('Сцена настроена');
            }
            
            // Создание тестовых стен для демонстрации системы видимости
            this.createTestWalls();
            
            // Создание игрока
            this.player = new Player({
                position: { x: 0, y: 0, z: 0 },
                renderer: this.renderer,
                input: this.input,
                game: this
            });
            
            log('Игрок создан');
            
            // Инициализация системы видимости
            this.initVisionSystem();
            
            // Подключение к серверу (в прототипе локально)
            this.network.connect().then(() => {
                log('Подключено к серверу (прототип)');
            }).catch(error => {
                log(`Ошибка подключения: ${error.message}`);
            });
            
            // Запуск игрового цикла
            this.lastFrameTime = performance.now();
            requestAnimationFrame(this.update);
            
            log('Игра запущена');
        } catch (error) {
            log(`Ошибка при запуске игры: ${error.message}`);
            this.showErrorScreen(`Ошибка при запуске игры: ${error.message}`);
        }
    }
    
    /**
     * Метод для инициализации системы видимости
     */
    initVisionSystem() {
        try {
            if (!this.renderer || !this.renderer.scene || !this.player) {
                throw new Error('Не все компоненты доступны для инициализации системы видимости');
            }
            
            log('Инициализация системы видимости...');
            
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
            
            log('Система видимости инициализирована');
        } catch (error) {
            log(`Ошибка инициализации системы видимости: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Метод для создания тестовых стен
     */
    createTestWalls() {
        try {
            if (!this.physics || !this.physics.isReady() || !this.renderer || !this.renderer.scene) {
                log('Физика или рендерер не готовы для создания стен');
                return;
            }
            
            log('Создание тестовых стен...');
            
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
            // Горизонтальные стены (границы)
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
            
            log('Тестовые стены созданы');
        } catch (error) {
            log(`Ошибка создания тестовых стен: ${error.message}`);
        }
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
        
        if (this.input) {
            this.input.disableGameControls();
        }
        
        // Здесь можно добавить отображение меню паузы
        log('Игра на паузе');
    }
    
    /**
     * Возобновить игру
     */
    resumeGame() {
        this.isRunning = true;
        
        if (this.input) {
            this.input.enableGameControls();
        }
        
        // Скрываем меню паузы
        log('Игра возобновлена');
        
        // Перезапускаем игровой цикл
        this.lastFrameTime = performance.now();
        requestAnimationFrame(this.update);
    }
    
    /**
     * Обновление с фиксированным шагом для физики
     * @param {number} deltaTime - фиксированный шаг времени 
     */
    fixedUpdate(deltaTime) {
        try {
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
        } catch (error) {
            log(`Ошибка в fixedUpdate: ${error.message}`);
        }
    }
    
    /**
     * Обновление состояния игры
     * @param {number} timestamp - текущий таймстамп
     */
    update(timestamp) {
        if (!this.isRunning) return;
        
        try {
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
                if (this.physics && this.physics.isReady()) {
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
            this.entities.forEach(entity => {
                if (entity.update) {
                    entity.update(clampedDeltaTime);
                }
            });
            
            // Рендеринг сцены с передачей игрока для системы видимости
            if (this.renderer) {
                this.renderer.render(this.player);
            }
            
            // Обновление UI
            this.updateUI();
            
            // Продолжение игрового цикла
            requestAnimationFrame(this.update);
        } catch (error) {
            log(`Ошибка в игровом цикле: ${error.message}`);
            
            // Пытаемся продолжить игровой цикл, несмотря на ошибку
            requestAnimationFrame(this.update);
        }
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
        
        if (this.ui.inventory) {
            this.ui.inventory.show();
        }
        
        if (this.input) {
            this.input.disableGameControls();
        }
    }
    
    /**
     * Скрыть инвентарь
     */
    hideInventory() {
        this.inventoryScreen.classList.add('hidden');
        
        if (this.ui.inventory) {
            this.ui.inventory.hide();
        }
        
        if (this.input) {
            this.input.enableGameControls();
        }
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
        if (this.gameCanvas) {
            this.gameCanvas.classList.add('hidden');
        }
        if (this.hudElement) {
            this.hudElement.classList.add('hidden');
        }
        if (this.mainMenu) {
            this.mainMenu.classList.remove('hidden');
        }
        
        log('Игра завершена');
    }
}

// Экспорт для доступа из других модулей
export { Game };

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    try {
        log('DOMContentLoaded: инициализация игры');
        // Создаем игровой объект
        window.game = new Game();
    } catch (error) {
        console.error('Критическая ошибка при инициализации игры:', error);
        
        // Показываем сообщение об ошибке
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            padding: 20px;
            background-color: #f44336;
            color: white;
            text-align: center;
            font-size: 18px;
            z-index: 9999;
        `;
        errorMessage.textContent = `Критическая ошибка: ${error.message}`;
        document.body.appendChild(errorMessage);
    }
});