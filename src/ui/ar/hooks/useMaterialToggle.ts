import { useState } from 'react';
import { MaterialType } from '../utils/materials';

export const useMaterialToggle = (
  initialMaterial: MaterialType = 'default',
  onMaterialChange?: (material: MaterialType) => void
) => {
  const [currentMaterial, setCurrentMaterial] = useState<MaterialType>(initialMaterial);

  const materials: MaterialType[] = ['default', 'wood', 'concrete'];

  const changeMaterial = (material: MaterialType) => {
    setCurrentMaterial(material);
    onMaterialChange?.(material);
  };

  const nextMaterial = () => {
    const currentIndex = materials.indexOf(currentMaterial);
    const nextIndex = (currentIndex + 1) % materials.length;
    changeMaterial(materials[nextIndex]);
  };

  return {
    currentMaterial,
    materials,
    changeMaterial,
    nextMaterial,
  };
};
