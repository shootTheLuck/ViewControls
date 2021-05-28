
class RayPicker extends THREE.Raycaster {

    constructor( layer ) {
        super();
        this.layers.set( layer || 0 );

        this.params.Points.threshold = 1;
        this.params.Line.threshold = 3;

        /*public mouseCoords are Vector3 to allow camera.unproject */
        this.mouseCoords = new THREE.Vector3();
        this.centerCoords = new THREE.Vector3();
        this.intersects = [];
    }

    setFromMouseEventAndCamera( evt, camera ) {
        this.mouseCoords.x = ( evt.clientX / evt.target.clientWidth ) * 2 - 1;
        this.mouseCoords.y = -( evt.clientY / evt.target.clientHeight ) * 2 + 1;
        super.setFromCamera( this.mouseCoords, camera );
    }

    setFromCamera(camera) {
        super.setFromCamera( this.centerCoords, camera );
    }

    /* return array of all raycaster intersects */

    pickAll( object ) {
        this.intersects.length = 0;

        if ( Array.isArray( object ) ) {
            this.intersectObjects( object, true, this.intersects );
        } else {
            this.intersectObject( object, true, this.intersects);
        }

        if ( this.intersects.length ) {
            return this.intersects;
        }

        return false;
    }

    /* return closest of all raycaster intersects, allowing for
     * optional test function. example of use with test function to ignore "grass":

       let result = rayPicker.pick( scene, ( intersect ) => {

           if ( intersect.object.name === "grass" ) {
              return false;
           }

           return true;
       } );
    *
    *  or:

        let result = rayPicker.pick( scene, ( intersect ) => {
            return !( intersect.object.name === "grass" );
        } );

     */

    pick( object, testFunction ) {
        let intersectsArray = this.pickAll( object );
        if ( intersectsArray ) {
            var index = 0;

            if ( typeof testFunction === "function" ) {
                while (index < intersectsArray.length &&
                    !testFunction(intersectsArray[ index ] ) ) {
                    index ++;
                }
            }

            if ( intersectsArray[ index ] ) {
                return intersectsArray[ index ];
            }

        }

        return false;

    }

}

export { RayPicker };
