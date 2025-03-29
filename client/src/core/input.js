/**
 * Класс обработки пользовательского ввода
 */
export class InputHandler {
    constructor() {
        // Состояние клавиш
        this.keys = {};
        
        // Состояние мыши
        this.mouse = {
            position: { x: 0, y: 0 },
            isDown: false,
            rightIsDown: false
        };
        
        // Последнее положение мыши для расчета дельты
        this.lastMousePosition = { x: 0, y: 0 };
        
        // Колбэки для клавиш
        this.keyCallbacks = {};
        
        // Колбэк для клика мыши
        this.clickCallback = null;
        this.rightClickCallback = null;
        
        // Колбэк для движения мыши
        this.mouseMoveCallback = null;
        
        // Флаг активных игровых управлений
        this.gameControlsEnabled = true;
        
        // Привязка методов к контексту
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleContextMenu = this.handleContextMenu.bind(this);
        
        // Инициализация обработчиков событий
        this.init();
    }
    
    /**
     * Инициализация обработчиков событий
     */
    init() {
        // Добавление обработчиков событий клавиатуры
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        
        // Добавление обработчиков событий мыши
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mousedown', this.handleMouseDown);
        window.addEventListener('mouseup', this.handleMouseUp);
        window.addEventListener('contextmenu', this.handleContextMenu);
        
        // Подавление стандартных действий браузера
        document.body.style.userSelect = 'none';
    }
    
    /**
     * Обработчик нажатия клавиши
     * @param {KeyboardEvent} event - событие нажатия клавиши
     */
    handleKeyDown(event) {
        // Запоминаем состояние клавиши
        this.keys[event.code] = true;
        
        // Вызываем колбэк, если он установлен
        if (this.keyCallbacks[event.code] && this.gameControlsEnabled) {
            this.keyCallbacks[event.code]();
        }
    }
    
    /**
     * Обработчик отпускания клавиши
     * @param {KeyboardEvent} event - событие отпускания клавиши
     */
    handleKeyUp(event) {
        // Запоминаем состояние клавиши
        this.keys[event.code] = false;
    }
    
    /**
     * Обработчик движения мыши
     * @param {MouseEvent} event - событие движения мыши
     */
    handleMouseMove(event) {
        // Обновляем позицию мыши
        this.mouse.position.x = event.clientX;
        this.mouse.position.y = event.clientY;
        
        // Вычисляем delta движения
        const deltaX = this.mouse.position.x - this.lastMousePosition.x;
        const deltaY = this.mouse.position.y - this.lastMousePosition.y;
        
        // Обновляем последнюю позицию
        this.lastMousePosition.x = this.mouse.position.x;
        this.lastMousePosition.y = this.mouse.position.y;
        
        // Вызываем колбэк движения, если он установлен
        if (this.mouseMoveCallback && this.gameControlsEnabled) {
            this.mouseMoveCallback(this.mouse.position, { x: deltaX, y: deltaY });
        }
    }
    
    /**
     * Обработчик нажатия кнопки мыши
     * @param {MouseEvent} event - событие нажатия кнопки мыши
     */
    handleMouseDown(event) {
        if (event.button === 0) {
            // Левая кнопка мыши
            this.mouse.isDown = true;
            
            // Вызываем колбэк, если он установлен
            if (this.clickCallback && this.gameControlsEnabled) {
                this.clickCallback(this.mouse.position);
            }
        } else if (event.button === 2) {
            // Правая кнопка мыши
            this.mouse.rightIsDown = true;
            
            // Вызываем колбэк, если он установлен
            if (this.rightClickCallback && this.gameControlsEnabled) {
                this.rightClickCallback(this.mouse.position);
            }
        }
    }
    
    /**
     * Обработчик отпускания кнопки мыши
     * @param {MouseEvent} event - событие отпускания кнопки мыши
     */
    handleMouseUp(event) {
        if (event.button === 0) {
            this.mouse.isDown = false;
        } else if (event.button === 2) {
            this.mouse.rightIsDown = false;
        }
    }
    
    /**
     * Обработчик контекстного меню (правый клик)
     * @param {MouseEvent} event - событие контекстного меню
     */
    handleContextMenu(event) {
        // Предотвращаем появление стандартного контекстного меню
        event.preventDefault();
    }
    
    /**
     * Проверка, нажата ли указанная клавиша
     * @param {string} code - код клавиши
     * @returns {boolean} - состояние клавиши
     */
    isKeyPressed(code) {
        return this.gameControlsEnabled && this.keys[code] === true;
    }
    
    /**
     * Проверка, нажата ли левая кнопка мыши
     * @returns {boolean} - состояние левой кнопки мыши
     */
    isMouseDown() {
        return this.gameControlsEnabled && this.mouse.isDown;
    }
    
    /**
     * Проверка, нажата ли правая кнопка мыши
     * @returns {boolean} - состояние правой кнопки мыши
     */
    isRightMouseDown() {
        return this.gameControlsEnabled && this.mouse.rightIsDown;
    }
    
    /**
     * Получение текущей позиции мыши
     * @returns {Object} - координаты мыши {x, y}
     */
    getMousePosition() {
        return { ...this.mouse.position };
    }
    
    /**
     * Добавление колбэка для клавиши
     * @param {string} code - код клавиши
     * @param {Function} callback - функция обратного вызова
     */
    addKeyCallback(code, callback) {
        this.keyCallbacks[code] = callback;
    }
    
    /**
     * Удаление колбэка для клавиши
     * @param {string} code - код клавиши
     */
    removeKeyCallback(code) {
        delete this.keyCallbacks[code];
    }
    
    /**
     * Установка колбэка для клика мыши
     * @param {Function} callback - функция обратного вызова
     */
    setClickCallback(callback) {
        this.clickCallback = callback;
    }
    
    /**
     * Установка колбэка для правого клика мыши
     * @param {Function} callback - функция обратного вызова
     */
    setRightClickCallback(callback) {
        this.rightClickCallback = callback;
    }
    
    /**
     * Установка колбэка для движения мыши
     * @param {Function} callback - функция обратного вызова
     */
    setMouseMoveCallback(callback) {
        this.mouseMoveCallback = callback;
    }
    
    /**
     * Отключение управления игрой (для меню, инвентаря и т.д.)
     */
    disableGameControls() {
        this.gameControlsEnabled = false;
    }
    
    /**
     * Включение управления игрой
     */
    enableGameControls() {
        this.gameControlsEnabled = true;
    }
    
    /**
     * Получение направления движения на основе нажатых клавиш
     * @returns {Object} - вектор движения {x, z}
     */
    getMovementDirection() {
        if (!this.gameControlsEnabled) {
            return { x: 0, z: 0 };
        }
        
        let dirX = 0;
        let dirZ = 0;
        
        // Вперед/назад (WASD)
        if (this.isKeyPressed('KeyW') || this.isKeyPressed('ArrowUp')) {
            dirZ = -1;
        } else if (this.isKeyPressed('KeyS') || this.isKeyPressed('ArrowDown')) {
            dirZ = 1;
        }
        
        // Влево/вправо (WASD)
        if (this.isKeyPressed('KeyA') || this.isKeyPressed('ArrowLeft')) {
            dirX = -1;
        } else if (this.isKeyPressed('KeyD') || this.isKeyPressed('ArrowRight')) {
            dirX = 1;
        }
        
        return { x: dirX, z: dirZ };
    }
    
    /**
     * Очистка всех колбэков
     */
    clearCallbacks() {
        this.keyCallbacks = {};
        this.clickCallback = null;
        this.rightClickCallback = null;
        this.mouseMoveCallback = null;
    }
    
    /**
     * Уничтожение обработчика ввода и удаление обработчиков событий
     */
    destroy() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('mousedown', this.handleMouseDown);
        window.removeEventListener('mouseup', this.handleMouseUp);
        window.removeEventListener('contextmenu', this.handleContextMenu);
        
        document.body.style.userSelect = '';
    }
}