
import { ViewControls } from "./ViewControls.js";
var camera, scene, renderer, viewControls;

init();
animate();

function init() {

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 100000 );
    camera.position.set( 0.2, 3.31, 7.94 );
    camera.lookAt( new THREE.Vector3( - 0.0, 1.5, 0 ) );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xADD8E6 );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.shadowMap.enabled = true;
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    viewControls = new ViewControls( camera, scene, renderer.domElement );

    // remaining code in this block is for various scene items

    const ambientLight = new THREE.HemisphereLight( 0xFFFFFF, 0x666666, 0.65 );
    scene.add( ambientLight );

    var directionalLight = new THREE.DirectionalLight( 0xFFEEDD, 0.5 );
    directionalLight.position.set( 1, 10, 3 );
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.far = 200000;
    const shadowCamDimension = 10;
    directionalLight.shadow.camera.left = -shadowCamDimension;
    directionalLight.shadow.camera.right = shadowCamDimension;
    directionalLight.shadow.camera.bottom = -shadowCamDimension;
    directionalLight.shadow.camera.top = shadowCamDimension;
    directionalLight.shadow.camera.updateProjectionMatrix();

    scene.add( directionalLight );

    var grassTexture = new THREE.TextureLoader().load( "./textures/grass.jpg" );
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set( 25, 25 );

    var floor = new THREE.Mesh(
        new THREE.PlaneBufferGeometry( 200, 200 ),
        new THREE.MeshStandardMaterial( { map: grassTexture } )
    );
    floor.rotateX( - Math.PI / 2 );
    floor.receiveShadow = true;
    scene.add( floor );

    var wallTexture = new THREE.TextureLoader().load( "./textures/01murocrep512.jpg" );
    var boxGeometry = new THREE.BoxBufferGeometry( 2, 2, 2 );
    var boxMaterial = new THREE.MeshStandardMaterial( { color: 0xeeeeee, map: wallTexture } );

    var box = new THREE.Mesh( boxGeometry, boxMaterial );
    box.castShadow = true;
    box.receiveShadow = true;

    var box1 = box.clone();
    box1.position.set( 3, 1, 0 );
    scene.add( box1 );

    var box2 = box.clone();
    box2.position.set( - 3, 1, 0 );
    scene.add( box2 );

    var box3 = box.clone();
    box3.position.set( 0, 6, 0 );
    scene.add( box3 );

    window.addEventListener( 'resize', onWindowResize, false );

    class Sign extends THREE.Mesh  {

        constructor( textMaterial ) {
            var signFrameMaterial = new THREE.MeshStandardMaterial( { color: 0x8B6914 } );
            super(new THREE.BoxBufferGeometry( 0.1, 2, 0.1 ), signFrameMaterial);

            this.frame = new THREE.Mesh(
                new THREE.BoxBufferGeometry( 2.1, 0.1, 1.1 ),
                signFrameMaterial
            );
            this.add( this.frame );
            this.frame.position.y += 1;
            this.frame.rotation.x = 0.75;

            textMaterial.anisotropy = 2;
            var text = new THREE.Mesh(
                new THREE.PlaneBufferGeometry( 2, 1 ),
                new THREE.MeshStandardMaterial( { map: textMaterial } )
            );
            text.rotation.x = - Math.PI / 2;
            text.position.y += 0.07;
            this.frame.add( text );
            this.frame.castShadow = true;
            this.castShadow = true;
            this.receiveShadow = true;

        }
    }

    var instructionsJustAlt = new THREE.TextureLoader().load( "./textures/instructionsJustAlt.png" );
    var sign = new Sign( instructionsJustAlt );
    scene.add( sign );
    sign.position.set( 0, 1, 6 );

    var instructionsAltControl = new THREE.TextureLoader().load( "./textures/instructionsAltControl.png" );
    var sign2 = new Sign( instructionsAltControl );
    scene.add( sign2 );
    sign2.position.set( 0, 1, - 6 );
    sign2.rotation.y = Math.PI;

    var instructionsLookUp = new THREE.TextureLoader().load( "./textures/instructionsLookUp.png" );
    var sign3 = new Sign( instructionsLookUp );
    scene.add( sign3 );
    sign3.position.set( 6, 1, 0 );
    sign3.rotation.y = Math.PI / 2;

    var instructionsEscape = new THREE.TextureLoader().load( "./textures/instructionsEscape.png" );
    var sign4 = new Sign( instructionsEscape );
    scene.add( sign4 );
    sign4.position.set( - 6, 1, 0 );
    sign4.rotation.y = - Math.PI / 2;

    var instructionsHaveYouSeen = new THREE.TextureLoader().load( "./textures/instructionsHaveYouSeen.png" );
    var sign5 = new Sign( instructionsHaveYouSeen );
    scene.add( sign5 );
    sign5.position.set( 0, 6, 0 );
    sign5.rotation.y = - Math.PI / 2;
    sign5.frame.rotation.x = 0;
    sign5.frame.scale.set( 0.5, 0.5, 0.5 );

}

function animate() {

    viewControls.update();
    renderer.render( scene, camera );
    requestAnimationFrame( animate );

}


function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}
