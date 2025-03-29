/**
 * Класс для управления интерфейсом инвентаря
 */
export class InventoryUI {
    /**
     * @param {HTMLElement} element - DOM элемент для отображения инвентаря
     */
    constructor(element) {
        this.element = element;
        
        // Элементы инвентаря
        this.gridElement = element.querySelector('.inventory-grid');
        this.equippedElement = element.querySelector('.equipped-items');
        
        // Данные инвентаря
        this.inventory = {
            items: [],
            maxSlots: 25 // 5x5 сетка
        };
        
        // Экипированные предметы
        this.equipped = {
            weapon: null,
            armor: null,
            helmet: null
        };
        
        // Инициализация
        this.initialize();
    }
    
    /**
     * Инициализация интерфейса инвентаря
     */
    initialize() {
        // Создаем слоты инвентаря
        this.createInventorySlots();
        
        // Создаем слоты экипировки
        this.createEquippedSlots();
        
        // Настраиваем обработчики событий перетаскивания
        this.setupDragAndDrop();
    }
    
    /**
     * Создание слотов инвентаря
     */
    createInventorySlots() {
        if (!this.gridElement) return;
        
        // Очищаем контейнер
        this.gridElement.innerHTML = '';
        
        // Создаем сетку слотов 5x5
        for (let i = 0; i < this.inventory.maxSlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.slotIndex = i;
            
            this.gridElement.appendChild(slot);
        }
    }
    
    /**
     * Создание слотов экипировки
     */
    createEquippedSlots() {
        if (!this.equippedElement) return;
        
        // Очищаем контейнер
        this.equippedElement.innerHTML = '';
        
        // Создаем слоты для экипировки
        const slots = [
            { id: 'weapon', label: 'Оружие' },
            { id: 'armor', label: 'Броня' },
            { id: 'helmet', label: 'Шлем' }
        ];
        
        slots.forEach(slotInfo => {
            const slotContainer = document.createElement('div');
            slotContainer.className = 'equipped-slot-container';
            
            const label = document.createElement('div');
            label.className = 'equipped-slot-label';
            label.textContent = slotInfo.label;
            
            const slot = document.createElement('div');
            slot.className = 'equipped-slot';
            slot.dataset.slotType = slotInfo.id;
            
            slotContainer.appendChild(label);
            slotContainer.appendChild(slot);
            
            this.equippedElement.appendChild(slotContainer);
        });
    }
    
    /**
     * Настройка системы перетаскивания
     */
    setupDragAndDrop() {
        // Здесь будет реализация drag-and-drop
        // Для прототипа оставим простую реализацию с кликами
        
        // Находим все слоты инвентаря
        const inventorySlots = this.element.querySelectorAll('.inventory-slot');
        
        // Добавляем обработчики клика
        inventorySlots.forEach(slot => {
            slot.addEventListener('click', () => {
                // В будущем здесь будет логика выбора предмета
                console.log('Клик по слоту инвентаря:', slot.dataset.slotIndex);
            });
        });
        
        // Находим все слоты экипировки
        const equippedSlots = this.element.querySelectorAll('.equipped-slot');
        
        // Добавляем обработчики клика
        equippedSlots.forEach(slot => {
            slot.addEventListener('click', () => {
                // В будущем здесь будет логика выбора экипированного предмета
                console.log('Клик по слоту экипировки:', slot.dataset.slotType);
            });
        });
    }
    
    /**
     * Обновление отображения инвентаря
     * @param {Object} inventory - данные инвентаря
     */
    update(inventory) {
        if (!inventory) return;
        
        // Обновляем данные
        this.inventory = inventory;
        
        // Обновляем отображение
        this.updateInventoryDisplay();
    }
    
    /**
     * Обновление отображения экипировки
     * @param {Object} equipped - данные экипировки
     */
    updateEquipped(equipped) {
        if (!equipped) return;
        
        // Обновляем данные
        this.equipped = equipped;
        
        // Обновляем отображение
        this.updateEquippedDisplay();
    }
    
    /**
     * Обновление отображения слотов инвентаря
     */
    updateInventoryDisplay() {
        // Находим все слоты инвентаря
        const slots = this.element.querySelectorAll('.inventory-slot');
        
        // Очищаем все слоты
        slots.forEach(slot => {
            slot.innerHTML = '';
            slot.classList.remove('filled');
        });
        
        // Заполняем слоты предметами
        this.inventory.items.forEach((item, index) => {
            if (index >= slots.length) return;
            
            const slot = slots[index];
            
            // Создаем элемент предмета
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.dataset.itemId = item.id;
            
            // Разный стиль для разных типов предметов
            switch (item.type) {
                case 'weapon':
                    itemElement.classList.add('item-weapon');
                    itemElement.textContent = 'W';
                    break;
                case 'medkit':
                    itemElement.classList.add('item-medkit');
                    itemElement.textContent = 'M';
                    break;
                case 'ammo':
                    itemElement.classList.add('item-ammo');
                    itemElement.textContent = 'A';
                    break;
                default:
                    itemElement.textContent = '?';
            }
            
            // Добавляем предмет в слот
            slot.appendChild(itemElement);
            slot.classList.add('filled');
        });
    }
    
    /**
     * Обновление отображения экипированных предметов
     */
    updateEquippedDisplay() {
        // Обновляем отображение экипированного оружия
        const weaponSlot = this.element.querySelector('.equipped-slot[data-slot-type="weapon"]');
        if (weaponSlot) {
            weaponSlot.innerHTML = '';
            
            if (this.equipped.weapon) {
                const weaponElement = document.createElement('div');
                weaponElement.className = 'equipped-item item-weapon';
                weaponElement.textContent = 'W';
                
                weaponSlot.appendChild(weaponElement);
            }
        }
        
        // Обновляем отображение экипированной брони
        const armorSlot = this.element.querySelector('.equipped-slot[data-slot-type="armor"]');
        if (armorSlot) {
            armorSlot.innerHTML = '';
            
            if (this.equipped.armor) {
                const armorElement = document.createElement('div');
                armorElement.className = 'equipped-item item-armor';
                armorElement.textContent = 'A';
                
                armorSlot.appendChild(armorElement);
            }
        }
        
        // Обновляем отображение экипированного шлема
        const helmetSlot = this.element.querySelector('.equipped-slot[data-slot-type="helmet"]');
        if (helmetSlot) {
            helmetSlot.innerHTML = '';
            
            if (this.equipped.helmet) {
                const helmetElement = document.createElement('div');
                helmetElement.className = 'equipped-item item-helmet';
                helmetElement.textContent = 'H';
                
                helmetSlot.appendChild(helmetElement);
            }
        }
    }
    
    /**
     * Добавление стилей для предметов в инвентаре
     */
    addInventoryStyles() {
        // Создаем стили для предметов
        const style = document.createElement('style');
        style.textContent = `
            .inventory-item {
                width: 90%;
                height: 90%;
                margin: 5%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                user-select: none;
                cursor: pointer;
            }
            
            .item-weapon {
                background-color: #FF5722;
            }
            
            .item-medkit {
                background-color: #4CAF50;
            }
            
            .item-ammo {
                background-color: #FFC107;
            }
            
            .item-armor {
                background-color: #2196F3;
            }
            
            .item-helmet {
                background-color: #673AB7;
            }
            
            .equipped-slot-container {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .equipped-slot-label {
                margin-bottom: 5px;
                font-size: 14px;
            }
            
            .equipped-item {
                width: 90%;
                height: 90%;
                margin: 5%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Показать инвентарь
     */
    show() {
        // Добавляем стили для предметов при первом открытии
        if (!document.querySelector('style[data-inventory-styles]')) {
            this.addInventoryStyles();
        }
        
        this.element.classList.remove('hidden');
    }
    
    /**
     * Скрыть инвентарь
     */
    hide() {
        this.element.classList.add('hidden');
    }
}