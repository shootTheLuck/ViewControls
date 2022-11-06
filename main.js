
import * as THREE from "three";
import { HTMLMesh } from "./lib/HTMLMesh.js";
import { ViewControls } from "./ViewControls.js";
var camera, scene, renderer, clock, viewControls;

init();
animate();

function init() {

    camera = new THREE.PerspectiveCamera( 65, window.innerWidth / window.innerHeight, 0.01, 100000 );
    camera.position.set( 0.2, 3.31, 8.25 );
    camera.lookAt( new THREE.Vector3( 0.0, 1.5, 0 ) );

    scene = new THREE.Scene();
    // scene.background = new THREE.Color( 0xADD8E6 );
    // scene.background = new THREE.Color( 0x88AAFF );
    scene.background = new THREE.Color( 0xAACCFF );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.shadowMap.enabled = true;
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    clock = new THREE.Clock();

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
    // directionalLight.shadow.camera.updateProjectionMatrix();

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
    var boxMaterial = new THREE.MeshStandardMaterial( { map: wallTexture } );

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

        constructor( textMap ) {
            var signFrameMaterial = new THREE.MeshStandardMaterial( { color: 0x8B6914 } );
            super(new THREE.BoxBufferGeometry( 0.1, 2, 0.1 ), signFrameMaterial);

            this.frame = new THREE.Mesh(
                new THREE.BoxBufferGeometry( 2.1, 0.1, 1.1 ),
                signFrameMaterial
            );
            this.add( this.frame );
            this.frame.position.y += 1;
            this.frame.rotation.x = 0.75;

            textMap.anisotropy = 2;
            textMap.minFilter = THREE.LinearMipmapLinearFilter;
            var text = new THREE.Mesh(
                new THREE.PlaneBufferGeometry( 2, 1 ),
                new THREE.MeshStandardMaterial( { map: textMap } )
            );
            text.rotation.x = - Math.PI / 2;
            text.position.y += 0.07;
            this.frame.add( text );
            this.frame.castShadow = true;
            this.castShadow = true;
            this.receiveShadow = true;

        }
    }

    const htmlMesh1 = new HTMLMesh( document.getElementById( "alt" ) );
    const sign1 = new Sign( htmlMesh1.material.map );
    scene.add( sign1 );
    sign1.position.set( 0, 1, 6 );

    const htmlMesh2 = new HTMLMesh( document.getElementById( "altCtrl" ) );
    const sign2 = new Sign( htmlMesh2.material.map );
    scene.add( sign2 );
    sign2.position.set( 0, 1, -6 );
    sign2.rotation.y = Math.PI;

    const htmlMesh3 = new HTMLMesh( document.getElementById( "lookUp" ) );
    const sign3 = new Sign( htmlMesh3.material.map );
    scene.add( sign3 );
    sign3.position.set( 6, 1, 0 );
    sign3.rotation.y = Math.PI / 2;

    const htmlMesh4 = new HTMLMesh( document.getElementById( "escape" ) );
    const sign4 = new Sign( htmlMesh4.material.map );
    scene.add( sign4 );
    sign4.position.set( -6, 1, 0 );
    sign4.rotation.y = -Math.PI / 2;

    const htmlMesh5 = new HTMLMesh( document.getElementById( "haveYouSeen") );
    const sign5 = new Sign( htmlMesh5.material.map );
    scene.add( sign5 );
    sign5.position.set( 0, 6, 0 );
    sign5.rotation.y = - Math.PI / 2;
    sign5.frame.rotation.x = 0;
    sign5.frame.scale.set( 0.5, 0.5, 0.5 );

}

function animate() {
    const delta = clock.getDelta();
    viewControls.update(delta);
    renderer.render( scene, camera );
    requestAnimationFrame( animate );

}


function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}
