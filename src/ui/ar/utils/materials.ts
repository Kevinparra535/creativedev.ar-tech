import * as THREE from 'three';

export type MaterialType = 'default' | 'wood' | 'concrete';

interface MaterialConfig {
  wall: {
    color: number;
    roughness: number;
    metalness: number;
  };
  floor: {
    color: number;
    roughness: number;
    metalness: number;
  };
}

export const MATERIALS: Record<MaterialType, MaterialConfig> = {
  default: {
    wall: { color: 0xF5F5F5, roughness: 0.7, metalness: 0 },
    floor: { color: 0xCCCCCC, roughness: 0.8, metalness: 0 },
  },
  wood: {
    wall: { color: 0xD4A574, roughness: 0.8, metalness: 0.1 },
    floor: { color: 0x8B4513, roughness: 0.9, metalness: 0 },
  },
  concrete: {
    wall: { color: 0x808080, roughness: 0.9, metalness: 0.2 },
    floor: { color: 0x606060, roughness: 0.95, metalness: 0.1 },
  },
};

export const getMaterialConfig = (type: MaterialType): MaterialConfig => {
  return MATERIALS[type];
};

export const createMaterial = (config: MaterialConfig['wall'] | MaterialConfig['floor']): THREE.Material => {
  return new THREE.MeshStandardMaterial({
    color: config.color,
    roughness: config.roughness,
    metalness: config.metalness,
  });
};