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

  buildStraightRoad(x, y, z, length, width, horizontal = true) {
    const geo = horizontal
      ? new THREE.BoxGeometry(length, 0.1, width)
      : new THREE.BoxGeometry(width, 0.1, length);
    const mat = new THREE.MeshLambertMaterial({ color: 0x222233 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  buildCornerRoad(x, y, z, size) {
    // L型拐弯，size为道路宽度
    const group = new THREE.Group();
    // 横向
    const geo1 = new THREE.BoxGeometry(size, 0.1, size * 2);
    const geo2 = new THREE.BoxGeometry(size * 2, 0.1, size);
    const mat = new THREE.MeshLambertMaterial({ color: 0x222233 });
    const mesh1 = new THREE.Mesh(geo1, mat);
    const mesh2 = new THREE.Mesh(geo2, mat);
    mesh1.position.set(x, y, z + size / 2);
    mesh2.position.set(x + size / 2, y, z);
    group.add(mesh1);
    group.add(mesh2);
    return group;
  }

  buildCrossRoad(x, y, z, size) {
    // 十字路口，size为道路宽度
    const geo = new THREE.BoxGeometry(size * 2, 0.1, size * 2);
    const mat = new THREE.MeshLambertMaterial({ color: 0x222233 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  buildTJunction(x, y, z, size, direction = 'north') {
    // T字路口，size为道路宽度，direction为缺口方向
    const group = new THREE.Group();
    // 主干道
    const geo1 = new THREE.BoxGeometry(size * 2, 0.1, size);
    const geo2 = new THREE.BoxGeometry(size, 0.1, size * 2);
    const mat = new THREE.MeshLambertMaterial({ color: 0x222233 });
    const mesh1 = new THREE.Mesh(geo1, mat);
    const mesh2 = new THREE.Mesh(geo2, mat);
    mesh1.position.set(x, y, z);
    mesh2.position.set(x, y, z);
    group.add(mesh1);
    group.add(mesh2);
    // 可以根据direction调整mesh2的位置或旋转
    return group;
  }
} 