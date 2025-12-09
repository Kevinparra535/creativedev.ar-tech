import * as THREE from 'three';

import { setupLighting } from './LightingSetup';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  private objects: THREE.Object3D[] = [];

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Configuración de cámara optimizada para AR
    // FOV más amplio para mejor visualización en AR
    this.camera = new THREE.PerspectiveCamera(70, 1, 0.01, 100);

    // Posición de cámara ajustada para vista de maqueta en AR
    // Más cerca y ligeramente elevada
    this.camera.position.set(0, 1.5, 3);
    this.camera.lookAt(0, 0, 0);

    // Setup de luces
    setupLighting(this.scene);
  }

  public addToScene(object: THREE.Object3D): void {
    this.scene.add(object);
    this.objects.push(object);
  }

  public removeFromScene(object: THREE.Object3D): void {
    this.scene.remove(object);
    const index = this.objects.indexOf(object);
    if (index > -1) {
      this.objects.splice(index, 1);
    }
  }

  public updateAspect(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public dispose(): void {
    // Cleanup de geometrías y materiales
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((mat) => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    this.objects = [];
  }
}
