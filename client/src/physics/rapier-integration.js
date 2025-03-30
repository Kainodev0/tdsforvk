/**
 * Модуль для инициализации и интеграции Rapier.js
 */

// Максимальное время ожидания инициализации RAPIER в миллисекундах
const MAX_WAIT_TIME = 10000;

/**
 * Инициализация Rapier.js
 * @returns {Promise} - промис, который разрешается, когда Rapier.js инициализирован
 */
export async function initRapier() {
    console.log('Начинаем инициализацию Rapier.js...');
    
    // Проверяем, загружен ли уже Rapier.js
    if (typeof RAPIER !== 'undefined') {
        // Проверяем, был ли RAPIER уже инициализирован
        if (RAPIER._initialized) {
            console.log('Rapier.js уже инициализирован');
            return RAPIER;
        }
        
        // Если RAPIER загружен, но не инициализирован, инициализируем его
        if (typeof RAPIER.init === 'function') {
            try {
                console.log('Инициализируем Rapier.js через RAPIER.init()');
                await RAPIER.init();
                RAPIER._initialized = true;
                console.log('Rapier.js успешно инициализирован');
                return RAPIER;
            } catch (error) {
                console.error('Ошибка при инициализации Rapier.js:', error);
                throw error;
            }
        } else {
            // Если init не существует, возможно, это уже рабочий экземпляр RAPIER
            console.log('Rapier.js уже загружен из глобального объекта');
            RAPIER._initialized = true;
            return RAPIER;
        }
    }
    
    try {
        // Проверяем, доступен ли RAPIER в window
        if (typeof window !== 'undefined' && window.RAPIER) {
            // Если RAPIER существует в window, проверяем, нужно ли его инициализировать
            if (typeof window.RAPIER.init === 'function' && !window.RAPIER._initialized) {
                console.log('Инициализируем Rapier.js из window.RAPIER');
                await window.RAPIER.init();
                window.RAPIER._initialized = true;
                console.log('window.RAPIER успешно инициализирован');
            } else {
                console.log('Используем готовый Rapier.js из window.RAPIER');
                window.RAPIER._initialized = true;
            }
            return window.RAPIER;
        }
        
        console.log('Rapier.js не найден в глобальном пространстве имен, ждем загрузки...');
        
        // Ожидаем, что RAPIER будет загружен и инициализирован с таймаутом
        return await waitForRapierWithTimeout(MAX_WAIT_TIME);
    } catch (error) {
        console.error('Не удалось инициализировать Rapier.js:', error.message);
        
        // Возвращаем заглушку для предотвращения критических ошибок
        return createRapierStub();
    }
}

/**
 * Ожидание загрузки и инициализации RAPIER с таймаутом
 * @param {number} maxWaitTime - максимальное время ожидания в мс
 * @returns {Promise} - промис, который разрешается с объектом RAPIER или отклоняется по таймауту
 */
async function waitForRapierWithTimeout(maxWaitTime) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 20;
        const checkInterval = 300; // ms
        const startTime = Date.now();
        
        const checkRapier = () => {
            attempts++;
            const currentTime = Date.now();
            
            // Проверяем, не превышен ли таймаут
            if (currentTime - startTime > maxWaitTime) {
                reject(new Error(`Таймаут ожидания инициализации RAPIER (${maxWaitTime}ms)`));
                return;
            }
            
            // Проверяем глобальный RAPIER
            if (typeof RAPIER !== 'undefined') {
                if (typeof RAPIER.init === 'function' && !RAPIER._initialized) {
                    console.log(`RAPIER найден, нужна инициализация (попытка ${attempts})`);
                    RAPIER.init().then(() => {
                        console.log('RAPIER успешно инициализирован');
                        RAPIER._initialized = true;
                        resolve(RAPIER);
                    }).catch(error => {
                        console.error('Ошибка инициализации RAPIER:', error);
                        reject(error);
                    });
                    return;
                } else {
                    console.log(`RAPIER найден и готов (попытка ${attempts})`);
                    RAPIER._initialized = true;
                    resolve(RAPIER);
                    return;
                }
            }
            
            // Проверяем window.RAPIER
            if (typeof window !== 'undefined' && window.RAPIER) {
                if (typeof window.RAPIER.init === 'function' && !window.RAPIER._initialized) {
                    console.log(`window.RAPIER найден, нужна инициализация (попытка ${attempts})`);
                    window.RAPIER.init().then(() => {
                        console.log('window.RAPIER успешно инициализирован');
                        window.RAPIER._initialized = true;
                        resolve(window.RAPIER);
                    }).catch(error => {
                        console.error('Ошибка инициализации window.RAPIER:', error);
                        reject(error);
                    });
                    return;
                } else {
                    console.log(`window.RAPIER найден и готов (попытка ${attempts})`);
                    window.RAPIER._initialized = true;
                    resolve(window.RAPIER);
                    return;
                }
            }
            
            if (attempts >= maxAttempts) {
                console.warn(`RAPIER не загрузился после ${maxAttempts} попыток, но продолжаем попытки в пределах таймаута...`);
            }
            
            setTimeout(checkRapier, checkInterval);
        };
        
        checkRapier();
    });
}

/**
 * Создание заглушки для Rapier.js
 * @returns {Object} - заглушка с базовыми методами
 */
function createRapierStub() {
    console.warn('Создание заглушки Rapier.js. Физика НЕ будет работать корректно!');
    
    return {
        _initialized: true,
        World: class StubWorld {
            constructor() {
                console.warn('Используется заглушка World вместо настоящего Rapier.js');
                this.bodies = [];
                this.colliders = [];
            }
            
            step() {
                console.log('Симуляция шага физики в заглушке');
            }
            
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
    return (typeof RAPIER !== 'undefined' && RAPIER._initialized) || 
           (typeof window !== 'undefined' && window.RAPIER && window.RAPIER._initialized);
}

/**
 * Получение экземпляра Rapier.js
 * @returns {Object|null} - объект Rapier.js или null, если он не загружен
 */
export function getRapier() {
    if (typeof RAPIER !== 'undefined' && RAPIER._initialized) {
        return RAPIER;
    }
    
    if (typeof window !== 'undefined' && window.RAPIER && window.RAPIER._initialized) {
        return window.RAPIER;
    }
    
    return null;
}