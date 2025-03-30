// client/src/core/GameUI.js

import { HUD } from '../ui/hud.js';
import { InventoryUI } from '../ui/inventory.js';
import { log } from './gameCore.js';

/**
 * Класс для управления пользовательским интерфейсом игры
 */
export class GameUI {
    /**
     * @param {Object} game - ссылка на основной класс игры
     */
    constructor(game) {
        this.game = game;
        
        // Элементы DOM
        this.loadingScreen = document.getElementById('loading-screen');
        this.mainMenu = document.getElementById('main-menu');
        this.gameCanvas = document.getElementById('game-canvas');
        this.hudElement = document.getElementById('hud');
        this.inventoryScreen = document.getElementById('inventory-screen');
        this.loadingStatus = document.getElementById('loading-status');
        
        // Компоненты UI
        this.components = {
            hud: null,
            inventory: null
        };
    }
    
    /**
     * Инициализация компонентов UI
     */
    async initComponents() {
        this.components = {
            hud: this.hudElement ? new HUD(this.hudElement) : null,
            inventory: this.inventoryScreen ? new InventoryUI(this.inventoryScreen) : null
        };
        
        return true;
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
     * Показать главное меню
     */
    showMainMenu() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
        }
        if (this.mainMenu) {
            this.mainMenu.classList.remove('hidden');
        }
        this.game.state.currentScene = 'menu';
        log('Главное меню отображено');
    }
    
    /**
     * Скрыть главное меню
     */
    hideMainMenu() {
        if (this.mainMenu) {
            this.mainMenu.classList.add('hidden');
        }
    }
    
    /**
     * Показать игровой экран
     */
    showGameScreen() {
        if (this.gameCanvas) {
            this.gameCanvas.classList.remove('hidden');
        }
        if (this.hudElement) {
            this.hudElement.classList.remove('hidden');
        }
    }
    
    /**
     * Обновление UI
     */
    update() {
        // Обновляем HUD
        if (this.game.world.player && this.components.hud) {
            this.components.hud.update({
                health: this.game.world.player.health,
                ammo: this.game.world.player.ammo,
                weapon: this.game.world.player.weapon
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
        
        if (this.components.inventory) {
            this.components.inventory.show();
        }
        
        if (this.game.input) {
            this.game.input.disableGameControls();
        }
    }
    
    /**
     * Скрыть инвентарь
     */
    hideInventory() {
        this.inventoryScreen.classList.add('hidden');
        
        if (this.components.inventory) {
            this.components.inventory.hide();
        }
        
        if (this.game.input) {
            this.game.input.enableGameControls();
        }
    }
}