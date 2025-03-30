// client/src/core/gameEvents.js

import { log } from './gameCore.js';

/**
 * Класс для обработки событий в игре
 */
export class GameEvents {
    /**
     * @param {Object} game - ссылка на основной класс игры
     */
    constructor(game) {
        this.game = game;
        
        // Привязка методов к this
        this.handleGlobalError = this.handleGlobalError.bind(this);
        this.handlePromiseError = this.handlePromiseError.bind(this);
        
        // Регистрация обработчиков глобальных ошибок
        window.addEventListener('error', this.handleGlobalError);
        window.addEventListener('unhandledrejection', this.handlePromiseError);
    }
    
    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        try {
            // Обработчики для главного меню
            const startGameButton = document.getElementById('start-game');
            if (startGameButton) {
                startGameButton.addEventListener('click', () => this.game.startGame());
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
                    this.game.ui.hideInventory();
                });
            }
            
            // Обработчики клавиш
            if (this.game.input) {
                this.game.input.addKeyCallback('KeyI', () => {
                    if (this.game.state.isInScene('game')) {
                        this.game.ui.toggleInventory();
                    }
                });
                
                // Обработчик ESC для паузы
                this.game.input.addKeyCallback('Escape', () => {
                    if (this.game.state.isInScene('game')) {
                        this.game.state.togglePause();
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
                if (this.game.renderer) {
                    // Перерисовываем сцену при изменении размера окна
                    this.game.renderer.render(this.game.world.player);
                }
            });
            
            log('Обработчики событий настроены');
        } catch (error) {
            log(`Ошибка настройки обработчиков событий: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Обработка глобальных ошибок
     * @param {ErrorEvent} event - событие ошибки
     */
    handleGlobalError(event) {
        log(`Глобальная ошибка: ${event.message} в ${event.filename}:${event.lineno}`);
        
        // Показываем сообщение об ошибке, если игра ещё не запущена
        if (this.game.state.isInScene('loading')) {
            this.game.ui.showErrorScreen(`Ошибка: ${event.message}`);
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
        if (this.game.state.isInScene('loading')) {
            this.game.ui.showErrorScreen(`Ошибка асинхронной операции: ${errorMessage}`);
        }
        
        // Предотвращаем дополнительную обработку ошибки
        event.preventDefault();
    }
}