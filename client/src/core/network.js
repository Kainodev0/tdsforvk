/**
 * Класс для управления сетевым соединением игры
 * Для прототипа будет имитировать серверное соединение
 */
export class NetworkManager {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.serverUrl = 'wss://your-server-url.com'; // Изменить на реальный URL при деплое
        this.mockMode = true; // Для прототипа используем мок-режим
        
        // Колбэки для событий
        this.eventHandlers = {
            connect: [],
            disconnect: [],
            error: [],
            message: [],
            playerMove: [],
            playerShoot: [],
            playerDamage: [],
            itemPickup: [],
            npcSpawn: [],
            npcMove: [],
            gameState: []
        };
        
        // Данные для мок-режима
        this.mockData = {
            players: {},
            npcs: {},
            items: {}
        };
        
        // ID игрока (для локальной игры будет фиксированным)
        this.playerId = 'local_player';
    }
    
    /**
     * Подключение к серверу
     * @returns {Promise} - промис подключения
     */
    connect() {
        return new Promise((resolve) => {
            // В режиме прототипа имитируем подключение
            console.log('Запущен режим прототипа (без сервера)');
            this.connected = true;
            
            // Генерируем тестовые данные
            this.generateMockData();
            
            // Имитируем время загрузки
            setTimeout(() => {
                // Вызываем обработчики подключения
                this.eventHandlers.connect.forEach(handler => handler());
                
                // Имитация движения NPC
                this.startMockNpcMovement();
                
                resolve();
            }, 500);
        });
    }
    
    /**
     * Генерация тестовых данных для мок-режима
     */
    generateMockData() {
        // Генерируем предметы на карте
        for (let i = 0; i < 15; i++) {
            const id = `item_${i}`;
            const x = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 80;
            
            // Случайный тип предмета
            const types = ['weapon', 'medkit', 'ammo'];
            const type = types[Math.floor(Math.random() * types.length)];
            
            this.mockData.items[id] = {
                id,
                type,
                position: { x, y: 0, z },
                properties: {}
            };
        }
        
        // Генерируем NPC
        for (let i = 0; i < 5; i++) {
            const id = `npc_${i}`;
            const x = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 80;
            
            this.mockData.npcs[id] = {
                id,
                type: 'enemy',
                position: { x, y: 0, z },
                health: 100,
                state: 'patrol'
            };
        }
    }
    
    /**
     * Запуск имитации движения NPC
     */
    startMockNpcMovement() {
        setInterval(() => {
            // Для каждого NPC
            Object.keys(this.mockData.npcs).forEach(id => {
                const npc = this.mockData.npcs[id];
                
                // Случайное перемещение
                const moveX = (Math.random() - 0.5) * 2;
                const moveZ = (Math.random() - 0.5) * 2;
                
                npc.position.x += moveX;
                npc.position.z += moveZ;
                
                // Проверка границ карты
                npc.position.x = Math.max(-45, Math.min(45, npc.position.x));
                npc.position.z = Math.max(-45, Math.min(45, npc.position.z));
                
                // Вызываем обработчики перемещения NPC
                this.eventHandlers.npcMove.forEach(handler => handler({
                    id,
                    position: npc.position
                }));
            });
        }, 1000); // Обновляем каждую секунду
    }
    
    /**
     * Регистрация обработчика события
     * @param {string} event - название события
     * @param {Function} handler - функция-обработчик
     */
    on(event, handler) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].push(handler);
        }
    }
    
    /**
     * Отправка информации о перемещении игрока
     * @param {Object} position - новая позиция
     * @param {Object} rotation - новое вращение
     */
    sendPlayerMove(position, rotation) {
        if (!this.connected) return;
        
        // В мок-режиме просто сохраняем данные
        if (this.mockMode) {
            this.mockData.players[this.playerId] = {
                ...this.mockData.players[this.playerId],
                position,
                rotation
            };
        }
    }
    
    /**
     * Отправка информации о выстреле игрока
     * @param {Object} position - позиция выстрела
     * @param {Object} direction - направление выстрела
     * @param {string} weapon - используемое оружие
     */
    sendPlayerShoot(position, direction, weapon) {
        if (!this.connected) return;
        
        console.log('Выстрел игрока:', { position, direction, weapon });
        
        // В реальной игре здесь была бы отправка данных на сервер
    }
    
    /**
     * Отправка информации о подборе предмета
     * @param {string} itemId - ID поднятого предмета
     * @param {string} itemType - тип предмета
     */
    sendItemPickup(itemId, itemType) {
        if (!this.connected) return;
        
        console.log('Подбор предмета:', { itemId, itemType });
        
        // В мок-режиме удаляем предмет из данных
        if (this.mockMode) {
            delete this.mockData.items[itemId];
        }
    }
}