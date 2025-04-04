// client/src/core/GameCore.js

import { GameUI } from './gameUI.js';
import { GameWorld } from './gameWorld.js';
import { GameState } from './gameState.js';
import { GameEvents } from './gameEvents.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';
import { NetworkManager } from './network.js';
import { PhysicsManager } from '../physics/physics-manager.js';

// Функция для логирования
export function log(message) {
    if (typeof window !== 'undefined' && window.debugLog) {
        window.debugLog('Game', message);
    } else {
        console.log(`[Game] ${message}`);
    }
}

/**
 * Основной класс игры, управляющий всеми компонентами
 */
export class GameCore {
    constructor() {
        log('Инициализация игры...');
        
        // Привязка контекста this к методам
        this.update = this.update.bind(this);
        this.fixedUpdate = this.fixedUpdate.bind(this);
        
        // Инициализация основных модулей
        this.events = new GameEvents(this);
        this.state = new GameState(this);
        this.ui = new GameUI(this);
        this.world = new GameWorld(this);
        
        // Игровой таймер и физика
        this.gameTime = 0;
        this.physicsUpdateRate = 1/60; // 60 обновлений физики в секунду
        this.physicsAccumulator = 0;
        this.lastFrameTime = 0;
        
        // Запуск процесса инициализации
        this.init();
    }
    
    /**
     * Асинхронная инициализация всех компонентов игры
     */
    async init() {
        try {
            this.ui.updateLoadingStatus('Инициализация компонентов...');
            
            // Инициализация базовых компонентов
            await this.initBaseComponents();
            log('Основные компоненты инициализированы');
            
            // Загрузка ресурсов и настройка
            await this.loadResources();
            log('Ресурсы загружены');
            
            // Показываем главное меню
            this.ui.showMainMenu();
        } catch (error) {
            log(`Ошибка инициализации: ${error.message}`);
            this.ui.showErrorScreen(`Произошла ошибка при инициализации: ${error.message}`);
        }
    }
    
    /**
     * Инициализация базовых компонентов игры
     */
    async initBaseComponents() {
        try {
            this.ui.updateLoadingStatus('Инициализация рендерера...');
            // Инициализация рендерера
            this.renderer = new Renderer(this.ui.gameCanvas);
            
            this.ui.updateLoadingStatus('Инициализация обработчика ввода...');
            // Инициализация обработчика ввода
            this.input = new InputHandler();
            
            this.ui.updateLoadingStatus('Инициализация сетевого менеджера...');
            // Инициализация сетевого менеджера
            this.network = new NetworkManager();
            
            this.ui.updateLoadingStatus('Инициализация физического движка...');
            // Инициализация физического движка
            this.physics = new PhysicsManager();
            
            this.ui.updateLoadingStatus('Инициализация UI компонентов...');
            // Инициализация UI компонентов
            await this.ui.initComponents();
            
            // Настройка обработчиков событий
            this.events.setupEventListeners();
            
            return true;
        } catch (error) {
            log(`Ошибка инициализации компонентов: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Загрузка игровых ресурсов
     */
    async loadResources() {
        this.ui.updateLoadingStatus('Инициализация физического движка...');
        
        try {
            // Инициализируем физику
            const physicsInitialized = await this.physics.init();
            if (!physicsInitialized) {
                throw new Error('Не удалось инициализировать физику');
            }
            
            this.ui.updateLoadingStatus('Физический движок инициализирован');
            
            // Здесь будет загрузка дополнительных ресурсов
            this.ui.updateLoadingStatus('Загрузка игровых ресурсов...');
            
            // Имитация загрузки (в реальной игре здесь будет загрузка assets)
            await new Promise((resolve) => {
                setTimeout(() => {
                    this.state.isLoading = false;
                    resolve();
                }, 1000);
            });
            
            this.ui.updateLoadingStatus('Все ресурсы загружены успешно');
            return true;
        } catch (error) {
            log(`Ошибка загрузки ресурсов: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Начало игры
     */
    async startGame() {
        try {
            log('Запуск игры...');
            
            this.ui.hideMainMenu();
            this.ui.showGameScreen();
            
            this.state.isRunning = true;
            this.state.currentScene = 'game';
            
            // Инициализация сцены
            if (this.renderer) {
                this.renderer.setupScene();
                log('Сцена настроена');
            }
            
            // Создание игрового мира
            await this.world.initialize();
            
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
            this.ui.showErrorScreen(`Ошибка при запуске игры: ${error.message}`);
        }
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
            
            // Обновляем игровой мир с фиксированным шагом
            this.world.fixedUpdate(deltaTime);
        } catch (error) {
            log(`Ошибка в fixedUpdate: ${error.message}`);
        }
    }
    
    /**
     * Обновление состояния игры
     * @param {number} timestamp - текущий таймстамп
     */
    update(timestamp) {
        if (!this.state.isRunning) return;
        
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
            
            // Обновление игрового мира
            this.world.update(clampedDeltaTime);
            
            // Рендеринг сцены
            if (this.renderer) {
                this.renderer.render(this.world.player);
            }
            
            // Обновление UI
            this.ui.update();
            
            // Продолжение игрового цикла
            requestAnimationFrame(this.update);
        } catch (error) {
            log(`Ошибка в игровом цикле: ${error.message}`);
            
            // Пытаемся продолжить игровой цикл, несмотря на ошибку
            requestAnimationFrame(this.update);
        }
    }
}