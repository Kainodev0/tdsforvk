/**
 * Класс NPC (Non-Player Character) для управления ИИ-противниками
 */
export class NPC {
    /**
     * @param {Object} options - настройки NPC
     * @param {string} options.id - идентификатор NPC
     * @param {Object} options.position - начальная позиция
     * @param {string} options.type - тип NPC (enemy, neutral)
     * @param {Object} options.renderer - ссылка на рендерер
     * @param {Object} options.game - ссылка на игровой объект
     */
    constructor(options) {
        // Базовые параметры
        this.id = options.id || `npc_${Date.now()}`;
        this.type = options.type || 'enemy';
        
        // Позиция и вращение
        this.position = options.position || { x: 0, y: 0, z: 0 };
        this.rotation = options.rotation || { x: 0, y: 0, z: 0 };
        this.targetPosition = { ...this.position }; // Целевая точка движения
        
        // Характеристики
        this.health = options.health || 100;
        this.maxHealth = options.maxHealth || 100;
        this.speed = options.speed || 2; // скорость движения
        this.attackRange = options.attackRange || 10; // дистанция атаки
        this.attackDamage = options.attackDamage || 10; // урон
        this.attackCooldown = options.attackCooldown || 2000; // задержка между атаками в мс
        this.lastAttackTime = 0;
        
        // Состояния
        this.isMoving = false;
        this.isAttacking = false;
        this.isDead = false;
        
        // ИИ параметры
        this.aiState = 'idle'; // idle, patrol, chase, attack
        this.alertness = 0; // от 0 до 100, где 100 - полная тревога
        this.lastStateChangeTime = Date.now();
        this.patrolPoints = options.patrolPoints || []; // точки патрулирования
        this.currentPatrolIndex = 0;
        
        // Ссылки на другие модули
        this.renderer = options.renderer;
        this.game = options.game;
        this.mesh = null; // будет инициализирован при создании модели
        
        // Создаем модель NPC
        this.createModel();
    }
    
    /**
     * Создание модели NPC
     */
    createModel() {
        // Если рендерер не доступен, выходим
        if (!this.renderer) return;
        
        // Создаем меш через рендерер
        this.mesh = this.renderer.addNPC({
            id: this.id,
            position: this.position,
            type: this.type
        });
    }
    
    /**
     * Обновление состояния NPC
     * @param {number} deltaTime - прошедшее время с предыдущего кадра
     * @param {Object} playerPosition - позиция игрока для реакции
     */
    update(deltaTime, playerPosition) {
        if (!deltaTime || this.isDead) return;
        
        // Обновляем ИИ
        this.updateAI(deltaTime, playerPosition);
        
        // Обновляем движение
        this.updateMovement(deltaTime);
        
        // Обновляем модель (позицию и анимацию)
        this.updateModel();
    }
    
    /**
     * Обновление ИИ NPC
     * @param {number} deltaTime - прошедшее время с предыдущего кадра
     * @param {Object} playerPosition - позиция игрока для реакции
     */
    updateAI(deltaTime, playerPosition) {
        // Если нет позиции игрока, продолжаем текущее поведение
        if (!playerPosition) {
            this.continueBehavior(deltaTime);
            return;
        }
        
        // Проверяем видимость игрока
        const canSeePlayer = this.checkLineOfSight(playerPosition);
        
        // Вычисляем расстояние до игрока
        const distanceToPlayer = this.calculateDistance(this.position, playerPosition);
        
        // Обновляем уровень тревоги
        if (canSeePlayer) {
            // Если видим игрока, увеличиваем тревогу
            this.alertness = Math.min(100, this.alertness + 50 * deltaTime);
        } else {
            // Если не видим, медленно уменьшаем
            this.alertness = Math.max(0, this.alertness - 10 * deltaTime);
        }
        
        // Определяем новое состояние на основе тревоги и расстояния
        if (this.alertness > 70) {
            // В состоянии тревоги
            if (distanceToPlayer <= this.attackRange) {
                // Если игрок в зоне атаки
                this.aiState = 'attack';
                this.targetPosition = { ...playerPosition };
            } else {
                // Преследуем игрока
                this.aiState = 'chase';
                this.targetPosition = { ...playerPosition };
            }
        } else if (this.alertness > 30) {
            // Подозрительное состояние - идем к последней известной позиции игрока
            this.aiState = 'investigate';
            this.targetPosition = { ...playerPosition };
        } else {
            // Спокойное состояние - патрулируем
            if (this.aiState !== 'patrol') {
                this.aiState = 'patrol';
                this.setNextPatrolPoint();
            }
        }
        
        // Если мы в состоянии атаки и игрок в зоне досягаемости, атакуем
        if (this.aiState === 'attack' && distanceToPlayer <= this.attackRange) {
            this.attackPlayer();
        }
        
        // Проверяем, достигли ли мы целевой точки
        if (this.calculateDistance(this.position, this.targetPosition) < 1) {
            if (this.aiState === 'patrol') {
                // Переходим к следующей точке патрулирования
                this.setNextPatrolPoint();
            } else if (this.aiState === 'investigate') {
                // После расследования переходим к патрулированию
                this.aiState = 'patrol';
                this.setNextPatrolPoint();
            }
        }
    }
    
    /**
     * Продолжение текущего поведения без новой информации
     * @param {number} deltaTime - прошедшее время с предыдущего кадра
     */
    continueBehavior(deltaTime) {
        // Если мы патрулируем, проверяем достижение точки
        if (this.aiState === 'patrol') {
            // Если достигли целевой точки, переходим к следующей
            if (this.calculateDistance(this.position, this.targetPosition) < 1) {
                this.setNextPatrolPoint();
            }
        } else if (this.aiState === 'idle') {
            // Если в простое, периодически выбираем новое действие
            const now = Date.now();
            if (now - this.lastStateChangeTime > 5000) {
                // Переключаемся между простоем и патрулированием
                this.aiState = 'patrol';
                this.setNextPatrolPoint();
                this.lastStateChangeTime = now;
            }
        }
    }
    
    /**
     * Установка следующей точки патрулирования
     */
    setNextPatrolPoint() {
        // Если есть заданные точки патрулирования, используем их
        if (this.patrolPoints.length > 0) {
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
            this.targetPosition = { ...this.patrolPoints[this.currentPatrolIndex] };
        } else {
            // Иначе генерируем случайную точку вокруг текущей позиции
            const randomRadius = 10 + Math.random() * 10;
            const randomAngle = Math.random() * Math.PI * 2;
            
            this.targetPosition = {
                x: this.position.x + Math.cos(randomAngle) * randomRadius,
                y: this.position.y,
                z: this.position.z + Math.sin(randomAngle) * randomRadius
            };
            
            // Не выходим за пределы карты
            const mapSize = 45; // Половина размера карты
            this.targetPosition.x = Math.max(-mapSize, Math.min(mapSize, this.targetPosition.x));
            this.targetPosition.z = Math.max(-mapSize, Math.min(mapSize, this.targetPosition.z));
        }
    }
    
    /**
     * Проверка прямой видимости до цели
     * @param {Object} targetPosition - позиция цели
     * @returns {boolean} - видна ли цель
     */
    checkLineOfSight(targetPosition) {
        // В прототипе просто проверяем расстояние
        const viewDistance = 20; // максимальная дистанция обзора
        const distance = this.calculateDistance(this.position, targetPosition);
        
        return distance <= viewDistance;
        
        // В реальной игре здесь будет raycast для проверки препятствий
    }
    
    /**
     * Вычисление расстояния между двумя точками
     * @param {Object} point1 - первая точка {x, y, z}
     * @param {Object} point2 - вторая точка {x, y, z}
     * @returns {number} - расстояние
     */
    calculateDistance(point1, point2) {
        const dx = point2.x - point1.x;
        const dz = point2.z - point1.z;
        
        return Math.sqrt(dx * dx + dz * dz);
    }
    
    /**
     * Атака игрока
     */
    attackPlayer() {
        const now = Date.now();
        
        // Проверяем кулдаун атаки
        if (now - this.lastAttackTime < this.attackCooldown) {
            return;
        }
        
        // Запоминаем время атаки
        this.lastAttackTime = now;
        
        // Устанавливаем флаг атаки (для анимации)
        this.isAttacking = true;
        setTimeout(() => {
            this.isAttacking = false;