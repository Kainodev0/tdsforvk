// Импорт основных модулей
import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';
import { NetworkManager } from './network.js';
import { Player } from '../entities/player.js';
import { HUD } from '../ui/hud.js';
import { InventoryUI } from '../ui/inventory.js';

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
        
        // Состояние игры
        this.player = null;
        this.entities = [];
        this.ui = {
            hud: new HUD(this.hudElement),
            inventory: new InventoryUI(this.inventoryScreen)
        };
        
        // Привязка контекста this к методам
        this.update = this.update.bind(this);
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
        document.getElementById('settings').addEventListener('click', () => console.log('Настройки'));
        
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
        
        // Интеграция с VK (если доступно)
        if (window.vkBridge) {
            try {
                window.vkBridge.send('VKWebAppInit');
                console.log('VK Bridge initialized');
            } catch (e) {
                console.error('Error initializing VK Bridge:', e);
            }
        }
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
        
        // Создание игрока
        this.player = new Player({
            position: { x: 0, y: 0, z: 0 },
            renderer: this.renderer,
            input: this.input,
            game: this
        });
        
        // Инициализация сцены
        this.renderer.setupScene();
        
        // Подключение к серверу (в прототипе локально)
        this.network.connect().then(() => {
            console.log('Подключено к серверу');
            // В прототипе не будем подключаться к реальному серверу
        }).catch(error => {
            console.error('Ошибка подключения:', error);
            // Локальный режим для прототипа
        });
        
        // Запуск игрового цикла
        requestAnimationFrame(this.update);
    }
    
    /**
     * Обновление состояния игры
     * @param {number} timestamp - текущий таймстамп
     */
    update(timestamp) {
        if (!this.isRunning) return;
        
        // Расчет дельты времени для стабильной анимации
        const deltaTime = (timestamp - this.lastFrameTime) / 1000;
        this.lastFrameTime = timestamp;
        
        // Обновление игрока и сущностей
        if (this.player) {
            this.player.update(deltaTime);
        }
        
        // Обновление других сущностей
        this.entities.forEach(entity => entity.update(deltaTime));
        
        // Рендеринг сцены
        this.renderer.render();
        
        // Обновление UI
        this.ui.hud.update({
            health: this.player ? this.player.health : 0,
            ammo: this.player ? this.player.ammo : 0,
            weapon: this.player ? this.player.weapon : 'Нет'
        });
        
        // Продолжение игрового цикла
        requestAnimationFrame(this.update);
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
}

// Экспорт для доступа из других модулей
export { Game };

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Создаем игровой объект
    window.game = new Game();
});