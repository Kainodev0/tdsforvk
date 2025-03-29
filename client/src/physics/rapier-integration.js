/**
 * Модуль для инициализации и интеграции Rapier.js
 */

/**
 * Инициализация Rapier.js
 * @returns {Promise} - промис, который разрешается, когда Rapier.js инициализирован
 */
export async function initRapier() {
    console.log('Начинаем инициализацию Rapier.js...');
    
    // Проверяем, загружен ли уже Rapier.js
    if (typeof RAPIER !== 'undefined') {
        console.log('Rapier.js уже загружен из глобального объекта');
        return RAPIER;
    }
    
    try {
        // Пытаемся загрузить из глобального пространства имен (CDN)
        // Проверяем, доступен ли RAPIER в window
        if (typeof window !== 'undefined' && window.RAPIER) {
            console.log('Используем Rapier.js из window.RAPIER');
            return window.RAPIER;
        }
        
        // Если метод init существует, вызываем его
        if (typeof RAPIER !== 'undefined' && typeof RAPIER.init === 'function') {
            console.log('Инициализируем Rapier.js через RAPIER.init()');
            await RAPIER.init();
            return RAPIER;
        }
        
        throw new Error('Rapier.js не найден в глобальном пространстве имен');
    } catch (initError) {
        console.warn('Не удалось инициализировать Rapier.js из глобального пространства:', initError);
        
        // Пробуем разные способы инициализации
        try {
            // Метод 1: Ожидаем глобальный объект RAPIER в течение определенного времени
            console.log('Пытаемся дождаться загрузки Rapier.js...');
            
            const waitForRapier = new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 10;
                const checkInterval = 300; // ms
                
                const checkRapier = () => {
                    attempts++;
                    if (typeof window.RAPIER !== 'undefined') {
                        console.log(`RAPIER найден после ${attempts} попыток`);
                        resolve(window.RAPIER);
                        return;
                    }
                    
                    if (attempts >= maxAttempts) {
                        reject(new Error(`RAPIER не загрузился после ${maxAttempts} попыток`));
                        return;
                    }
                    
                    setTimeout(checkRapier, checkInterval);
                };
                
                checkRapier();
            });
            
            return await waitForRapier;
        } catch (error) {
            console.error('Все попытки инициализации Rapier.js завершились неудачей:', error);
            
            // Возвращаем заглушку для предотвращения критических ошибок
            return createRapierStub();
        }
    }
}

/**
 * Создание заглушки для Rapier.js
 * @returns {Object} - заглушка с базовыми методами
 */
function createRapierStub() {
    console.warn('Создание заглушки Rapier.js. Физика НЕ будет работать корректно!');
    
    return {
        World: class StubWorld {
            constructor() {
                console.warn('Используется заглушка World вместо настоящего Rapier.js');
                this.bodies = [];
                this.colliders = [];
            }
            
            step() {}
            
            createRigidBody() {
                return {
                    translation: () => ({ x: 0, y: 0, z: 0 }),
                    setTranslation: () => {}
                };
            }
            
            createCollider() {
                return {};
            }
            
            castRay() {
                return null;
            }
            
            castRayAndGetNormal() {
                return { hasHit: false, toi: 0 };
            }
        },
        RigidBodyDesc: {
            fixed: () => ({
                setTranslation: () => ({})
            }),
            dynamic: () => ({
                setTranslation: () => ({}),
                setCanSleep: () => ({}),
                setLinearDamping: () => ({})
            })
        },
        ColliderDesc: {
            cuboid: () => ({}),
            capsule: () => ({})
        },
        Ray: class StubRay {
            constructor(origin, dir) {
                this.origin = origin;
                this.dir = dir;
            }
        }
    };
}

/**
 * Проверка доступности Rapier.js
 * @returns {boolean} - результат проверки
 */
export function isRapierAvailable() {
    return typeof RAPIER !== 'undefined' || 
           (typeof window !== 'undefined' && window.RAPIER);
}

/**
 * Получение экземпляра Rapier.js
 * @returns {Object|null} - объект Rapier.js или null, если он не загружен
 */
export function getRapier() {
    if (typeof RAPIER !== 'undefined') {
        return RAPIER;
    }
    
    if (typeof window !== 'undefined' && window.RAPIER) {
        return window.RAPIER;
    }
    
    return null;
}