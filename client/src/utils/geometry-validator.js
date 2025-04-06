/**
 * Утилита для проверки и исправления проблем с геометрией
 */
class GeometryValidator {
    /**
     * Проверяет и исправляет проблемы с NaN значениями в атрибуте position геометрии
     * 
     * @param {THREE.BufferGeometry} geometry Проверяемая геометрия
     * @returns {boolean} true если геометрия была исправлена, false если геометрия корректна
     */
    static validatePositionAttribute(geometry) {
      if (!geometry || !geometry.attributes || !geometry.attributes.position) {
        console.warn('GeometryValidator: Геометрия не имеет атрибута position', geometry);
        return false;
      }
  
      const positionAttr = geometry.attributes.position;
      const positions = positionAttr.array;
      let hasNaN = false;
      let fixedCount = 0;
  
      // Проверяем наличие NaN значений
      for (let i = 0; i < positions.length; i++) {
        if (isNaN(positions[i])) {
          hasNaN = true;
          // Заменяем NaN на 0 (или другое подходящее значение)
          positions[i] = 0;
          fixedCount++;
        }
      }
  
      if (hasNaN) {
        console.warn(`GeometryValidator: Исправлено ${fixedCount} NaN значений в геометрии`, geometry);
        positionAttr.needsUpdate = true;
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();
        return true;
      }
  
      return false;
    }
  
    /**
     * Проверяет, содержит ли геометрия корректные данные для вычисления ограничивающей сферы
     * 
     * @param {THREE.BufferGeometry} geometry Проверяемая геометрия
     * @returns {boolean} true если геометрия валидна
     */
    static isValid(geometry) {
      if (!geometry || !geometry.attributes || !geometry.attributes.position) {
        return false;
      }
  
      const positionAttr = geometry.attributes.position;
      const positions = positionAttr.array;
  
      for (let i = 0; i < positions.length; i++) {
        if (isNaN(positions[i]) || !isFinite(positions[i])) {
          return false;
        }
      }
  
      return true;
    }
  
    /**
     * Проверяет и исправляет всю сцену, включая все дочерние объекты
     * 
     * @param {THREE.Object3D} sceneObject Корневой объект сцены
     * @returns {number} Количество исправленных объектов
     */
    static validateScene(sceneObject) {
      if (!sceneObject) return 0;
      
      let fixedCount = 0;
      
      sceneObject.traverse((object) => {
        if (object.geometry) {
          if (this.validatePositionAttribute(object.geometry)) {
            fixedCount++;
          }
        }
      });
      
      return fixedCount;
    }
  }
  
  // Экспортируем утилиту
  export { GeometryValidator };