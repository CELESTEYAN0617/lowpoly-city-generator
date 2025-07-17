import * as THREE from 'three';

export class TextureManager {
  constructor() {
    this.parameters = {
      colorSaturation: 0.5,
      colorBrightness: 0.5
    };
  }

  updateParameters(newParams) {
    this.parameters = { ...this.parameters, ...newParams };
  }

  getBuildingColor(seed, seededRandom) {
    return new THREE.Color().setHSL(
      seededRandom(seed + 1),
      this.parameters.colorSaturation + seededRandom(seed + 2) * 0.3,
      this.parameters.colorBrightness + seededRandom(seed + 3) * 0.2
    );
  }
} 