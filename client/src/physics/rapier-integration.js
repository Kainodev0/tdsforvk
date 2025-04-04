// client/src/physics/rapier-integration.js

import * as RAPIER from '@dimforge/rapier3d';

/**
 * Инициализация Rapier.js и возврат API
 * @returns {Promise<Object>} - модуль RAPIER после инициализации
 */
export async function initRapier() {
    console.log('🛠 Инициализация Rapier 3D через модуль...');
    await RAPIER.init();
    console.log('✅ Rapier 3D инициализирован');
    return RAPIER;
}

/**
 * Получение готового объекта RAPIER (если он уже инициализирован)
 */
export function getRapier() {
    return RAPIER;
}
