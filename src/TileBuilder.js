import * as THREE from 'three';

export class TileBuilder {
  buildBuilding(x, y, z, w, h, d, color, seed, seededRandom) {
    const geo = new THREE.BoxGeometry(w, h, d);
    for (let i = 0; i < geo.attributes.position.count; i++) {
      geo.attributes.position.setY(i, geo.attributes.position.getY(i) + (seededRandom(seed+i)-0.5)*0.7);
    }
    geo.computeVertexNormals();
    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  buildRoad(x, y, z, w, h, d) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshLambertMaterial({ color: 0x222233 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }
} 