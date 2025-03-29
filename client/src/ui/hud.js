/**
 * Класс для управления HUD (интерфейсом в игре)
 */
export class HUD {
    /**
     * @param {HTMLElement} element - DOM элемент для отображения HUD
     */
    constructor(element) {
        this.element = element;
        
        // Элементы HUD
        this.healthBar = element.querySelector('#health-bar .health-value');
        this.ammoCounter = element.querySelector('#ammo-counter');
        this.weaponInfo = element.querySelector('#weapon-info');
        this.statusMessages = element.querySelector('#status-messages');
        
        // Состояние HUD
        this.health = 100;
        this.ammo = 0;
        this.weapon = 'Нет';
        this.messages = [];
        
        // Таймер для удаления сообщений
        this.messageTimer = null;
        
        // Инициализация
        this.initialize();
    }
    
    /**
     * Инициализация HUD
     */
    initialize() {
        // Обновляем элементы с начальными значениями
        this.updateHealthBar();
        this.updateAmmoCounter();
        this.updateWeaponInfo();
    }
    
    /**
     * Обновление HUD
     * @param {Object} data - данные для обновления
     */
    update(data) {
        // Обновляем только переданные данные
        if (data.health !== undefined && data.health !== this.health) {
            this.health = data.health;
            this.updateHealthBar();
        }
        
        if (data.ammo !== undefined && data.ammo !== this.ammo) {
            this.ammo = data.ammo;
            this.updateAmmoCounter();
        }
        
        if (data.weapon !== undefined && data.weapon !== this.weapon) {
            this.weapon = data.weapon;
            this.updateWeaponInfo();
        }
    }
    
    /**
     * Обновление полоски здоровья
     */
    updateHealthBar() {
        // Обновляем ширину полоски здоровья
        if (this.healthBar) {
            this.healthBar.style.width = `${this.health}%`;
            
            // Меняем цвет в зависимости от количества здоровья
            if (this.health > 70) {
                this.healthBar.style.backgroundColor = '#4CAF50'; // Зеленый
            } else if (this.health > 30) {
                this.healthBar.style.backgroundColor = '#FFC107'; // Желтый
            } else {
                this.healthBar.style.backgroundColor = '#F44336'; // Красный
            }
        }
    }
    
    /**
     * Обновление счетчика патронов
     */
    updateAmmoCounter() {
        if (this.ammoCounter) {
            this.ammoCounter.textContent = `${this.ammo}`;
        }
    }
    
    /**
     * Обновление информации об оружии
     */
    updateWeaponInfo() {
        if (this.weaponInfo) {
            this.weaponInfo.textContent = this.weapon;
        }
    }
    
    /**
     * Добавление сообщения в статус
     * @param {string} message - текст сообщения
     * @param {number} duration - длительность показа в миллисекундах
     */
    addStatusMessage(message, duration = 3000) {
        // Добавляем сообщение в список
        this.messages.push({
            text: message,
            timestamp: Date.now(),
            duration
        });
        
        // Обновляем отображение сообщений
        this.updateStatusMessages();
        
        // Устанавливаем таймер для удаления сообщения
        if (this.messageTimer === null) {
            this.messageTimer = setInterval(() => {
                this.checkMessagesTimeout();
            }, 1000);
        }
    }
    
    /**
     * Обновление отображения статусных сообщений
     */
    updateStatusMessages() {
        if (!this.statusMessages) return;
        
        // Очищаем элемент
        this.statusMessages.innerHTML = '';
        
        // Добавляем сообщения
        this.messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.className = 'status-message';
            messageElement.textContent = msg.text;
            
            this.statusMessages.appendChild(messageElement);
        });
    }
    
    /**
     * Проверка таймаута сообщений
     */
    checkMessagesTimeout() {
        const now = Date.now();
        let hasRemovedMessages = false;
        
        // Удаляем устаревшие сообщения
        this.messages = this.messages.filter(msg => {
            const isExpired = now - msg.timestamp > msg.duration;
            if (isExpired) {
                hasRemovedMessages = true;
            }
            return !isExpired;
        });
        
        // Обновляем отображение, если были удалены сообщения
        if (hasRemovedMessages) {
            this.updateStatusMessages();
        }
        
        // Останавливаем таймер, если нет сообщений
        if (this.messages.length === 0) {
            clearInterval(this.messageTimer);
            this.messageTimer = null;
        }
    }
    
    /**
     * Показать HUD
     */
    show() {
        this.element.classList.remove('hidden');
    }
    
    /**
     * Скрыть HUD
     */
    hide() {
        this.element.classList.add('hidden');
    }
}