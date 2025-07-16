import * as THREE from 'three';
import { TileBuilder } from './TileBuilder.js';
import { TextureManager } from './TextureManager.js';

export class CityGenerator {
  constructor(scene) {
    this.scene = scene;
    this.chunks = new Map();
    this.tileBuilder = new TileBuilder();
    this.textureManager = new TextureManager();
    this.BLOCK_SIZE = 10;
    this.CELL_SIZE = 10;
    this.ROAD_WIDTH = 2.5;
    this.MAIN_ROAD_WIDTH = 6;
    this.MAIN_ROAD_EVERY = 5;
    this.CHUNK_RENDER_RADIUS = 1;
    this.GLOBAL_SEED = Math.random() * 1000000;
  }

  seededRandom(seed) {
    let x = Math.sin(seed + this.GLOBAL_SEED) * 10000;
    return x - Math.floor(x);
  }

  generateChunk(chunkX, chunkZ) {
    const chunkKey = `${chunkX},${chunkZ}`;
    if (this.chunks.has(chunkKey)) return;
    const group = new THREE.Group();
    group.position.set(
      chunkX * this.BLOCK_SIZE * this.CELL_SIZE,
      0,
      chunkZ * this.BLOCK_SIZE * this.CELL_SIZE
    );
    for (let x = 0; x < this.BLOCK_SIZE; x++) {
      for (let z = 0; z < this.BLOCK_SIZE; z++) {
        // Skip main roads
        if (x % this.MAIN_ROAD_EVERY === 0 || z % this.MAIN_ROAD_EVERY === 0) continue;
        // Skip edge roads
        if (x === 0 || z === 0) continue;
        const seed = chunkX * 10000 + chunkZ * 100 + x * 10 + z;
        const h = 4 + Math.floor(this.seededRandom(seed) * 16);
        const color = this.textureManager.getBuildingColor(seed, this.seededRandom.bind(this));
        const mesh = this.tileBuilder.buildBuilding(
          x * this.CELL_SIZE + (this.CELL_SIZE/2),
          h/2,
          z * this.CELL_SIZE + (this.CELL_SIZE/2),
          this.CELL_SIZE - this.ROAD_WIDTH,
          h,
          this.CELL_SIZE - this.ROAD_WIDTH,
          color,
          seed,
          this.seededRandom.bind(this)
        );
        group.add(mesh);
      }
    }
    // Add roads
    for (let x = 0; x <= this.BLOCK_SIZE; x++) {
      let width = (x % this.MAIN_ROAD_EVERY === 0) ? this.MAIN_ROAD_WIDTH : this.ROAD_WIDTH;
      const mesh = this.tileBuilder.buildRoad(
        x * this.CELL_SIZE,
        0.05,
        this.BLOCK_SIZE * this.CELL_SIZE / 2,
        width,
        0.1,
        this.BLOCK_SIZE * this.CELL_SIZE
      );
      group.add(mesh);
    }
    for (let z = 0; z <= this.BLOCK_SIZE; z++) {
      let width = (z % this.MAIN_ROAD_EVERY === 0) ? this.MAIN_ROAD_WIDTH : this.ROAD_WIDTH;
      const mesh = this.tileBuilder.buildRoad(
        this.BLOCK_SIZE * this.CELL_SIZE / 2,
        0.05,
        z * this.CELL_SIZE,
        this.BLOCK_SIZE * this.CELL_SIZE,
        0.1,
        width
      );
      group.add(mesh);
    }
    this.scene.add(group);
    this.chunks.set(chunkKey, group);
  }

  updateChunks(camera) {
    const camX = Math.floor(camera.position.x / (this.BLOCK_SIZE * this.CELL_SIZE));
    const camZ = Math.floor(camera.position.z / (this.BLOCK_SIZE * this.CELL_SIZE));
    for (let dx = -this.CHUNK_RENDER_RADIUS; dx <= this.CHUNK_RENDER_RADIUS; dx++) {
      for (let dz = -this.CHUNK_RENDER_RADIUS; dz <= this.CHUNK_RENDER_RADIUS; dz++) {
        this.generateChunk(camX + dx, camZ + dz);
      }
    }
  }
} 