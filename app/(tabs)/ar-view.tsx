import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Camera } from 'expo-camera';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';

type MaterialType = 'default' | 'wood' | 'concrete';

export default function ARViewScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMaterial, setCurrentMaterial] = useState<MaterialType>('default');
  const roomRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      setIsLoading(false);
    })();
  }, []);

  const createRoom = (scene: THREE.Scene, materialType: MaterialType) => {
    // Remover habitación anterior si existe
    if (roomRef.current) {
      scene.remove(roomRef.current);
    }

    const room = new THREE.Group();

    // Materiales según el tipo seleccionado
    let wallMaterial: THREE.MeshStandardMaterial;
    let floorMaterial: THREE.MeshStandardMaterial;

    switch (materialType) {
      case 'wood':
        wallMaterial = new THREE.MeshStandardMaterial({
          color: 0xD4A574,
          roughness: 0.8,
          metalness: 0.1
        });
        floorMaterial = new THREE.MeshStandardMaterial({
          color: 0x8B4513,
          roughness: 0.9,
          metalness: 0
        });
        break;
      case 'concrete':
        wallMaterial = new THREE.MeshStandardMaterial({
          color: 0x808080,
          roughness: 0.9,
          metalness: 0.2
        });
        floorMaterial = new THREE.MeshStandardMaterial({
          color: 0x606060,
          roughness: 0.95,
          metalness: 0.1
        });
        break;
      default:
        wallMaterial = new THREE.MeshStandardMaterial({
          color: 0xF5F5F5,
          roughness: 0.7,
          metalness: 0
        });
        floorMaterial = new THREE.MeshStandardMaterial({
          color: 0xCCCCCC,
          roughness: 0.8,
          metalness: 0
        });
    }

    // Piso
    const floorGeometry = new THREE.PlaneGeometry(8, 8);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    room.add(floor);

    // Paredes
    const wallGeometry = new THREE.BoxGeometry(8, 4, 0.1);

    // Pared trasera
    const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    backWall.position.z = -4;
    room.add(backWall);

    // Pared izquierda
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.x = -4;
    room.add(leftWall);

    // Pared derecha
    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.x = 4;
    room.add(rightWall);

    // Ventana (hueco en la pared trasera)
    const windowGeometry = new THREE.PlaneGeometry(2, 1.5);
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x87CEEB,
      transparent: true,
      opacity: 0.3,
      metalness: 0.9,
      roughness: 0.1
    });
    const window = new THREE.Mesh(windowGeometry, windowMaterial);
    window.position.set(0, 0.5, -3.95);
    room.add(window);

    // Mueble simple (mesa)
    const tableGeometry = new THREE.BoxGeometry(2, 0.1, 1);
    const tableMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.6,
      metalness: 0.1
    });
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.set(0, -1, 0);
    room.add(table);

    // Patas de la mesa
    const legGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.1);
    const positions = [
      [-0.9, -1.5, -0.4],
      [0.9, -1.5, -0.4],
      [-0.9, -1.5, 0.4],
      [0.9, -1.5, 0.4]
    ];

    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, tableMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      room.add(leg);
    });

    roomRef.current = room;
    scene.add(room);
  };

  const onContextCreate = async (gl: any) => {
    // Configuración de Three.js
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );

    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setClearColor(0x000000, 0);

    // Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Luz adicional desde el frente
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.4);
    frontLight.position.set(0, 5, 10);
    scene.add(frontLight);

    // Crear habitación inicial
    createRoom(scene, currentMaterial);

    camera.position.set(0, 0, 8);
    camera.lookAt(0, 0, 0);

    let angle = 0;

    // Loop de renderizado
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotación suave de la cámara alrededor de la habitación
      angle += 0.003;
      camera.position.x = Math.sin(angle) * 8;
      camera.position.z = Math.cos(angle) * 8;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();

    // Guardar referencias para cambio de materiales
    (global as any).__arScene = scene;
  };

  const handleMaterialChange = (material: MaterialType) => {
    setCurrentMaterial(material);
    if ((global as any).__arScene) {
      createRoom((global as any).__arScene, material);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00A8E8" />
        <Text style={styles.text}>Cargando experiencia AR...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>
          No hay acceso a la cámara.
          Por favor habilita los permisos en la configuración.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GLView
        style={styles.glView}
        onContextCreate={onContextCreate}
      />
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>
          Render Arquitectónico AR
        </Text>
        <Text style={styles.overlaySubtext}>
          POC - Habitación interactiva
        </Text>
      </View>

      <View style={styles.controls}>
        <Text style={styles.controlsTitle}>Materiales:</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.materialButton,
              currentMaterial === 'default' && styles.materialButtonActive
            ]}
            onPress={() => handleMaterialChange('default')}
          >
            <Text style={styles.buttonText}>Default</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.materialButton,
              currentMaterial === 'wood' && styles.materialButtonActive
            ]}
            onPress={() => handleMaterialChange('wood')}
          >
            <Text style={styles.buttonText}>Madera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.materialButton,
              currentMaterial === 'concrete' && styles.materialButtonActive
            ]}
            onPress={() => handleMaterialChange('concrete')}
          >
            <Text style={styles.buttonText}>Concreto</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  glView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  overlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  overlaySubtext: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 16,
  },
  controlsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  materialButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  materialButtonActive: {
    backgroundColor: 'rgba(0, 168, 232, 0.4)',
    borderColor: '#00A8E8',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
