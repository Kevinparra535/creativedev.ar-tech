# ARKit Features - Documentación Completa

**Última actualización:** 2025-12-12
**Versión:** 1.0.0

---

## Tabla de Contenidos

1. [Resumen de Características](#resumen-de-características)
2. [Modos de Colocación](#modos-de-colocación)
3. [Gestos y Manipulación](#gestos-y-manipulación)
4. [Gestión de Modelos](#gestión-de-modelos)
5. [Visualización de Planos](#visualización-de-planos)
6. [Personalización](#personalización)
7. [API Reference](#api-reference)
8. [Ejemplos de Uso](#ejemplos-de-uso)

---

## Resumen de Características

### ✨ Funcionalidades Implementadas

- **Detección de planos en tiempo real** (horizontal y vertical)
- **Dos modos de colocación**: Camera Mode y Tap-to-Place Mode
- **Gestos táctiles** para manipular modelos 3D
- **Sistema Undo/Redo** para gestión de modelos
- **Visualización personalizable** de planos detectados
- **Feedback visual** durante el escaneo
- **Transparencia optimizada** de modelos 3D
- **Clasificación inteligente** de superficies (piso, pared, techo, mesa, etc.)

---

## Modos de Colocación

### 1. Camera Mode (Modo Cámara)

**Descripción:** Los modelos aparecen directamente frente a la cámara al importarlos.

**Uso:**
- Por defecto al iniciar la app
- Útil para previsualización rápida
- Los modelos se colocan a 1 metro frente a la cámara

**Cómo activar:**
```typescript
// En ARTestScreen
handleToggleMode() // Toggle entre modos
```

### 2. Tap Mode (Modo Tap-to-Place)

**Descripción:** El usuario toca en un plano detectado para colocar el modelo.

**Uso:**
- Activar con botón "Tap Mode"
- Importar modelo USDZ
- Tocar en cualquier superficie detectada
- El modelo se ancla al plano seleccionado

**Ventajas:**
- Mayor precisión en la colocación
- Anclaje automático a superficies reales
- Modelos permanecen estables en el espacio

---

## Gestos y Manipulación

### Selección de Modelos

**Long Press (Mantener presionado)**
- Duración: 0.5 segundos
- Efecto: Selecciona/deselecciona el modelo
- Feedback visual: Outline azul alrededor del modelo

```swift
// ExpoARKitView.swift:430
longPressGesture.minimumPressDuration = 0.5
```

### Manipulación de Modelos Seleccionados

#### 1. Mover (Pan Gesture)
- **Gesto:** Arrastrar con un dedo
- **Efecto:** Mueve el modelo sobre los planos detectados
- **Nota:** El modelo se reposiciona usando raycast a planos existentes

```swift
// ExpoARKitView.swift:503
@objc private func handlePan(_ sender: UIPanGestureRecognizer)
```

#### 2. Rotar (Rotation Gesture)
- **Gesto:** Girar con dos dedos
- **Efecto:** Rota el modelo alrededor del eje Y (vertical)
- **Ángulo:** Sigue la rotación del gesto

```swift
// ExpoARKitView.swift:555
@objc private func handleRotation(_ sender: UIRotationGestureRecognizer)
```

#### 3. Escalar (Pinch Gesture)
- **Gesto:** Pinch (pellizcar) con dos dedos
- **Efecto:** Aumenta o reduce el tamaño del modelo
- **Proporcional:** Mantiene las proporciones del modelo

```swift
// ExpoARKitView.swift:568
@objc private func handlePinch(_ sender: UIPinchGestureRecognizer)
```

### Ejemplo de Flujo Completo

```
1. Long Press en modelo → Modelo seleccionado (outline azul)
2. Pan → Mover a nueva posición
3. Rotation → Girar a orientación deseada
4. Pinch → Ajustar tamaño
5. Long Press fuera → Deseleccionar
```

---

## Gestión de Modelos

### Sistema de Historial

Cada modelo colocado se guarda en un historial ordenado:

```swift
// ExpoARKitView.swift:19
private var modelHistory: [(anchor: ARAnchor, node: SCNNode)] = []
```

### Undo (Deshacer)

**Funcionalidad:** Elimina el último modelo colocado

**Uso:**
- Botón "Undo" en la UI
- Se deshabilita cuando no hay modelos
- Elimina el modelo y su anchor del espacio AR

```typescript
// ARTestScreen.tsx:137
const handleUndo = () => {
  if (arViewRef.current && modelCount > 0) {
    arViewRef.current.undoLastModel();
    setModelCount(prev => prev - 1);
  }
};
```

### Clear All (Limpiar Todo)

**Funcionalidad:** Elimina todos los modelos de la escena

```typescript
// ARTestScreen.tsx:127
const handleClearAllModels = () => {
  arViewRef.current.removeAllAnchors();
  setModelCount(0);
};
```

### Contador de Modelos

La UI muestra en tiempo real cuántos modelos hay en la escena:

```typescript
const [modelCount, setModelCount] = useState(0);

// Se incrementa al colocar
setModelCount(prev => prev + 1);

// Se decrementa al hacer undo
setModelCount(prev => prev - 1);
```

---

## Visualización de Planos

### Detección Automática

ARKit detecta automáticamente:
- **Planos horizontales**: Pisos, mesas, asientos
- **Planos verticales**: Paredes, puertas, ventanas

### Clasificación de Superficies

| Tipo | Color | Uso |
|------|-------|-----|
| Floor (Piso) | Azul | Superficies horizontales de piso |
| Wall (Pared) | Naranja | Superficies verticales |
| Ceiling (Techo) | Púrpura | Superficies superiores |
| Table (Mesa) | Verde | Mesas y superficies elevadas |
| Seat (Asiento) | Amarillo | Sillas y asientos |
| Window (Ventana) | Cyan | Ventanas |
| Door (Puerta) | Magenta | Puertas |

### Control de Visibilidad

**Auto-ocultación:** Los planos se ocultan automáticamente cuando se coloca el primer modelo.

**Toggle manual:**
```typescript
// ARTestScreen.tsx:145
const handleTogglePlanes = () => {
  arViewRef.current.setPlaneVisibility(!showPlanes);
};
```

**Implementación Swift:**
```swift
// ExpoARKitView.swift:415
func setPlaneVisibility(_ visible: Bool) {
  planesVisible = visible
  sceneView.scene.rootNode.enumerateChildNodes { node, _ in
    if let plane = node.childNodes.first as? Plane {
      plane.isHidden = !visible
    }
  }
}
```

### Fase de Escaneo

**Feedback visual durante el escaneo:**
1. Inicialización: "Scanning for surfaces..."
2. Detección: Muestra cantidad de planos detectados
3. Listo: "Surfaces detected! Ready to place models"

```typescript
// ARTestScreen.tsx:37
const handlePlaneDetected = (event: PlaneDetectedEvent) => {
  if (isScanning && totalPlanes >= 1) {
    setIsScanning(false);
    setStatusMessage('Surfaces detected! Ready to place models.');
  }
};
```

---

## Personalización

### Colores de Planos

**Ubicación:** `modules/expo-arkit/ios/Plane.swift:103`

#### Modificar colores individuales:

```swift
case .floor:
  // Cambiar de azul a verde
  return UIColor(red: 0.0, green: 0.8, blue: 0.3, alpha: 0.5)

case .wall:
  // Cambiar de naranja a rojo
  return UIColor(red: 1.0, green: 0.0, blue: 0.0, alpha: 0.5)
```

#### Opacidad de planos:

```swift
// Línea 92 - Opacidad del mesh
meshNode.opacity = 0.08  // Rango: 0.0 (invisible) - 1.0 (opaco)

// Línea 143 - Opacidad de los bordes
extentNode.opacity = 0.6  // Bordes más visibles
```

#### Alpha de colores:

```swift
// En cada color
alpha: 0.5  // Rango: 0.0 (transparente) - 1.0 (opaco)
```

### Texto de Clasificación

**Color del texto:**
```swift
// Plane.swift:158
textGeometry.firstMaterial?.diffuse.contents = UIColor.black

// Cambiar a blanco:
textGeometry.firstMaterial?.diffuse.contents = UIColor.white
```

**Tamaño del texto:**
```swift
// Plane.swift:157
textGeometry.font = UIFont(name: "Futura", size: 75)

// Línea 161
textNode.simdScale = SIMD3<Float>(repeating: 0.0005)
```

### Estilo de Visualización

**Cambiar de líneas a sólido:**
```swift
// Plane.swift:152
material.fillMode = .lines  // Wireframe
material.fillMode = .fill   // Sólido
```

---

## API Reference

### ARKitView Component

```typescript
interface ARKitViewRef {
  addTestObject: () => void;
  loadModel: (path: string, scale?: number, position?: [number, number, number]) => void;
  placeModelOnTap: (path: string, scale?: number) => void;
  removeAllAnchors: () => void;
  undoLastModel: () => void;
  setPlaneVisibility: (visible: boolean) => void;
}
```

### Métodos

#### `addTestObject()`
Agrega un cubo rojo de prueba a la escena.

```typescript
arViewRef.current?.addTestObject();
```

#### `loadModel(path, scale, position)`
Carga un modelo USDZ en el modo cámara.

**Parámetros:**
- `path` (string): URI del archivo USDZ
- `scale` (number, opcional): Escala del modelo (default: 1)
- `position` (array, opcional): [x, y, z] posición relativa a cámara (default: [0, 0, -1])

```typescript
arViewRef.current?.loadModel(
  'file:///path/to/model.usdz',
  1.0,
  [0, 0, -1]
);
```

#### `placeModelOnTap(path, scale)`
Prepara un modelo para colocación con tap.

**Parámetros:**
- `path` (string): URI del archivo USDZ
- `scale` (number, opcional): Escala del modelo (default: 1)

```typescript
arViewRef.current?.placeModelOnTap(
  'file:///path/to/model.usdz',
  1.0
);
// Usuario debe tocar un plano para colocar
```

#### `removeAllAnchors()`
Elimina todos los modelos de la escena.

```typescript
arViewRef.current?.removeAllAnchors();
```

#### `undoLastModel()`
Elimina el último modelo colocado.

```typescript
arViewRef.current?.undoLastModel();
```

#### `setPlaneVisibility(visible)`
Controla la visibilidad de los planos detectados.

**Parámetros:**
- `visible` (boolean): true para mostrar, false para ocultar

```typescript
arViewRef.current?.setPlaneVisibility(false); // Ocultar
arViewRef.current?.setPlaneVisibility(true);  // Mostrar
```

### Eventos

```typescript
interface ARKitViewProps {
  onARInitialized?: (event: { nativeEvent: { success: boolean; message: string } }) => void;
  onARError?: (event: { nativeEvent: { error: string } }) => void;
  onModelLoaded?: (event: { nativeEvent: { success: boolean; message: string; path: string } }) => void;
  onModelPlaced?: (event: { nativeEvent: { success: boolean; message: string; path: string } }) => void;
  onPlaneDetected?: (event: PlaneDetectedEvent) => void;
  onPlaneUpdated?: (event: PlaneUpdatedEvent) => void;
  onPlaneRemoved?: (event: PlaneRemovedEvent) => void;
}
```

#### Ejemplo de uso de eventos:

```typescript
<ARKitView
  ref={arViewRef}
  onARInitialized={({ nativeEvent }) => {
    console.log('AR initialized:', nativeEvent.success);
  }}
  onModelPlaced={({ nativeEvent }) => {
    console.log('Model placed:', nativeEvent.path);
  }}
  onPlaneDetected={({ nativeEvent }) => {
    console.log('Plane detected:', nativeEvent.plane.type);
  }}
/>
```

---

## Ejemplos de Uso

### Ejemplo 1: Colocación Simple

```typescript
import { ARKitView, ARKitViewRef } from './components';

const MyARScreen = () => {
  const arViewRef = useRef<ARKitViewRef>(null);

  const loadMyModel = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true
    });

    if (!result.canceled) {
      arViewRef.current?.loadModel(result.assets[0].uri, 1);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ARKitView ref={arViewRef} style={{ flex: 1 }} />
      <Button title="Load Model" onPress={loadMyModel} />
    </View>
  );
};
```

### Ejemplo 2: Tap-to-Place con Feedback

```typescript
const [tapMode, setTapMode] = useState(false);

const handleLoadModel = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true
  });

  if (!result.canceled) {
    if (tapMode) {
      arViewRef.current?.placeModelOnTap(result.assets[0].uri, 1);
      Alert.alert('Tap Mode', 'Tap on a surface to place the model');
    } else {
      arViewRef.current?.loadModel(result.assets[0].uri, 1);
    }
  }
};
```

### Ejemplo 3: Gestión de Modelos con UI

```typescript
const [modelCount, setModelCount] = useState(0);

const handleModelPlaced = () => {
  setModelCount(prev => prev + 1);
};

const handleUndo = () => {
  if (modelCount > 0) {
    arViewRef.current?.undoLastModel();
    setModelCount(prev => prev - 1);
  }
};

return (
  <>
    <ARKitView
      ref={arViewRef}
      onModelPlaced={handleModelPlaced}
    />
    <Text>Models: {modelCount}</Text>
    <Button
      title="Undo"
      onPress={handleUndo}
      disabled={modelCount === 0}
    />
  </>
);
```

### Ejemplo 4: Control de Planos

```typescript
const [showPlanes, setShowPlanes] = useState(true);

const togglePlanes = () => {
  const newVisibility = !showPlanes;
  setShowPlanes(newVisibility);
  arViewRef.current?.setPlaneVisibility(newVisibility);
};

// Auto-ocultar planos al colocar primer modelo
const handleFirstModelPlaced = () => {
  if (showPlanes) {
    togglePlanes();
  }
};
```

---

## Solución de Problemas

### Modelos transparentes

**Problema:** Los modelos se ven transparentes o se puede ver la cámara a través de ellos.

**Solución:** Implementada automáticamente en `ExpoARKitView.swift:192-208`. Los materiales se configuran como opacos.

### Planos se mezclan con modelos

**Problema:** Los planos detectados interfieren visualmente con los modelos.

**Solución:** Usa el botón "Hide Planes" o ajusta la opacidad en `Plane.swift:92`.

### Gestos no funcionan

**Problema:** Los gestos de manipulación no responden.

**Solución:** Asegúrate de seleccionar el modelo primero con Long Press (0.5 segundos).

### El modelo no se coloca en tap mode

**Problema:** Tocar un plano no coloca el modelo.

**Solución:** Verifica que:
1. Hay planos detectados (contador > 0)
2. El modo tap está activo
3. Estás tocando directamente en una superficie visualizada

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────┐
│         React Native (TypeScript)        │
│                                          │
│  ARTestScreen.tsx                        │
│  └─> ARKitView.tsx (Component)          │
│       └─> ARKitViewRef (Imperative API) │
└──────────────────┬──────────────────────┘
                   │ Bridge
┌──────────────────▼──────────────────────┐
│         Native Module (Swift)            │
│                                          │
│  ExpoARKitModule.swift (Bridge)          │
│  └─> ExpoARKitView.swift (AR Logic)     │
│       ├─> Plane.swift (Visualization)   │
│       └─> Gesture Handlers               │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│          ARKit + SceneKit                │
│                                          │
│  - World Tracking                        │
│  - Plane Detection                       │
│  - Anchor Management                     │
│  - 3D Rendering                          │
└──────────────────────────────────────────┘
```

---

## Próximas Mejoras

- [ ] Eliminar modelos individualmente (además de undo)
- [ ] Persistencia de escena (guardar/cargar)
- [ ] Captura de screenshots/videos de la sesión AR
- [ ] Mediciones de distancia entre modelos
- [ ] Portal mode (ver solo el modelo sin cámara)
- [ ] Compartir escenas entre dispositivos

---

## Contribución

Para agregar nuevas características al módulo ARKit:

1. Implementar funcionalidad en Swift (`ExpoARKitView.swift`)
2. Exponer método en el módulo (`ExpoARKitModule.swift`)
3. Agregar interfaz TypeScript (`ARKitView.tsx`)
4. Actualizar esta documentación
5. Crear ejemplos de uso

---

**Documentación mantenida por:** CreativeDev.ar
**Repositorio:** creativedev.ar-tech
**Versión ARKit Module:** 1.0.0