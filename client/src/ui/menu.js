/**
 * Класс для управления игровым меню
 */
export class Menu {
    /**
     * @param {HTMLElement} element - DOM элемент меню
     * @param {Object} game - ссылка на игровой объект
     */
    constructor(element, game) {
        this.element = element;
        this.game = game;
        
        // Элементы меню
        this.startButton = element.querySelector('#start-game');
        this.settingsButton = element.querySelector('#settings');
        
        // Меню настроек
        this.settingsMenu = null;
        
        // Привязка методов
        this.startGame = this.startGame.bind(this);
        this.openSettings = this.openSettings.bind(this);
        
        // Инициализация
        this.initialize();
    }
    
    /**
     * Инициализация меню
     */
    initialize() {
        // Настраиваем обработчики событий
        if (this.startButton) {
            this.startButton.addEventListener('click', this.startGame);
        }
        
        if (this.settingsButton) {
            this.settingsButton.addEventListener('click', this.openSettings);
        }
        
        // Создаем меню настроек (если нужно)
        this.createSettingsMenu();
    }
    
    /**
     * Создание меню настроек
     */
    createSettingsMenu() {
        // Создаем элемент меню настроек
        this.settingsMenu = document.createElement('div');
        this.settingsMenu.className = 'settings-menu hidden';
        this.settingsMenu.innerHTML = `
            <div class="settings-header">
                <h2>Настройки</h2>
                <button id="close-settings">×</button>
            </div>
            <div class="settings-content">
                <div class="setting-group">
                    <h3>Графика</h3>
                    <div class="setting-item">
                        <label for="graphics-quality">Качество графики:</label>
                        <select id="graphics-quality">
                            <option value="low">Низкое</option>
                            <option value="medium" selected>Среднее</option>
                            <option value="high">Высокое</option>
                        </select>
                    </div>
                </div>
                <div class="setting-group">
                    <h3>Управление</h3>
                    <div class="setting-item">
                        <label for="mouse-sensitivity">Чувствительность мыши:</label>
                        <input type="range" id="mouse-sensitivity" min="1" max="10" step="1" value="5">
                    </div>
                </div>
                <div class="setting-group">
                    <h3>Звук</h3>
                    <div class="setting-item">
                        <label for="sound-volume">Громкость звука:</label>
                        <input type="range" id="sound-volume" min="0" max="100" step="1" value="80">
                    </div>
                    <div class="setting-item">
                        <label for="music-volume">Громкость музыки:</label>
                        <input type="range" id="music-volume" min="0" max="100" step="1" value="50">
                    </div>
                </div>
                <div class="settings-footer">
                    <button id="apply-settings">Применить</button>
                </div>
            </div>
        `;
        
        // Добавляем меню в DOM
        document.body.appendChild(this.settingsMenu);
        
        // Добавляем обработчики событий
        const closeButton = this.settingsMenu.querySelector('#close-settings');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.closeSettings();
            });
        }
        
        const applyButton = this.settingsMenu.querySelector('#apply-settings');
        if (applyButton) {
            applyButton.addEventListener('click', () => {
                this.applySettings();
                this.closeSettings();
            });
        }
        
        // Добавляем стили для меню настроек
        this.addSettingsStyles();
    }
    
    /**
     * Запуск игры
     */
    startGame() {
        if (this.game) {
            this.game.startGame();
        }
    }
    
    /**
     * Открытие меню настроек
     */
    openSettings() {
        if (this.settingsMenu) {
            this.settingsMenu.classList.remove('hidden');
        }
    }
    
    /**
     * Закрытие меню настроек
     */
    closeSettings() {
        if (this.settingsMenu) {
            this.settingsMenu.classList.add('hidden');
        }
    }
    
    /**
     * Применение настроек
     */
    applySettings() {
        // Получаем значения настроек
        const graphicsQuality = document.getElementById('graphics-quality').value;
        const mouseSensitivity = document.getElementById('mouse-sensitivity').value;
        const soundVolume = document.getElementById('sound-volume').value;
        const musicVolume = document.getElementById('music-volume').value;
        
        // Применяем настройки к игре
        if (this.game) {
            // Качество графики
            if (this.game.renderer) {
                switch (graphicsQuality) {
                    case 'low':
                        // Низкое качество
                        this.game.renderer.setQuality('low');
                        break;
                    case 'medium':
                        // Среднее качество
                        this.game.renderer.setQuality('medium');
                        break;
                    case 'high':
                        // Высокое качество
                        this.game.renderer.setQuality('high');
                        break;
                }
            }
            
            // Чувствительность мыши
            if (this.game.input) {
                this.game.input.setMouseSensitivity(mouseSensitivity);
            }
            
            // Громкость звука и музыки
            // В будущем здесь будет управление аудио
        }
        
        // Сохраняем настройки в localStorage
        try {
            const settings = {
                graphicsQuality,
                mouseSensitivity,
                soundVolume,
                musicVolume
            };
            
            localStorage.setItem('gameSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('Ошибка при сохранении настроек:', error);
        }
    }
    
    /**
     * Загрузка настроек из localStorage
     */
    loadSettings() {
        try {
            const settingsStr = localStorage.getItem('gameSettings');
            
            if (settingsStr) {
                const settings = JSON.parse(settingsStr);
                
                // Устанавливаем значения в элементы управления
                if (settings.graphicsQuality) {
                    document.getElementById('graphics-quality').value = settings.graphicsQuality;
                }
                
                if (settings.mouseSensitivity) {
                    document.getElementById('mouse-sensitivity').value = settings.mouseSensitivity;
                }
                
                if (settings.soundVolume) {
                    document.getElementById('sound-volume').value = settings.soundVolume;
                }
                
                if (settings.musicVolume) {
                    document.getElementById('music-volume').value = settings.musicVolume;
                }
                
                // Применяем настройки к игре
                this.applySettings();
            }
        } catch (error) {
            console.error('Ошибка при загрузке настроек:', error);
        }
    }
    
    /**
     * Добавление стилей для меню настроек
     */
    addSettingsStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .settings-menu {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 500px;
                background-color: rgba(34, 34, 34, 0.95);
                border: 2px solid #4CAF50;
                padding: 20px;
                z-index: 1000;
                color: #fff;
            }
            
            .settings-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                border-bottom: 1px solid #555;
                padding-bottom: 10px;
            }
            
            .settings-header h2 {
                margin: 0;
            }
            
            #close-settings {
                background: none;
                border: none;
                color: #fff;
                font-size: 24px;
                cursor: pointer;
            }
            
            .setting-group {
                margin-bottom: 20px;
            }
            
            .setting-group h3 {
                margin-top: 0;
                margin-bottom: 10px;
                color: #4CAF50;
            }
            
            .setting-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 10px 0;
            }
            
            .setting-item label {
                flex: 1;
            }
            
            .setting-item select,
            .setting-item input[type="range"] {
                flex: 1;
                background-color: #333;
                color: #fff;
                border: 1px solid #555;
                padding: 5px;
            }
            
            .settings-footer {
                text-align: center;
                margin-top: 20px;
                padding-top: 10px;
                border-top: 1px solid #555;
            }
            
            #apply-settings {
                background-color: #4CAF50;
                border: none;
                color: white;
                padding: 10px 20px;
                cursor: pointer;
                font-size: 16px;
            }
            
            #apply-settings:hover {
                background-color: #45a049;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Показать меню
     */
    show() {
        this.element.classList.remove('hidden');
    }
    
    /**
     * Скрыть меню
     */
    hide() {
        this.element.classList.add('hidden');
    }
}