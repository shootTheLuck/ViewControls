
import MousePicker from "./MousePicker.js";
// import * as THREE from '../js/three.js-r115/build/three.module.js';

class ViewControls extends THREE.Object3D {

    constructor( camera, scene, domElement, opts = {} ) {

        super();
        this.name = opts.name || "viewControls";
        this.autoReturn = ( opts.autoReturn !== undefined ) ? opts.autoReturn : true;
        this.maxDollySpeed = opts.maxDollySpeed || Infinity;
        this.rotationSpeed = opts.rotationSpeed || 0.005;
        this.altKey = opts.altKey || "Alt";
        this.distanceTolerance = opts.distanceTolerance || 0.002;

        this.camera = camera;
        this.scene = scene;
        this.domElement = domElement;

        // make sure element can receive keys.
        if ( this.domElement.tabIndex === - 1 ) {

            this.domElement.tabIndex = 0;

        }

        this.outer = new THREE.Object3D();
        this.outer.name = "outer";
        this.add( this.outer );

        this.ray = new MousePicker();
        this.oldPosition = camera.position.clone();
        this.oldQuaternion = camera.quaternion.clone();
        this.oldParent = camera.parent || scene;
        this.rotateTargetY = 0;

        this.focusIncrement = 0;
        this.focusSpeed = 0.03;

        this.wheelDollySpeed = 0.03;
        this.focusMatrix = new THREE.Matrix4();
        this.focusQuaternion = new THREE.Quaternion();
        this.focused = false;
        this.animation = null;
        this.focusIterations = 0;
        this.maxFocusIterations = 20;

        this.mouseMoveListener = this.handleMouseMove.bind( this );
        this.mouseDownListener = this.handleMouseDown.bind( this );
        this.mouseUpListener = this.handleMouseUp.bind( this );
        this.keyDownListener = this.handleKeyDown.bind( this );
        this.keyUpListener = this.handleKeyUp.bind( this );
        this.mouseWheelListener = this.handleMouseWheel.bind( this );

        this.domElement.addEventListener( "mousedown", this.mouseDownListener );
        this.domElement.addEventListener( "wheel", this.mouseWheelListener );
        this.domElement.addEventListener( "contextmenu", ( evt ) => {

            evt.preventDefault();

        } );

        if ( this.autoReturn ) {

            this.domElement.addEventListener( "keydown", this.keyDownListener );

        }

        this.scene.add( this );
        this.selectedObjects = [];

    }

    handleMouseDown( evt ) {

        let intersects = this.ray.pick( evt, this.camera, this.scene );
        if ( ! intersects ) return;

        if ( evt.button === 0 ) {

            if ( evt.getModifierState(this.altKey) ) {

                this.addListeners();
                this.unFocus( this.camera, this.scene );
                this.startFocus( this.camera, intersects.point );
                /// no event for just looking!

            } else {

                this.dispatchEvent( {
                    type: "leftClick",
                    detail: {
                        originalEvent: evt,
                        object: intersects.object,
                        intersection: intersects
                    }
                } );

            }

            if ( evt.shiftKey ) {

                this.dispatchEvent( {
                    type: "additionalSelection",
                    detail: {
                        originalEvent: evt,
                        object: intersects.object,
                        intersection: intersects
                    }
                } );

            }

        }

        if ( evt.button === 2 ) {

            this.selectedObject = intersects.object;
            this.state = 0;
            evt.preventDefault();
            this.dispatchEvent( {
                type: "rightClick",
                detail: {
                    originalEvent: evt,
                    object: intersects.object,
                    intersection: intersects
                }
            } );

        }

    }

    handleMouseMove( evt ) {

        if ( evt.ctrlKey ) {

            this.rotate( evt.movementY * this.rotationSpeed, evt.movementX * this.rotationSpeed );

        } else {

            // this.rotateTargetY -= evt.movementX * this.rotationSpeed;
            // this.rotateTargetY = Math.max(-0.1, Math.min(this.rotateTargetY , 0.1));
            // console.log("here", this.rotateTargetY);
            this.rotate( 0, evt.movementX * this.rotationSpeed );
            this.dolly( this.camera, evt.movementY * this.rotationSpeed );

        }

    }

    handleMouseUp( evt ) {

        this.removeListeners();

    }

    handleMouseWheel( evt ) {

        evt.preventDefault();
        var dist = this.camera.position.distanceTo( this.outer.position );
        var dollyAmount = THREE.MathUtils.clamp( evt.deltaY * dist * this.wheelDollySpeed, - this.maxDollySpeed, this.maxDollySpeed );
        this.camera.translateZ( dollyAmount );
        this.camera.position.z = Math.max( 0, this.camera.position.z );

    }

    handleKeyUp( evt ) {

        if ( evt.key === this.altKey ) {

            this.removeListeners();

        }

    }

    handleKeyDown( evt ) {

        if ( evt.key === "Escape" ) {

            // evt.stopPropogation();
            // evt.preventDefault();
            this.unFocus( this.camera, this.scene );
            this.resetCamera( this.camera, this.oldPosition, this.oldQuaternion );
            this.removeListeners();

        }

    }

    rotate( x, y ) {

        if ( this.focused ) {

            this.rotateY( - y );
            this.outer.rotateX( - x );
            // this.rotateY(this.rotateTargetY);
            // this.rotateTargetY *= 0.7;

        }

    }

    dolly( camera, y ) {

        if ( this.focused ) {

            var dist = camera.position.distanceTo( this.outer.position );
            var dollyAmount = THREE.MathUtils.clamp( y * dist, - this.maxDollySpeed, this.maxDollySpeed );
            camera.translateZ( dollyAmount );
            camera.position.z = Math.max( 0, camera.position.z );

        }

    }

    panToObject( camera, position ) {

        camera.quaternion.slerp( this.focusQuaternion, this.focusIncrement );
        this.focusIncrement += this.focusSpeed;
        this.focusIterations += 1;
        var d = THREE.Vector3.prototype.manhattanDistanceTo.call( this, camera.quaternion, this.focusQuaternion );
        if ( d < this.distanceTolerance || this.focusIterations > this.maxFocusIterations ) {

            this.focused = true;
            this.focusIncrement = 0;
            this.position.copy( position );
            this.outer.lookAt( camera.position );
            this.outer.attach( camera );
            this.animation = null;

        } else {

            // this.animation = requestAnimationFrame(this.panToObject.bind(this, camera, position));
            this.animation = this.panToObject.bind( this, camera, position );

        }

    }

    startFocus( camera, position ) {

        this.focusIterations = 0;
        this.focusMatrix.lookAt( camera.position, position, camera.up );
        this.focusQuaternion.setFromRotationMatrix( this.focusMatrix );
        this.panToObject( camera, position );

    }

    unFocus( camera, scene ) {

        this.focusIncrement = 0;
        this.focused = false;
        // cancelAnimationFrame(this.animation);
        this.oldParent.attach( camera );

    }

    resetCamera( camera, resetPosition, resetQuaternion ) {

        if ( camera.position.manhattanDistanceTo( resetPosition ) < this.distanceTolerance ) {

            camera.position.copy( resetPosition );
            camera.quaternion.copy( resetQuaternion );
            this.animation = null;

        } else {

            // this.animation = requestAnimationFrame(this.resetCamera.bind(this, camera, position, quaternion));
            this.animation = this.resetCamera.bind( this, camera, resetPosition, resetQuaternion );
            camera.position.lerp( resetPosition, 0.11 );
            camera.quaternion.slerp( resetQuaternion, 0.11 );

        }

    }

    addListeners() {

        this.domElement.requestPointerLock();
        this.domElement.addEventListener( "mousemove", this.mouseMoveListener );
        this.domElement.addEventListener( "mouseup", this.mouseUpListener );
        this.domElement.addEventListener( "keyup", this.keyUpListener );

    }

    removeListeners() {

        document.exitPointerLock();
        this.domElement.removeEventListener( "mousemove", this.mouseMoveListener );
        this.domElement.removeEventListener( "mouseup", this.mouseUpListener );
        this.domElement.removeEventListener( "keyup", this.keyUpListener );

    }

    update() {

        if ( this.animation ) {

            this.animation();

        }

    }

    exit() {

        this.unFocus( this.camera, this.scene );
        this.resetCamera( this.camera, this.oldPosition, this.oldQuaternion );
        this.removeListeners();

    }

}

export default ViewControls;
