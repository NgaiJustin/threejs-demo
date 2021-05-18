import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import * as dat from "dat.gui";

let mixer;

const gui = new dat.GUI();

const clock = new THREE.Clock();
const canvas = document.querySelector("canvas.webgl");

// Loading
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/draco/"
);
const loader = new GLTFLoader();

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

window.addEventListener("resize", () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: canvas,
    alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;

const pmremGenerator = new THREE.PMREMGenerator(renderer);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfe3dd);
scene.environment = pmremGenerator.fromScene(
    new RoomEnvironment(),
    0.04
).texture;

/**
 * Camera
 */

const camera = new THREE.PerspectiveCamera(
    40,
    sizes.width / sizes.height,
    0.1,
    5000
);
camera.position.set(1, 2, -3);
camera.lookAt(0, 0, 0);

/**
 * Controls
 */
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1, 0);
controls.update();
controls.enablePan = true;
controls.enableDamping = true;

loader.setDRACOLoader(dracoLoader);
loader.load(
    "models/Soldier.glb",
    function (gltf) {
        const model = gltf.scene;
        model.position.set(0, 0, 0);
        model.scale.set(1, 1, 1);
        scene.add(model);

        mixer = new THREE.AnimationMixer(model);
        mixer.clipAction(gltf.animations[0]).play();

        animate();
    },
    undefined,
    function (e) {
        console.error(e);
    }
);

window.onresize = function () {
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
};

function animate() {
    window.requestAnimationFrame(animate);

    const delta = clock.getDelta();

    mixer.update(delta);

    controls.update();

    renderer.render(scene, camera);
}

// Enable drag and drop features
document.addEventListener("dragover", function (event) {
    event.preventDefault();
});

const loadFile = function (files) {
    if (files.length > 0) {
        // Only process first file
        const file = files[0];
        const filename = file.name;
        const reader = new FileReader();

        console.log(filename);

        reader.addEventListener(
            "load",
            function (event) {
                const contents = event.target.result;
                console.log("Creating model");
                loader.parse(contents, "", function (gltf) {
                    const model = gltf.scene;
                    model.position.set(0, 0, 0);
                    model.scale.set(1, 1, 1);
                    scene.clear();
                    scene.add(model);

                    mixer = new THREE.AnimationMixer(model);
                    mixer.clipAction(gltf.animations[0]).play();

                    animate();
                });
            },
            false
        );

        reader.readAsArrayBuffer(file);
    }
};

window.addEventListener(
    "drop",
    function (event) {
        event.preventDefault();
        loadFile(event.dataTransfer.files);
    },
    false
);
