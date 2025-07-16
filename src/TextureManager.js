import * as THREE from 'three';

export class TextureManager {
  getBuildingColor(seed, seededRandom) {
    return new THREE.Color().setHSL(
      seededRandom(seed+1),
      0.5 + seededRandom(seed+2)*0.3,
      0.5 + seededRandom(seed+3)*0.2
    );
  }
} 