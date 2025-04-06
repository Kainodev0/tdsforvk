console.log('📦 game.js загружен');

import { GameCore } from './gameCore.js';
import * as RAPIER from '@dimforge/rapier3d';

console.log('✅ Rapier 3D модуль загружен');

export class Game extends GameCore {
  static RAPIER = RAPIER;
}

const launchGame = () => {
  console.log('🚀 DOM загружен. Запускаем игру...');
  window.game = new Game();
};

launchGame(); // 👈 Явный вызов
