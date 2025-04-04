import { GameCore } from './gameCore.js';
import * as RAPIER from '@dimforge/rapier3d';

// Инициализация Rapier перед запуском игры
await RAPIER.init();

export class Game extends GameCore {
  static RAPIER = RAPIER; // 👈 если хочешь передавать его в другие модули
}