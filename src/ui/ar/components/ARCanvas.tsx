import { CameraView } from 'expo-camera';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import * as THREE from 'three';

import { useDeviceOrientation } from '../hooks/useDeviceOrientation';
import { SceneManager } from '../utils/SceneManager';

interface ARCanvasProps {
  sceneManager: SceneManager | null;
  isReady: boolean;
  isARMode: boolean;
}

export const ARCanvas: React.FC<ARCanvasProps> = ({ sceneManager, isReady, isARMode }) => {
  const rafIdRef = useRef<number | undefined>(undefined);
  const rendererRef = useRef<any>(null);

  // Tracking de orientación del dispositivo
  const orientation = useDeviceOrientation(isARMode);

  const onContextCreate = async (gl: any) => {
    if (!sceneManager || !isReady) return;

    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    rendererRef.current = renderer;

    // Configurar para transparencia en modo AR
    if (isARMode) {
      renderer.setClearColor(0x000000, 0); // Transparente
    }

    // Habilitar sombras
    renderer.shadowMap.enabled = true;

    const scene = sceneManager.scene;
    const camera = sceneManager.camera;

    // Actualizar aspect ratio
    sceneManager.updateAspect(gl.drawingBufferWidth, gl.drawingBufferHeight);

    let angle = 0;

    const animate = () => {
      rafIdRef.current = requestAnimationFrame(animate);

      // Rotación automática solo si NO está en modo AR
      if (!isARMode) {
        angle += 0.005;
        scene.rotation.y = angle;
      }

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();
  };

  // Aplicar orientación del dispositivo a la cámara en modo AR
  useEffect(() => {
    if (!sceneManager || !isARMode) return;

    const camera = sceneManager.camera;

    // Aplicar rotación basada en la orientación del dispositivo
    // Convertir de radianes a una rotación suave
    camera.rotation.x = orientation.beta * 0.5;
    camera.rotation.y = orientation.gamma * 0.5;
    camera.rotation.z = orientation.alpha * 0.5;
  }, [orientation, sceneManager, isARMode]);

  // Actualizar transparencia del renderer cuando cambia el modo AR
  useEffect(() => {
    if (rendererRef.current && sceneManager) {
      if (isARMode) {
        rendererRef.current.setClearColor(0x000000, 0);
        sceneManager.scene.background = null;
      } else {
        rendererRef.current.setClearColor(0x000000, 1);
        sceneManager.scene.background = new THREE.Color(0x000000);
      }
    }
  }, [isARMode, sceneManager]);

  useEffect(
    () => () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    },
    []
  );

  return (
    <View style={styles.container}>
      {isARMode && <CameraView style={StyleSheet.absoluteFill} facing='back' />}
      <GLView style={styles.canvas} onContextCreate={onContextCreate} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  canvas: {
    flex: 1,
    backgroundColor: 'transparent'
  }
});
