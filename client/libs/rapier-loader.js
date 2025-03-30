// Глобальный объект для хранения RAPIER
window.RAPIER_GLOBAL = {
    initialized: false,
    instance: null,
    initPromise: null
  };
  
  // Функция асинхронной загрузки Rapier
  async function loadRapier() {
    // Если процесс инициализации уже запущен, возвращаем существующий промис
    if (window.RAPIER_GLOBAL.initPromise) {
      return window.RAPIER_GLOBAL.initPromise;
    }
    
    // Создаем и запоминаем промис инициализации
    window.RAPIER_GLOBAL.initPromise = new Promise(async (resolve, reject) => {
      try {
        console.log("Загрузчик Rapier: начало инициализации...");
        
        // Проверяем, доступен ли уже RAPIER
        if (typeof RAPIER !== 'undefined') {
          console.log("Загрузчик Rapier: обнаружен глобальный объект RAPIER");
          
          // Если требуется инициализация
          if (typeof RAPIER.init === 'function' && !RAPIER._initialized) {
            console.log("Загрузчик Rapier: инициализируем RAPIER.init()");
            try {
              await RAPIER.init();
              RAPIER._initialized = true;
              window.RAPIER_GLOBAL.initialized = true;
              window.RAPIER_GLOBAL.instance = RAPIER;
              console.log("Загрузчик Rapier: RAPIER успешно инициализирован");
              resolve(RAPIER);
            } catch (error) {
              console.error("Загрузчик Rapier: ошибка при инициализации:", error);
              reject(error);
            }
            return;
          } else {
            console.log("Загрузчик Rapier: RAPIER уже инициализирован или не требует инициализации");
            RAPIER._initialized = true;
            window.RAPIER_GLOBAL.initialized = true;
            window.RAPIER_GLOBAL.instance = RAPIER;
            resolve(RAPIER);
            return;
          }
        }
        
        // RAPIER недоступен - ждем его загрузки
        console.log("Загрузчик Rapier: RAPIER не найден, ожидаем его загрузки...");
        
        // Максимальное время ожидания (10 секунд)
        const maxWaitTime = 10000;
        const startTime = Date.now();
        
        // Функция проверки доступности RAPIER
        const checkRapier = () => {
          // Проверяем таймаут
          if (Date.now() - startTime > maxWaitTime) {
            const error = new Error(`Загрузчик Rapier: превышено время ожидания загрузки RAPIER (${maxWaitTime}ms)`);
            console.error(error);
            reject(error);
            return;
          }
          
          // Проверяем, доступен ли RAPIER
          if (typeof RAPIER !== 'undefined') {
            console.log("Загрузчик Rapier: RAPIER появился");
            
            if (typeof RAPIER.init === 'function' && !RAPIER._initialized) {
              RAPIER.init().then(() => {
                console.log("Загрузчик Rapier: RAPIER успешно инициализирован");
                RAPIER._initialized = true;
                window.RAPIER_GLOBAL.initialized = true;
                window.RAPIER_GLOBAL.instance = RAPIER;
                resolve(RAPIER);
              }).catch(error => {
                console.error("Загрузчик Rapier: ошибка при инициализации:", error);
                reject(error);
              });
            } else {
              console.log("Загрузчик Rapier: RAPIER готов");
              RAPIER._initialized = true;
              window.RAPIER_GLOBAL.initialized = true;
              window.RAPIER_GLOBAL.instance = RAPIER;
              resolve(RAPIER);
            }
            return;
          }
          
          // Продолжаем проверку через 100мс
          setTimeout(checkRapier, 100);
        };
        
        // Запускаем проверку
        checkRapier();
        
      } catch (error) {
        console.error("Загрузчик Rapier: неожиданная ошибка:", error);
        reject(error);
      }
    });
    
    return window.RAPIER_GLOBAL.initPromise;
  }
  
  // Функция для получения инициализированного экземпляра RAPIER
  function getRapier() {
    return window.RAPIER_GLOBAL.instance;
  }
  
  // Функция для проверки, готов ли RAPIER
  function isRapierReady() {
    return window.RAPIER_GLOBAL.initialized && window.RAPIER_GLOBAL.instance !== null;
  }
  
  // Экспортируем функции для использования в глобальном контексте
  window.RAPIER_LOADER = {
    loadRapier,
    getRapier,
    isRapierReady
  };