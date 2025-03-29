/**
 * Класс предмета в игровом мире
 */
export class Item {
    /**
     * @param {Object} options - настройки предмета
     * @param {string} options.id - идентификатор предмета
     * @param {string} options.type - тип предмета (weapon, medkit, ammo и т.д.)
     * @param {Object} options.position - позиция предмета в мире
     * @param {Object} options.renderer - ссылка на рендерер
     * @param {Object} options.game - ссылка на игровой объект
     */
    constructor(options) {
        // Базовые параметры
        this.id = options.id || `item_${Date.now()}`;
        this.type = options.type || 'unknown';
        this.position = options.position || { x: 0, y: 0, z: 0 };
        
        // Дополнительные свойства в зависимости от типа
        this.properties = options.properties || {};
        
        // Флаги
        this.isPickable = options.isPickable !== undefined ? options.isPickable : true;
        this.isVisible = true;
        
        // Ссылки на другие модули
        this.renderer = options.renderer;
        this.game = options.game;
        this.mesh = null;
        
        // Создаем модель предмета
        this.createModel();
    }
    
    /**
     * Создание модели предмета
     */
    createModel() {
        // Если рендерер не доступен, выходим
        if (!this.renderer) return;
        
        // Создаем меш через рендерер
        this.mesh = this.renderer.addItem({
            id: this.id,
            type: this.type,
            position: this.position,
            properties: this.properties
        });
    }
    
    /**
     * Обновление предмета
     * @param {number} deltaTime - прошедшее время с предыдущего кадра
     */
    update(deltaTime) {
        // Обновляем визуальные эффекты
        this.updateVisuals(deltaTime);
        
        // Проверяем расстояние до игрока (для подсветки предметов рядом с игроком)
        this.checkPlayerProximity();
    }
    
    /**
     * Обновление визуальных эффектов предмета
     * @param {number} deltaTime - прошедшее время с предыдущего кадра
     */
    updateVisuals(deltaTime) {
        if (!this.mesh) return;
        
        // Вращение предмета (для лучшей видимости)
        if (this.mesh.rotation) {
            this.mesh.rotation.y += 0.5 * deltaTime;
        }
    }
    
    /**
     * Проверка близости игрока для подсветки предмета
     */
    checkPlayerProximity() {
        if (!this.game || !this.game.player || !this.mesh) return;
        
        // Получаем позицию игрока
        const playerPosition = this.game.player.position;
        
        // Вычисляем расстояние до игрока
        const dx = playerPosition.x - this.position.x;
        const dz = playerPosition.z - this.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // Определяем радиус подсветки
        const highlightRadius = 3;
        
        // Если игрок достаточно близко, подсвечиваем предмет
        if (distance <= highlightRadius) {
            this.highlight(true);
            
            // Проверяем, может ли игрок поднять предмет
            if (distance <= 1.5 && this.isPickable) {
                this.showPickupPrompt();
            } else {
                this.hidePickupPrompt();
            }
        } else {
            this.highlight(false);
            this.hidePickupPrompt();
        }
    }
    
    /**
     * Подсветка предмета
     * @param {boolean} isHighlighted - нужно ли подсветить предмет
     */
    highlight(isHighlighted) {
        if (!this.mesh || !this.mesh.material) return;
        
        // В будущем здесь будет логика подсветки (outline, glow)
        // Для прототипа просто меняем оттенок
        if (isHighlighted) {
            // Сохраняем оригинальный цвет, если еще не сохранен
            if (!this.originalColor && this.mesh.material.color) {
                this.originalColor = this.mesh.material.color.clone();
            }
            
            // Подсвечиваем (светлее)
            if (this.mesh.material.emissive) {
                this.mesh.material.emissive.set(0.2, 0.2, 0.2);
            }
        } else {
            // Возвращаем оригинальный цвет
            if (this.mesh.material.emissive) {
                this.mesh.material.emissive.set(0, 0, 0);
            }
        }
    }
    
    /**
     * Показать подсказку о подборе предмета
     */
    showPickupPrompt() {
        if (!this.game || !this.game.ui || !this.game.ui.hud) return;
        
        // Добавляем подсказку в HUD
        this.game.ui.hud.addStatusMessage(`Нажмите E чтобы поднять: ${this.getDisplayName()}`, 1000);
        
        // Устанавливаем обработчик клавиши E для подбора
        if (!this.pickupHandler && this.game.input) {
            this.pickupHandler = () => {
                if (this.game.input.isKeyPressed('KeyE')) {
                    this.pickup();
                }
            };
            
            // Добавляем обработчик
            this.game.input.addKeyCallback('KeyE', this.pickupHandler);
        }
    }
    
    /**
     * Скрыть подсказку о подборе предмета
     */
    hidePickupPrompt() {
        // Удаляем обработчик клавиши E, если он был установлен
        if (this.pickupHandler && this.game && this.game.input) {
            this.game.input.removeKeyCallback('KeyE', this.pickupHandler);
            this.pickupHandler = null;
        }
    }
    
    /**
     * Получение отображаемого имени предмета
     * @returns {string} - имя предмета для отображения
     */
    getDisplayName() {
        // В зависимости от типа предмета возвращаем разные имена
        switch(this.type) {
            case 'weapon':
                return 'Оружие';
            case 'medkit':
                return 'Аптечка';
            case 'ammo':
                return 'Патроны';
            default:
                return 'Предмет';
        }
    }
    
    /**
     * Подбор предмета игроком
     */
    pickup() {
        // Проверяем, может ли игрок поднять предмет
        if (!this.isPickable || !this.isVisible || !this.game || !this.game.player) {
            return false;
        }
        
        console.log(`Подбор предмета ${this.id} типа ${this.type}`);
        
        // Пытаемся добавить предмет в инвентарь игрока
        const success = this.game.player.pickupItem(this.id);
        
        if (success) {
            // Скрываем предмет из мира
            this.remove();
            return true;
        }
        
        return false;
    }
    
    /**
     * Удаление предмета из мира
     */
    remove() {
        this.isVisible = false;
        this.isPickable = false;
        
        // Удаляем модель
        if (this.mesh && this.renderer && this.renderer.scene) {
            this.renderer.scene.remove(this.mesh);
            this.mesh = null;
        }
        
        // Удаляем обработчик, если он был
        this.hidePickupPrompt();
    }
}