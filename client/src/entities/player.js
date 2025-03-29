/**
 * Класс игрока, управляющий поведением и состоянием персонажа
 */
export class Player {
    /**
     * @param {Object} options - настройки игрока
     * @param {Object} options.position - начальная позиция
     * @param {Object} options.renderer - ссылка на рендерер
     * @param {Object} options.input - ссылка на обработчик ввода
     * @param {Object} options.game - ссылка на игровой объект
     */
    constructor(options) {
        // Базовые параметры
        this.id = options.id || 'local_player';
        this.isLocalPlayer = options.isLocalPlayer !== undefined ? options.isLocalPlayer : true;
        
        // Позиция и вращение
        this.position = options.position || { x: 0, y: 0, z: 0 };
        this.rotation = options.rotation || { x: 0, y: 0, z: 0 };
        this.direction = { x: 0, z: -1 }; // Направление взгляда (по умолчанию вперед)
        
        // Характеристики
        this.health = options.health || 100;
        this.maxHealth = options.maxHealth || 100;
        this.speed = options.speed || 5; // скорость движения
        this.weapon = options.weapon || 'pistol';
        this.ammo = options.ammo || 30;
        
        // Инвентарь
        this.inventory = options.inventory || {
            items: [],
            maxSlots: 25 // 5x5 сетка
        };
        
        // Состояния
        this.isMoving = false;
        this.isShooting = false;
        this.lastShootTime = 0;
        this.shootCooldown = 500; // задержка между выстрелами в мс
        
        // Ссылки на другие модули
        this.renderer = options.renderer;
        this.input = options.input;
        this.game = options.game;
        this.mesh = null; // будет инициализирован при создании модели
        
        // Если это локальный игрок, настраиваем управление
        if (this.isLocalPlayer) {
            this.setupControls();
        }
        
        // Создаем модель игрока
        this.createModel();
    }
    
    /**
     * Создание модели игрока
     */
    createModel() {
        // Если рендерер не доступен, выходим
        if (!this.renderer) return;
        
        // Создаем меш через рендерер
        this.mesh = this.renderer.addPlayer({
            position: this.position,
            rotation: this.rotation,
            isLocalPlayer: this.isLocalPlayer
        });
    }
    
    /**
     * Настройка управления игроком
     */
    setupControls() {
        if (!this.input) return;
        
        // Добавляем обработчик клика для стрельбы
        this.input.setClickCallback(() => {
            this.shoot();
        });
        
        // Обработчик движения мыши для вращения
        this.input.setMouseMoveCallback((position, delta) => {
            this.handleMouseMove(delta);
        });
    }
    
    /**
     * Обработка движения мыши
     * @param {Object} delta - изменение позиции мыши {x, y}
     */
    handleMouseMove(delta) {
        // В будущем здесь будет вращение персонажа и оружия
        // Для прототипа ничего не делаем
    }
    
    /**
     * Обновление состояния игрока
     * @param {number} deltaTime - прошедшее время с предыдущего кадра
     */
    update(deltaTime) {
        if (!deltaTime) return;
        
        // Только локальный игрок может двигаться сам
        if (this.isLocalPlayer) {
            this.handleMovement(deltaTime);
            
            // Обновляем камеру для слежения за игроком
            if (this.renderer) {
                this.renderer.updateCamera(this.position);
            }
        }
        
        // Обновляем модель (позицию и анимацию)
        this.updateModel();
    }
    
    /**
     * Обработка движения игрока
     * @param {number} deltaTime - прошедшее время с предыдущего кадра
     */
    handleMovement(deltaTime) {
        if (!this.input) return;
        
        // Получаем направление движения
        const moveDir = this.input.getMovementDirection();
        
        // Если вектор движения нулевой, игрок стоит на месте
        if (moveDir.x === 0 && moveDir.z === 0) {
            this.isMoving = false;
            return;
        }
        
        // Устанавливаем флаг движения
        this.isMoving = true;
        
        // Вычисляем новую позицию
        const newX = this.position.x + moveDir.x * this.speed * deltaTime;
        const newZ = this.position.z + moveDir.z * this.speed * deltaTime;
        
        // Проверка столкновений (упрощенная)
        const canMoveX = this.checkCollision({ x: newX, y: this.position.y, z: this.position.z });
        const canMoveZ = this.checkCollision({ x: this.position.x, y: this.position.y, z: newZ });
        
        // Обновляем позицию
        if (canMoveX) {
            this.position.x = newX;
        }
        
        if (canMoveZ) {
            this.position.z = newZ;
        }
        
        // Обновляем направление взгляда, если игрок двигается
        if (moveDir.x !== 0 || moveDir.z !== 0) {
            // Обновляем вращение для соответствия направлению движения
            const angle = Math.atan2(moveDir.x, moveDir.z);
            this.rotation.y = angle;
            
            // Обновляем вектор направления взгляда
            this.direction = {
                x: Math.sin(angle),
                z: Math.cos(angle)
            };
        }
        
        // Отправляем изменения на сервер, если доступно
        if (this.game && this.game.network) {
            this.game.network.sendPlayerMove(this.position, this.rotation);
        }
    }
    
    /**
     * Упрощенная проверка столкновений
     * @param {Object} newPosition - новая позиция для проверки
     * @returns {boolean} - можно ли двигаться на новую позицию
     */
    checkCollision(newPosition) {
        // Проверяем выход за границы карты
        const mapSize = 45; // Размер карты (половина от 100)
        
        if (Math.abs(newPosition.x) > mapSize || Math.abs(newPosition.z) > mapSize) {
            return false;
        }
        
        // Здесь должна быть проверка столкновений с объектами
        // В прототипе используем только границы карты
        
        return true;
    }
    
    /**
     * Обработка стрельбы
     */
    shoot() {
        const currentTime = Date.now();
        
        // Проверяем временную задержку между выстрелами
        if (currentTime - this.lastShootTime < this.shootCooldown) {
            return;
        }
        
        // Проверяем наличие патронов
        if (this.ammo <= 0) {
            console.log('Нет патронов!');
            return;
        }
        
        // Устанавливаем время последнего выстрела
        this.lastShootTime = currentTime;
        
        // Уменьшаем количество патронов
        this.ammo--;
        
        // Устанавливаем флаг стрельбы (для анимации)
        this.isShooting = true;
        setTimeout(() => {
            this.isShooting = false;
        }, 100);
        
        // Создаем выстрел
        this.createShot();
        
        // Отправляем информацию о выстреле на сервер
        if (this.game && this.game.network) {
            this.game.network.sendPlayerShoot(
                this.position,
                this.direction,
                this.weapon
            );
        }
    }
    
    /**
     * Создание выстрела (визуально и логически)
     */
    createShot() {
        // В будущем здесь будет логика создания пули, проверки попаданий и т.д.
        console.log('Выстрел!', this.direction);
        
        // Простой рейкаст для определения попадания
        const rayStart = { ...this.position };
        rayStart.y += 1; // Уровень "глаз"
        
        const rayEnd = {
            x: rayStart.x + this.direction.x * 100,
            y: rayStart.y,
            z: rayStart.z + this.direction.z * 100
        };
        
        // Здесь должна быть логика проверки попаданий
    }
    
    /**
     * Обновление модели игрока
     */
    updateModel() {
        if (this.mesh && this.renderer) {
            // Обновляем позицию меша
            this.renderer.updateObjectTransform(this.mesh, this.position, this.rotation);
            
            // В будущем здесь будет управление анимациями
        }
    }
    
    /**
     * Получение урона
     * @param {number} amount - количество урона
     * @returns {boolean} - жив ли игрок после получения урона
     */
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        
        // Обновляем HUD, если это локальный игрок
        if (this.isLocalPlayer && this.game && this.game.ui && this.game.ui.hud) {
            this.game.ui.hud.update({ health: this.health });
        }
        
        // Проверяем, жив ли игрок
        if (this.health <= 0) {
            this.die();
            return false;
        }
        
        return true;
    }
    
    /**
     * Смерть игрока
     */
    die() {
        console.log('Игрок погиб');
        
        // Здесь будет логика смерти и респавна
    }
    
    /**
     * Использование предмета
     * @param {string} itemId - идентификатор предмета
     * @returns {boolean} - успешность использования
     */
    useItem(itemId) {
        // Находим предмет в инвентаре
        const itemIndex = this.inventory.items.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) {
            return false;
        }
        
        const item = this.inventory.items[itemIndex];
        
        // Обрабатываем в зависимости от типа предмета
        switch (item.type) {
            case 'medkit':
                // Лечим игрока
                this.health = Math.min(this.maxHealth, this.health + item.healAmount);
                
                // Удаляем предмет из инвентаря
                this.inventory.items.splice(itemIndex, 1);
                
                // Обновляем HUD, если это локальный игрок
                if (this.isLocalPlayer && this.game && this.game.ui && this.game.ui.hud) {
                    this.game.ui.hud.update({ health: this.health });
                }
                
                return true;
                
            case 'ammo':
                // Добавляем патроны
                this.ammo += item.amount;
                
                // Удаляем предмет из инвентаря
                this.inventory.items.splice(itemIndex, 1);
                
                // Обновляем HUD
                if (this.isLocalPlayer && this.game && this.game.ui && this.game.ui.hud) {
                    this.game.ui.hud.update({ ammo: this.ammo });
                }
                
                return true;
                
            default:
                return false;
        }
    }
    
    /**
     * Добавление предмета в инвентарь
     * @param {Object} item - предмет для добавления
     * @returns {boolean} - успешность добавления
     */
    addItemToInventory(item) {
        // Проверяем, есть ли место в инвентаре
        if (this.inventory.items.length >= this.inventory.maxSlots) {
            return false;
        }
        
        // Добавляем предмет
        this.inventory.items.push(item);
        
        // Обновляем инвентарь, если это локальный игрок
        if (this.isLocalPlayer && this.game && this.game.ui && this.game.ui.inventory) {
            this.game.ui.inventory.update(this.inventory);
        }
        
        return true;
    }
    
    /**
     * Подбор предмета с земли
     * @param {string} itemId - идентификатор предмета
     * @returns {boolean} - успешность подбора
     */
    pickupItem(itemId) {
        // Получаем информацию о предмете из сетевого менеджера
        if (this.game && this.game.network && this.game.network.mockData.items[itemId]) {
            const itemData = this.game.network.mockData.items[itemId];
            
            // Создаем предмет для инвентаря
            const item = {
                id: itemData.id,
                type: itemData.type,
                // Дополнительные свойства в зависимости от типа
                ...(itemData.type === 'medkit' ? { healAmount: 50 } : {}),
                ...(itemData.type === 'ammo' ? { amount: 30 } : {})
            };
            
            // Добавляем в инвентарь
            const success = this.addItemToInventory(item);
            
            if (success) {
                // Отправляем информацию о подборе на сервер
                this.game.network.sendItemPickup(itemId, itemData.type);
                
                return true;
            }
        }
        
        return false;
    }
}