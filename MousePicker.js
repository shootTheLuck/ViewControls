
class MousePicker {

    constructor(layer) {
        this.raycaster = new THREE.Raycaster();
        this.raycaster.layers.set(layer || 0);
        this.mouseCoords = new THREE.Vector2();
        this.intersects = [];
    }

    pickAll(evt, camera, object) {
        this.mouseCoords.x = (evt.clientX / evt.target.clientWidth) * 2 - 1;
        this.mouseCoords.y = -(evt.clientY / evt.target.clientHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouseCoords, camera);
        this.intersects.length = 0;

        if (Array.isArray(object)) {
            this.raycaster.intersectObjects(object, true, this.intersects);
        } else {
            this.raycaster.intersectObject(object, true, this.intersects);
        }

        if (this.intersects.length) {
            return this.intersects;
        }
        return false;
    }

    pick(evt, camera, object, ignoreProperty) {
        let intersectsArray = this.pickAll(evt, camera, object);
        if (intersectsArray) {
            var index = 0;
            if (ignoreProperty) {
                while (index < intersectsArray.length &&
                    intersectsArray[index].object[ignoreProperty]) {
                    index ++;
                }
            }
            if (intersectsArray[index]) {
                return intersectsArray[index];
            }
        }
        return false;
    }
}

export default MousePicker;
