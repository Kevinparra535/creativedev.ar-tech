# Plan de Implementación - POC AR Arquitectura

**Documento:** Guía paso a paso para implementar el POC
**Versión:** 1.0
**Fecha:** 2025-12-08

---

## Índice de Fases

1. [Fase 1: Foundation](#fase-1-foundation-días-1-3)
2. [Fase 2: AR Integration](#fase-2-ar-integration-días-4-7)
3. [Fase 3: Features Profesionales](#fase-3-features-profesionales-días-8-12)
4. [Fase 4: Polish + Testing](#fase-4-polish--testing-días-13-15)

---

## Fase 1: Foundation (Días 1-3)

### Objetivo
Recuperar y mejorar el código 3D anterior en una arquitectura modular y mantenible.

---

### Día 1: Recuperación y Setup

#### Tarea 1.1: Recuperar código 3D anterior
**Archivo a recuperar:** `app/(tabs)/ar-view.tsx` del commit `a1bea4b`

**Comando:**
```bash
git show a1bea4b:app/\(tabs\)/ar-view.tsx > temp-ar-view.tsx
```

**Qué contiene (363 líneas):**
- Implementación completa de THREE.Scene
- Sala arquitectónica con paredes, piso, ventana, mesa
- Sistema de materiales intercambiables
- Renderizado con GLView + expo-three
- Rotación automática de cámara
- Iluminación configurada

**Checklist:**
- [ ] Recuperar archivo en ubicación temporal
- [ ] Analizar estructura del código
- [ ] Identificar partes reutilizables vs refactorizar
- [ ] Documentar dependencias Three.js usadas

---

#### Tarea 1.2: Crear estructura de carpetas modular

**Ejecutar:**
```bash
mkdir -p src/core/scene
mkdir -p src/core/ar
mkdir -p src/core/hooks
mkdir -p src/core/context
mkdir -p src/data/models/geometries
mkdir -p src/data/models/materials
mkdir -p src/data/constants
mkdir -p src/ui/screens/ARScreen/components
mkdir -p docs
```

**Verificar:**
```bash
tree src -L 3
```

**Checklist:**
- [ ] Carpetas creadas correctamente
- [ ] Estructura coincide con [ARQUITECTURA_POC.md](./ARQUITECTURA_POC.md)

---

#### Tarea 1.3: Refactorizar lógica Three.js

**Crear:** `src/core/scene/SceneManager.ts`

**Responsabilidades:**
- Inicializar THREE.Scene
- Gestionar ciclo de vida (create, update, destroy)
- Exponer API limpia para UI

**Código base:**
```typescript
import * as THREE from 'three';

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer | null = null;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.setupScene();
  }

  private setupScene(): void {
    // Configuración inicial de la escena
    this.scene.background = new THREE.Color(0x000000);
    this.camera.position.set(0, 2, 5);
  }

  public addObject(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  public removeObject(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  public update(): void {
    // Lógica de update por frame
  }

  public destroy(): void {
    // Cleanup
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(mat => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
}
```

**Checklist:**
- [ ] SceneManager.ts creado
- [ ] Métodos básicos implementados
- [ ] TypeScript sin errores

---

#### Tarea 1.4: Extraer geometrías a módulos

**Crear:** `src/data/models/geometries/ArchitecturalRoom.ts`

**Extraer del ar-view.tsx anterior:**
- Lógica de creación de paredes
- Lógica de creación de piso
- Lógica de ventana
- Lógica de mesa con patas

**Estructura propuesta:**
```typescript
import * as THREE from 'three';

export interface RoomConfig {
  width: number;
  height: number;
  depth: number;
}

export class ArchitecturalRoom {
  private group: THREE.Group;
  private walls: THREE.Mesh[] = [];
  private floor: THREE.Mesh | null = null;

  constructor(config: RoomConfig) {
    this.group = new THREE.Group();
    this.createFloor(config);
    this.createWalls(config);
    this.createWindow(config);
  }

  private createFloor(config: RoomConfig): void {
    const geometry = new THREE.PlaneGeometry(config.width, config.depth);
    const material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    this.floor = new THREE.Mesh(geometry, material);
    this.floor.rotation.x = -Math.PI / 2;
    this.group.add(this.floor);
  }

  private createWalls(config: RoomConfig): void {
    // Implementación de paredes
  }

  private createWindow(config: RoomConfig): void {
    // Implementación de ventana
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public updateMaterial(materialName: string): void {
    // Cambiar material de paredes
  }
}
```

**Checklist:**
- [ ] ArchitecturalRoom.ts creado
- [ ] Geometrías extraídas del código anterior
- [ ] API pública limpia (getGroup, updateMaterial)

---

**Crear:** `src/data/models/geometries/Furniture.ts`

**Contiene:**
- Mesa con patas
- Futuro: sillas, lámparas, etc.

**Checklist:**
- [ ] Furniture.ts creado
- [ ] Mesa renderiza correctamente

---

#### Tarea 1.5: Sistema de materiales

**Crear:** `src/data/models/materials/MaterialLibrary.ts`

**Del código anterior, había 3 materiales:**
1. Default (gris)
2. Wood (marrón/textura madera)
3. Concrete (gris cemento)

**Estructura:**
```typescript
import * as THREE from 'three';

export enum MaterialType {
  DEFAULT = 'default',
  WOOD = 'wood',
  CONCRETE = 'concrete',
}

export class MaterialLibrary {
  private materials: Map<MaterialType, THREE.Material>;

  constructor() {
    this.materials = new Map();
    this.initializeMaterials();
  }

  private initializeMaterials(): void {
    this.materials.set(
      MaterialType.DEFAULT,
      new THREE.MeshStandardMaterial({ color: 0xcccccc })
    );

    this.materials.set(
      MaterialType.WOOD,
      new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.8,
        metalness: 0.2,
      })
    );

    this.materials.set(
      MaterialType.CONCRETE,
      new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.9,
        metalness: 0.1,
      })
    );
  }

  public getMaterial(type: MaterialType): THREE.Material {
    const material = this.materials.get(type);
    if (!material) {
      throw new Error(`Material ${type} not found`);
    }
    return material;
  }

  public dispose(): void {
    this.materials.forEach(material => material.dispose());
    this.materials.clear();
  }
}
```

**Checklist:**
- [ ] MaterialLibrary.ts creado
- [ ] 3 materiales básicos implementados
- [ ] Método getMaterial funciona

---

### Día 2: Hook personalizado y Context

#### Tarea 2.1: Crear hook use3DScene

**Crear:** `src/core/hooks/use3DScene.ts`

**Responsabilidad:**
Encapsular lógica de Three.js para que componentes React puedan usarla fácilmente.

**Código:**
```typescript
import { useEffect, useRef, useState } from 'react';
import { SceneManager } from '@/core/scene/SceneManager';
import { ArchitecturalRoom } from '@/data/models/geometries/ArchitecturalRoom';
import { MaterialLibrary, MaterialType } from '@/data/models/materials/MaterialLibrary';

export const use3DScene = () => {
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState<MaterialType>(
    MaterialType.DEFAULT
  );

  useEffect(() => {
    // Inicializar escena
    sceneManagerRef.current = new SceneManager();

    // Crear sala arquitectónica
    const room = new ArchitecturalRoom({
      width: 5,
      height: 3,
      depth: 5,
    });

    sceneManagerRef.current.addObject(room.getGroup());
    setIsReady(true);

    // Cleanup
    return () => {
      sceneManagerRef.current?.destroy();
    };
  }, []);

  const changeMaterial = (material: MaterialType) => {
    setCurrentMaterial(material);
    // Lógica para cambiar material en la escena
  };

  return {
    sceneManager: sceneManagerRef.current,
    isReady,
    currentMaterial,
    changeMaterial,
  };
};
```

**Checklist:**
- [ ] use3DScene.ts creado
- [ ] Hook inicializa escena correctamente
- [ ] Cleanup funciona (no memory leaks)

---

#### Tarea 2.2: Crear SceneContext

**Crear:** `src/core/context/SceneContext.tsx`

**Responsabilidad:**
Compartir estado de la escena entre componentes sin prop drilling.

**Código:**
```typescript
import React, { createContext, useContext, ReactNode } from 'react';
import { MaterialType } from '@/data/models/materials/MaterialLibrary';
import { use3DScene } from '@/core/hooks/use3DScene';

interface SceneContextType {
  isReady: boolean;
  currentMaterial: MaterialType;
  changeMaterial: (material: MaterialType) => void;
}

const SceneContext = createContext<SceneContextType | undefined>(undefined);

export const SceneProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isReady, currentMaterial, changeMaterial } = use3DScene();

  return (
    <SceneContext.Provider value={{ isReady, currentMaterial, changeMaterial }}>
      {children}
    </SceneContext.Provider>
  );
};

export const useSceneContext = () => {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error('useSceneContext must be used within SceneProvider');
  }
  return context;
};
```

**Checklist:**
- [ ] SceneContext.tsx creado
- [ ] Provider implementado
- [ ] Hook useSceneContext funciona

---

### Día 3: Crear ARScreen y Navegación

#### Tarea 3.1: Crear componente ARCanvas

**Crear:** `src/ui/screens/ARScreen/components/ARCanvas.tsx`

**Responsabilidad:**
Renderizar escena 3D usando GLView + expo-three.

**Código base (adaptar del ar-view.tsx anterior):**
```typescript
import React, { useEffect, useRef } from 'react';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import { StyleSheet } from 'react-native';
import { useSceneContext } from '@/core/context/SceneContext';

export const ARCanvas: React.FC = () => {
  const { sceneManager, isReady } = useSceneContext();
  const rafIdRef = useRef<number>();

  const onContextCreate = async (gl: any) => {
    if (!sceneManager || !isReady) return;

    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    const scene = sceneManager.getScene();
    const camera = sceneManager.getCamera();

    const animate = () => {
      rafIdRef.current = requestAnimationFrame(animate);

      // Rotación automática (opcional)
      scene.rotation.y += 0.005;

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
```

**Checklist:**
- [ ] ARCanvas.tsx creado
- [ ] GLView renderiza escena
- [ ] Animation loop funciona
- [ ] No memory leaks

---

#### Tarea 3.2: Crear componente MaterialPicker

**Crear:** `src/ui/screens/ARScreen/components/MaterialPicker.tsx`

**Responsabilidad:**
UI para cambiar materiales (botones Default, Wood, Concrete).

**Código:**
```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSceneContext } from '@/core/context/SceneContext';
import { MaterialType } from '@/data/models/materials/MaterialLibrary';

export const MaterialPicker: React.FC = () => {
  const { currentMaterial, changeMaterial } = useSceneContext();

  const materials = [
    { type: MaterialType.DEFAULT, label: 'Default' },
    { type: MaterialType.WOOD, label: 'Wood' },
    { type: MaterialType.CONCRETE, label: 'Concrete' },
  ];

  return (
    <View style={styles.container}>
      {materials.map((material) => (
        <TouchableOpacity
          key={material.type}
          style={[
            styles.button,
            currentMaterial === material.type && styles.activeButton,
          ]}
          onPress={() => changeMaterial(material.type)}
        >
          <Text style={styles.buttonText}>{material.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeButton: {
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

**Checklist:**
- [ ] MaterialPicker.tsx creado
- [ ] Botones renderizan correctamente
- [ ] Cambio de material funciona visualmente

---

#### Tarea 3.3: Crear pantalla ARScreen

**Crear:** `src/ui/screens/ARScreen/ARScreen.tsx`

**Código:**
```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SceneProvider } from '@/core/context/SceneContext';
import { ARCanvas } from './components/ARCanvas';
import { MaterialPicker } from './components/MaterialPicker';

export const ARScreen: React.FC = () => {
  return (
    <SceneProvider>
      <View style={styles.container}>
        <ARCanvas />
        <MaterialPicker />
      </View>
    </SceneProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
```

**Checklist:**
- [ ] ARScreen.tsx creado
- [ ] Renderiza ARCanvas y MaterialPicker
- [ ] Context funciona correctamente

---

#### Tarea 3.4: Actualizar navegación

**Modificar:** `src/ui/navigation/types.ts`

```typescript
export type TabParamList = {
  Home: undefined;
  AR: undefined;  // AGREGAR
  Explore: undefined;
};
```

**Modificar:** `src/ui/navigation/TabNavigator.tsx`

```typescript
import { ARScreen } from '@/ui/screens/ARScreen/ARScreen';

// Dentro del Tab.Navigator
<Tab.Screen
  name="AR"
  component={ARScreen}
  options={{
    title: 'AR View',
    tabBarIcon: ({ color }) => (
      <Ionicons name="cube-outline" size={24} color={color} />
    ),
  }}
/>
```

**Checklist:**
- [ ] types.ts actualizado
- [ ] TabNavigator.tsx actualizado
- [ ] Tab "AR" aparece en navegación
- [ ] Navegación hacia ARScreen funciona

---

#### Tarea 3.5: Probar rendering completo

**Ejecutar:**
```bash
npm start
# Abrir en iOS simulator o dispositivo físico
```

**Verificar:**
- [ ] App inicia sin crashes
- [ ] Tab "AR" aparece en bottom navigation
- [ ] Al tocar tab AR, se ve sala 3D
- [ ] Botones de materiales aparecen
- [ ] Cambiar material funciona visualmente
- [ ] Performance estable (inspeccionar con Flipper o React DevTools)

**Criterio de éxito Fase 1:**
✅ Sala 3D renderiza correctamente
✅ Toggle de materiales funciona
✅ Performance estable (60 FPS en simulador, >30 FPS en device)
✅ Código modular y mantenible

---

## Fase 2: AR Integration (Días 4-7)

### Objetivo
Integrar AR real con detección de superficies y anclaje en mundo físico.

---

### Día 4: Setup de Cámara y Permisos

#### Tarea 4.1: Implementar ARPermissionPrompt

**Crear:** `src/ui/components/ar/ARPermissionPrompt.tsx`

**Responsabilidad:**
Solicitar permisos de cámara de manera UX-friendly.

**Código:**
```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { Camera } from 'expo-camera';

interface ARPermissionPromptProps {
  onPermissionGranted: () => void;
}

export const ARPermissionPrompt: React.FC<ARPermissionPromptProps> = ({
  onPermissionGranted,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status === 'granted') {
        onPermissionGranted();
      }
    })();
  }, []);

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Solicitando permisos de cámara...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          Necesitamos acceso a la cámara para AR
        </Text>
        <Button
          title="Otorgar Permisos"
          onPress={async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
            if (status === 'granted') {
              onPermissionGranted();
            }
          }}
        />
      </View>
    );
  }

  return null; // Permisos otorgados, no mostrar nada
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
```

**Checklist:**
- [ ] ARPermissionPrompt.tsx creado
- [ ] Solicita permisos correctamente
- [ ] UX clara para usuario

---

#### Tarea 4.2: Crear ARManager

**Crear:** `src/core/ar/ARManager.ts`

**Responsabilidad:**
Coordinar cámara, sensores, y tracking AR.

**Código:**
```typescript
import { Camera } from 'expo-camera';
import {
  Accelerometer,
  Gyroscope,
  Magnetometer
} from 'expo-sensors';

export interface ARConfig {
  enablePlaneDetection: boolean;
  enableLightEstimation: boolean;
}

export class ARManager {
  private camera: Camera | null = null;
  private accelerometerSubscription: any;
  private gyroscopeSubscription: any;
  private isTracking: boolean = false;

  constructor(private config: ARConfig) {}

  public async startTracking(): Promise<void> {
    this.isTracking = true;

    // Suscribirse a sensores
    this.accelerometerSubscription = Accelerometer.addListener(data => {
      // Procesar datos de acelerómetro
      this.handleAccelerometerData(data);
    });

    this.gyroscopeSubscription = Gyroscope.addListener(data => {
      // Procesar datos de giroscopio
      this.handleGyroscopeData(data);
    });

    Accelerometer.setUpdateInterval(16); // ~60fps
    Gyroscope.setUpdateInterval(16);
  }

  public stopTracking(): void {
    this.isTracking = false;
    this.accelerometerSubscription?.remove();
    this.gyroscopeSubscription?.remove();
  }

  private handleAccelerometerData(data: any): void {
    // Implementar lógica de tracking
  }

  private handleGyroscopeData(data: any): void {
    // Implementar lógica de tracking
  }

  public isActive(): boolean {
    return this.isTracking;
  }
}
```

**Checklist:**
- [ ] ARManager.ts creado
- [ ] Sensores se suscriben correctamente
- [ ] Cleanup funciona (stopTracking)

---

### Día 5-6: Plane Detection (Básico)

**NOTA IMPORTANTE:**
Expo Managed Workflow no tiene soporte nativo completo de ARKit/ARCore plane detection.

**Opciones:**

**Opción A (Recomendada para POC):** Simulación básica
- Detectar superficie plana usando acelerómetro (cuando device está estable)
- Usuario toca pantalla para "anclar" escena
- No es verdadero plane detection, pero suficiente para demo

**Opción B (Más robusto):** Expo Bare Workflow
- Ejectar a bare workflow: `expo prebuild`
- Instalar `react-native-arkit` (iOS) o similar
- Acceso completo a ARKit/ARCore APIs

**Recomendación:** Empezar con Opción A para validar POC, migrar a Opción B si hay tracción.

---

#### Tarea 5.1: Implementar PlaneDetector (Simulado)

**Crear:** `src/core/ar/PlaneDetector.ts`

**Código (versión simulada):**
```typescript
export interface PlaneInfo {
  center: { x: number; y: number; z: number };
  extent: { width: number; height: number };
  orientation: 'horizontal' | 'vertical';
}

export class PlaneDetector {
  private detectedPlane: PlaneInfo | null = null;

  public detectPlane(): PlaneInfo | null {
    // Versión simulada: retorna plano horizontal en origen
    if (!this.detectedPlane) {
      this.detectedPlane = {
        center: { x: 0, y: 0, z: 0 },
        extent: { width: 2, height: 2 },
        orientation: 'horizontal',
      };
    }
    return this.detectedPlane;
  }

  public hasPlane(): boolean {
    return this.detectedPlane !== null;
  }

  public reset(): void {
    this.detectedPlane = null;
  }
}
```

**Checklist:**
- [ ] PlaneDetector.ts creado
- [ ] Retorna plano simulado

---

#### Tarea 5.2: Hook useARSession

**Crear:** `src/core/hooks/useARSession.ts`

**Código:**
```typescript
import { useState, useEffect } from 'react';
import { ARManager } from '@/core/ar/ARManager';
import { PlaneDetector } from '@/core/ar/PlaneDetector';

export const useARSession = () => {
  const [isARActive, setIsARActive] = useState(false);
  const [planeDetected, setPlaneDetected] = useState(false);
  const [arManager] = useState(() => new ARManager({
    enablePlaneDetection: true,
    enableLightEstimation: false,
  }));
  const [planeDetector] = useState(() => new PlaneDetector());

  useEffect(() => {
    return () => {
      arManager.stopTracking();
    };
  }, []);

  const startAR = async () => {
    await arManager.startTracking();
    setIsARActive(true);

    // Simular detección de plano después de 2 segundos
    setTimeout(() => {
      const plane = planeDetector.detectPlane();
      if (plane) {
        setPlaneDetected(true);
      }
    }, 2000);
  };

  const stopAR = () => {
    arManager.stopTracking();
    planeDetector.reset();
    setIsARActive(false);
    setPlaneDetected(false);
  };

  return {
    isARActive,
    planeDetected,
    startAR,
    stopAR,
  };
};
```

**Checklist:**
- [ ] useARSession.ts creado
- [ ] startAR/stopAR funcionan
- [ ] planeDetected cambia a true después de delay

---

### Día 7: Integrar AR en ARScreen

#### Tarea 7.1: Agregar cámara de fondo

**Modificar:** `src/ui/screens/ARScreen/components/ARCanvas.tsx`

Agregar capa de cámara detrás de escena 3D:

```typescript
import { Camera } from 'expo-camera';

export const ARCanvas: React.FC = () => {
  // ... código anterior

  return (
    <View style={{ flex: 1 }}>
      <Camera style={StyleSheet.absoluteFill} />
      <GLView style={styles.canvas} onContextCreate={onContextCreate} />
    </View>
  );
};
```

**Checklist:**
- [ ] Cámara renderiza como fondo
- [ ] Escena 3D se superpone con transparencia

---

#### Tarea 7.2: Crear componente ARControls

**Crear:** `src/ui/screens/ARScreen/components/ARControls.tsx`

**Responsabilidad:**
Botones para iniciar/detener AR, anclar escena, etc.

**Código:**
```typescript
import React from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';

interface ARControlsProps {
  isARActive: boolean;
  planeDetected: boolean;
  onStartAR: () => void;
  onStopAR: () => void;
}

export const ARControls: React.FC<ARControlsProps> = ({
  isARActive,
  planeDetected,
  onStartAR,
  onStopAR,
}) => {
  return (
    <View style={styles.container}>
      {!isARActive ? (
        <Button title="Iniciar AR" onPress={onStartAR} />
      ) : (
        <>
          <Text style={styles.status}>
            {planeDetected
              ? 'Superficie detectada ✅'
              : 'Buscando superficie...'}
          </Text>
          <Button title="Detener AR" onPress={onStopAR} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  status: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
});
```

**Checklist:**
- [ ] ARControls.tsx creado
- [ ] Botones funcionan
- [ ] Estado visual claro

---

#### Tarea 7.3: Integrar todo en ARScreen

**Modificar:** `src/ui/screens/ARScreen/ARScreen.tsx`

```typescript
import { useARSession } from '@/core/hooks/useARSession';
import { ARControls } from './components/ARControls';
import { ARPermissionPrompt } from '@/ui/components/ar/ARPermissionPrompt';

export const ARScreen: React.FC = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const { isARActive, planeDetected, startAR, stopAR } = useARSession();

  if (!permissionGranted) {
    return (
      <ARPermissionPrompt
        onPermissionGranted={() => setPermissionGranted(true)}
      />
    );
  }

  return (
    <SceneProvider>
      <View style={styles.container}>
        <ARCanvas />
        <ARControls
          isARActive={isARActive}
          planeDetected={planeDetected}
          onStartAR={startAR}
          onStopAR={stopAR}
        />
        {planeDetected && <MaterialPicker />}
      </View>
    </SceneProvider>
  );
};
```

**Checklist:**
- [ ] Flujo completo funciona: permisos → AR → plane detection → controles
- [ ] MaterialPicker solo aparece cuando plano detectado

---

**Criterio de éxito Fase 2:**
✅ Cámara se activa como fondo
✅ Escena 3D se superpone correctamente
✅ Detección de plano simulada funciona
✅ Usuario puede iniciar/detener AR

---

## Fase 3: Features Profesionales (Días 8-12)

### Objetivo
Agregar herramientas que justifican el valor premium para arquitectos.

---

### Día 8-9: Sistema de Mediciones

#### Tarea 8.1: Crear MeasurementTool

**Crear:** `src/ui/screens/ARScreen/components/MeasurementTool.tsx`

**Features:**
- Usuario toca dos puntos en escena
- App dibuja línea entre puntos
- Muestra distancia en metros

**Implementación básica:**
```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as THREE from 'three';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

export const MeasurementTool: React.FC = () => {
  const [points, setPoints] = useState<Point3D[]>([]);
  const [distance, setDistance] = useState<number | null>(null);

  const addPoint = (point: Point3D) => {
    if (points.length === 2) {
      // Reset si ya hay 2 puntos
      setPoints([point]);
      setDistance(null);
    } else {
      const newPoints = [...points, point];
      setPoints(newPoints);

      if (newPoints.length === 2) {
        // Calcular distancia
        const dist = calculateDistance(newPoints[0], newPoints[1]);
        setDistance(dist);
      }
    }
  };

  const calculateDistance = (p1: Point3D, p2: Point3D): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {points.length === 0 && 'Toca un punto para empezar'}
        {points.length === 1 && 'Toca segundo punto'}
        {distance !== null && `Distancia: ${distance.toFixed(2)}m`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 8,
  },
  text: {
    color: '#fff',
    fontSize: 14,
  },
});
```

**Checklist:**
- [ ] MeasurementTool.tsx creado
- [ ] Cálculo de distancia funciona
- [ ] UI clara

**Nota:** Integrar con raycasting de Three.js para detectar puntos en escena 3D.

---

### Día 10: Modo Día/Noche

#### Tarea 10.1: Crear LightingController

**Crear:** `src/core/scene/LightingController.ts`

**Responsabilidad:**
Gestionar iluminación de escena (día vs noche).

**Código:**
```typescript
import * as THREE from 'three';

export type LightingMode = 'day' | 'night';

export class LightingController {
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private currentMode: LightingMode = 'day';

  constructor(scene: THREE.Scene) {
    // Luz ambiental
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(this.ambientLight);

    // Luz direccional (sol)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(5, 10, 7.5);
    scene.add(this.directionalLight);
  }

  public setMode(mode: LightingMode): void {
    this.currentMode = mode;

    if (mode === 'day') {
      this.ambientLight.intensity = 0.5;
      this.directionalLight.intensity = 0.8;
      this.directionalLight.color.setHex(0xffffff);
    } else {
      // Noche: luz más tenue, tono azulado
      this.ambientLight.intensity = 0.2;
      this.directionalLight.intensity = 0.3;
      this.directionalLight.color.setHex(0x4466ff);
    }
  }

  public getMode(): LightingMode {
    return this.currentMode;
  }
}
```

**Checklist:**
- [ ] LightingController.ts creado
- [ ] Modo día/noche cambia iluminación
- [ ] Transición visual clara

---

#### Tarea 10.2: Agregar toggle en UI

**Crear botón en MaterialPicker o componente separado:**

```typescript
<TouchableOpacity onPress={() => toggleLighting()}>
  <Text>☀️ / 🌙</Text>
</TouchableOpacity>
```

**Checklist:**
- [ ] Botón agregado
- [ ] Cambio de modo funciona
- [ ] Visual feedback claro

---

### Día 11: Capturas de Pantalla

#### Tarea 11.1: Implementar screenshot

**Usar:** `expo-gl` snapshot o `react-native-view-shot`

**Instalar:**
```bash
npm install react-native-view-shot
```

**Código:**
```typescript
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';

const canvasRef = useRef();

const takeScreenshot = async () => {
  try {
    const uri = await captureRef(canvasRef, {
      format: 'png',
      quality: 1,
    });

    await MediaLibrary.saveToLibraryAsync(uri);
    alert('Screenshot guardado!');
  } catch (error) {
    console.error('Error:', error);
  }
};

// En render:
<View ref={canvasRef}>
  <ARCanvas />
</View>
```

**Checklist:**
- [ ] Screenshot funciona
- [ ] Se guarda en galería
- [ ] Permisos de MediaLibrary solicitados

---

### Día 12: Polish de Features

- [ ] Revisar UX de todas las features
- [ ] Agregar loading states
- [ ] Agregar error handling
- [ ] Probar en dispositivo físico

---

## Fase 4: Polish + Testing (Días 13-15)

### Día 13: Onboarding

#### Crear tutorial inicial
- [ ] Pantalla de bienvenida
- [ ] Guía de gestos (pinch, rotate, tap)
- [ ] Guía de calibración AR

### Día 14: Optimización

- [ ] Profiling con Flipper
- [ ] Reducir draw calls
- [ ] Lazy loading de assets
- [ ] Optimizar geometrías

### Día 15: Testing Final

- [ ] Probar en iPhone 12+
- [ ] Probar en Android 11+
- [ ] Crear demo projects
- [ ] Documentar bugs conocidos

---

## Checklist Final del POC

### Funcionalidad Core
- [ ] Renderizado 3D estable
- [ ] AR activado con cámara
- [ ] Plane detection (simulado o real)
- [ ] Toggle de materiales
- [ ] Mediciones
- [ ] Modo día/noche
- [ ] Screenshots

### Performance
- [ ] >30 FPS en dispositivos mid-range
- [ ] <100ms lag en cambio de materiales
- [ ] 0 crashes en sesión de 10 min

### UX
- [ ] Onboarding claro
- [ ] Permisos bien manejados
- [ ] Error states con mensajes útiles
- [ ] Loading states

### Documentación
- [ ] README actualizado
- [ ] Docs de arquitectura
- [ ] API reference
- [ ] Known issues documentados

---

**Fin del Plan de Implementación**

Este documento es una guía viva que se actualiza conforme avanza el desarrollo.