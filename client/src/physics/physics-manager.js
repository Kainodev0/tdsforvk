/**
 * Менеджер физики, отвечающий за инициализацию и управление физикой игры
 * Использует Rapier.js для физических расчетов
 */
import { initRapier, isRapierAvailable, getRapier } from './rapier-integration.js';

export class PhysicsManager {
    constructor() {
        this.world = null; // Физический мир Rapier
        this.bodies = new Map(); // Карта физических тел
        this.colliders = new Map(); // Карта коллайдеров
        this.isInitialized = false; // Флаг инициализации
        this.RAPIER = null; // Ссылка на объект RAPIER
    }

    /**
     * Инициализация физики
     * @returns {Promise} - промис, который разрешается, когда физика инициализирована
     */
    async init() {
        try {
            // Инициализируем Rapier.js
            this.RAPIER = await initRapier();
            
            // Проверяем, доступен ли RAPIER
            if (!this.RAPIER && !isRapierAvailable()) {
                console.error('RAPIER не определен. Убедитесь, что библиотека загружена.');
                return false;
            }
            
            // Если RAPIER всё ещё не доступен, используем глобальный объект
            if (!this.RAPIER) {
                this.RAPIER = getRapier();
                if (!this.RAPIER) {
                    console.error('Не удалось получить объект RAPIER.');
                    return false;
                }
            }

            // Инициализируем RAPIER
            console.log('Инициализация физического движка Rapier.js...');
            
            // Создаем мир с гравитацией (0, -9.81, 0)
            const gravity = { x: 0.0, y: -9.81, z: 0.0 };
            this.world = new this.RAPIER.World(gravity);
            
            // Устанавливаем флаг инициализации
            this.isInitialized = true;
            
            console.log('Физический движок Rapier.js успешно инициализирован.');
            return true;
        } catch (error) {
            console.error('Ошибка при инициализации физики:', error);
            return false;
        }
    }

    /**
     * Проверка, инициализирован ли физический движок
     * @returns {boolean} - результат проверки
     */
    isReady() {
        return this.isInitialized && this.world !== null;
    }

    /**
     * Получение физического мира
     * @returns {Object} - физический мир Rapier
     */
    getWorld() {
        return this.world;
    }

    /**
     * Обновление физики
     * @param {number} deltaTime - время с последнего обновления в секундах
     */
    update(deltaTime) {
        if (!this.isReady()) return;
        
        // Шаг физической симуляции
        this.world.step();
        
        // Обновление позиций объектов на основе физики
        this.updateBodies();
    }

    /**
     * Обновление позиций объектов на основе физики
     */
    updateBodies() {
        // Для каждого физического тела обновляем позицию соответствующего 3D объекта
        for (let [object, body] of this.bodies) {
            if (object && object.position) {
                const position = body.translation();
                object.position.set(position.x, position.y, position.z);
                
                // Если у объекта есть метод обновления позиции, вызываем его
                if (typeof object.updatePhysics === 'function') {
                    object.updatePhysics(body);
                }
            }
        }
    }

    /**
     * Создание статического коллайдера для препятствия
     * @param {Object} options - параметры коллайдера
     * @param {Object} options.position - позиция коллайдера {x, y, z}
     * @param {Object} options.size - размеры коллайдера {x, y, z}
     * @param {Object} options.object - связанный 3D объект (опционально)
     * @returns {Object} - созданный коллайдер
     */
    createObstacle(options) {
        if (!this.isReady()) return null;
        
        const position = options.position || { x: 0, y: 0, z: 0 };
        const size = options.size || { x: 1, y: 1, z: 1 };
        
        // Создаем жесткое тело
        const rigidBodyDesc = this.RAPIER.RigidBodyDesc.fixed()
            .setTranslation(position.x, position.y, position.z);
        const rigidBody = this.world.createRigidBody(rigidBodyDesc);
        
        // Создаем коллайдер в форме прямоугольника
        const colliderDesc = this.RAPIER.ColliderDesc.cuboid(
            size.x / 2, size.y / 2, size.z / 2
        );
        const collider = this.world.createCollider(colliderDesc, rigidBody);
        
        // Если передан 3D объект, сохраняем его связь с физическим телом
        if (options.object) {
            this.bodies.set(options.object, rigidBody);
            this.colliders.set(options.object, collider);
        }
        
        return collider;
    }

    /**
     * Создание динамического тела для игрока или NPC
     * @param {Object} options - параметры тела
     * @param {Object} options.position - начальная позиция {x, y, z}
     * @param {number} options.radius - радиус коллайдера
     * @param {number} options.height - высота коллайдера
     * @param {Object} options.object - связанный 3D объект
     * @returns {Object} - созданное физическое тело
     */
    createCharacter(options) {
        if (!this.isReady()) return null;
        
        const position = options.position || { x: 0, y: 0, z: 0 };
        const radius = options.radius || 0.5;
        const height = options.height || 1.8;
        
        // Создаем жесткое тело
        const rigidBodyDesc = this.RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(position.x, position.y, position.z)
            .setCanSleep(false) // Тело всегда активно
            .setLinearDamping(0.2); // Добавляем затухание для более плавного движения
        
        const rigidBody = this.world.createRigidBody(rigidBodyDesc);
        
        // Создаем коллайдер в форме капсулы
        const colliderDesc = this.RAPIER.ColliderDesc.capsule(
            height / 2 - radius, // половина высоты без учета полусфер
            radius // радиус
        );
        const collider = this.world.createCollider(colliderDesc, rigidBody);
        
        // Если передан 3D объект, сохраняем его связь с физическим телом
        if (options.object) {
            this.bodies.set(options.object, rigidBody);
            this.colliders.set(options.object, collider);
        }
        
        return rigidBody;
    }
    
    /**
     * Выполнение рейкаста для проверки пересечения с объектами
     * @param {Object} origin - начальная точка луча {x, y, z}
     * @param {Object} direction - направление луча {x, y, z}
     * @param {number} maxDistance - максимальная дистанция
     * @returns {Object|null} - результат рейкаста или null, если нет пересечений
     */
    castRay(origin, direction, maxDistance = 100) {
        if (!this.isReady()) return null;
        
        // Создаем луч
        const ray = new this.RAPIER.Ray(origin, direction);
        
        // Выполняем рейкаст
        return this.world.castRay(ray, maxDistance, true);
    }
    
    /**
     * Освобождение ресурсов
     */
    dispose() {
        // Очищаем все коллекции
        this.bodies.clear();
        this.colliders.clear();
        
        // Уничтожаем физический мир
        if (this.world) {
            this.world = null;
        }
        
        this.isInitialized = false;
    }
}