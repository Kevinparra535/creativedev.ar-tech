import React, { useEffect, useRef } from 'react';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import { StyleSheet } from 'react-native';
import { SceneManager } from '../utils/SceneManager';

interface ARCanvasProps {
  sceneManager: SceneManager | null;
  isReady: boolean;
}

export const ARCanvas: React.FC<ARCanvasProps> = ({ sceneManager, isReady }) => {
  const rafIdRef = useRef<number>();

  const onContextCreate = async (gl: any) => {
    if (!sceneManager || !isReady) return;

    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    // Habilitar sombras
    renderer.shadowMap.enabled = true;

    const scene = sceneManager.scene;
    const camera = sceneManager.camera;

    // Actualizar aspect ratio
    sceneManager.updateAspect(gl.drawingBufferWidth, gl.drawingBufferHeight);

    let angle = 0;

    const animate = () => {
      rafIdRef.current = requestAnimationFrame(animate);

      // Rotación automática de la escena
      angle += 0.005;
      scene.rotation.y = angle;

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();
  };

  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return <GLView style={styles.canvas} onContextCreate={onContextCreate} />;
};

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
  },
});
