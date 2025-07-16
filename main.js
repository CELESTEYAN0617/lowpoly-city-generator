import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.module.js';

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

const move = { forward: false, backward: false, left: false, right: false };
const velocity = new THREE.Vector3();
const moveSpeed = 0.5;

document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyW') move.forward = true;
  if (e.code === 'KeyS') move.backward = true;
  if (e.code === 'KeyA') move.left = true;
  if (e.code === 'KeyD') move.right = true;
});
document.addEventListener('keyup', (e) => {
  if (e.code === 'KeyW') move.forward = false;
  if (e.code === 'KeyS') move.backward = false;
  if (e.code === 'KeyA') move.left = false;
  if (e.code === 'KeyD') move.right = false;
});

let isMouseDown = false;
let lastMouseX = 0, lastMouseY = 0;
let yaw = 0, pitch = -0.3;

document.addEventListener('mousedown', (e) => {
  isMouseDown = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});
document.addEventListener('mouseup', () => { isMouseDown = false; });
document.addEventListener('mousemove', (e) => {
  if (!isMouseDown) return;
  const dx = e.clientX - lastMouseX;
  const dy = e.clientY - lastMouseY;
  yaw -= dx * 0.005;
  pitch -= dy * 0.005;
  pitch = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, pitch));
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

const BLOCK_SIZE = 10;
const CELL_SIZE = 10;
const ROAD_WIDTH = 2.5;
const MAIN_ROAD_WIDTH = 6;
const MAIN_ROAD_EVERY = 5;
const CHUNK_RENDER_RADIUS = 1;

const chunks = new Map();

const GLOBAL_SEED = Math.random() * 1000000;

function seededRandom(seed) {
  let x = Math.sin(seed + GLOBAL_SEED) * 10000;
  return x - Math.floor(x);
}

function generateChunk(chunkX, chunkZ) {
  const chunkKey = `${chunkX},${chunkZ}`;
  if (chunks.has(chunkKey)) return;
  const group = new THREE.Group();
  group.position.set(
    chunkX * BLOCK_SIZE * CELL_SIZE,
    0,
    chunkZ * BLOCK_SIZE * CELL_SIZE
  );

  for (let x = 0; x < BLOCK_SIZE; x++) {
    for (let z = 0; z < BLOCK_SIZE; z++) {
      if (x % MAIN_ROAD_EVERY === 0 || z % MAIN_ROAD_EVERY === 0) continue;
      if (x === 0 || z === 0) continue;
      const seed = chunkX * 10000 + chunkZ * 100 + x * 10 + z;
      const h = 4 + Math.floor(seededRandom(seed) * 16);
      const color = new THREE.Color().setHSL(seededRandom(seed+1), 0.5 + seededRandom(seed+2)*0.3, 0.5 + seededRandom(seed+3)*0.2);
      const geo = new THREE.BoxGeometry(CELL_SIZE - ROAD_WIDTH, h, CELL_SIZE - ROAD_WIDTH);
      for (let i = 0; i < geo.attributes.position.count; i++) {
        geo.attributes.position.setY(i, geo.attributes.position.getY(i) + (seededRandom(seed+i)-0.5)*0.7);
      }
      geo.computeVertexNormals();
      const mat = new THREE.MeshLambertMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        x * CELL_SIZE + (CELL_SIZE/2),
        h/2,
        z * CELL_SIZE + (CELL_SIZE/2)
      );
      group.add(mesh);
    }
  }

  for (let x = 0; x <= BLOCK_SIZE; x++) {
    let width = (x % MAIN_ROAD_EVERY === 0) ? MAIN_ROAD_WIDTH : ROAD_WIDTH;
    const geo = new THREE.BoxGeometry(width, 0.1, BLOCK_SIZE * CELL_SIZE);
    const mat = new THREE.MeshLambertMaterial({ color: 0x222233 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x * CELL_SIZE, 0.05, BLOCK_SIZE * CELL_SIZE / 2);
    group.add(mesh);
  }
  for (let z = 0; z <= BLOCK_SIZE; z++) {
    let width = (z % MAIN_ROAD_EVERY === 0) ? MAIN_ROAD_WIDTH : ROAD_WIDTH;
    const geo = new THREE.BoxGeometry(BLOCK_SIZE * CELL_SIZE, 0.1, width);
    const mat = new THREE.MeshLambertMaterial({ color: 0x222233 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(BLOCK_SIZE * CELL_SIZE / 2, 0.05, z * CELL_SIZE);
    group.add(mesh);
  }

  scene.add(group);
  chunks.set(chunkKey, group);
}

function updateChunks() {
  const camX = Math.floor(camera.position.x / (BLOCK_SIZE * CELL_SIZE));
  const camZ = Math.floor(camera.position.z / (BLOCK_SIZE * CELL_SIZE));
  for (let dx = -CHUNK_RENDER_RADIUS; dx <= CHUNK_RENDER_RADIUS; dx++) {
    for (let dz = -CHUNK_RENDER_RADIUS; dz <= CHUNK_RENDER_RADIUS; dz++) {
      generateChunk(camX + dx, camZ + dz);
    }
  }
}

function updateCamera() {
  const dir = new THREE.Vector3(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(yaw) * Math.cos(pitch)
  );
  camera.lookAt(camera.position.clone().add(dir));

  velocity.set(0, 0, 0);
  if (move.forward) velocity.z += moveSpeed;
  if (move.backward) velocity.z -= moveSpeed;
  if (move.left) velocity.x += moveSpeed;
  if (move.right) velocity.x -= moveSpeed;
  const moveDir = new THREE.Vector3(velocity.x, 0, velocity.z).applyAxisAngle(new THREE.Vector3(0,1,0), yaw);
  camera.position.add(moveDir);
}

function animate() {
  requestAnimationFrame(animate);
  updateCamera();
  updateChunks();
  renderer.render(scene, camera);
}

animate();
