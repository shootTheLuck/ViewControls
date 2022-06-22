
import { RayPicker } from "./RayPicker.js";

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
        this.dollySpeed = opts.dollySpeed || 0.003;
        this.maxDollySpeed = opts.maxDollySpeed || Infinity;
        this.activationKey = opts.activationKey || "Alt";
        this.distanceTolerance = opts.distanceTolerance || 0.002;
        this.minCameraDistance = opts.minCameraDistance || camera.near * 2;

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
        this.enabled = true;

    }

    handleMouseDown( evt ) {

        this.rayPicker.setFromMouseEventAndCamera( evt, this.camera );
        let intersects = this.rayPicker.pick( this.scene );
        if ( !intersects ) return;

        if ( evt.button === 0 ) {

            if ( this.enabled && evt.getModifierState( this.activationKey ) ) {

                this.addListeners();
                this.unFocus();
                this.startFocus( this.camera, intersects.point );

            } else {

                const event = { type: "leftClick" };

                for ( const property in intersects ) {

                    if ( intersects.hasOwnProperty( property ) ) {
                        event[ property ] = intersects[ property ];
                    }
                }

                event.originalEvent = evt;
                this.dispatchEvent( event );

            }
        }

        if ( evt.button === 2 ) {

            evt.preventDefault();

            const event = { type: "rightClick" };

            for ( const property in intersects ) {

                if ( intersects.hasOwnProperty( property ) ) {
                    event[ property ] = intersects[ property ];
                }
            }

            event.originalEvent = evt;
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
        this.removeListeners();
    }

    handleMouseWheel( evt ) {

        if ( !this.enabled ) return;

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

    dolly( amount ) {
        const dollyAmount = THREE.MathUtils.clamp( amount * this.camera.position.z,
                -this.maxDollySpeed, this.maxDollySpeed );

        if ( this.camera.position.z > 0 ) {
            this.camera.translateZ( dollyAmount );
        }
        this.camera.position.z = Math.max( this.minCameraDistance, this.camera.position.z );
    }

    handleKeyUp( evt ) {
        if ( evt.key === this.activationKey ) {
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
        const d = THREE.Vector3.prototype.manhattanDistanceTo.call( this, camera.quaternion, this.focusQuaternion );
        if ( d < this.distanceTolerance || this.focusIterations > this.maxFocusIterations ) {
            this.focused = true;
            this.focusIncrement = 0;
            this.position.copy( position );
            this.cameraHolder.lookAt( camera.position );
            this.cameraHolder.attach( camera );
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

    unFocus() {
        this.focusIncrement = 0;
        this.focused = false;
        this.oldParent.attach( this.camera );
    }

    resetCamera() {
        if ( this.camera.position.manhattanDistanceTo( this.oldPosition ) < this.distanceTolerance ) {
            this.camera.position.copy( this.oldPosition );
            this.camera.quaternion.copy( this.oldQuaternion );
            this.animation = null;
        } else {
            this.animation = this.resetCamera.bind( this );
            this.camera.position.lerp( this.oldPosition, 0.11 );
            this.camera.quaternion.slerp( this.oldQuaternion, 0.11 );
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

        if ( !this.enabled ) return;

        if ( this.animation ) {
            this.animation();
        }

        if ( this.focused ) {
            this.rotateY( -this.movementY  * this.rotationSpeed );
            this.cameraHolder.rotateX( -this.movementX * this.rotationSpeed );
            this.dolly( this.movementZ * this.rotationSpeed );
        }

        this.movementX *= this.damper;
        this.movementY *= this.damper;
        this.movementZ *= this.damper;
    }

    saveState() {
        this.oldPosition = this.camera.position.clone();
        this.oldQuaternion = this.camera.quaternion.clone();
        this.oldParent = this.camera.parent || this.scene;
    }

    exit() {
        this.unFocus();
        this.resetCamera();
        this.removeListeners();
    }
}

export { ViewControls };