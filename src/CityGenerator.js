import * as THREE from 'three';
import { TileBuilder } from './TileBuilder.js';
import { TextureManager } from './TextureManager.js';

export class CityGenerator {
  constructor(scene) {
    this.scene = scene;
    this.chunks = new Map();
    this.tileBuilder = new TileBuilder();
    this.textureManager = new TextureManager();
    
    // Default parameters
    this.parameters = {
      buildingDensity: 0.4, // Reduce building density, increase spacing
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
        // Skip main roads and boundaries
        if (x % this.parameters.mainRoadInterval === 0 || z % this.parameters.mainRoadInterval === 0) continue;
        if (x === 0 || z === 0) continue;
        // Grass - increase size to eliminate gaps
        const grassMesh = this.tileBuilder.buildGrass(
          x * this.CELL_SIZE + (this.CELL_SIZE/2),
          0.5,
          z * this.CELL_SIZE + (this.CELL_SIZE/2),
          this.CELL_SIZE + 2,
          0.5,
          this.CELL_SIZE + 2
        );
        group.add(grassMesh);
        // Check if adjacent to roads, if so generate white edge
        const edgeThickness = 0.05;
        const edgeLength = this.CELL_SIZE - 0.4; // Reduce length to avoid covering grass edge
        const edgeWidth = 0.4; // Increase width to make white edge wider
        const edgeY = 0.76; // Slightly above grass
        const edgeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        
        // Only generate white edge near roads
        // Top - only generate when near main road
        if ((z+1) % this.parameters.mainRoadInterval === 0) {
          const edgeGeo = new THREE.BoxGeometry(edgeLength, edgeThickness, edgeWidth);
          const edgeMesh = new THREE.Mesh(edgeGeo, edgeMaterial);
          edgeMesh.position.set(x * this.CELL_SIZE + (this.CELL_SIZE/2), edgeY, (z+1) * this.CELL_SIZE - edgeWidth/2);
          group.add(edgeMesh);
        }
        // Bottom - only generate when near main road
        if ((z-1) % this.parameters.mainRoadInterval === 0) {
          const edgeGeo = new THREE.BoxGeometry(edgeLength, edgeThickness, edgeWidth);
          const edgeMesh = new THREE.Mesh(edgeGeo, edgeMaterial);
          edgeMesh.position.set(x * this.CELL_SIZE + (this.CELL_SIZE/2), edgeY, z * this.CELL_SIZE + edgeWidth/2);
          group.add(edgeMesh);
        }
        // Right - only generate when near main road
        if ((x+1) % this.parameters.mainRoadInterval === 0) {
          const edgeGeo = new THREE.BoxGeometry(edgeWidth, edgeThickness, edgeLength);
          const edgeMesh = new THREE.Mesh(edgeGeo, edgeMaterial);
          edgeMesh.position.set((x+1) * this.CELL_SIZE - edgeWidth/2, edgeY, z * this.CELL_SIZE + (this.CELL_SIZE/2));
          group.add(edgeMesh);
        }
        // Left - only generate when near main road
        if ((x-1) % this.parameters.mainRoadInterval === 0) {
          const edgeGeo = new THREE.BoxGeometry(edgeWidth, edgeThickness, edgeLength);
          const edgeMesh = new THREE.Mesh(edgeGeo, edgeMaterial);
          edgeMesh.position.set(x * this.CELL_SIZE + edgeWidth/2, edgeY, z * this.CELL_SIZE + (this.CELL_SIZE/2));
          group.add(edgeMesh);
        }
        // Apply building density
        const seed = chunkX * 10000 + chunkZ * 100 + x * 10 + z;
        if (this.seededRandom(seed + 1000) > this.parameters.buildingDensity) continue;
        
        // Calculate house position and size within white edge
        const buildingMargin = 0.4 + 0.1; // Use new edgeWidth value + margin
        const buildingSize = this.CELL_SIZE - buildingMargin * 2;
        
        // Make houses generate around road edges
        let buildingX = x * this.CELL_SIZE + (this.CELL_SIZE/2);
        let buildingZ = z * this.CELL_SIZE + (this.CELL_SIZE/2);
        
        // Decide house position based on which road it's near
        const roadOffset = 4; // Increase distance from road, move houses further from roads
        let nearRoad = false; // Mark if near road
        let roadDirection = ''; // Record which road it's near
        
        // If near north road, move house up
        if ((z+1) % this.parameters.mainRoadInterval === 0) {
          buildingZ = z * this.CELL_SIZE + roadOffset;
          nearRoad = true;
          roadDirection = 'north';
        }
        // If near south road, move house down
        else if ((z-1) % this.parameters.mainRoadInterval === 0) {
          buildingZ = (z+1) * this.CELL_SIZE - roadOffset;
          nearRoad = true;
          roadDirection = 'south';
        }
        // If near east road, move house right
        else if ((x+1) % this.parameters.mainRoadInterval === 0) {
          buildingX = x * this.CELL_SIZE + roadOffset;
          nearRoad = true;
          roadDirection = 'east';
        }
        // If near west road, move house left
        else if ((x-1) % this.parameters.mainRoadInterval === 0) {
          buildingX = (x+1) * this.CELL_SIZE - roadOffset;
          nearRoad = true;
          roadDirection = 'west';
        }
        
        // Only generate houses if near a road
        if (!nearRoad) continue;
        
        // Adjust house size based on road direction to avoid intersection
        let adjustedBuildingSize = buildingSize;
        if (roadDirection === 'north' || roadDirection === 'south') {
          // Houses in north-south direction, reduce width to avoid intersection with east-west houses
          adjustedBuildingSize = buildingSize * 0.6; // Further reduce size
        } else if (roadDirection === 'east' || roadDirection === 'west') {
          // Houses in east-west direction, reduce depth to avoid intersection with north-south houses
          adjustedBuildingSize = buildingSize * 0.6; // Further reduce size
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
    
    // If force regenerate, clear all chunks
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
    console.log('Starting city regeneration');
    // Clear all existing chunks
    this.chunks.forEach((group) => {
      this.scene.remove(group);
      // Clean up geometries and materials
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
    
    // Update global seed
    this.GLOBAL_SEED = this.parameters.randomSeed;
    
    // Force regenerate current visible chunks
    this.forceRegenerateVisibleChunks = true;
  }
} 