
import {MousePicker} from "./MousePicker.js";

class ViewControls extends THREE.Object3D {

    constructor( camera, scene, domElement, opts = {} ) {


        if (!(camera instanceof THREE.Camera)) {
            console.error("ViewControls requires a THREE camera as first parameter");
        }

        if (!(scene instanceof THREE.Scene)) {
            console.error("ViewControls requires a THREE scene as second parameter");
        }

        if (!(domElement instanceof HTMLElement)) {
            console.error("ViewControls requires a DOM element (renderer.domElement) as third parameter");
        }

        super();
        this.name = opts.name || "viewControls";
        this.autoReturn = ( opts.autoReturn !== undefined ) ? opts.autoReturn : true;
        this.rotationSpeed = opts.rotationSpeed || 0.005;
        this.maxDollySpeed = opts.maxDollySpeed || Infinity;
        this.altKey = opts.altKey || "Alt";
        this.distanceTolerance = opts.distanceTolerance || 0.002;
        this.minCameraDistance = opts.minCameraDistance || camera.near * 2;

        this.camera = camera;
        this.scene = scene;
        this.domElement = domElement;

        /* make sure element can receive keys. */
        if ( this.domElement.tabIndex < 0 ) {
            this.domElement.tabIndex = 0;
        }

        this.outer = new THREE.Object3D();
        // this.outer.rotation.y += Math.PI;
        this.outer.name = "outer";
        this.add( this.outer );

        this.mousePicker = new MousePicker();
        this.oldPosition = camera.position.clone();
        this.oldQuaternion = camera.quaternion.clone();
        this.oldParent = camera.parent || scene;

        this.focusIncrement = 0;
        this.focusSpeed = 0.03;

        this.wheelDollySpeed = 0.1;
        this.focusMatrix = new THREE.Matrix4();
        this.focusQuaternion = new THREE.Quaternion();
        this.focused = false;
        this.animation = null;
        this.focusIterations = 0;
        this.maxFocusIterations = 20;
        this.movementX = 0;
        this.movementY = 0;
        this.movementZ = 0;
        this.damper = 0.5;

        this.mouseMoveListener = this.handleMouseMove.bind( this );
        this.mouseDownListener = this.handleMouseDown.bind( this );
        this.mouseUpListener = this.handleMouseUp.bind( this );
        this.keyDownListener = this.handleKeyDown.bind( this );
        this.keyUpListener = this.handleKeyUp.bind( this );
        this.mouseWheelListener = this.handleMouseWheel.bind( this );

        this.domElement.addEventListener( "mousedown", this.mouseDownListener );
        this.domElement.addEventListener( "wheel", this.mouseWheelListener );
        this.domElement.addEventListener( "keydown", this.keyDownListener );
        this.domElement.addEventListener( "contextmenu", ( evt ) => {
            evt.preventDefault();
        } );

        this.scene.add( this );

    }

    handleMouseDown( evt ) {

        let intersects = this.mousePicker.pick( evt, this.camera, this.scene );
        if ( !intersects ) return;

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
        this.damper = 0.5;
        if ( evt.ctrlKey ) {
            this.movementX += ( Math.sign(evt.movementY) + evt.movementY/5 ) * this.rotationSpeed;
            this.movementY += ( Math.sign(evt.movementX) + evt.movementX/3 ) * this.rotationSpeed;
        } else {
            if (Math.abs(evt.movementY) > Math.abs(evt.movementX)) {
                this.movementY += ( Math.sign(evt.movementX)/100 + evt.movementX/1000 ) * this.rotationSpeed;
            } else {
                this.movementY += ( Math.sign(evt.movementX) + evt.movementX/3 ) * this.rotationSpeed;
            }
            this.movementZ += ( Math.sign(evt.movementY) + evt.movementY/5 ) * this.rotationSpeed;
        }
    }

    handleMouseUp( evt ) {
        this.removeListeners();
    }

    handleMouseWheel( evt ) {
        evt.preventDefault();
        /* if something else needs the mouse wheel it can use ctrlKey */
        if (evt.ctrlKey && !evt.altKey) {
            return;
        }
        this.animation = null;
        var direction = Math.sign(evt.deltaY);
        var wheelAmount = direction * this.wheelDollySpeed;

        this.dolly( wheelAmount, 0 );
    }

    dolly( amount, minDistance = 0 ) {
        var dollyAmount = THREE.MathUtils.clamp( amount * this.camera.position.z,
                -this.maxDollySpeed, this.maxDollySpeed );

        if ( this.camera.position.z > 0 ) {
            this.camera.translateZ( dollyAmount );
        }
        this.camera.position.z = Math.max( this.minCameraDistance, this.camera.position.z );
    }

    handleKeyUp( evt ) {
        if ( evt.key === this.altKey ) {
            this.removeListeners();
        }
    }

    handleKeyDown( evt ) {
        if ( evt.key === "Escape" && this.autoReturn ) {
            this.exit();
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
            this.animation = this.panToObject.bind( this, camera, position );
        }
    }

    startFocus( camera, position ) {
        this.focusIterations = 0;
        this.scene.attach( camera );
        this.focusMatrix.lookAt( camera.position, position, camera.up );
        this.focusQuaternion.setFromRotationMatrix( this.focusMatrix );
        this.panToObject( camera, position );
    }

    unFocus( camera ) {
        this.focusIncrement = 0;
        this.focused = false;
        this.oldParent.attach( camera );
    }

    resetCamera( camera, resetPosition, resetQuaternion ) {
        if ( camera.position.manhattanDistanceTo( resetPosition ) < this.distanceTolerance ) {
            camera.position.copy( resetPosition );
            camera.quaternion.copy( resetQuaternion );
            this.animation = null;
        } else {
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

        if ( this.focused ) {
            this.rotateY( -this.movementY );
            this.outer.rotateX( -this.movementX );
            this.dolly( this.movementZ );
        }

        this.movementX *= this.damper;
        this.movementY *= this.damper;
        this.movementZ *= this.damper;
        // this.damper *= 0.5;
    }

    saveState() {
        this.oldPosition = this.camera.position.clone();
        this.oldQuaternion = this.camera.quaternion.clone();
        this.oldParent = this.camera.parent || this.scene;
    }

    exit() {
        this.unFocus( this.camera, this.scene );
        this.resetCamera( this.camera, this.oldPosition, this.oldQuaternion );
        this.removeListeners();
    }
}

export {ViewControls};