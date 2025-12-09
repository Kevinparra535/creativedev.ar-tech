import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { SceneManager } from '../utils/SceneManager';
import { createArchitecturalRoom } from '../utils/geometries';
import { MaterialType, getMaterialConfig, createMaterial } from '../utils/materials';

export const use3DScene = () => {
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const roomRef = useRef<THREE.Group | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState<MaterialType>('default');

  useEffect(() => {
    // Inicializar escena
    sceneManagerRef.current = new SceneManager();

    // Crear habitación
    const room = createArchitecturalRoom();
    roomRef.current = room;
    sceneManagerRef.current.addToScene(room);

    setIsReady(true);

    // Cleanup
    return () => {
      sceneManagerRef.current?.dispose();
    };
  }, []);

  const changeMaterial = (materialType: MaterialType) => {
    if (!roomRef.current) return;

    const materialConfig = getMaterialConfig(materialType);

    // Actualizar materiales de paredes y piso
    roomRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Detectar si es piso (rotación en X)
        const isFloor = Math.abs(child.rotation.x + Math.PI / 2) < 0.01;

        if (isFloor) {
          child.material = createMaterial(materialConfig.floor);
        } else if (child.geometry instanceof THREE.PlaneGeometry ||
                   child.geometry instanceof THREE.BoxGeometry) {
          // Es pared
          child.material = createMaterial(materialConfig.wall);
        }
      }
    });

    setCurrentMaterial(materialType);
  };

  return {
    scene: sceneManagerRef.current?.scene,
    camera: sceneManagerRef.current?.camera,
    sceneManager: sceneManagerRef.current,
    isReady,
    currentMaterial,
    changeMaterial,
  };
};
