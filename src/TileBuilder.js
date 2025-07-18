import * as THREE from 'three';

export class TileBuilder {
  buildBuilding(x, y, z, w, h, d, color, seed, seededRandom) {
    const geo = new THREE.BoxGeometry(w, h, d);
    // 移除几何体变形，保持房屋完整
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

  buildGrass(x, y, z, w, h, d) {
    // 创建整体不规则的草坪形状
    const segments = 8; // 较少的分段数，专注于整体形状
    const geo = new THREE.BoxGeometry(w, h, d, segments, segments, segments);
    
    // 使用种子生成器来创建一致的不规则形状
    const seededRandom = (seed) => {
      let x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    
    const positions = geo.attributes.position;
    const seed = Math.floor(x * 1000 + z * 1000); // 基于位置生成种子
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      
      // 计算到边界的距离
      const halfW = w / 2;
      const halfH = h / 2;
      const halfD = d / 2;
      
      // 创建整体不规则的轮廓
      let newX = x;
      let newZ = z;
      let newY = y;
      
      // 计算到中心的距离
      const distFromCenter = Math.sqrt(x * x + z * z);
      const maxDist = Math.sqrt(halfW * halfW + halfD * halfD);
      const edgeFactor = distFromCenter / maxDist;
      
      // 整体形状变形 - 让草坪块整体不规则
      if (edgeFactor > 0.5) {
        // 在边缘区域应用较大的变形
        const shapeNoise = seededRandom(seed + i * 17) * 3.0;
        const angleNoise = seededRandom(seed + i * 19) * Math.PI * 2;
        
        // 根据角度应用不同方向的变形
        const angle = Math.atan2(z, x);
        const radius = distFromCenter;
        
        // 创建不规则的半径
        const irregularRadius = radius + shapeNoise * (edgeFactor - 0.5) * 2.0;
        
        // 转换回笛卡尔坐标
        newX = Math.cos(angle) * irregularRadius;
        newZ = Math.sin(angle) * irregularRadius;
      }
      
      // 确保不会超出边界太多
      newX = Math.max(-halfW + 1, Math.min(halfW - 1, newX));
      newZ = Math.max(-halfD + 1, Math.min(halfD - 1, newZ));
      
      positions.setXYZ(i, newX, newY, newZ);
    }
    
    geo.computeVertexNormals();
    const mat = new THREE.MeshLambertMaterial({ color: 0x4a7c59 }); // 使用纯色替代草地贴图
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y - h/2, z);
    return mesh;
  }
} 