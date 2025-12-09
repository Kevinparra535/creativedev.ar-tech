# Código 3D Anterior - Análisis y Guía de Recuperación

**Fuente:** Commit `a1bea4b` - Archivo `app/(tabs)/ar-view.tsx`
**Fecha de recuperación:** 2025-12-08
**Líneas de código:** 363

---

## Resumen Ejecutivo

El commit anterior contenía una implementación funcional de una sala arquitectónica 3D con sistema de materiales intercambiables. Este documento analiza el código para guiar la refactorización en la nueva arquitectura modular.

---

## Análisis del Código Original

### Estructura General

```typescript
// Imports
import React, { useEffect, useState, useRef } from 'react';
import { Camera } from 'expo-camera';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';

// Component: ARViewScreen
export default function ARViewScreen() {
  // Estado
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMaterial, setCurrentMaterial] = useState<MaterialType>('default');
  const roomRef = useRef<THREE.Group | null>(null);

  // Lógica de permisos (useEffect)
  // Función createRoom() - Core de geometrías
  // Función onContextCreate() - Setup Three.js
  // Función handleMaterialChange() - Toggle materiales
  // Render JSX
}
```

---

## Componentes Clave a Extraer

### 1. Sistema de Materiales

**Código original:**
```typescript
type MaterialType = 'default' | 'wood' | 'concrete';

// Dentro de createRoom():
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
```

**Refactorizar a:** `src/data/models/materials/MaterialLibrary.ts`

**Propiedades de materiales identificadas:**
- **Default:** Color: 0xF5F5F5 (blanco hueso), roughness: 0.7-0.8, metalness: 0
- **Wood:** Color: 0xD4A574 (beige madera) / 0x8B4513 (marrón), roughness: 0.8-0.9, metalness: 0-0.1
- **Concrete:** Color: 0x808080 (gris medio) / 0x606060 (gris oscuro), roughness: 0.9-0.95, metalness: 0.1-0.2

**Nota:** Materiales usan `MeshStandardMaterial` (soporte PBR con roughness/metalness)

---

### 2. Geometrías de la Sala

#### 2.1 Piso

**Código original:**
```typescript
const floorGeometry = new THREE.PlaneGeometry(8, 8);
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -2;
room.add(floor);
```

**Especificaciones:**
- Geometría: PlaneGeometry de 8x8 unidades
- Rotación: -90° en eje X (plano horizontal)
- Posición Y: -2 (2 unidades debajo del origen)
- Material: Variable según tipo seleccionado

---

#### 2.2 Paredes

**Código original:**
```typescript
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
```

**Especificaciones:**
- Geometría: BoxGeometry 8x4x0.1 (ancho x alto x grosor)
- **Pared trasera:** Z = -4
- **Pared izquierda:** X = -4, rotación Y = 90°
- **Pared derecha:** X = 4, rotación Y = -90°
- **Nota:** No hay pared frontal (cámara mira desde el frente)

**Dimensiones de la habitación:**
- Ancho: 8 unidades
- Alto: 4 unidades
- Profundidad: 8 unidades
- Grosor de paredes: 0.1 unidades

---

#### 2.3 Ventana

**Código original:**
```typescript
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
```

**Especificaciones:**
- Geometría: PlaneGeometry 2x1.5 (ancho x alto)
- Material: Color 0x87CEEB (azul cielo), transparente, opacity: 0.3
- Propiedades especiales: Alta reflectividad (metalness: 0.9, roughness: 0.1)
- Posición: Centro X, Y=0.5 (ligeramente arriba del centro), Z=-3.95 (pegada a pared trasera)

**Nota:** Simula vidrio con material transparente y reflectante

---

#### 2.4 Mesa y Patas

**Código original:**
```typescript
// Superficie de la mesa
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
```

**Especificaciones:**

**Mesa:**
- Geometría: BoxGeometry 2x0.1x1 (ancho x grosor x profundidad)
- Material: Color 0x654321 (marrón oscuro), roughness: 0.6, metalness: 0.1
- Posición: Centro de la habitación, Y=-1

**Patas:**
- Geometría: BoxGeometry 0.1x0.8x0.1 (grosor x altura x grosor)
- Cantidad: 4 patas
- Posiciones: Esquinas de la mesa
  - Frontal izquierda: [-0.9, -1.5, -0.4]
  - Frontal derecha: [0.9, -1.5, -0.4]
  - Trasera izquierda: [-0.9, -1.5, 0.4]
  - Trasera derecha: [0.9, -1.5, 0.4]
- Material: Mismo que la mesa

**Nota:** Mesa es independiente del sistema de materiales de paredes (siempre marrón)

---

### 3. Sistema de Iluminación

**Código original:**
```typescript
// Luz ambiental
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

// Luz direccional principal
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Luz direccional frontal
const frontLight = new THREE.DirectionalLight(0xffffff, 0.4);
frontLight.position.set(0, 5, 10);
scene.add(frontLight);
```

**Especificaciones:**

**Luz Ambiental:**
- Tipo: AmbientLight
- Color: 0xffffff (blanco)
- Intensidad: 0.6
- Propósito: Iluminación base uniforme

**Luz Direccional Principal:**
- Tipo: DirectionalLight
- Color: 0xffffff (blanco)
- Intensidad: 0.8
- Posición: [5, 10, 7.5] (arriba y atrás a la derecha)
- castShadow: true (genera sombras)
- Propósito: Simular sol o luz principal

**Luz Direccional Frontal:**
- Tipo: DirectionalLight
- Color: 0xffffff (blanco)
- Intensidad: 0.4 (más suave)
- Posición: [0, 5, 10] (frontal y arriba)
- Propósito: Rellenar sombras frontales

**Setup de 3 puntos de luz:**
1. Ambiental (general)
2. Key light (principal desde atrás)
3. Fill light (relleno frontal)

**Refactorizar a:** `src/core/scene/LightingController.ts`

---

### 4. Configuración de Cámara

**Código original:**
```typescript
const camera = new THREE.PerspectiveCamera(
  75,
  gl.drawingBufferWidth / gl.drawingBufferHeight,
  0.1,
  1000
);

camera.position.set(0, 0, 8);
camera.lookAt(0, 0, 0);

// Animation loop con rotación orbital
let angle = 0;

const animate = () => {
  requestAnimationFrame(animate);

  angle += 0.003;
  camera.position.x = Math.sin(angle) * 8;
  camera.position.z = Math.cos(angle) * 8;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
  gl.endFrameEXP();
};
```

**Especificaciones:**

**Cámara:**
- Tipo: PerspectiveCamera
- FOV: 75 grados
- Aspect ratio: Dinámico (gl.drawingBufferWidth / gl.drawingBufferHeight)
- Near plane: 0.1
- Far plane: 1000
- Posición inicial: [0, 0, 8] (8 unidades desde el centro)
- Target: [0, 0, 0] (origen)

**Animación orbital:**
- Velocidad: 0.003 radianes por frame
- Radio: 8 unidades
- Eje: Y (rotación horizontal alrededor de la habitación)
- Fórmula:
  - X = sin(angle) * 8
  - Z = cos(angle) * 8
- LookAt: Siempre apunta al centro

**Refactorizar a:** `src/core/scene/CameraController.ts`

---

### 5. Gestión de Cambio de Materiales

**Código original:**
```typescript
const handleMaterialChange = (material: MaterialType) => {
  setCurrentMaterial(material);
  if ((global as any).__arScene) {
    createRoom((global as any).__arScene, material);
  }
};
```

**Método actual:**
1. Actualizar estado React (currentMaterial)
2. Obtener referencia a escena desde global
3. Llamar `createRoom()` que **RECREA toda la habitación**

**Problemas del enfoque actual:**
- ❌ Usa variable global (`(global as any).__arScene`)
- ❌ Recrea toda la geometría en cada cambio (ineficiente)
- ❌ No hace dispose de geometrías/materiales anteriores (memory leak potencial)

**Mejor enfoque (para refactorización):**
```typescript
// En lugar de recrear toda la habitación:
// 1. Mantener referencias a meshes
// 2. Solo cambiar la propiedad .material
room.traverse((child) => {
  if (child instanceof THREE.Mesh && child.userData.changeable) {
    child.material = materialLibrary.getMaterial(newMaterialType);
  }
});
```

**Refactorizar a:** `src/core/hooks/useMaterialToggle.ts`

---

## Flujo de Renderizado

### Setup Inicial (onContextCreate)

```
1. Obtener contexto WebGL
   ↓
2. Crear THREE.Scene
   ↓
3. Crear THREE.PerspectiveCamera (FOV 75)
   ↓
4. Crear Renderer (expo-three)
   - setSize()
   - setClearColor(0x000000, 0) ← Fondo transparente
   ↓
5. Agregar luces a escena
   - AmbientLight (0.6)
   - DirectionalLight principal (0.8)
   - DirectionalLight frontal (0.4)
   ↓
6. Llamar createRoom(scene, currentMaterial)
   - Crear THREE.Group
   - Agregar piso, paredes, ventana, mesa
   ↓
7. Posicionar cámara [0, 0, 8]
   ↓
8. Iniciar animation loop (animate)
   - requestAnimationFrame
   - Actualizar posición de cámara (orbital)
   - renderer.render(scene, camera)
   - gl.endFrameEXP() ← Importante para Expo
```

---

### Ciclo de Cambio de Material

```
Usuario toca botón "Wood"
   ↓
handleMaterialChange('wood')
   ↓
setCurrentMaterial('wood')
   ↓
Acceder a global.__arScene
   ↓
Llamar createRoom(scene, 'wood')
   ↓
Dentro de createRoom:
   1. Remover THREE.Group anterior (roomRef.current)
   2. Crear nuevo THREE.Group
   3. Crear materiales según switch(materialType)
   4. Crear geometrías con nuevos materiales
   5. Agregar a escena
   6. Actualizar roomRef.current
   ↓
Animation loop continúa renderizando
```

---

## Elementos de UI

### 1. Overlay Superior

```typescript
<View style={styles.overlay}>
  <Text style={styles.overlayText}>
    Render Arquitectónico AR
  </Text>
  <Text style={styles.overlaySubtext}>
    POC - Habitación interactiva
  </Text>
</View>
```

**Posición:** Absoluta, top: 60
**Estilo:** Texto blanco con sombra (textShadow)

---

### 2. Controles de Materiales

```typescript
<View style={styles.controls}>
  <Text style={styles.controlsTitle}>Materiales:</Text>
  <View style={styles.buttonRow}>
    {/* 3 botones: Default, Madera, Concreto */}
    <TouchableOpacity
      style={[
        styles.materialButton,
        currentMaterial === 'default' && styles.materialButtonActive
      ]}
      onPress={() => handleMaterialChange('default')}
    >
      <Text style={styles.buttonText}>Default</Text>
    </TouchableOpacity>
    {/* ... más botones */}
  </View>
</View>
```

**Posición:** Absoluta, bottom: 40
**Estilo:**
- Fondo: rgba(0, 0, 0, 0.7) con border-radius
- Botones: flexDirection: 'row' con gap
- Estado activo: border azul (#00A8E8) + fondo azul translúcido

**Refactorizar a:** `src/ui/screens/ARScreen/components/MaterialPicker.tsx`

---

### 3. Estados de Carga y Permisos

**Loading State:**
```typescript
if (isLoading) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#00A8E8" />
      <Text style={styles.text}>Cargando experiencia AR...</Text>
    </View>
  );
}
```

**Permission Denied:**
```typescript
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
```

**Refactorizar a:** `src/ui/components/ar/ARPermissionPrompt.tsx`

---

## Estilos (StyleSheet)

### Colores principales
- Fondo: `#000` (negro)
- Texto: `#fff` (blanco)
- Acento: `#00A8E8` (azul cyan)
- Overlays: `rgba(0, 0, 0, 0.7)` (negro translúcido)

### Componentes clave
- `container`: flex: 1, backgroundColor: '#000'
- `glView`: flex: 1
- `overlay`: position: 'absolute', top: 60
- `controls`: position: 'absolute', bottom: 40, borderRadius: 12
- `materialButton`: flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)'
- `materialButtonActive`: borderColor: '#00A8E8'

**Refactorizar a:** `src/ui/screens/ARScreen/styles.ts` o usar theme existente

---

## Dependencias Críticas

```typescript
import { Camera } from 'expo-camera';        // Permisos de cámara
import { GLView } from 'expo-gl';            // Contexto WebGL
import { Renderer } from 'expo-three';       // Renderizador para Expo
import * as THREE from 'three';              // Motor 3D
```

**Todas ya instaladas en package.json actual ✅**

---

## Checklist de Refactorización

### Extracciones necesarias:

**Datos:**
- [ ] MaterialLibrary.ts con 3 materiales (default, wood, concrete)
- [ ] Presets de materiales (colores, roughness, metalness)

**Geometrías:**
- [ ] ArchitecturalRoom.ts
  - [ ] createFloor() - PlaneGeometry 8x8
  - [ ] createWalls() - 3 paredes BoxGeometry 8x4x0.1
  - [ ] createWindow() - PlaneGeometry 2x1.5 transparente
- [ ] Furniture.ts
  - [ ] createTable() - BoxGeometry 2x0.1x1
  - [ ] createTableLegs() - 4 patas BoxGeometry 0.1x0.8x0.1

**Lógica Core:**
- [ ] SceneManager.ts - Setup de escena, renderer, cleanup
- [ ] LightingController.ts - 3-point lighting setup
- [ ] CameraController.ts - Orbital camera animation

**Hooks:**
- [ ] use3DScene.ts - Encapsular lógica Three.js
- [ ] useMaterialToggle.ts - Cambio eficiente de materiales
- [ ] useOrbitalCamera.ts - Animación de cámara (opcional)

**UI Components:**
- [ ] ARCanvas.tsx - GLView + renderizado
- [ ] MaterialPicker.tsx - Botones de materiales
- [ ] ARPermissionPrompt.tsx - Estados de carga/permisos

**Context:**
- [ ] SceneContext.tsx - Estado global de escena

---

## Mejoras Propuestas vs Código Original

### 1. Gestión de Memoria
**Original:** Recrea toda la geometría en cada cambio de material
**Mejorado:** Solo cambia material, reutiliza geometrías

### 2. Arquitectura
**Original:** Todo en un solo componente de 363 líneas
**Mejorado:** Modular en capas (core, data, ui)

### 3. State Management
**Original:** Variables globales `(global as any).__arScene`
**Mejorado:** React Context API

### 4. Type Safety
**Original:** TypeScript básico, any types
**Mejorado:** Interfaces y tipos estrictos

### 5. Cleanup
**Original:** No hay dispose explícito de geometrías/materiales
**Mejorado:** Cleanup completo en useEffect

### 6. Reusabilidad
**Original:** Código acoplado a un solo screen
**Mejorado:** Hooks y managers reutilizables

---

## Próximos Pasos

1. ✅ Documento creado con análisis completo
2. [ ] Crear estructura de carpetas modular
3. [ ] Extraer MaterialLibrary.ts
4. [ ] Extraer ArchitecturalRoom.ts
5. [ ] Crear SceneManager.ts
6. [ ] Crear hook use3DScene.ts
7. [ ] Crear componente ARCanvas.tsx
8. [ ] Integrar en ARScreen.tsx
9. [ ] Testear rendering 3D funcional

---

**Documento de referencia:** Conservar este archivo durante toda la implementación del POC.

**Última actualización:** 2025-12-08