// client/src/entities/player.js

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
        this.speed = options.speed || 5; // базовая скорость движения
        this.weapon = options.weapon || 'pistol';
        this.ammo = options.ammo || 30;
        this.weaponType = 'single'; // 'single' или 'auto'
        this.fireRate = 500; // задержка между выстрелами в мс (для одиночного оружия)
        this.recoil = { x: 0.05, y: 0.05 }; // сила отдачи
        
        // Инвентарь
        this.inventory = options.inventory || {
            items: [],
            maxSlots: 25 // 5x5 сетка
        };
        
        // Состояния
        this.isMoving = false;
        this.isRunning = false;
        this.isAiming = false;
        this.isShooting = false;
        this.canShoot = true; // флаг возможности стрельбы
        this.lastShootTime = 0;
        this.currentState = 'idle'; // idle, walk, run, aim, shoot
        
        // Параметры обзора
        this.viewAngle = 90; // начальный угол обзора в градусах
        this.normalViewAngle = 90;
        this.aimingViewAngle = 45;
        this.runningViewAngle = 70; // угол обзора при беге
        this.viewDistance = 50; // дальность видимости
        
        // Параметры движения
        this.normalSpeed = 5;
        this.runningSpeed = 7.5; // скорость бега (+50%)
        this.aimingSpeed = 1.5; // скорость при прицеливании (-70%)
        this.acceleration = 10; // ускорение для плавности движения
        this.velocity = { x: 0, z: 0 }; // текущая скорость
        
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
        
        // Добавляем обработчик ЛКМ для прицеливания
        this.input.setMouseDownCallback((button, position) => {
            if (button === 0) { // Левая кнопка
                this.startAiming();
            }
        });
        
        // Обработчик отпускания ЛКМ
        this.input.setMouseUpCallback((button) => {
            if (button === 0) { // Левая кнопка
                this.stopAiming();
            }
        });
        
        // Обработчик ПКМ для стрельбы
        this.input.setRightClickCallback(() => {
            this.tryShoot();
        });
        
        // Обработчик движения мыши для вращения
        this.input.setMouseMoveCallback((position, delta) => {
            this.handleMouseMove(position);
        });
    }
    
    /**
     * Начало прицеливания
     */
    startAiming() {
        this.isAiming = true;
        this.speed = this.aimingSpeed;
        this.viewAngle = this.aimingViewAngle;
        console.log('Начало прицеливания');
    }
    
    /**
     * Конец прицеливания
     */
    stopAiming() {
        this.isAiming = false;
        this.speed = this.normalSpeed;
        this.viewAngle = this.normalViewAngle;
        console.log('Конец прицеливания');
    }
    
    /**
     * Попытка выстрела
     */
    tryShoot() {
        // Можно стрелять только если игрок прицеливается
        if (!this.isAiming || !this.canShoot || this.ammo <= 0) {
            return;
        }
        
        const currentTime = Date.now();
        
        // Проверяем временную задержку между выстрелами
        if (currentTime - this.lastShootTime < this.fireRate) {
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
        
        // Применяем отдачу
        this.applyRecoil();
        
        // Создаем выстрел
        this.createShot();
        
        // Для одиночного оружия добавляем задержку перед следующим выстрелом
        if (this.weaponType === 'single') {
            this.canShoot = false;
            setTimeout(() => {
                this.canShoot = true;
            }, this.fireRate);
        }
        
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
     * Применение отдачи при стрельбе
     */
    applyRecoil() {
        // Случайное смещение прицела в пределах recoil
        const recoilX = (Math.random() - 0.5) * this.recoil.x * 2;
        const recoilY = -Math.abs(Math.random() * this.recoil.y); // Всегда вверх
        
        // Получаем текущую позицию мыши
        const mousePos = this.input.getMousePosition();
        
        // Симулируем движение мыши с отдачей
        const newMousePos = {
            x: mousePos.x + recoilX * 100, // Умножаем для заметного эффекта
            y: mousePos.y + recoilY * 100
        };
        
        // Обновляем направление игрока
        this.handleMouseMove(newMousePos);
    }
    
    /**
     * Обработка движения мыши
     * @param {Object} position - позиция мыши {x, y}
     */
    handleMouseMove(position) {
        // Получаем размеры канваса
        const canvasRect = this.renderer.canvas.getBoundingClientRect();
        const canvasCenter = {
            x: canvasRect.left + canvasRect.width / 2,
            y: canvasRect.top + canvasRect.height / 2
        };
        
        // Вычисляем вектор от центра к мыши
        const mouseVec = {
            x: position.x - canvasCenter.x,
            y: position.y - canvasCenter.y
        };
        
        // Нормализуем вектор
        const length = Math.sqrt(mouseVec.x * mouseVec.x + mouseVec.y * mouseVec.y);
        if (length > 0) {
            mouseVec.x /= length;
            mouseVec.y /= length;
        }
        
        // Вычисляем угол поворота (в радианах)
        const angle = Math.atan2(mouseVec.x, -mouseVec.y);
        
        // Устанавливаем направление игрока
        this.rotation.y = angle;
        this.direction = {
            x: Math.sin(angle),
            z: -Math.cos(angle)
        };
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
            
            // Обновляем параметры при нажатии Shift (бег)
            this.handleRunning();
            
            // Обновляем состояние анимации
            this.updateAnimationState();
        }
        
        // Обновляем модель (позицию и анимацию)
        this.updateModel();
    }
    
    /**
     * Обработка бега (нажатие Shift)
     */
    handleRunning() {
        if (!this.input) return;
        
        const wasRunning = this.isRunning;
        
        // Проверяем нажат ли Shift и не в режиме прицеливания
        if (this.input.isKeyPressed('ShiftLeft') && !this.isAiming) {
            if (!this.isRunning) {
                this.isRunning = true;
                this.speed = this.runningSpeed;
                this.viewAngle = this.runningViewAngle;
            }
        } else if (this.isRunning) {
            this.isRunning = false;
            this.speed = this.isAiming ? this.aimingSpeed : this.normalSpeed;
            this.viewAngle = this.isAiming ? this.aimingViewAngle : this.normalViewAngle;
        }
        
        // Если состояние бега изменилось, сообщаем об этом
        if (wasRunning !== this.isRunning) {
            console.log(this.isRunning ? 'Начало бега' : 'Конец бега');
        }
    }
    
    /**
     * Обновление состояния анимации
     */
    updateAnimationState() {
        let newState = 'idle';
        
        if (this.isMoving) {
            newState = this.isRunning ? 'run' : 'walk';
        }
        
        if (this.isAiming) {
            newState = 'aim';
        }
        
        if (this.isShooting) {
            newState = 'shoot';
        }
        
        if (this.currentState !== newState) {
            this.currentState = newState;
            console.log(`Состояние анимации: ${this.currentState}`);
            
            // Здесь будет логика смены анимации
        }
    }
    
    /**
     * Обработка движения игрока
     * @param {number} deltaTime - прошедшее время с предыдущего кадра
     */
    handleMovement(deltaTime) {
        if (!this.input) return;
        
        // Получаем направление движения
        const moveDir = this.input.getMovementDirection();
        
        // Если вектор движения нулевой, снижаем скорость
        if (moveDir.x === 0 && moveDir.z === 0) {
            // Применяем трение для плавной остановки
            this.velocity.x *= 0.9;
            this.velocity.z *= 0.9;
            
            // Если скорость совсем маленькая, останавливаемся
            if (Math.abs(this.velocity.x) < 0.01 && Math.abs(this.velocity.z) < 0.01) {
                this.velocity.x = 0;
                this.velocity.z = 0;
                this.isMoving = false;
            }
        } else {
            // Устанавливаем флаг движения
            this.isMoving = true;
            
            // Вычисляем целевую скорость с учетом нормализации
            const length = Math.sqrt(moveDir.x * moveDir.x + moveDir.z * moveDir.z);
            const normalizedDir = {
                x: moveDir.x / length,
                z: moveDir.z / length
            };
            
            const targetVel = {
                x: normalizedDir.x * this.speed,
                z: normalizedDir.z * this.speed
            };
            
            // Плавно изменяем скорость
            this.velocity.x += (targetVel.x - this.velocity.x) * this.acceleration * deltaTime;
            this.velocity.z += (targetVel.z - this.velocity.z) * this.acceleration * deltaTime;
        }
        
        // Вычисляем новую позицию
        const newX = this.position.x + this.velocity.x * deltaTime;
        const newZ = this.position.z + this.velocity.z * deltaTime;
        
        // Проверка столкновений (упрощенная)
        const canMoveX = this.checkCollision({ x: newX, y: this.position.y, z: this.position.z });
        const canMoveZ = this.checkCollision({ x: this.position.x, y: this.position.y, z: newZ });
        
        // Обновляем позицию
        if (canMoveX) {
            this.position.x = newX;
        } else {
            this.velocity.x = 0; // Остановка при столкновении
        }
        
        if (canMoveZ) {
            this.position.z = newZ;
        } else {
            this.velocity.z = 0; // Остановка при столкновении
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
        const mapSize = 500; // Половина размера карты (1000x1000)
        
        if (Math.abs(newPosition.x) > mapSize || Math.abs(newPosition.z) > mapSize) {
            return false;
        }
        
        // Здесь должна быть проверка столкновений с объектами
        // В прототипе используем только границы карты
        
        return true;
    }
    
    /**
     * Создание выстрела (визуально и логически)
     */
    createShot() {
        // В прототипе создаем простой луч
        if (this.renderer && this.renderer.scene) {
            const rayStart = { ...this.position };
            rayStart.y += 1; // Уровень "глаз"
            
            const rayEnd = {
                x: rayStart.x + this.direction.x * 100,
                y: rayStart.y,
                z: rayStart.z + this.direction.z * 100
            };
            
            // Создаем временный луч для визуализации выстрела
            this.renderer.createTemporaryBeam(rayStart, rayEnd, 0xFF0000, 100);
            
            console.log('Выстрел!', this.direction);
        }
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
     * Получение угла обзора
     * @returns {number} - текущий угол обзора в градусах
     */
    getViewAngle() {
        return this.viewAngle;
    }
    
    /**
     * Получение дальности обзора
     * @returns {number} - текущая дальность обзора
     */
    getViewDistance() {
        return this.viewDistance;
    }
    
    /**
     * Получение направления взгляда
     * @returns {Object} - вектор направления {x, z}
     */
    getViewDirection() {
        return { ...this.direction };
    }
}