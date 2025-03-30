// client/src/core/GameWorld.js

import { Player } from '../entities/player.js';
import { VisionSystem } from '../physics/vision-system.js';
import { log } from './gameCore.js';

/**
 * Класс для управления игровым миром и сущностями
 */
export class GameWorld {
    /**
     * @param {Object} game - ссылка на основной класс игры
     */
    constructor(game) {
        this.game = game;
        
        // Сущности
        this.player = null;
        this.entities = [];
        
        // Системы
        this.visionSystem = null;
    }
    
    /**
     * Инициализация игрового мира
     */
    async initialize() {
        try {
            // Создание тестовых стен
            this.createTestWalls();
            
            // Создание игрока
            this.player = new Player({
                position: { x: 0, y: 0, z: 0 },
                renderer: this.game.renderer,
                input: this.game.input,
                game: this.game
            });
            
            log('Игрок создан');
            
            // Инициализация системы видимости
            await this.initVisionSystem();
            
            return true;
        } catch (error) {
            log(`Ошибка инициализации игрового мира: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Обновление игрового мира
     * @param {number} deltaTime - время между кадрами
     */
    update(deltaTime) {
        // Обновление игрока
        if (this.player) {
            this.player.update(deltaTime);
        }
        
        // Обновление других сущностей
        this.entities.forEach(entity => {
            if (entity.update) {
                entity.update(deltaTime);
            }
        });
    }
    
    /**
     * Фиксированное обновление для физики
     * @param {number} deltaTime - фиксированный временной шаг
     */
    fixedUpdate(deltaTime) {
        // Обновляем состояние сущностей (NPC и др.)
        this.entities.forEach(entity => {
            if (entity.fixedUpdate) {
                entity.fixedUpdate(deltaTime);
            }
        });
    }
    
    /**
     * Метод для инициализации системы видимости
     */
    async initVisionSystem() {
        try {
            if (!this.game.renderer || !this.game.renderer.scene || !this.player) {
                throw new Error('Не все компоненты доступны для инициализации системы видимости');
            }
            
            log('Инициализация системы видимости...');
            
            // Создаем систему видимости
            const visionSystem = new VisionSystem({
                scene: this.game.renderer.scene,
                world: this.game.physics.getWorld(),
                player: this.player,
                fov: 90, // Начальный угол обзора
                rayCount: 60, // Количество лучей
                maxDistance: 50, // Максимальная дистанция видимости
                memoryEnabled: true, // Запоминать посещенные области
                blurEdges: true // Размытие краев видимости
            });
            
            // Дожидаемся инициализации системы видимости
            await visionSystem.init();
            
            // Проверяем готовность системы
            if (!visionSystem.isReady()) {
                log('Система видимости не готова, но будет инициализирована позже автоматически');
            }
            
            // Сохраняем систему видимости в рендерере
            this.game.renderer.visionSystem = visionSystem;
            this.visionSystem = visionSystem;
            
            log('Система видимости инициализирована');
            return true;
        } catch (error) {
            log(`Ошибка инициализации системы видимости: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Метод для создания тестовых стен
     */
    createTestWalls() {
        try {
            if (!this.game.physics || !this.game.physics.isReady() || !this.game.renderer || !this.game.renderer.scene) {
                log('Физика или рендерер не готовы для создания стен');
                return;
            }
            
            log('Создание тестовых стен...');
            
            // Создаем материал для стен
            const wallMaterial = new THREE.MeshStandardMaterial({
                color: 0x808080,
                roughness: 0.7,
                metalness: 0.2
            });
            
            // Функция для создания стены
            const createWall = (x, z, width, depth, height = 3) => {
                // Создаем геометрию
                const geometry = new THREE.BoxGeometry(width, height, depth);
                const mesh = new THREE.Mesh(geometry, wallMaterial);
                
                // Устанавливаем позицию
                mesh.position.set(x, height / 2, z);
                
                // Добавляем на сцену
                this.game.renderer.scene.add(mesh);
                
                // Создаем физический коллайдер
                this.game.physics.createObstacle({
                    position: { x, y: height / 2, z },
                    size: { x: width, y: height, z: depth },
                    object: mesh
                });
                
                return mesh;
            };
            
            // Создаем стены лабиринта
            // Горизонтальные стены (границы)
            createWall(0, -20, 40, 1);
            createWall(-20, 0, 1, 40);
            createWall(20, 0, 1, 40);
            createWall(0, 20, 40, 1);
            
            // Внутренние стены
            createWall(-10, -10, 1, 20);
            createWall(10, 10, 20, 1);
            createWall(10, -5, 1, 10);
            createWall(-5, 5, 10, 1);
            
            // Препятствия
            createWall(-15, -15, 3, 3);
            createWall(15, -15, 3, 3);
            createWall(15, 15, 3, 3);
            createWall(-15, 15, 3, 3);
            
            log('Тестовые стены созданы');
        } catch (error) {
            log(`Ошибка создания тестовых стен: ${error.message}`);
        }
    }
    
    /**
     * Добавление сущности в игру
     * @param {Object} entity - сущность для добавления
     */
    addEntity(entity) {
        this.entities.push(entity);
    }
    
    /**
     * Удаление сущности из игры
     * @param {Object} entity - сущность для удаления
     */
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }
    }
    
    /**
     * Очистка игрового мира
     */
    clear() {
        // Удаляем все сущности
        this.entities = [];
        
        // Удаляем игрока
        this.player = null;
        
        // Очищаем системы
        if (this.visionSystem) {
            this.visionSystem.dispose();
            this.visionSystem = null;
        }
        
        if (this.game.renderer && this.game.renderer.visionSystem) {
            this.game.renderer.visionSystem = null;
        }
    }
}