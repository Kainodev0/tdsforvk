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
        
        // Привязка методов к контексту
        this.onSocketOpen = this.onSocketOpen.bind(this);
        this.onSocketClose = this.onSocketClose.bind(this);
        this.onSocketError = this.onSocketError.bind(this);
        this.onSocketMessage = this.onSocketMessage.bind(this);
    }
    
    /**
     * Подключение к серверу
     * @returns {Promise} - промис подключения
     */
    connect() {
        return new Promise((resolve, reject) => {
            if (this.mockMode) {
                // В режиме прототипа имитируем подключение
                console.log('Запущен режим прототипа (без сервера)');
                this.connected = true;
                
                // Вызываем обработчики подключения
                this.eventHandlers.connect.forEach(handler => handler());
                
                // Запускаем имитацию движения NPC
                this.startMockNpcMovement();
                
                resolve();
                return;
            }
            
            // Создаем WebSocket соединение
            try {
                this.socket = new WebSocket(this.serverUrl);
                
                // Настраиваем обработчики
                this.socket.addEventListener('open', () => {
                    this.onSocketOpen();
                    resolve();
                });
                
                this.socket.addEventListener('close', this.onSocketClose);
                this.socket.addEventListener('error', (error) => {
                    this.onSocketError(error);
                    reject(error);
                });
                
                this.socket.addEventListener('message', this.onSocketMessage);
            } catch (error) {
                console.error('Ошибка при создании WebSocket:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Обработчик открытия соединения
     */
    onSocketOpen() {
        console.log('Соединение с сервером установлено');
        this.connected = true;
        
        // Вызываем обработчики подключения
        this.eventHandlers.connect.forEach(handler => handler());
    }
    
    /**
     * Обработчик закрытия соединения
     * @param {CloseEvent} event - событие закрытия соединения
     */
    onSocketClose(event) {
        console.log(`Соединение с сервером закрыто: ${event.code} ${event.reason}`);
        this.connected = false;
        
        // Вызываем обработчики отключения
        this.eventHandlers.disconnect.forEach(handler => handler(event));
    }
    
    /**
     * Обработчик ошибки соединения
     * @param {Event} error - событие ошибки
     */
    onSocketError(error) {
        console.error('Ошибка соединения:', error);
        
        // Вызываем обработчики ошибок
        this.eventHandlers.error.forEach(handler => handler(error));
    }
    
    /**
     * Обработчик сообщения от сервера
     * @param {MessageEvent} event - событие сообщения
     */
    onSocketMessage(event) {
        try {
            const message = JSON.parse(event.data);
            
            // Обрабатываем сообщение в зависимости от типа
            switch (message.type) {
                case 'gameState':
                    this.handleGameState(message.data);
                    break;
                    
                case 'playerMove':
                    this.handlePlayerMove(message.data);
                    break;
                    
                case 'playerShoot':
                    this.handlePlayerShoot(message.data);
                    break;
                    
                case 'playerDamage':
                    this.handlePlayerDamage(message.data);
                    break;
                    
                case 'itemPickup':
                    this.handleItemPickup(message.data);
                    break;
                    
                case 'npcSpawn':
                    this.handleNpcSpawn(message.data);
                    break;
                    
                case 'npcMove':
                    this.handleNpcMove(message.data);
                    break;
                    
                default:
                    console.warn('Неизвестный тип сообщения:', message.type);
                    
                    // Вызываем общие обработчики сообщений
                    this.eventHandlers.message.forEach(handler => handler(message));
            }
        } catch (error) {
            console.error('Ошибка при разборе сообщения:', error, event.data);
        }
    }
    
    /**
     * Отправка сообщения на сервер
     * @param {string} type - тип сообщения
     *