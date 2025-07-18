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
      buildingDensity: 0.4, // 降低建筑密度，增加间距
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
        // 跳过主路和边界
        if (x % this.parameters.mainRoadInterval === 0 || z % this.parameters.mainRoadInterval === 0) continue;
        if (x === 0 || z === 0) continue;
        // 草坪 - 增加尺寸以消除缝隙
        const grassMesh = this.tileBuilder.buildGrass(
          x * this.CELL_SIZE + (this.CELL_SIZE/2),
          0.5,
          z * this.CELL_SIZE + (this.CELL_SIZE/2),
          this.CELL_SIZE + 2,
          0.5,
          this.CELL_SIZE + 2
        );
        group.add(grassMesh);
        // 检查四周是否为马路，若是则生成白色边缘
        const edgeThickness = 0.05;
        const edgeLength = this.CELL_SIZE - 0.4; // 减小长度，避免覆盖草地边缘
        const edgeWidth = 0.4; // 增加宽度，让白色边界更宽
        const edgeY = 0.76; // 略高于草坪
        const edgeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        
        // 只在靠近道路的边缘生成白色边界
        // 上方 - 只在靠近主路时生成
        if ((z+1) % this.parameters.mainRoadInterval === 0) {
          const edgeGeo = new THREE.BoxGeometry(edgeLength, edgeThickness, edgeWidth);
          const edgeMesh = new THREE.Mesh(edgeGeo, edgeMaterial);
          edgeMesh.position.set(x * this.CELL_SIZE + (this.CELL_SIZE/2), edgeY, (z+1) * this.CELL_SIZE - edgeWidth/2);
          group.add(edgeMesh);
        }
        // 下方 - 只在靠近主路时生成
        if ((z-1) % this.parameters.mainRoadInterval === 0) {
          const edgeGeo = new THREE.BoxGeometry(edgeLength, edgeThickness, edgeWidth);
          const edgeMesh = new THREE.Mesh(edgeGeo, edgeMaterial);
          edgeMesh.position.set(x * this.CELL_SIZE + (this.CELL_SIZE/2), edgeY, z * this.CELL_SIZE + edgeWidth/2);
          group.add(edgeMesh);
        }
        // 右方 - 只在靠近主路时生成
        if ((x+1) % this.parameters.mainRoadInterval === 0) {
          const edgeGeo = new THREE.BoxGeometry(edgeWidth, edgeThickness, edgeLength);
          const edgeMesh = new THREE.Mesh(edgeGeo, edgeMaterial);
          edgeMesh.position.set((x+1) * this.CELL_SIZE - edgeWidth/2, edgeY, z * this.CELL_SIZE + (this.CELL_SIZE/2));
          group.add(edgeMesh);
        }
        // 左方 - 只在靠近主路时生成
        if ((x-1) % this.parameters.mainRoadInterval === 0) {
          const edgeGeo = new THREE.BoxGeometry(edgeWidth, edgeThickness, edgeLength);
          const edgeMesh = new THREE.Mesh(edgeGeo, edgeMaterial);
          edgeMesh.position.set(x * this.CELL_SIZE + edgeWidth/2, edgeY, z * this.CELL_SIZE + (this.CELL_SIZE/2));
          group.add(edgeMesh);
        }
        // 应用建筑密度
        const seed = chunkX * 10000 + chunkZ * 100 + x * 10 + z;
        if (this.seededRandom(seed + 1000) > this.parameters.buildingDensity) continue;
        
        // 计算房屋在白色边界内的位置和尺寸
        const buildingMargin = 0.4 + 0.1; // 使用新的edgeWidth值 + 留出边距
        const buildingSize = this.CELL_SIZE - buildingMargin * 2;
        
        // 让房屋围着马路边生成
        let buildingX = x * this.CELL_SIZE + (this.CELL_SIZE/2);
        let buildingZ = z * this.CELL_SIZE + (this.CELL_SIZE/2);
        
        // 根据靠近哪条道路来决定房屋位置
        const roadOffset = 4; // 增加距离道路的偏移量，让房屋离道路更远
        let nearRoad = false; // 标记是否靠近道路
        let roadDirection = ''; // 记录靠近哪条道路
        
        // 如果靠近上方道路，将房屋向上移动
        if ((z+1) % this.parameters.mainRoadInterval === 0) {
          buildingZ = z * this.CELL_SIZE + roadOffset;
          nearRoad = true;
          roadDirection = 'north';
        }
        // 如果靠近下方道路，将房屋向下移动
        else if ((z-1) % this.parameters.mainRoadInterval === 0) {
          buildingZ = (z+1) * this.CELL_SIZE - roadOffset;
          nearRoad = true;
          roadDirection = 'south';
        }
        // 如果靠近右方道路，将房屋向右移动
        else if ((x+1) % this.parameters.mainRoadInterval === 0) {
          buildingX = x * this.CELL_SIZE + roadOffset;
          nearRoad = true;
          roadDirection = 'east';
        }
        // 如果靠近左方道路，将房屋向左移动
        else if ((x-1) % this.parameters.mainRoadInterval === 0) {
          buildingX = (x+1) * this.CELL_SIZE - roadOffset;
          nearRoad = true;
          roadDirection = 'west';
        }
        
        // 只有在靠近道路时才生成房屋
        if (!nearRoad) continue;
        
        // 根据道路方向调整房屋尺寸，避免交叉
        let adjustedBuildingSize = buildingSize;
        if (roadDirection === 'north' || roadDirection === 'south') {
          // 南北方向的房屋，减小宽度避免与东西方向的房屋交叉
          adjustedBuildingSize = buildingSize * 0.6; // 进一步减小尺寸
        } else if (roadDirection === 'east' || roadDirection === 'west') {
          // 东西方向的房屋，减小深度避免与南北方向的房屋交叉
          adjustedBuildingSize = buildingSize * 0.6; // 进一步减小尺寸
        }
        
        const h = 4 + Math.floor(this.seededRandom(seed) * this.parameters.heightRange);
        const color = this.textureManager.getBuildingColor(seed, this.seededRandom.bind(this));
        const mesh = this.tileBuilder.buildBuilding(
          buildingX,
          h/2,
          buildingZ,
          adjustedBuildingSize,
          h,
          adjustedBuildingSize,
          color,
          seed,
          this.seededRandom.bind(this)
        );
        group.add(mesh);
      }
    }
    
    // Add roads
    for (let x = 0; x <= this.BLOCK_SIZE; x++) {
      let width = (x % this.parameters.mainRoadInterval === 0) ? this.parameters.mainRoadWidth : this.parameters.roadWidth;
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
      let width = (z % this.parameters.mainRoadInterval === 0) ? this.parameters.mainRoadWidth : this.parameters.roadWidth;
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