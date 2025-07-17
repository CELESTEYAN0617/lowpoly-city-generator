import * as THREE from 'three';
import { TileBuilder } from './TileBuilder.js';
import { TextureManager } from './TextureManager.js';

export class CityGenerator {
  constructor(scene) {
    this.scene = scene;
    this.chunks = new Map();
    this.tileBuilder = new TileBuilder();
    this.textureManager = new TextureManager();
    
    // 默认参数
    this.parameters = {
      buildingDensity: 0.8,
      heightRange: 16,
      roadWidth: 2.5,
      mainRoadWidth: 6,
      mainRoadInterval: 5,
      colorSaturation: 0.5,
      colorBrightness: 0.5,
      renderDistance: 1,
      randomSeed: 12345
    };
    
    this.BLOCK_SIZE = 10;
    this.CELL_SIZE = 10;
    this.GLOBAL_SEED = this.parameters.randomSeed;
  }

  updateParameters(newParams) {
    this.parameters = { ...this.parameters, ...newParams };
    this.GLOBAL_SEED = this.parameters.randomSeed;
    this.textureManager.updateParameters(this.parameters);
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
        if (x % this.parameters.mainRoadInterval === 0 || z % this.parameters.mainRoadInterval === 0) continue;
        // Skip edge roads
        if (x === 0 || z === 0) continue;
        
        // 应用建筑密度
        const seed = chunkX * 10000 + chunkZ * 100 + x * 10 + z;
        if (this.seededRandom(seed + 1000) > this.parameters.buildingDensity) continue;
        
        const h = 4 + Math.floor(this.seededRandom(seed) * this.parameters.heightRange);
        const color = this.textureManager.getBuildingColor(seed, this.seededRandom.bind(this));
        const mesh = this.tileBuilder.buildBuilding(
          x * this.CELL_SIZE + (this.CELL_SIZE/2),
          h/2,
          z * this.CELL_SIZE + (this.CELL_SIZE/2),
          this.CELL_SIZE - this.parameters.roadWidth,
          h,
          this.CELL_SIZE - this.parameters.roadWidth,
          color,
          seed,
          this.seededRandom.bind(this)
        );
        group.add(mesh);
      }
    }
    
    // Add roads
    for (let x = 0; x <= this.BLOCK_SIZE; x++) {
      for (let z = 0; z <= this.BLOCK_SIZE; z++) {
        // 判断当前格子是否为道路
        const isRoadX = (x % this.parameters.mainRoadInterval === 0);
        const isRoadZ = (z % this.parameters.mainRoadInterval === 0);
        if (!isRoadX && !isRoadZ) continue;

        // 判断四个方向是否有路
        const left  = (x > 0) && ((x-1) % this.parameters.mainRoadInterval === 0 || isRoadZ);
        const right = (x < this.BLOCK_SIZE) && ((x+1) % this.parameters.mainRoadInterval === 0 || isRoadZ);
        const up    = (z > 0) && ((z-1) % this.parameters.mainRoadInterval === 0 || isRoadX);
        const down  = (z < this.BLOCK_SIZE) && ((z+1) % this.parameters.mainRoadInterval === 0 || isRoadX);
        const cx = x * this.CELL_SIZE;
        const cz = z * this.CELL_SIZE;
        const y = 0.05;
        const w = isRoadX ? this.parameters.mainRoadWidth : this.parameters.roadWidth;
        const d = isRoadZ ? this.parameters.mainRoadWidth : this.parameters.roadWidth;
        // 统计有几个方向有路
        const count = [left, right, up, down].filter(Boolean).length;
        let mesh = null;
        if (count === 4) {
          mesh = this.tileBuilder.buildCrossRoad(cx, y, cz, Math.max(w, d)/2);
        } else if (count === 3) {
          mesh = this.tileBuilder.buildTJunction(cx, y, cz, Math.max(w, d)/2);
        } else if (count === 2) {
          // 判断是直路还是拐弯
          if ((left && right) || (up && down)) {
            mesh = this.tileBuilder.buildStraightRoad(cx, y, cz, this.CELL_SIZE, Math.max(w, d), up && down);
          } else {
            mesh = this.tileBuilder.buildCornerRoad(cx, y, cz, Math.max(w, d));
          }
        } else if (count === 1) {
          // 单独一条路，画成直路
          mesh = this.tileBuilder.buildStraightRoad(cx, y, cz, this.CELL_SIZE, Math.max(w, d), up || down);
        }
        if (mesh) group.add(mesh);
      }
    }
    
    this.scene.add(group);
    this.chunks.set(chunkKey, group);
  }

  updateChunks(camera) {
    const camX = Math.floor(camera.position.x / (this.BLOCK_SIZE * this.CELL_SIZE));
    const camZ = Math.floor(camera.position.z / (this.BLOCK_SIZE * this.CELL_SIZE));
    
    // 如果强制重新生成，清除所有chunks
    if (this.forceRegenerateVisibleChunks) {
      this.chunks.forEach((group) => {
        this.scene.remove(group);
        group.traverse((child) => {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      });
      this.chunks.clear();
      this.forceRegenerateVisibleChunks = false;
    }
    
    for (let dx = -this.parameters.renderDistance; dx <= this.parameters.renderDistance; dx++) {
      for (let dz = -this.parameters.renderDistance; dz <= this.parameters.renderDistance; dz++) {
        this.generateChunk(camX + dx, camZ + dz);
      }
    }
  }

  regenerateCity() {
    console.log('开始重新生成城市');
    // 清除所有现有的chunks
    this.chunks.forEach((group) => {
      this.scene.remove(group);
      // 清理几何体和材质
      group.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    this.chunks.clear();
    
    // 更新全局种子
    this.GLOBAL_SEED = this.parameters.randomSeed;
    
    // 强制重新生成当前可见的chunks
    this.forceRegenerateVisibleChunks = true;
  }
} 