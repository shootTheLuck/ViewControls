
import ViewControls from "../js/mjs/ViewControls.js";
import ModalWindow from "https://shoottheluck.github.io/Modal-Window/ModalWindow.js";

var camera, scene, renderer, controls;

init();
animate();

function init() {

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 100000 );
    camera.position.set(0.2, 3.31, 7.94);
    camera.lookAt(new THREE.Vector3(-0.0, 1.5, 0));

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xADD8E6);

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.4);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFEEDD, 0.6);
    directionalLight.position.set(10,10,10);
    scene.add(directionalLight);

    var grassTexture = new THREE.TextureLoader().load("./textures/grass.jpg");
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(15, 15);

    var floor = new THREE.Mesh(
        new THREE.PlaneGeometry( 200, 200 ),
        new THREE.MeshStandardMaterial({map : grassTexture})
    );
    floor.rotateX( - Math.PI / 2 );

    floor.position.set( 0, 0, 0 );
    scene.add( floor );

    var wallTexture = new THREE.TextureLoader().load("./textures/01murocrep512.jpg");
    var boxGeometry = new THREE.BoxGeometry(2,2,2 );
    var boxMaterial = new THREE.MeshStandardMaterial({color: 0xeeeeee, map: wallTexture});

    var box1 = new THREE.Mesh( boxGeometry, boxMaterial );
    box1.position.set(3, 1, 0);
    scene.add( box1 );

    var box2 = new THREE.Mesh( boxGeometry, boxMaterial );
    box2.position.set(-3, 1, 0);
    scene.add( box2 );

    var box3 = new THREE.Mesh( boxGeometry, boxMaterial );
    box3.position.set(0, 6, 0);
    scene.add( box3 );

    controls = new ViewControls(camera, scene, renderer.domElement);
    window.addEventListener( 'resize', onWindowResize, false );

    function Sign(textMaterial) {

        var signFrameMaterial = new THREE.MeshStandardMaterial({color: 0x8B6914});
        THREE.Mesh.apply(this, [
            new THREE.BoxGeometry(0.1, 2, 0.1),
            signFrameMaterial
        ]);

        this.frame = new THREE.Mesh(
            new THREE.BoxGeometry(2.1, 0.1, 1.1),
            signFrameMaterial
        );
        this.add(this.frame);
        this.frame.position.y += 1;
        this.frame.rotation.x = 0.75;

        var text = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 1),
            new THREE.MeshStandardMaterial({map: textMaterial})
        );
        text.rotation.x = -Math.PI/2;
        text.position.y += 0.07;
        this.frame.add( text );
    }

    Sign.prototype = Object.create(THREE.Mesh.prototype);
    Sign.prototype.constructor = Sign;

    var instructionsJustAlt = new THREE.TextureLoader().load( "./textures/instructionsJustAlt.png" );
    var sign = new Sign(instructionsJustAlt);
    scene.add(sign);
    sign.position.set(0, 1, 6);

    var pointLight1 = new THREE.PointLight(0xFFEEDD, 0.4);
    pointLight1.distance = 6;
    pointLight1.position.set(0, 3.4, -6.5);
    scene.add(pointLight1);

    var instructionsAltControl = new THREE.TextureLoader().load( "instructionsAltControl.png" );
    var sign2 = new Sign(instructionsAltControl);
    scene.add(sign2);
    sign2.position.set(0, 1, -6);
    sign2.rotation.y = Math.PI;

    var instructionsLookUp = new THREE.TextureLoader().load( "./textures/instructionsLookUp.png" );
    var sign3 = new Sign(instructionsLookUp);
    scene.add(sign3);
    sign3.position.set(6, 1, 0);
    sign3.rotation.y = Math.PI/2;

    var pointLight2 = new THREE.PointLight(0xFFEEDD, 0.4);
    pointLight2.distance = 6;
    pointLight2.position.set(-6.5, 3.4, 0);
    scene.add(pointLight2);

    var instructionsEscape = new THREE.TextureLoader().load( "./textures/instructionsEscape.png" );
    var sign4 = new Sign(instructionsEscape);
    scene.add(sign4);
    sign4.position.set(-6, 1, 0);
    sign4.rotation.y = -Math.PI/2;

    var instructionsHaveYouSeen = new THREE.TextureLoader().load( "./textures/instructionsHaveYouSeen.png" );
    var sign5 = new Sign(instructionsHaveYouSeen);
    scene.add(sign5);
    sign5.position.set(0, 6, 0);
    sign5.rotation.y = -Math.PI/2;
    sign5.frame.rotation.x = 0;
    sign5.frame.scale.set(0.5,0.5,0.5);
}

function animate() {
    requestAnimationFrame( animate );
    controls.update();
    renderer.render( scene, camera );
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}
