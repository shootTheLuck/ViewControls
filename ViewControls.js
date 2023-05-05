
import * as THREE from "three";
import { RayPicker } from "./RayPicker.js";

const _xAxis = new THREE.Vector3(1, 0, 0);
const _yAxis = new THREE.Vector3(0, 1, 0);
const _zAxis = new THREE.Vector3(0, 0, 1);

class ViewControls extends THREE.Object3D {

    constructor( camera, scene, domElement, opts = {} ) {

        if ( !camera.isCamera ) {
            console.error( "ViewControls requires a THREE camera as first parameter" );
        }

        if ( !scene.isScene ) {
            console.error( "ViewControls requires a THREE scene as second parameter" );
        }

        if ( !(domElement instanceof HTMLElement) ) {
            console.error( "ViewControls requires a DOM element (renderer.domElement) as third parameter" );
        }

        super();
        this.name = opts.name || "viewControls";
        this.autoReturn = ( opts.autoReturn !== undefined ) ? opts.autoReturn : true;
        this.rotationSpeed = opts.rotationSpeed || 0.02;
        this.accelerationRate = opts.accelerationRate || 0.1;
        this.damper = opts.damper || 0.5;
        this.dollySpeed = opts.dollySpeed || 0.003; // not used
        this.maxDollySpeed = opts.maxDollySpeed || Infinity;
        this.activationKey = opts.activationKey || "Alt";
        this.minCameraDistance = opts.minCameraDistance || camera.near * 2;
        this.maxCameraDistance = opts.maxCameraDistance || camera.far * 0.75;

        this.camera = camera;
        this.scene = scene;
        this.domElement = domElement;

        /* make sure element can receive keys. */
        if ( this.domElement.tabIndex < 0 ) {
            this.domElement.tabIndex = 0;
        }

        this.cameraHolder = new THREE.Object3D();
        this.cameraHolder.name = "cameraHolder";
        this.add( this.cameraHolder );

        this.rayPicker = new RayPicker();
        this.resetPosition = camera.position.clone();
        this.resetQuaternion = camera.quaternion.clone();
        this.resetParent = camera.parent || scene;
        this.viewObject = null;
        this.viewPosition = new THREE.Vector3();

        this.focusIncrement = 0;
        this.focusSpeed = 1;

        this.wheelDollySpeed = 0.1;
        this.focusMatrix = new THREE.Matrix4();
        this.focusQuaternion = new THREE.Quaternion();
        this.focused = false;
        this.animation = null;
        this.movementX = 0;
        this.movementY = 0;
        this.movementZ = 0;

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
        // document.addEventListener( "wheel", this.mouseWheelListener );

        this.enabled = true;
        this.focusedEvent = {type: "focused"};

    }

    handleMouseDown( evt ) {

        this.rayPicker.setFromMouseEventAndCamera( evt, this.camera );
        let intersect = this.rayPicker.pick( this.scene );

        if ( evt.button === 0 ) {

            if ( this.enabled && evt.getModifierState( this.activationKey ) ) {

                if ( intersect && intersect.distance <= this.maxCameraDistance ) {
                    this.addDOMListeners();
                    this.beginPanCamera( intersect.object, intersect.point );
                }

            } else {

                const event = { type: "leftClick" };

                event.mouseEvent = evt;
                event.intersect = intersect;
                this.dispatchEvent( event );

            }
        }

        if ( evt.button === 2 ) {

            evt.preventDefault();

            const event = { type: "rightClick" };

            event.mouseEvent = evt;
            event.intersect = intersect;
            this.dispatchEvent( event );

        }
    }

    /* with ctrlKey = orbit side to side + up and down
     * without ctrlKey = orbit side to side + pan with up and down
     */

    handleMouseMove( evt ) {

        if ( !this.enabled ) return;

        const x = evt.movementX;
        const y = evt.movementY;
        // const x = THREE.MathUtils.clamp(evt.movementX, -100, 100);
        // const y = THREE.MathUtils.clamp(evt.movementY, -100, 100);

        if ( evt.ctrlKey ) {

            this.movementX += y * this.accelerationRate;
            this.movementY += x * this.accelerationRate;

        } else {

            if ( Math.abs( y ) > Math.abs( x ) ) {

                /* if panning, kill most of the movement from side to side */
                this.movementY += x/1000 * this.accelerationRate;
            } else {
                this.movementY += x * this.accelerationRate;
            }

            this.movementZ += y * this.accelerationRate;
        }
    }

    handleMouseUp( evt ) {
        this.removeDOMListeners();
    }

    handleMouseWheel( evt ) {

        if ( !this.enabled ) return;

        const activeElement = document.activeElement;

        if ( activeElement === this.domElement || activeElement === document.body ) {

            evt.preventDefault();

            /* if something else needs the mouse wheel it can use ctrlKey */
            if ( evt.ctrlKey && !evt.activationKey ) {
                return;
            }

            this.animation = null;
            const direction = Math.sign( evt.deltaY );
            const wheelAmount = direction * this.wheelDollySpeed;

            this.dolly( wheelAmount );
        }

    }

    dolly( amount ) {
        const distance = this.camera.position.length();
        const dollyAmount = THREE.MathUtils.clamp( amount * distance,
                -this.maxDollySpeed, this.maxDollySpeed );

        this.camera.translateZ( dollyAmount );
        this.camera.position.clampLength( this.minCameraDistance, this.maxCameraDistance );
    }

    handleKeyUp( evt ) {
        if ( evt.key === this.activationKey ) {
            this.removeDOMListeners();
        }
    }

    handleKeyDown( evt ) {
        if ( evt.key === "Escape" && this.autoReturn ) {
            this.exit();
        }
    }

    panCamera( delta = 0.017 ) {

        // this is not the correct way to slerp
        this.camera.quaternion.slerp( this.focusQuaternion, this.focusIncrement );
        this.focusIncrement += this.focusSpeed * delta;

        // slerp to 1.0 takes too long and doesn't make much difference so
        // stop at > 0.5...
        if ( this.focusIncrement > 0.5 ) {

            this.focused = true;
            this.position.copy( this.viewPosition );
            this.cameraHolder.lookAt( this.camera.position );
            this.cameraHolder.attach( this.camera );
            this.animation = null;

            const event = { type: "focused", object: this.viewObject, point: this.viewPosition };
            this.dispatchEvent( event );

        } else {

            this.animation = this.panCamera.bind( this );

        }
    }

    beginPanCamera( object, position ) {
        this.focused = false;
        this.focusIncrement = 0;
        this.scene.attach( this.camera );
        this.focusMatrix.lookAt( this.camera.position, position, this.camera.up );
        this.focusQuaternion.setFromRotationMatrix( this.focusMatrix );
        this.viewObject = object;
        this.viewPosition.copy( position );
        this.panCamera();
    }

    resetCamera() {

        // this is not the correct way to lerp or slerp
        this.camera.position.lerp( this.resetPosition, 0.11 );
        this.camera.quaternion.slerp( this.resetQuaternion, 0.055 );

        // slerp to 1.0 takes too long and doesn't make much difference so
        // stop at > 0.5...
        if ( this.focusIncrement > 0.5 ) {

            this.camera.position.copy( this.resetPosition );
            this.camera.quaternion.copy( this.resetQuaternion );
            this.animation = null;

        } else {

            this.animation = this.resetCamera.bind( this );

        }
    }

    addDOMListeners() {
        this.domElement.requestPointerLock();
        this.domElement.addEventListener( "mousemove", this.mouseMoveListener );
        this.domElement.addEventListener( "mouseup", this.mouseUpListener );
        this.domElement.addEventListener( "keyup", this.keyUpListener );
    }

    removeDOMListeners() {
        document.exitPointerLock();
        this.domElement.removeEventListener( "mousemove", this.mouseMoveListener );
        this.domElement.removeEventListener( "mouseup", this.mouseUpListener );
        this.domElement.removeEventListener( "keyup", this.keyUpListener );
    }

    update( delta = 0.017 ) {

        if ( !this.enabled ) return;

        if ( this.animation ) {
            this.animation( delta );
        }

        if ( !_yAxis.equals( this.camera.up ) ) {
            _yAxis.copy(this.camera.up);
            this.cameraHolder.up.copy(this.camera.up);
        }

        if ( this.focused ) {
            // this.rotateY( -this.movementY  * this.rotationSpeed );
            // this.cameraHolder.rotateX( -this.movementX * this.rotationSpeed );
            this.rotateOnWorldAxis( _yAxis, -this.movementY  * this.rotationSpeed );
            this.cameraHolder.rotateOnAxis( _xAxis, -this.movementX * this.rotationSpeed );
            this.dolly( this.movementZ * this.rotationSpeed );
        }

        this.movementX *= this.damper;
        this.movementY *= this.damper;
        this.movementZ *= this.damper;

        this.updateMatrixWorld();
    }

    saveState() {
        this.resetPosition = this.camera.position.clone();
        this.resetQuaternion = this.camera.quaternion.clone();
        this.resetParent = this.camera.parent || this.scene;
    }

    exit() {
        this.focusIncrement = 0;
        this.resetParent.attach( this.camera );
        this.resetCamera();
        this.removeDOMListeners();
    }
}

export { ViewControls };