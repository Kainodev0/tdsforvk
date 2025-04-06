// client/src/physics/rapier-integration.js

import * as RAPIER from '@dimforge/rapier3d';

/**
 * Простая инициализация — для совместимости с PhysicsManager
 */
export async function initRapier() {
  console.log('🔄 initRapier: Rapier 3D загружен напрямую, инициализация не требуется');
  return RAPIER;
}