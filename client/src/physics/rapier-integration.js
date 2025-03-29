/**
 * Модуль для инициализации и интеграции Rapier.js
 */

/**
 * Инициализация Rapier.js
 * @returns {Promise} - промис, который разрешается, когда Rapier.js инициализирован
 */
export async function initRapier() {
    // Проверяем, загружен ли уже Rapier.js
    if (typeof RAPIER !== 'undefined') {
        console.log('Rapier.js уже загружен');
        return RAPIER;
    }
    
    // Загружаем Rapier.js динамически
    try {
        // Для сборки через webpack
        const RAPIER = await import('@dimforge/rapier3d');
        // Инициализируем Rapier.js
        await RAPIER.init();
        console.log('Rapier.js успешно инициализирован');
        return RAPIER;
    } catch (error) {
        console.error('Ошибка при инициализации Rapier.js:', error);
        
        // Пытаемся загрузить из глобального пространства имен (CDN)
        if (typeof RAPIER !== 'undefined') {
            console.log('Используем глобальный Rapier.js');
            return RAPIER;
        }
        
        throw new Error('Не удалось загрузить Rapier.js');
    }
}

/**
 * Проверка доступности Rapier.js
 * @returns {boolean} - результат проверки
 */
export function isRapierAvailable() {
    return typeof RAPIER !== 'undefined';
}

/**
 * Получение экземпляра Rapier.js
 * @returns {Object|null} - объект Rapier.js или null, если он не загружен
 */
export function getRapier() {
    return typeof RAPIER !== 'undefined' ? RAPIER : null;
}