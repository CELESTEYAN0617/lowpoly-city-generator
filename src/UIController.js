import * as THREE from 'three';

export class UIController {
  constructor(camera, moveSpeed = 0.5) {
    this.camera = camera;
    this.move = { forward: false, backward: false, left: false, right: false };
    this.velocity = new THREE.Vector3();
    this.moveSpeed = moveSpeed;
    this.yaw = 0;
    this.pitch = -0.3;
    this.isMouseDown = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.initEvents();
  }

  initEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyW') this.move.forward = true;
      if (e.code === 'KeyS') this.move.backward = true;
      if (e.code === 'KeyA') this.move.left = true;
      if (e.code === 'KeyD') this.move.right = true;
    });
    document.addEventListener('keyup', (e) => {
      if (e.code === 'KeyW') this.move.forward = false;
      if (e.code === 'KeyS') this.move.backward = false;
      if (e.code === 'KeyA') this.move.left = false;
      if (e.code === 'KeyD') this.move.right = false;
    });
    document.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });
    document.addEventListener('mouseup', () => { this.isMouseDown = false; });
    document.addEventListener('mousemove', (e) => {
      if (!this.isMouseDown) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.yaw -= dx * 0.005;
      this.pitch -= dy * 0.005;
      this.pitch = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, this.pitch));
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });
  }

  updateCamera() {
    const dir = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch)
    );
    this.camera.lookAt(this.camera.position.clone().add(dir));
    this.velocity.set(0, 0, 0);
    if (this.move.forward) this.velocity.z += this.moveSpeed;
    if (this.move.backward) this.velocity.z -= this.moveSpeed;
    if (this.move.left) this.velocity.x += this.moveSpeed;
    if (this.move.right) this.velocity.x -= this.moveSpeed;
    const moveDir = new THREE.Vector3(this.velocity.x, 0, this.velocity.z).applyAxisAngle(new THREE.Vector3(0,1,0), this.yaw);
    this.camera.position.add(moveDir);
  }
} 