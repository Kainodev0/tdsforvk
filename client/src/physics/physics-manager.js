/**
 * Менеджер физики, отвечающий за инициализацию и управление физикой игры
 * Использует Rapier.js для физических расчетов
 */
import { initRapier } from './rapier-integration.js';

export class PhysicsManager {
    constructor() {
        this.world = null; // Физический мир Rapier
        this.bodies = new Map(); // Карта физических тел
        this.colliders = new Map(); // Карта коллайдеров
        this.isInitialized = false; // Флаг инициализации
        this.RAPIER = null; // Ссылка на объект RAPIER
        this.initPromise = null; // Промис инициализации
    }

    /**
     * Инициализация физики
     * @returns {Promise} - промис, который разрешается, когда физика инициализирована
     */
    async init() {
        // Если инициализация уже началась, возвращаем существующий промис
        if (this.initPromise) {
            return this.initPromise;
        }

        // Создаем промис инициализации
        this.initPromise = new Promise(async (resolve) => {
            try {
                console.log('PhysicsManager: начало инициализации...');
                
                // Инициализируем Rapier.js
                this.RAPIER = await initRapier();
                

                // Инициализируем физический мир
                console.log('PhysicsManager: создание физического мира...');
                
                // Создаем мир с гравитацией (0, -9.81, 0)
                const gravity = { x: 0.0, y: -9.81, z: 0.0 };
                
                // Проверяем, правильный ли формат конструктора
                if (typeof this.RAPIER.World === 'function') {
                    this.world = new this.RAPIER.World(gravity);
                } else if (typeof this.RAPIER.World?.new === 'function') {
                    // Альтернативный синтаксис для некоторых версий
                    this.world = this.RAPIER.World.new(gravity);
                } else {
                    console.error('PhysicsManager: не удалось создать физический мир. Неподдерживаемый API.');
                    resolve(false);
                    return;
                }
                
                // Устанавливаем флаг инициализации
                this.isInitialized = true;
                
                console.log('PhysicsManager: физический движок успешно инициализирован.');
                resolve(true);
            } catch (error) {
                console.error('PhysicsManager: ошибка при инициализации физики:', error);
                this.isInitialized = false;
                resolve(false);
            }
        });

        return this.initPromise;
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
        
        try {
            // Шаг физической симуляции
            if (typeof this.world.step === 'function') {
                this.world.step();
            } else if (typeof this.world.timestep === 'function') {
                // Альтернативный метод для некоторых версий API
                this.world.timestep(deltaTime || 1/60);
            }
            
            // Обновление позиций объектов на основе физики
            this.updateBodies();
        } catch (error) {
            console.error('PhysicsManager: ошибка при обновлении физики:', error);
        }
    }

    /**
     * Обновление позиций объектов на основе физики
     */
    updateBodies() {
        try {
            // Для каждого физического тела обновляем позицию соответствующего 3D объекта
            for (let [object, body] of this.bodies) {
                if (object && object.position && body) {
                    let position;
                    
                    // Получаем позицию в зависимости от API
                    if (typeof body.translation === 'function') {
                        position = body.translation();
                    } else if (typeof body.getTranslation === 'function') {
                        position = body.getTranslation();
                    } else if (body.translation) {
                        position = body.translation;
                    } else {
                        continue; // Пропускаем, если не можем получить позицию
                    }
                    
                    // Обновляем позицию 3D объекта
                    object.position.set(position.x, position.y, position.z);
                    
                    // Если у объекта есть метод обновления позиции, вызываем его
                    if (typeof object.updatePhysics === 'function') {
                        object.updatePhysics(body);
                    }
                }
            }
        } catch (error) {
            console.error('PhysicsManager: ошибка при обновлении позиций объектов:', error);
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
        
        try {
            const position = options.position || { x: 0, y: 0, z: 0 };
            const size = options.size || { x: 1, y: 1, z: 1 };
            
            // Создаем жесткое тело
            let rigidBodyDesc;
            if (typeof this.RAPIER.RigidBodyDesc.fixed === 'function') {
                rigidBodyDesc = this.RAPIER.RigidBodyDesc.fixed()
                    .setTranslation(position.x, position.y, position.z);
            } else {
                // Альтернативный синтаксис
                rigidBodyDesc = new this.RAPIER.RigidBodyDesc(this.RAPIER.RigidBodyType.Fixed);
                rigidBodyDesc.translation = { x: position.x, y: position.y, z: position.z };
            }
            
            const rigidBody = this.world.createRigidBody(rigidBodyDesc);
            
            // Создаем коллайдер в форме прямоугольника
            let colliderDesc;
            if (typeof this.RAPIER.ColliderDesc.cuboid === 'function') {
                colliderDesc = this.RAPIER.ColliderDesc.cuboid(
                    size.x / 2, size.y / 2, size.z / 2
                );
            } else {
                // Альтернативный синтаксис
                colliderDesc = new this.RAPIER.ColliderDesc(
                    new this.RAPIER.Cuboid(size.x / 2, size.y / 2, size.z / 2)
                );
            }
            
            const collider = this.world.createCollider(colliderDesc, rigidBody);
            
            // Если передан 3D объект, сохраняем его связь с физическим телом
            if (options.object) {
                this.bodies.set(options.object, rigidBody);
                this.colliders.set(options.object, collider);
            }
            
            return collider;
        } catch (error) {
            console.error('PhysicsManager: ошибка при создании препятствия:', error);
            return null;
        }
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
        
        try {
            const position = options.position || { x: 0, y: 0, z: 0 };
            const radius = options.radius || 0.5;
            const height = options.height || 1.8;
            
            // Создаем жесткое тело
            let rigidBodyDesc;
            if (typeof this.RAPIER.RigidBodyDesc.dynamic === 'function') {
                rigidBodyDesc = this.RAPIER.RigidBodyDesc.dynamic()
                    .setTranslation(position.x, position.y, position.z)
                    .setCanSleep(false) // Тело всегда активно
                    .setLinearDamping(0.2); // Добавляем затухание для более плавного движения
            } else {
                // Альтернативный синтаксис
                rigidBodyDesc = new this.RAPIER.RigidBodyDesc(this.RAPIER.RigidBodyType.Dynamic);
                rigidBodyDesc.translation = { x: position.x, y: position.y, z: position.z };
                rigidBodyDesc.canSleep = false;
                rigidBodyDesc.linearDamping = 0.2;
            }
            
            const rigidBody = this.world.createRigidBody(rigidBodyDesc);
            
            // Создаем коллайдер в форме капсулы
            let colliderDesc;
            if (typeof this.RAPIER.ColliderDesc.capsule === 'function') {
                colliderDesc = this.RAPIER.ColliderDesc.capsule(
                    height / 2 - radius, // половина высоты без учета полусфер
                    radius // радиус
                );
            } else {
                // Альтернативный синтаксис
                colliderDesc = new this.RAPIER.ColliderDesc(
                    new this.RAPIER.Capsule(height / 2 - radius, radius)
                );
            }
            
            const collider = this.world.createCollider(colliderDesc, rigidBody);
            
            // Если передан 3D объект, сохраняем его связь с физическим телом
            if (options.object) {
                this.bodies.set(options.object, rigidBody);
                this.colliders.set(options.object, collider);
            }
            
            return rigidBody;
        } catch (error) {
            console.error('PhysicsManager: ошибка при создании персонажа:', error);
            return null;
        }
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
        
        try {
            // Создаем луч
            let ray;
            if (typeof this.RAPIER.Ray === 'function') {
                ray = new this.RAPIER.Ray(origin, direction);
            } else {
                // Альтернативный синтаксис для объектных параметров
                ray = { origin, direction };
            }
            
            // Выполняем рейкаст
            if (typeof this.world.castRay === 'function') {
                return this.world.castRay(ray, maxDistance, true);
            } else if (typeof this.world.castRayAndGetNormal === 'function') {
                return this.world.castRayAndGetNormal(origin, direction, maxDistance, true);
            } else {
                console.warn('PhysicsManager: метод рейкаста не доступен');
                return null;
            }
        } catch (error) {
            console.error('PhysicsManager: ошибка при выполнении рейкаста:', error);
            return null;
        }
    }
    
    /**
     * Создание неподвижного препятствия в виде плоскости (например, пол)
     * @param {Object} options - параметры плоскости
     * @param {Object} options.normal - нормаль к плоскости {x, y, z}
     * @param {number} options.offset - смещение от начала координат
     * @returns {Object} - созданный коллайдер
     */
    createGround(options = {}) {
        if (!this.isReady()) return null;
        
        try {
            const normal = options.normal || { x: 0, y: 1, z: 0 }; // По умолчанию вверх
            const offset = options.offset || 0;
            
            // Создаем жесткое тело
            let rigidBodyDesc;
            if (typeof this.RAPIER.RigidBodyDesc.fixed === 'function') {
                rigidBodyDesc = this.RAPIER.RigidBodyDesc.fixed();
            } else {
                // Альтернативный синтаксис
                rigidBodyDesc = new this.RAPIER.RigidBodyDesc(this.RAPIER.RigidBodyType.Fixed);
            }
            
            const rigidBody = this.world.createRigidBody(rigidBodyDesc);
            
            // Создаем коллайдер в форме плоскости
            let colliderDesc;
            if (typeof this.RAPIER.ColliderDesc.halfspace === 'function') {
                colliderDesc = this.RAPIER.ColliderDesc.halfspace(normal, offset);
            } else {
                // Альтернативный синтаксис для Plane или HalfSpace
                colliderDesc = new this.RAPIER.ColliderDesc(
                    new this.RAPIER.HalfSpace(normal, offset)
                );
            }
            
            return this.world.createCollider(colliderDesc, rigidBody);
        } catch (error) {
            console.error('PhysicsManager: ошибка при создании плоскости:', error);
            return null;
        }
    }
    
    /**
     * Удаление физического тела
     * @param {Object} object - 3D объект, связанный с физическим телом
     */
    removeBody(object) {
        try {
            if (this.bodies.has(object)) {
                const body = this.bodies.get(object);
                this.world.removeRigidBody(body);
                this.bodies.delete(object);
            }
            
            if (this.colliders.has(object)) {
                this.colliders.delete(object);
            }
        } catch (error) {
            console.error('PhysicsManager: ошибка при удалении тела:', error);
        }
    }
    
    /**
     * Освобождение ресурсов
     */
    dispose() {
        try {
            // Очищаем все коллекции
            this.bodies.clear();
            this.colliders.clear();
            
            // Уничтожаем физический мир
            if (this.world) {
                // У некоторых версий Rapier.js есть метод free() для освобождения ресурсов
                if (typeof this.world.free === 'function') {
                    this.world.free();
                }
                this.world = null;
            }
            
            this.isInitialized = false;
            this.initPromise = null;
            console.log('PhysicsManager: ресурсы освобождены');
        } catch (error) {
            console.error('PhysicsManager: ошибка при освобождении ресурсов:', error);
        }
    }
}