import * as THREE from 'three';

export const createArchitecturalRoom = (): THREE.Group => {
  const room = new THREE.Group();

  // Piso
  const floor = createFloor();
  room.add(floor);

  // Paredes
  const walls = createWalls();
  walls.forEach(wall => room.add(wall));

  // Ventana
  const window = createWindow();
  room.add(window);

  // Mesa
  const table = createTable();
  room.add(table);

  return room;
};

const createFloor = (): THREE.Mesh => {
  const geometry = new THREE.PlaneGeometry(8, 8);
  const material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
  const floor = new THREE.Mesh(geometry, material);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2;
  floor.receiveShadow = true;
  return floor;
};

const createWalls = (): THREE.Mesh[] => {
  const wallGeometry = new THREE.BoxGeometry(8, 4, 0.1);
  const material = new THREE.MeshStandardMaterial({ color: 0xf5f5f5 });

  const backWall = new THREE.Mesh(wallGeometry, material);
  backWall.position.z = -4;
  backWall.castShadow = true;
  backWall.receiveShadow = true;

  const leftWall = new THREE.Mesh(wallGeometry, material.clone());
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.x = -4;
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;

  const rightWall = new THREE.Mesh(wallGeometry, material.clone());
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.x = 4;
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;

  return [backWall, leftWall, rightWall];
};

const createWindow = (): THREE.Mesh => {
  const geometry = new THREE.PlaneGeometry(2, 1.5);
  const material = new THREE.MeshStandardMaterial({
    color: 0x87CEEB,
    transparent: true,
    opacity: 0.3,
    metalness: 0.9,
    roughness: 0.1
  });
  const window = new THREE.Mesh(geometry, material);
  window.position.set(0, 0.5, -3.95);
  return window;
};

const createTable = (): THREE.Group => {
  const table = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x654321 });

  // Superficie
  const tableTop = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.1, 1),
    material
  );
  tableTop.position.y = -1;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  table.add(tableTop);

  // Patas
  const legGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.1);
  const positions: [number, number, number][] = [
    [-0.9, -1.5, -0.4],
    [0.9, -1.5, -0.4],
    [-0.9, -1.5, 0.4],
    [0.9, -1.5, 0.4]
  ];

  positions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, material);
    leg.position.set(pos[0], pos[1], pos[2]);
    leg.castShadow = true;
    leg.receiveShadow = true;
    table.add(leg);
  });

  return table;
};