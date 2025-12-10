# Plan: ARKit Plane Detection Visualization

## Objetivo
Implementar visualización de detección de planos en tiempo real estilo RoomPlan con:
- Wireframe/grid + color semi-transparente
- Visualización siempre activa
- Selección de planos con tap para ver información
- UI mostrando cantidad, tipo y dimensiones de planos

## Arquitectura

```
React Native (ARTestScreen + PlaneStatsOverlay)
           ↓ eventos
     ARKitView (Bridge)
           ↓
  ExpoARKitModule (Swift)
           ↓
  ExpoARKitView (ARSessionDelegate)
  - Detección de planos
  - Visualización con RealityKit
  - Gestión de gestos
```

## Implementación

### Fase 1: Foundation (Native Swift)

**Archivo:** `ios/ARKitModule/ExpoARKitView.swift`

1. **Agregar ARSessionDelegate:**
   - Conformar a protocolo `ARSessionDelegate`
   - Set delegate: `arView.session.delegate = self`
   - Implementar métodos: `didAdd`, `didUpdate`, `didRemove`

2. **Sistema de datos de planos:**
   ```swift
   private var planeAnchors: [UUID: ARPlaneAnchor] = [:]
   private var planeEntities: [UUID: Entity] = [:]
   private var selectedPlaneId: UUID?

   struct PlaneInfo {
       let id: UUID
       let type: ARPlaneAnchor.Classification
       let alignment: ARPlaneAnchor.Alignment
       let extent: SIMD3<Float>
       let center: SIMD3<Float>

       func toDictionary() -> [String: Any]
       func alignmentString() -> String
   }
   ```

### Fase 2: Visualización de Planos

**Archivo:** `ios/ARKitModule/ExpoARKitView.swift`

1. **Crear visualización de planos:**
   - `createPlaneVisualization(for:)` → Entity con grid + fill
   - `createPlaneMesh(from:)` → MeshResource desde ARPlaneGeometry
   - `createGridMaterial(for:)` → Material con color azul (horizontal) u naranja (vertical), alpha 0.6
   - `createFillMaterial(for:)` → Material semi-transparente, alpha 0.2

2. **Handlers de planos:**
   - `handlePlaneDetected(_:)` → Crear entidad, agregar a escena, emitir evento
   - `handlePlaneUpdated(_:)` → Actualizar geometría, emitir evento
   - `handlePlaneRemoved(_:)` → Remover entidad, limpiar referencias, emitir evento

**Jerarquía de entidades:**
```
AnchorEntity(anchor: planeAnchor)
  └── PlaneEntity
      ├── FillEntity (semi-transparente, position.y = -0.001)
      └── GridEntity (wireframe)
```

### Fase 3: Selección de Planos

**Archivo:** `ios/ARKitModule/ExpoARKitView.swift`

1. **Gestos:**
   - Agregar `UITapGestureRecognizer` en `setupARView()`
   - Handler: `handleTap(_:)` → raycast para encontrar planos

2. **Manejo de selección:**
   - `handlePlaneSelected(_:)` → Actualizar selectedPlaneId, cambiar visuales, emitir evento
   - `handlePlaneDeselected()` → Limpiar selección, emitir evento
   - `updatePlaneSelectionVisuals(previousId:currentId:)` → Highlight amarillo para seleccionado
   - `highlightPlaneVisuals(entity:planeId:)` → Color amarillo, alpha 0.9
   - `resetPlaneVisuals(entity:planeId:)` → Restaurar colores originales

### Fase 4: Sistema de Eventos

**Archivo:** `ios/ARKitModule/ExpoARKitView.swift`
```swift
let onPlaneDetected = EventDispatcher()
let onPlaneUpdated = EventDispatcher()
let onPlaneRemoved = EventDispatcher()
let onPlaneSelected = EventDispatcher()
```

**Archivo:** `ios/ARKitModule/ExpoARKitModule.swift`
```swift
Events(
    "onARInitialized",
    "onARError",
    "onModelLoaded",
    "onPlaneDetected",
    "onPlaneUpdated",
    "onPlaneRemoved",
    "onPlaneSelected"
)
```

**Payloads de eventos:**
- `onPlaneDetected`: `{ plane: PlaneInfo, totalPlanes: number }`
- `onPlaneUpdated`: `{ plane: PlaneInfo, totalPlanes: number }`
- `onPlaneRemoved`: `{ planeId: string, totalPlanes: number }`
- `onPlaneSelected`: `{ plane?: PlaneInfo, selected: boolean }`

### Fase 5: Bridge TypeScript

**Archivo:** `src/ui/ar/components/ARKitView.tsx`

1. **Tipos:**
   ```typescript
   export interface PlaneInfo {
     id: string;
     type: 'horizontal' | 'vertical' | 'unknown';
     width: number;
     height: number;
     centerX: number;
     centerY: number;
     centerZ: number;
   }

   export interface PlaneDetectedEvent {
     nativeEvent: { plane: PlaneInfo; totalPlanes: number };
   }
   // ... otros eventos
   ```

2. **Props:**
   ```typescript
   export interface ARKitViewProps extends ViewProps {
     // ... props existentes
     onPlaneDetected?: (event: PlaneDetectedEvent) => void;
     onPlaneUpdated?: (event: PlaneUpdatedEvent) => void;
     onPlaneRemoved?: (event: PlaneRemovedEvent) => void;
     onPlaneSelected?: (event: PlaneSelectedEvent) => void;
   }
   ```

3. **Pasar eventos al NativeARKitView**

### Fase 6: UI de React Native

**Archivo nuevo:** `src/ui/ar/components/PlaneStatsOverlay.tsx`

- Componente con props: `totalPlanes`, `horizontalPlanes`, `verticalPlanes`, `selectedPlane?`
- Mostrar estadísticas generales en caja semi-transparente
- Mostrar info de plano seleccionado en caja amarilla con borde
- Información: tipo, dimensiones, área, posición

**Archivo:** `src/ui/screens/ARTestScreen.tsx`

1. **Estado:**
   ```typescript
   const [planes, setPlanes] = useState<Map<string, PlaneInfo>>(new Map());
   const [selectedPlane, setSelectedPlane] = useState<PlaneInfo | undefined>();

   const totalPlanes = planes.size;
   const horizontalPlanes = Array.from(planes.values()).filter(p => p.type === 'horizontal').length;
   const verticalPlanes = Array.from(planes.values()).filter(p => p.type === 'vertical').length;
   ```

2. **Event handlers:**
   - `handlePlaneDetected`: agregar plano a Map
   - `handlePlaneUpdated`: actualizar plano en Map, actualizar selectedPlane si aplica
   - `handlePlaneRemoved`: remover de Map, limpiar selectedPlane si aplica
   - `handlePlaneSelected`: actualizar selectedPlane

3. **Layout:**
   - Agregar `PlaneStatsOverlay` en overlay superior derecha
   - Actualizar info text con instrucciones de planos

**Archivo:** `src/ui/ar/components/index.ts`
- Exportar `PlaneStatsOverlay` y tipos

## Archivos a Modificar

1. ✏️ `ios/ARKitModule/ExpoARKitView.swift` - Core implementation
2. ✏️ `ios/ARKitModule/ExpoARKitModule.swift` - Event registration
3. ✏️ `src/ui/ar/components/ARKitView.tsx` - TypeScript types & props
4. ✏️ `src/ui/screens/ARTestScreen.tsx` - State management & UI integration
5. ✏️ `src/ui/ar/components/index.ts` - Exports
6. ✨ `src/ui/ar/components/PlaneStatsOverlay.tsx` - New component

## Orden de Implementación

1. **Fase 1**: Foundation (ARSessionDelegate + data structures)
2. **Fase 2**: Visualización (plane meshes + materials)
3. **Fase 4**: Eventos (event dispatchers + registration)
4. **Fase 5**: Bridge TypeScript (types + props)
5. **Fase 3**: Selección (gestures + selection visuals)
6. **Fase 6**: UI React Native (PlaneStatsOverlay + ARTestScreen)

## Colores de Visualización

- **Horizontal**: Azul (#3399FF)
  - Grid: `rgba(0.2, 0.6, 1.0, 0.6)`
  - Fill: `rgba(0.2, 0.6, 1.0, 0.2)`
- **Vertical**: Naranja (#FF9933)
  - Grid: `rgba(1.0, 0.6, 0.2, 0.6)`
  - Fill: `rgba(1.0, 0.6, 0.2, 0.2)`
- **Seleccionado**: Amarillo (#FFD700)
  - Grid: `rgba(1.0, 1.0, 0.0, 0.9)`
  - Fill: `rgba(1.0, 1.0, 0.0, 0.3)`

## Testing

**Manual:**
1. Escanear superficies horizontales (piso, mesa) → deben aparecer azules
2. Escanear superficies verticales (paredes) → deben aparecer naranjas
3. Tap en plano → debe volverse amarillo y mostrar info
4. Tap en otro plano → selección debe cambiar
5. Tap en vacío → selección debe limpiarse
6. Verificar estadísticas en UI se actualizan en tiempo real

**Performance:**
- Probar con 10+ planos detectados
- Verificar frame rate se mantiene suave
- Validar que planos se actualicen sin lag

## Consideraciones Técnicas

- Usar `weak self` en closures para evitar retain cycles
- Dispatch en main thread para operaciones de UI
- Manejar edge case de planes que se fusionan (merge)
- Z-fighting: fill entity a -0.001 en Y
- Cleanup: remover entidades en `deinit` y cuando planos se eliminan

## Referencias

- [ARKit Documentation](https://developer.apple.com/documentation/arkit)
- [RealityKit Documentation](https://developer.apple.com/documentation/realitykit)
- [ARSessionDelegate](https://developer.apple.com/documentation/arkit/arsessiondelegate)
- [ARPlaneAnchor](https://developer.apple.com/documentation/arkit/arplaneanchor)