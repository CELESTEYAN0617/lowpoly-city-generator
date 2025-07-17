//creating city

import * as THREE from 'three';
import { CityGenerator } from './CityGenerator.js';
import { UIController } from './UIController.js';
import { TileBuilder } from './TileBuilder.js';
import { TextureManager } from './TextureManager.js';
import { ParameterManager } from './ParameterManager.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaadfff);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 40);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
dirLight.position.set(30, 100, 40);
scene.add(dirLight);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


const uiController = new UIController(camera, 0.5);
const cityGenerator = new CityGenerator(scene);

const tileBuilder = new TileBuilder();
const textureManager = new TextureManager();

const parameterManager = new ParameterManager();

// 初始化参数到cityGenerator
cityGenerator.updateParameters(parameterManager.getParameters());
textureManager.updateParameters(parameterManager.getParameters());

parameterManager.onParameterChange((params) => {
  cityGenerator.updateParameters(params);
  textureManager.updateParameters(params);
  // 实时重新生成城市
  cityGenerator.regenerateCity();
});

parameterManager.onResetCamera(() => {
  console.log('重置相机');
  camera.position.set(0, 20, 40);
  uiController.yaw = 0;
  uiController.pitch = -0.3;
  // 重置移动状态
  uiController.move = { forward: false, backward: false, left: false, right: false };
  uiController.velocity.set(0, 0);
});

function animate() {
  requestAnimationFrame(animate);
  uiController.updateCamera();
  cityGenerator.updateChunks(camera);
  renderer.render(scene, camera);
}

animate();
