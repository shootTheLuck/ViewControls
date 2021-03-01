
class MousePicker extends THREE.Raycaster {

    constructor(layer) {
        super();
        this.layers.set(layer || 0);

        this.params.Points.threshold = 1;
        this.params.Line.threshold = 3;
        /*public mouseCoords are Vector3 to allow camera.unproject */
        this.mouseCoords = new THREE.Vector3();
        this.intersects = [];
    }

    updateMouseCoords(evt) {
        this.mouseCoords.x = (evt.clientX / evt.target.clientWidth) * 2 - 1;
        this.mouseCoords.y = -(evt.clientY / evt.target.clientHeight) * 2 + 1;
    }

    setRaycaster(evt, camera) {
        this.updateMouseCoords(evt);
        this.setFromCamera(this.mouseCoords, camera);
    }

    pickAll(evt, camera, object) {

        this.setRaycaster(evt, camera);
        this.intersects.length = 0;

        if (Array.isArray(object)) {
            this.intersectObjects(object, true, this.intersects);
        } else {
            this.intersectObject(object, true, this.intersects);
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

export {MousePicker};
