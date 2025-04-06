// client/src/utils/three-patches.js
import * as THREE from 'three';

/**
 * Патч для THREE.ShapeGeometry, чтобы предотвратить ошибки с NaN значениями
 */
export function patchShapeGeometry() {
    // Сохраняем оригинальный метод
    const originalComputeBoundingSphere = THREE.ShapeGeometry.prototype.computeBoundingSphere;
    
    // Переопределяем метод computeBoundingSphere
    THREE.ShapeGeometry.prototype.computeBoundingSphere = function() {
        // Проверяем атрибуты позиции на наличие NaN значений
        if (this.attributes.position) {
            const positions = this.attributes.position.array;
            let hasNaN = false;
            
            for (let i = 0; i < positions.length; i++) {
                if (isNaN(positions[i])) {
                    positions[i] = 0; // Заменяем NaN на 0
                    hasNaN = true;
                }
            }
            
            if (hasNaN) {
                this.attributes.position.needsUpdate = true;
                console.warn('ShapeGeometry: исправлены NaN значения в атрибуте position');
            }
        }
        
        // Вызываем оригинальный метод
        originalComputeBoundingSphere.call(this);
        
        // Проверяем результат
        if (!this.boundingSphere || isNaN(this.boundingSphere.radius)) {
            console.warn('ShapeGeometry: создан fallback для boundingSphere');
            
            // Создаем безопасную заглушку для boundingSphere
            this.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);
        }
        
        return this;
    };
    
    console.log('✅ THREE.ShapeGeometry успешно пропатчен');
}