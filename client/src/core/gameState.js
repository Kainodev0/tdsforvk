// client/src/core/GameState.js

import { log } from './gameCore.js';

/**
 * Класс для управления состоянием игры
 */
export class GameState {
    /**
     * @param {Object} game - ссылка на основной класс игры
     */
    constructor(game) {
        this.game = game;
        
        // Флаги состояния
        this.isRunning = false;
        this.isLoading = true;
        this.isPaused = false;
        
        // Текущая сцена (loading, menu, game, pause)
        this.currentScene = 'loading';
        
        // Настройки видимости
        this.fogOfWarEnabled = true;
        this.visibilitySystemEnabled = true;
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
        this.isPaused = true;
        
        if (this.game.input) {
            this.game.input.disableGameControls();
        }
        
        // Здесь можно добавить отображение меню паузы
        log('Игра на паузе');
    }
    
    /**
     * Возобновить игру
     */
    resumeGame() {
        this.isRunning = true;
        this.isPaused = false;
        
        if (this.game.input) {
            this.game.input.enableGameControls();
        }
        
        // Скрываем меню паузы
        log('Игра возобновлена');
        
        // Перезапускаем игровой цикл
        this.game.lastFrameTime = performance.now();
        requestAnimationFrame(this.game.update);
    }
    
    /**
     * Завершение игры
     */
    endGame() {
        this.isRunning = false;
        this.currentScene = 'menu';
        
        // Очистка игрового мира
        if (this.game.world) {
            this.game.world.clear();
        }
        
        // Очищаем физику
        if (this.game.physics) {
            this.game.physics.dispose();
        }
        
        // Отображение главного меню
        if (this.game.ui) {
            if (this.game.ui.gameCanvas) {
                this.game.ui.gameCanvas.classList.add('hidden');
            }
            if (this.game.ui.hudElement) {
                this.game.ui.hudElement.classList.add('hidden');
            }
            if (this.game.ui.mainMenu) {
                this.game.ui.mainMenu.classList.remove('hidden');
            }
        }
        
        log('Игра завершена');
    }
    
    /**
     * Проверка, находится ли игра в указанной сцене
     * @param {string} scene - имя сцены для проверки
     * @returns {boolean} результат проверки
     */
    isInScene(scene) {
        return this.currentScene === scene;
    }
}