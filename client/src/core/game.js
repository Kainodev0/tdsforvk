import { GameCore } from './gameCore.js';
import * as RAPIER from '@dimforge/rapier3d';

// Нет необходимости в init() — он не существует в этом пакете
console.log('✅ Rapier 3D модуль загружен');

export class Game extends GameCore {
  static RAPIER = RAPIER;
}