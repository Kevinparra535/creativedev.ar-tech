# Arquitectura Simplificada - POC AR (UI-First Approach)

**Fecha:** 2025-12-08
**Versión:** 2.0 - UI-First
**Decisión:** Mantener toda la lógica dentro de `src/ui/` por ahora

---

## Cambio de Enfoque

### Decisión Arquitectónica

**Antes (Arquitectura en capas):**
```
src/
├── core/      # Lógica de negocio
├── data/      # Modelos y assets
└── ui/        # Interfaz
```

**Ahora (UI-First):**
```
src/
└── ui/        # TODO aquí (screens, components, hooks, utils)
```

### Razón

Mantener arquitectura limpia con separación de responsabilidades, pero **sin crear carpetas externas a `ui/`**. La lógica de negocio se manejará de otra manera en el futuro.

---

## Nueva Estructura Propuesta

```
src/ui/
├── screens/                    # Pantallas principales
│   ├── HomeScreen.tsx          # Home (existente)
│   ├── ARScreen.tsx            # Pantalla principal AR
│   └── ProjectListScreen.tsx  # Lista de proyectos (futuro)
│
├── ar/                         # Todo lo relacionado con AR y 3D
│   ├── components/             # Componentes específicos de AR
│   │   ├── ARCanvas.tsx        # Canvas 3D con GLView
│   │   ├── ARControls.tsx      # Botones de control AR
│   │   ├── MaterialPicker.tsx  # Selector de materiales
│   │   └── ARPermissionPrompt.tsx  # Permisos de cámara
│   │
│   ├── hooks/                  # Hooks específicos de AR/3D
│   │   ├── use3DScene.ts       # Lógica Three.js
│   │   ├── useARSession.ts     # Gestión de sesión AR
│   │   └── useMaterialToggle.ts  # Cambio de materiales
│   │
│   └── utils/                  # Utilidades específicas de AR/3D
│       ├── SceneManager.ts     # Gestor de escena Three.js
│       ├── LightingSetup.ts    # Configuración de luces
│       ├── geometries.ts       # Funciones para crear geometrías
│       └── materials.ts        # Definiciones de materiales
│
├── components/                 # Componentes compartidos globales
│   └── shared/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── LoadingSpinner.tsx
│
├── navigation/                 # Navegación (existente)
│   ├── AppNavigator.tsx
│   ├── TabNavigator.tsx
│   └── types.ts
│
└── theme/                      # Tema (existente)
    ├── colors.ts
    └── fonts.ts
```

---

## Principios de Organización

### 1. Separación Screens vs Features

**Screens:**
- Pantallas principales de la app en `screens/`
- Ejemplo: `HomeScreen.tsx`, `ARScreen.tsx`
- Solo orquestación, delegando lógica a features

**Features (AR):**
- Todo lo relacionado con AR y 3D vive en `ar/`
- Componentes, hooks, utils específicos de AR/3D
- Independiente de las screens

### 2. Separación de Responsabilidades

**Dentro de `ar/`:**
- **`components/`** → UI pura específica de AR
- **`hooks/`** → Lógica reutilizable con estado (AR/3D)
- **`utils/`** → Funciones helper, managers, configuraciones (Three.js, geometrías, materiales)

### 3. Shared vs Specific

- **`ui/components/shared/`** → Componentes reutilizables globalmente
- **`ui/ar/components/`** → Componentes solo para AR/3D

---

## Estructura Detallada: Feature AR

### `/ui/screens/ARScreen.tsx`

**Responsabilidad:** Componente principal que orquesta toda la experiencia AR

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ARCanvas } from '@/ui/ar/components/ARCanvas';
import { ARControls } from '@/ui/ar/components/ARControls';
import { MaterialPicker } from '@/ui/ar/components/MaterialPicker';
import { ARPermissionPrompt } from '@/ui/ar/components/ARPermissionPrompt';
import { useARSession } from '@/ui/ar/hooks/useARSession';

export const ARScreen: React.FC = () => {
  const { isARActive, hasPermission, startAR, stopAR } = useARSession();

  if (!hasPermission) {
    return <ARPermissionPrompt />;
  }

  return (
    <View style={styles.container}>
      <ARCanvas />
      <ARControls isActive={isARActive} onStart={startAR} onStop={stopAR} />
      {isARActive && <MaterialPicker />}
    </View>
  );
};
```

**No contiene lógica de negocio, solo orquestación de componentes.**

---

### `/ui/ar/components/`

#### `ARCanvas.tsx`

**Responsabilidad:** Renderizar escena 3D usando GLView

```typescript
import React, { useEffect } from 'react';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import { use3DScene } from '../hooks/use3DScene';

export const ARCanvas: React.FC = () => {
  const { scene, camera, initScene } = use3DScene();

  const onContextCreate = async (gl: any) => {
    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    await initScene();

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();
  };

  return <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />;
};
```

**Solo renderizado, lógica delegada al hook.**

---

#### `MaterialPicker.tsx`

**Responsabilidad:** UI para seleccionar materiales

```typescript
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useMaterialToggle } from '../hooks/useMaterialToggle';

export const MaterialPicker: React.FC = () => {
  const { currentMaterial, changeMaterial, materials } = useMaterialToggle();

  return (
    <View style={styles.container}>
      {materials.map((material) => (
        <TouchableOpacity
          key={material}
          style={[
            styles.button,
            currentMaterial === material && styles.active
          ]}
          onPress={() => changeMaterial(material)}
        >
          <Text style={styles.text}>{material}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
```

**UI pura, lógica en hook.**

---

#### `ARControls.tsx`

**Responsabilidad:** Botones de control (start/stop AR)

```typescript
import React from 'react';
import { View, Button } from 'react-native';

interface ARControlsProps {
  isActive: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const ARControls: React.FC<ARControlsProps> = ({
  isActive,
  onStart,
  onStop
}) => {
  return (
    <View style={{ position: 'absolute', top: 60 }}>
      {!isActive ? (
        <Button title="Iniciar AR" onPress={onStart} />
      ) : (
        <Button title="Detener AR" onPress={onStop} />
      )}
    </View>
  );
};
```

**Componente controlado (controlled component).**

---

#### `ARPermissionPrompt.tsx`

**Responsabilidad:** Manejar permisos de cámara

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { Camera } from 'expo-camera';

export const ARPermissionPrompt: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  if (hasPermission === null) {
    return <Text>Solicitando permisos...</Text>;
  }

  if (hasPermission === false) {
    return (
      <View>
        <Text>Necesitamos acceso a la cámara</Text>
        <Button title="Otorgar" onPress={/* ... */} />
      </View>
    );
  }

  return null;
};
```

**Lógica autocontenida en el componente.**

---

### `/ui/ar/hooks/`

#### `use3DScene.ts`

**Responsabilidad:** Encapsular lógica de Three.js

```typescript
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { SceneManager } from '../utils/SceneManager';
import { createArchitecturalRoom } from '../utils/geometries';

export const use3DScene = () => {
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const [isReady, setIsReady] = useState(false);

  const initScene = async () => {
    sceneManagerRef.current = new SceneManager();

    // Crear habitación
    const room = createArchitecturalRoom();
    sceneManagerRef.current.addToScene(room);

    setIsReady(true);
  };

  return {
    scene: sceneManagerRef.current?.scene,
    camera: sceneManagerRef.current?.camera,
    isReady,
    initScene,
  };
};
```

**Hook que usa utils para lógica compleja.**

---

#### `useARSession.ts`

**Responsabilidad:** Gestionar sesión AR (start/stop)

```typescript
import { useState } from 'react';

export const useARSession = () => {
  const [isARActive, setIsARActive] = useState(false);
  const [hasPermission, setHasPermission] = useState(true); // Simplificado

  const startAR = () => {
    setIsARActive(true);
    // Iniciar tracking, sensores, etc.
  };

  const stopAR = () => {
    setIsARActive(false);
    // Cleanup
  };

  return {
    isARActive,
    hasPermission,
    startAR,
    stopAR,
  };
};
```

**Estado y lógica de AR encapsulada.**

---

#### `useMaterialToggle.ts`

**Responsabilidad:** Cambiar materiales de la escena

```typescript
import { useState } from 'react';
import { MaterialType, getMaterialConfig } from '../utils/materials';

export const useMaterialToggle = () => {
  const [currentMaterial, setCurrentMaterial] = useState<MaterialType>('default');

  const materials: MaterialType[] = ['default', 'wood', 'concrete'];

  const changeMaterial = (material: MaterialType) => {
    setCurrentMaterial(material);
    // Aplicar material a la escena (delegar a SceneManager)
  };

  return {
    currentMaterial,
    materials,
    changeMaterial,
  };
};
```

**Lógica de materiales encapsulada.**

---

### `/ui/ar/utils/`

#### `SceneManager.ts`

**Responsabilidad:** Gestión de escena Three.js

```typescript
import * as THREE from 'three';
import { setupLighting } from './LightingSetup';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.camera.position.set(0, 0, 8);

    // Setup de luces
    setupLighting(this.scene);
  }

  public addToScene(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  public removeFromScene(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  public dispose(): void {
    // Cleanup de geometrías y materiales
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}
```

**Clase helper, no componente React.**

---

#### `LightingSetup.ts`

**Responsabilidad:** Configurar iluminación de la escena

```typescript
import * as THREE from 'three';

export const setupLighting = (scene: THREE.Scene): void => {
  // Luz ambiental
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // Luz direccional principal
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7.5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Luz frontal
  const frontLight = new THREE.DirectionalLight(0xffffff, 0.4);
  frontLight.position.set(0, 5, 10);
  scene.add(frontLight);
};
```

**Función pura, sin estado.**

---

#### `geometries.ts`

**Responsabilidad:** Funciones para crear geometrías 3D

```typescript
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
  return floor;
};

const createWalls = (): THREE.Mesh[] => {
  const wallGeometry = new THREE.BoxGeometry(8, 4, 0.1);
  const material = new THREE.MeshStandardMaterial({ color: 0xf5f5f5 });

  const backWall = new THREE.Mesh(wallGeometry, material);
  backWall.position.z = -4;

  const leftWall = new THREE.Mesh(wallGeometry, material.clone());
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.x = -4;

  const rightWall = new THREE.Mesh(wallGeometry, material.clone());
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.x = 4;

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
  table.add(tableTop);

  // Patas
  const legGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.1);
  const positions = [
    [-0.9, -1.5, -0.4],
    [0.9, -1.5, -0.4],
    [-0.9, -1.5, 0.4],
    [0.9, -1.5, 0.4]
  ];

  positions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, material);
    leg.position.set(pos[0], pos[1], pos[2]);
    table.add(leg);
  });

  return table;
};
```

**Funciones factory puras.**

---

#### `materials.ts`

**Responsabilidad:** Definiciones de materiales

```typescript
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

export const createMaterial = (config: MaterialConfig['wall']): THREE.Material => {
  return new THREE.MeshStandardMaterial({
    color: config.color,
    roughness: config.roughness,
    metalness: config.metalness,
  });
};
```

**Configuración pura, sin lógica compleja.**

---

## Ventajas de Este Enfoque

### 1. Todo en `ui/`
- ✅ No se crean carpetas `core/` o `data/` todavía
- ✅ Lógica de negocio se manejará de otra manera (futuro)
- ✅ Simplicidad en la estructura inicial

### 2. Separación de Responsabilidades
- ✅ **Components:** UI pura
- ✅ **Hooks:** Lógica reutilizable con estado
- ✅ **Utils:** Funciones helper sin estado

### 3. Feature-Based
- ✅ Todo lo de AR/3D en `ar/` (al mismo nivel que `screens/`)
- ✅ Fácil de encontrar y modificar
- ✅ Escalable (agregar features → nuevas carpetas al mismo nivel)

### 4. Testeable
- ✅ Hooks se pueden testear independientemente
- ✅ Utils son funciones puras
- ✅ Components reciben props (fácil de mockear)

### 5. Migratable
- ✅ Cuando quieras extraer lógica a `core/` o `data/`:
  - Mover `utils/` → `core/`
  - Mover configuraciones → `data/`
  - Hooks quedan en `ui/`

---

## Plan de Implementación Simplificado

### Paso 1: Crear Estructura de Carpetas

```bash
mkdir -p src/ui/ar/components
mkdir -p src/ui/ar/hooks
mkdir -p src/ui/ar/utils
```

### Paso 2: Crear Utils (Sin Estado)

1. `utils/materials.ts` - Definiciones de materiales
2. `utils/geometries.ts` - Funciones para crear geometrías
3. `utils/LightingSetup.ts` - Setup de luces
4. `utils/SceneManager.ts` - Gestor de escena

### Paso 3: Crear Hooks (Con Estado)

1. `hooks/use3DScene.ts` - Lógica Three.js
2. `hooks/useARSession.ts` - Gestión AR
3. `hooks/useMaterialToggle.ts` - Cambio de materiales

### Paso 4: Crear Componentes (UI)

1. `components/ARCanvas.tsx` - Renderizado 3D
2. `components/MaterialPicker.tsx` - Selector de materiales
3. `components/ARControls.tsx` - Controles AR
4. `components/ARPermissionPrompt.tsx` - Permisos

### Paso 5: Crear Screen Principal

1. `ARScreen.tsx` - Orquestador

### Paso 6: Actualizar Navegación

1. `navigation/types.ts` - Agregar tipo AR
2. `navigation/TabNavigator.tsx` - Agregar tab AR

---

## Checklist de Implementación

- [ ] Crear carpetas `ar/{components,hooks,utils}`
- [ ] Implementar `utils/materials.ts`
- [ ] Implementar `utils/geometries.ts`
- [ ] Implementar `utils/LightingSetup.ts`
- [ ] Implementar `utils/SceneManager.ts`
- [ ] Implementar `hooks/use3DScene.ts`
- [ ] Implementar `hooks/useMaterialToggle.ts`
- [ ] Implementar `hooks/useARSession.ts`
- [ ] Implementar `components/ARCanvas.tsx`
- [ ] Implementar `components/MaterialPicker.tsx`
- [ ] Implementar `components/ARControls.tsx`
- [ ] Implementar `components/ARPermissionPrompt.tsx`
- [ ] Implementar `ARScreen.tsx`
- [ ] Actualizar `navigation/types.ts`
- [ ] Actualizar `navigation/TabNavigator.tsx`
- [ ] Testear rendering 3D

---

## Migración Futura (Opcional)

Cuando quieras separar lógica de negocio:

```
src/
├── core/              # Mover utils/ aquí
│   ├── scene/
│   ├── ar/
│   └── managers/
├── data/              # Mover configuraciones
│   ├── models/
│   └── constants/
└── ui/                # Mantener screens, components, hooks
    ├── screens/
    ├── components/
    └── navigation/
```

**Por ahora:** Todo en `ui/` con separación clara de responsabilidades.

---

**Última actualización:** 2025-12-08