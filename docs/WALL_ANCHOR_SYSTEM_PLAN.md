# Plan: Sistema de Anclaje Basado en Paredes (Wall-Based Anchor System)

**Fecha de creación:** 2025-12-13
**Última actualización:** 2025-12-13
**Estado:** En implementación - Fase 2 completada
**Duración estimada:** 4-5 semanas (21 días hábiles)

## 📊 Estado de Implementación

- ✅ **Fase 1: Vista Previa 3D del Modelo** - COMPLETADA (2025-12-13)
  - ✅ SceneKitPreviewView.swift (585 líneas)
  - ✅ Expo Module bridge
  - ✅ Componente React Native
  - ✅ ModelPreviewScreen UI
  - ✅ Bug fix: Nombre de vista nativa corregido

- ✅ **Fase 2: Escaneo de Pared en AR** - COMPLETADA (2025-12-13)
  - ✅ ARWallScanningView.swift (419 líneas)
  - ✅ Expo Module bridge con 4 funciones
  - ✅ ARWallScanningView.tsx componente
  - ✅ WallScanningScreen UI (352 líneas)
  - ✅ Navegación integrada

- ✅ **Fase 3: Motor de Alineación** - COMPLETADA (2025-12-15)
  - ✅ WallAlignmentEngine.swift (300+ líneas)
  - ✅ Algoritmos matemáticos completos (escala, rotación, traslación)
  - ✅ Sistema de confianza implementado
  - ✅ Función applyAlignmentTransform en ExpoARKitView
  - ✅ Funciones expuestas en ExpoARKitModule
  - ✅ WallAnchorService.ts completo

- ✅ **Fase 4: Vista de Alineación y Controles** - COMPLETADA (2025-12-15)
  - ✅ AlignmentViewScreen.tsx (400+ líneas)
  - ✅ Cálculo automático de alineación
  - ✅ Aplicación de transformación
  - ✅ Indicadores de calidad con código de colores
  - ✅ Validación de alineación
  - ✅ Navegación completa integrada

- ⏳ **Fase 5: Testing y Polish** - PENDIENTE

---

## Resumen Ejecutivo

Implementar un sistema de anclaje que permite alinear modelos 3D arquitectónicos rediseñados con el entorno físico real usando una pared como punto de referencia.

### Flujo de Usuario

1. Cargar modelo 3D (USDZ) en vista previa no-AR
2. Seleccionar una pared del modelo virtual tocándola
3. Presionar "Continuar" → Cambiar a modo AR
4. Escanear la pared física real que corresponde a la seleccionada
5. Presionar "Aceptar" → Sistema calcula y aplica alineación automática
6. Modelo queda anclado al entorno real con dimensiones correctas

### Contexto del Proyecto

**Problema a resolver:**
El arquitecto escanea una casa con RoomPlan, rediseña el interior en SketchUp, exporta el nuevo diseño como USDZ, y necesita visualizarlo en AR alineado con el entorno físico real.

**Solución propuesta:**
Sistema de alineación basado en correspondencia de paredes virtuales-reales que:
- No requiere ARWorldMap persistence
- Funciona en cualquier sesión/dispositivo
- Es intuitivo para el usuario
- Proporciona alta precisión de alineación

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│              Capa React Native (TypeScript)              │
│                                                          │
│  ModelPreviewScreen → WallScanningScreen → AlignmentViewScreen
│           ↓                    ↓                    ↓
│         WallAnchorService (orquestación + estado)
└──────────────────────────┬──────────────────────────────┘
                           │ Expo Modules Bridge
┌──────────────────────────▼──────────────────────────────┐
│                Capa Swift (iOS Nativo)                   │
│                                                          │
│  SceneKitPreviewView  →  ARWallScanningView  →  WallAlignmentEngine
│  (selección 3D)          (detección AR)        (cálculo matemático)
└─────────────────────────────────────────────────────────┘
```

### Componentes Principales

**Capa React Native:**
- **ModelPreviewScreen**: UI para cargar modelo y seleccionar pared virtual
- **WallScanningScreen**: UI para escanear y seleccionar pared física
- **AlignmentViewScreen**: Visualización del modelo alineado con controles manuales
- **WallAnchorService**: Orquestación del flujo y validaciones

**Capa Swift Nativo:**
- **SceneKitPreviewView**: Renderizado 3D no-AR con hit testing
- **ARWallScanningView**: Detección de planos verticales en ARKit
- **WallAlignmentEngine**: Algoritmo matemático de alineación

---

## Fase 1: Vista Previa 3D del Modelo

**Duración:** Semana 1, Días 1-4
**Objetivo:** Permitir al usuario cargar y visualizar un modelo USDZ en SceneKit (no-AR) y seleccionar una pared mediante tap.

### 1.1 SceneKitPreviewView (Swift) - Días 1-3

**Archivo nuevo:** `modules/expo-arkit/ios/SceneKitPreviewView.swift`

**Responsabilidades:**
- Renderizar USDZ en SCNView (no ARSCNView)
- Implementar hit testing para detectar paredes tocadas
- Extraer geometría de pared: normal, dimensiones, posición
- Resaltar pared seleccionada visualmente
- Controles de cámara: pan (rotar), pinch (zoom)

**Componentes clave:**

```swift
class SceneKitPreviewView: ExpoView {
    private var sceneView: SCNView!
    private var cameraNode: SCNNode!
    private var modelNode: SCNNode?
    private var selectedWallNode: SCNNode?
    private var selectedWallData: WallSelectionData?

    // Event dispatchers (siguiendo patrón existente)
    let onModelLoaded = EventDispatcher()
    let onWallSelected = EventDispatcher()
    let onWallDeselected = EventDispatcher()

    // Métodos principales:
    func loadModelForPreview(path: String)
    func handleTapForWallSelection(_ gesture: UITapGestureRecognizer)
    func extractWallData(from hit: SCNHitTestResult) -> WallSelectionData
    func highlightWall(hit: SCNHitTestResult)
}

struct WallSelectionData {
    let id: String
    let normal: simd_float3           // Vector normal de la pared
    let center: simd_float3           // Centro de la pared en espacio mundial
    let width: Float                  // Ancho de la pared en metros
    let height: Float                 // Alto de la pared en metros
    let transformMatrix: simd_float4x4 // Matriz de transformación
}
```

**Algoritmo de extracción de pared:**

1. Hit test retorna `SCNHitTestResult` con `localNormal`
2. Convertir normal a espacio mundial: `node.convertVector(localNormal, to: nil)`
3. Determinar dimensiones según eje dominante del normal:
   - Normal en X → pared es plano YZ
   - Normal en Y → pared es plano XZ
   - Normal en Z → pared es plano XY
4. Validar que superficie sea > 1m² (descarta objetos pequeños)

**Referencias al código existente:**
- Seguir patrón de `ExpoARKitView.swift` para estructura
- Usar `EventDispatcher` como en líneas 16-23 de ExpoARKitView.swift

### 1.2 Exponer en ExpoARKitModule (Swift) - Día 3

**Archivo a modificar:** `modules/expo-arkit/ios/ExpoARKitModule.swift`

**Agregar:**

```swift
// Definición de vista (similar a ExpoARKit en línea 148)
View(SceneKitPreviewView.self) {
    Events("onModelLoaded", "onWallSelected", "onWallDeselected")
}

// Funciones del módulo
AsyncFunction("loadModelForPreview") { (viewTag: Int, path: String) -> Void in
    DispatchQueue.main.async { [weak self] in
        guard let view = self?.appContext?.findView(
            withTag: viewTag,
            ofType: SceneKitPreviewView.self
        ) else {
            print("Error: Could not find SceneKitPreviewView")
            return
        }
        view.loadModelForPreview(path: path)
    }
}

AsyncFunction("deselectWall") { (viewTag: Int) -> Void in
    DispatchQueue.main.async { [weak self] in
        guard let view = self?.appContext?.findView(
            withTag: viewTag,
            ofType: SceneKitPreviewView.self
        ) else { return }
        view.deselectWall()
    }
}
```

**Patrón a seguir:** Líneas 10-88 de ExpoARKitModule.swift

### 1.3 Componente React Native - Día 3-4

**Archivo nuevo:** `modules/expo-arkit/src/SceneKitPreviewView.tsx`

```typescript
import { requireNativeViewManager } from 'expo-modules-core';
import { ViewProps, findNodeHandle } from 'react-native';
import { ExpoARKitModule } from './ExpoARKitModule';

const NativeSceneKitPreviewView = requireNativeViewManager('SceneKitPreview');

export interface WallData {
  wallId: string;
  normal: [number, number, number];
  center: [number, number, number];
  dimensions: [number, number];  // [width, height]
  transform: number[][];
}

export interface SceneKitPreviewViewRef {
  loadModelForPreview: (path: string) => Promise<void>;
  deselectWall: () => Promise<void>;
}

export const SceneKitPreviewView = forwardRef<
  SceneKitPreviewViewRef,
  SceneKitPreviewViewProps
>((props, ref) => {
  // Implementar siguiendo patrón de ARKitView.tsx (líneas 58-260)
});
```

**Patrón a seguir:** `modules/expo-arkit/src/ARKitView.tsx` líneas 1-260

### 1.4 ModelPreviewScreen - Día 4

**Archivo nuevo:** `src/ui/screens/ModelPreviewScreen.tsx`

**Componentes UI:**
- DocumentPicker para seleccionar archivo USDZ
- SceneKitPreviewView ocupando pantalla completa
- Instrucciones: "Toca una pared del modelo para anclarla"
- Botón "Continuar" (aparece solo cuando hay pared seleccionada)
- Feedback visual: muestra dimensiones de pared seleccionada

**Navegación:**
- Al presionar "Continuar": navegar a `WallScanningScreen` con `wallData` como parámetro

**Estado:**
```typescript
const [modelPath, setModelPath] = useState<string | null>(null);
const [selectedWall, setSelectedWall] = useState<WallData | null>(null);
const [isLoading, setIsLoading] = useState(false);
```

---

## Fase 2: Escaneo de Pared en AR

**Duración:** Semana 2, Días 5-8
**Objetivo:** Permitir al usuario escanear y seleccionar la pared física real que corresponde a la pared virtual seleccionada.

### 2.1 ARWallScanningView (Swift) - Días 5-7

**Archivo nuevo:** `modules/expo-arkit/ios/ARWallScanningView.swift`

**Responsabilidades:**
- Iniciar ARSession con detección de planos **solo verticales**
- Visualizar planos detectados con color distintivo
- Permitir selección de plano mediante tap
- Extraer datos del plano real (ARPlaneAnchor)
- Emitir evento cuando pared real es confirmada

**Configuración AR:**
```swift
let config = ARWorldTrackingConfiguration()
config.planeDetection = [.vertical]  // SOLO verticales!
config.environmentTexturing = .automatic
sceneView.session.run(config)
```

**Componentes clave:**

```swift
class ARWallScanningView: ExpoView, ARSCNViewDelegate {
    private var sceneView: ARSCNView!
    private var detectedWallPlanes: [UUID: ARPlaneAnchor] = [:]
    private var selectedRealWall: RealWallData?

    // Event dispatchers
    let onVerticalPlaneDetected = EventDispatcher()
    let onRealWallSelected = EventDispatcher()

    // Métodos principales
    func startWallScanning()
    func handleTapToSelectWall(_ gesture: UITapGestureRecognizer)
    func extractRealWallData(from anchor: ARPlaneAnchor) -> RealWallData
    func confirmWallSelection()
}

struct RealWallData {
    let id: String
    let normal: simd_float3
    let center: simd_float3
    let width: Float
    let height: Float
    let anchor: ARPlaneAnchor
}
```

**Algoritmo de selección:**

1. Usuario toca pantalla
2. Raycast con filtro `.vertical`: `sceneView.raycast(query)` donde query.target = `.estimatedPlane`
3. Obtener ARPlaneAnchor del resultado
4. Extraer extent (width/height), center, normal del anchor
5. Resaltar plano seleccionado (verde brillante)

**Visualización de planos:**
- Reutilizar `Plane.swift` existente pero solo para verticales
- Color: Verde semitransparente para planos detectados
- Color: Verde brillante para plano seleccionado

**Referencias:** Reutilizar lógica de `ExpoARKitView.swift` líneas 990-1061 (ARSessionDelegate)

### 2.2 Exponer en ExpoARKitModule - Día 7

**Archivo a modificar:** `modules/expo-arkit/ios/ExpoARKitModule.swift`

```swift
View(ARWallScanningView.self) {
    Events("onVerticalPlaneDetected", "onRealWallSelected")
}

AsyncFunction("startWallScanning") { (viewTag: Int) -> Void in
    // Similar a patrón líneas 10-18
}

AsyncFunction("confirmWallSelection") { (viewTag: Int) -> Void in
    // Similar a patrón líneas 43-51
}
```

### 2.3 WallScanningScreen (React Native) - Día 8

**Archivo nuevo:** `src/ui/screens/WallScanningScreen.tsx`

**Props recibidas de navegación:**
```typescript
route.params = {
  virtualWallData: WallData,  // Pared seleccionada en modelo virtual
  modelPath: string           // Path del modelo USDZ
}
```

**UI:**
- ARWallScanningView ocupando pantalla completa
- Instrucciones superiores: "Escanea la pared que seleccionaste en el modelo"
- Mostrar dimensiones de pared virtual como referencia
- Contador de planos detectados
- Botón "Aceptar" (habilitado solo cuando hay pared seleccionada)
- Botón "Cancelar" (volver atrás)

**Estado:**
```typescript
const [detectedPlanes, setDetectedPlanes] = useState<number>(0);
const [selectedRealWall, setSelectedRealWall] = useState<RealWallData | null>(null);
```

**Navegación:**
- Al presionar "Aceptar": navegar a `AlignmentViewScreen` con ambos wall data

---

## Fase 3: Motor de Alineación

**Duración:** Semana 3, Días 9-12
**Objetivo:** Calcular la transformación 3D (escala, rotación, traslación) que alinea el modelo virtual con el entorno real.

### 3.1 WallAlignmentEngine (Swift) - Días 9-11

**Archivo nuevo:** `modules/expo-arkit/ios/WallAlignmentEngine.swift`

**Responsabilidad central:** Calcular transformación 4x4 que mapea pared virtual → pared real

**Algoritmo matemático:**

```swift
class WallAlignmentEngine {
    struct AlignmentResult {
        let transformMatrix: simd_float4x4
        let scale: Float
        let rotation: simd_quatf
        let translation: simd_float3
        let confidence: Float  // 0.0 - 1.0
    }

    static func calculateAlignment(
        virtualWall: WallSelectionData,
        realWall: RealWallData
    ) -> AlignmentResult {
        // 1. Calcular escala
        let scale = calculateScale(virtual: virtualWall, real: realWall)

        // 2. Calcular rotación (alinear normales)
        let rotation = calculateRotation(
            virtualNormal: virtualWall.normal,
            realNormal: realWall.normal
        )

        // 3. Calcular traslación
        let translation = calculateTranslation(
            virtualCenter: virtualWall.center,
            realCenter: realWall.center,
            scale: scale,
            rotation: rotation
        )

        // 4. Componer matriz de transformación
        let transform = composeTransform(
            scale: scale,
            rotation: rotation,
            translation: translation
        )

        // 5. Calcular confianza
        let confidence = calculateConfidence(
            virtual: virtualWall,
            real: realWall,
            scale: scale
        )

        return AlignmentResult(
            transformMatrix: transform,
            scale: scale,
            rotation: rotation,
            translation: translation,
            confidence: confidence
        )
    }
}
```

#### Paso 1: Cálculo de escala

```swift
func calculateScale(virtual: WallSelectionData, real: RealWallData) -> Float {
    let scaleWidth = real.width / virtual.width
    let scaleHeight = real.height / virtual.height

    // Promedio ponderado (favorece dimensión mayor)
    let weightWidth = virtual.width / (virtual.width + virtual.height)
    let weightHeight = virtual.height / (virtual.width + virtual.height)

    let scale = scaleWidth * weightWidth + scaleHeight * weightHeight

    print("Scale: width=\(scaleWidth), height=\(scaleHeight), final=\(scale)")
    return scale
}
```

**Explicación:**
- Calcula factor de escala por dimensión (ancho y alto)
- Promedio ponderado favoreciendo la dimensión mayor para mejor precisión
- Retorna escala uniforme para mantener proporciones del modelo

#### Paso 2: Cálculo de rotación

```swift
func calculateRotation(
    virtualNormal: simd_float3,
    realNormal: simd_float3
) -> simd_quatf {
    // Normalizar vectores
    let v = normalize(virtualNormal)
    let r = normalize(realNormal)

    // Eje de rotación (perpendicular a ambos normales)
    let axis = cross(v, r)

    // Ángulo de rotación
    let cosAngle = dot(v, r)
    let angle = acos(clamp(cosAngle, -1.0, 1.0))

    // Crear quaternion
    if length(axis) < 0.001 {
        // Vectores paralelos o antiparalelos
        if cosAngle > 0 {
            return simd_quatf(angle: 0, axis: [0, 1, 0])
        } else {
            return simd_quatf(angle: .pi, axis: [0, 1, 0])
        }
    }

    return simd_quatf(angle: angle, axis: normalize(axis))
}
```

**Explicación:**
- Usa álgebra vectorial para calcular rotación entre normales de paredes
- Eje de rotación: producto cruz de ambos normales
- Ángulo: producto punto (dot product)
- Retorna quaternion para evitar gimbal lock

#### Paso 3: Cálculo de traslación

```swift
func calculateTranslation(
    virtualCenter: simd_float3,
    realCenter: simd_float3,
    scale: Float,
    rotation: simd_quatf
) -> simd_float3 {
    // Transformar centro virtual con escala y rotación
    let scaledVirtualCenter = virtualCenter * scale
    let rotatedVirtualCenter = rotation.act(scaledVirtualCenter)

    // Calcular offset necesario
    let translation = realCenter - rotatedVirtualCenter

    return translation
}
```

**Explicación:**
- Primero aplica escala y rotación al centro virtual
- Calcula el offset necesario para alinear centros
- Este offset será la traslación final del modelo completo

#### Paso 4: Composición de matriz

```swift
func composeTransform(
    scale: Float,
    rotation: simd_quatf,
    translation: simd_float3
) -> simd_float4x4 {
    // Orden: Escala → Rotación → Traslación
    let scaleMatrix = simd_float4x4(diagonal: [scale, scale, scale, 1.0])
    let rotationMatrix = simd_float4x4(rotation)
    let translationMatrix = simd_float4x4(
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [translation.x, translation.y, translation.z, 1]
    )

    return translationMatrix * rotationMatrix * scaleMatrix
}
```

**IMPORTANTE:** El orden es crítico. Debe ser: **Traslación × Rotación × Escala**

#### Paso 5: Cálculo de confianza

```swift
func calculateConfidence(
    virtual: WallSelectionData,
    real: RealWallData,
    scale: Float
) -> Float {
    // Factor 1: Similitud de aspect ratio (40%)
    let virtualAspect = virtual.width / virtual.height
    let realAspect = real.width / real.height
    let aspectSimilarity = 1.0 - min(
        abs(virtualAspect - realAspect) / realAspect,
        1.0
    )

    // Factor 2: Escala razonable (30%)
    let scaleReasonableness = scale >= 0.5 && scale <= 2.0 ? 1.0 : 0.5

    // Factor 3: Match dimensional después de escalar (30%)
    let scaledVirtualWidth = virtual.width * scale
    let scaledVirtualHeight = virtual.height * scale
    let widthMatch = 1.0 - min(
        abs(scaledVirtualWidth - real.width) / real.width,
        1.0
    )
    let heightMatch = 1.0 - min(
        abs(scaledVirtualHeight - real.height) / real.height,
        1.0
    )
    let dimensionMatch = (widthMatch + heightMatch) / 2.0

    // Promedio ponderado
    let confidence = aspectSimilarity * 0.4 +
                     scaleReasonableness * 0.3 +
                     dimensionMatch * 0.3

    return confidence
}
```

**Explicación del score de confianza:**
- **40%** - Similitud de proporciones (aspect ratio)
- **30%** - Razonabilidad de escala (0.5x - 2.0x)
- **30%** - Precisión dimensional después de escalar

Confianza > 0.7 = Excelente
Confianza 0.4-0.7 = Aceptable
Confianza < 0.4 = Pobre (advertir al usuario)

### 3.2 Aplicar transformación al modelo (Swift) - Día 11

**Archivo a modificar:** `modules/expo-arkit/ios/ExpoARKitView.swift`

**Agregar método:**

```swift
func applyAlignmentTransform(
    modelId: String,
    transform: simd_float4x4
) {
    DispatchQueue.main.async { [weak self] in
        guard let self = self,
              let uuid = UUID(uuidString: modelId),
              let node = self.anchoredNodes[uuid] else {
            print("❌ Model not found: \(modelId)")
            return
        }

        // Aplicar transformación con animación suave
        SCNTransaction.begin()
        SCNTransaction.animationDuration = 0.5

        node.simdTransform = transform

        SCNTransaction.commit()

        print("✅ Alignment transform applied to model \(modelId)")
    }
}
```

**Exponer en ExpoARKitModule.swift:**

```swift
AsyncFunction("applyAlignmentTransform") { (
    viewTag: Int,
    modelId: String,
    transform: [[Double]]
) -> Void in
    DispatchQueue.main.async { [weak self] in
        guard let view = self?.appContext?.findView(
            withTag: viewTag,
            ofType: ExpoARKitView.self
        ) else { return }

        // Convertir [[Double]] a simd_float4x4
        let matrix = transformArrayToMatrix(transform)
        view.applyAlignmentTransform(modelId: modelId, transform: matrix)
    }
}
```

### 3.3 WallAnchorService (TypeScript) - Día 12

**Archivo nuevo:** `src/services/wallAnchorService.ts`

**Responsabilidad:** Orquestar el flujo completo y manejar estado

```typescript
export interface WallAnchorWorkflow {
  modelPath: string;
  virtualWall: WallData | null;
  realWall: RealWallData | null;
  alignmentResult: AlignmentResult | null;
  currentStep: 'model_preview' | 'wall_scanning' | 'alignment' | 'complete';
}

export class WallAnchorService {
  private workflow: WallAnchorWorkflow;

  async calculateAlignment(
    virtualWall: WallData,
    realWall: RealWallData
  ): Promise<AlignmentResult> {
    // Llamar al motor nativo via ExpoARKitModule
    // (El cálculo se hace en Swift, no en JS)
  }

  async applyAlignment(
    arViewRef: ARKitViewRef,
    modelId: string,
    alignment: AlignmentResult
  ): Promise<void> {
    await arViewRef.applyAlignmentTransform(modelId, alignment.transformMatrix);
  }

  validateAlignment(alignment: AlignmentResult): {
    isValid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    if (alignment.confidence < 0.4) {
      warnings.push('Baja confianza en alineación');
    }
    if (alignment.scale < 0.5 || alignment.scale > 2.0) {
      warnings.push('Escala fuera de rango normal');
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  }
}
```

---

## Fase 4: Vista de Alineación y Controles

**Duración:** Semana 4, Días 13-16
**Objetivo:** Mostrar el modelo alineado en AR y permitir ajustes manuales si es necesario.

### 4.1 AlignmentViewScreen - Días 13-15

**Archivo nuevo:** `src/ui/screens/AlignmentViewScreen.tsx`

**Props de navegación:**
```typescript
route.params = {
  modelPath: string,
  virtualWall: WallData,
  realWall: RealWallData
}
```

**Flujo en componentDidMount:**
1. Cargar modelo en ARView (usando tap-to-place en la pared real)
2. Calcular alignment automático
3. Aplicar transformación
4. Mostrar resultado con confianza
5. Habilitar controles manuales

**UI:**
- ARKitView ocupando pantalla completa
- Panel superior: Score de confianza con color
  - Verde (>70%): "Excelente alineación"
  - Amarillo (40-70%): "Alineación aceptable - ajusta si es necesario"
  - Rojo (<40%): "Alineación pobre - considera seleccionar otra pared"
- Panel inferior colapsable: Controles manuales
  - Slider: Escala (0.5x - 2.0x)
  - Slider: Rotación Y (0° - 360°)
  - Sliders: Posición X, Y, Z (-2m a +2m)
  - Botón "Resetear a Auto"
- Botón "Finalizar" (guardar y completar)

**Estado:**
```typescript
const [modelId, setModelId] = useState<string | null>(null);
const [alignment, setAlignment] = useState<AlignmentResult | null>(null);
const [manualAdjustments, setManualAdjustments] = useState({
  scale: 1.0,
  rotationY: 0,
  position: { x: 0, y: 0, z: 0 }
});
const [showManualControls, setShowManualControls] = useState(false);
```

### 4.2 Controles de Ajuste Manual - Día 15

**Componente:** `src/ui/components/AlignmentControls.tsx`

Reutilizar patrón de `ARTestScreen.tsx` líneas 237-289 (model transformation modal).

**Mejoras:**
- Mostrar valores actuales vs automáticos
- Indicador de desviación respecto a auto-alignment
- Botón de reset restaura a valores automáticos

### 4.3 Integración de navegación - Día 16

**Archivo a modificar:** `src/ui/navigation/AppNavigator.tsx`

```typescript
import { ModelPreviewScreen } from '@/ui/screens/ModelPreviewScreen';
import { WallScanningScreen } from '@/ui/screens/WallScanningScreen';
import { AlignmentViewScreen } from '@/ui/screens/AlignmentViewScreen';

// Agregar a Stack.Navigator:
<Stack.Screen
  name='ModelPreview'
  component={ModelPreviewScreen}
  options={{ title: 'Vista Previa del Modelo' }}
/>
<Stack.Screen
  name='WallScanning'
  component={WallScanningScreen}
  options={{ title: 'Escanear Pared' }}
/>
<Stack.Screen
  name='AlignmentView'
  component={AlignmentViewScreen}
  options={{ title: 'Alineación AR' }}
/>
```

**Archivo a modificar:** `src/ui/navigation/types.ts`

```typescript
export type RootStackParamList = {
  Home: undefined;
  ARTest: undefined;
  RoomPlanTestScreen: undefined;
  ModelPreview: undefined;
  WallScanning: {
    virtualWallData: WallData;
    modelPath: string;
  };
  AlignmentView: {
    modelPath: string;
    virtualWall: WallData;
    realWall: RealWallData;
  };
};
```

---

## Validaciones y Manejo de Errores

### Validación 1: Archivo USDZ
**Ubicación:** `ModelPreviewScreen.tsx`

```typescript
if (!modelPath.endsWith('.usdz') && !modelPath.endsWith('.usd')) {
  Alert.alert('Error', 'Solo se aceptan archivos USDZ o USD');
  return;
}
```

### Validación 2: Superficie es pared válida
**Ubicación:** `SceneKitPreviewView.swift` método `isValidWallSurface`

Criterios:
- Área mínima: 1m²
- Aspect ratio: entre 1:5 y 5:1 (evitar superficies muy alargadas)
- Normal debe ser principalmente horizontal (pared, no piso/techo)

### Validación 3: Confianza de alineación
**Ubicación:** `AlignmentViewScreen.tsx`

```typescript
if (alignment.confidence < 0.4) {
  Alert.alert(
    'Advertencia: Baja Confianza',
    `La alineación tiene ${(alignment.confidence * 100).toFixed(0)}% de confianza.\n\n` +
    `Dimensiones:\n` +
    `Virtual: ${virtualWall.dimensions[0].toFixed(2)}m x ${virtualWall.dimensions[1].toFixed(2)}m\n` +
    `Real: ${realWall.width.toFixed(2)}m x ${realWall.height.toFixed(2)}m\n\n` +
    `Escala calculada: ${alignment.scale.toFixed(2)}x\n\n` +
    `¿Deseas continuar o seleccionar otra pared?`,
    [
      { text: 'Seleccionar Otra Pared', onPress: () => navigation.goBack() },
      { text: 'Ajustar Manualmente', onPress: () => setShowManualControls(true) },
      { text: 'Continuar', style: 'default' }
    ]
  );
}
```

### Validación 4: No hay planos detectados
**Ubicación:** `WallScanningScreen.tsx`

```typescript
useEffect(() => {
  const timeout = setTimeout(() => {
    if (detectedPlanes === 0) {
      Alert.alert(
        'No se detectaron paredes',
        'Asegúrate de tener buena iluminación y mueve el dispositivo lentamente.',
        [
          { text: 'Seguir Intentando' },
          { text: 'Cancelar', onPress: () => navigation.goBack() }
        ]
      );
    }
  }, 10000); // 10 segundos

  return () => clearTimeout(timeout);
}, [detectedPlanes]);
```

---

## Archivos del Proyecto

### Archivos Nuevos (9 archivos)

**Swift (Nativo):**
1. `modules/expo-arkit/ios/SceneKitPreviewView.swift` (~400 líneas)
2. `modules/expo-arkit/ios/ARWallScanningView.swift` (~350 líneas)
3. `modules/expo-arkit/ios/WallAlignmentEngine.swift` (~300 líneas)

**TypeScript (Servicios):**
4. `src/services/wallAnchorService.ts` (~150 líneas)

**TypeScript (Componentes Nativos):**
5. `modules/expo-arkit/src/SceneKitPreviewView.tsx` (~120 líneas)
6. `modules/expo-arkit/src/ARWallScanningView.tsx` (~120 líneas)

**TypeScript (Pantallas):**
7. `src/ui/screens/ModelPreviewScreen.tsx` (~250 líneas)
8. `src/ui/screens/WallScanningScreen.tsx` (~200 líneas)
9. `src/ui/screens/AlignmentViewScreen.tsx` (~300 líneas)

### Archivos a Modificar (5 archivos)

1. `modules/expo-arkit/ios/ExpoARKitModule.swift`
   - Agregar definiciones de vistas nuevas (SceneKitPreview, ARWallScanning)
   - Agregar AsyncFunctions: loadModelForPreview, startWallScanning, applyAlignmentTransform
   - ~50 líneas nuevas

2. `modules/expo-arkit/ios/ExpoARKitView.swift`
   - Agregar método applyAlignmentTransform
   - ~30 líneas nuevas

3. `modules/expo-arkit/src/index.ts`
   - Exportar nuevos componentes
   - ~5 líneas nuevas

4. `src/ui/navigation/AppNavigator.tsx`
   - Agregar 3 nuevas pantallas al stack
   - ~15 líneas nuevas

5. `src/ui/navigation/types.ts`
   - Agregar tipos de parámetros de navegación
   - ~15 líneas nuevas

---

## Cronograma Detallado

| Semana | Días   | Fase | Entregables |
|--------|--------|------|-------------|
| **1**  | 1-3    | Fase 1.1 | SceneKitPreviewView.swift funcional con selección de pared |
| **1**  | 3-4    | Fase 1.2-1.4 | Bridge expo + ModelPreviewScreen completo |
| **2**  | 5-7    | Fase 2.1 | ARWallScanningView.swift con detección vertical |
| **2**  | 7-8    | Fase 2.2-2.3 | WallScanningScreen integrado |
| **3**  | 9-11   | Fase 3.1 | WallAlignmentEngine.swift con algoritmo completo |
| **3**  | 11-12  | Fase 3.2-3.3 | Aplicación de transformación + servicio TS |
| **4**  | 13-15  | Fase 4.1-4.2 | AlignmentViewScreen con controles manuales |
| **4**  | 16     | Fase 4.3 | Integración de navegación completa |
| **5**  | 17-21  | Testing | Pruebas end-to-end, fixes, polish |

**Duración total:** 5 semanas (21 días hábiles)

---

## Criterios de Éxito

### Funcionales
- ✅ Cargar modelo USDZ en vista previa no-AR
- ✅ Seleccionar pared virtual con precisión >95%
- ✅ Detectar pared real en <5 segundos
- ✅ Calcular alineación con confianza >60% para paredes similares
- ✅ Modelo alineado visualmente correcto
- ✅ Controles manuales responden en <50ms
- ✅ Flujo completo en <2 minutos

### Performance
- ✅ Carga de modelo: <3 segundos
- ✅ Hit testing: <100ms
- ✅ Cálculo de alignment: <1 segundo
- ✅ Rendering: 60fps constantes

### UX
- ✅ Instrucciones claras en cada paso
- ✅ Feedback visual inmediato
- ✅ Warnings útiles para casos edge
- ✅ Navegación reversible (back en cada pantalla)

---

## Próximos Pasos Inmediatos

1. **Revisar y aprobar este plan** con el equipo
2. **Configurar entorno de desarrollo:**
   - Xcode 15+ con iOS SDK 17+
   - Dispositivo físico con LiDAR (iPhone 12 Pro o superior)
3. **Crear estructura de archivos** según lista arriba
4. **Comenzar con Fase 1.1:** SceneKitPreviewView.swift
   - Este componente es independiente y testeable desde el inicio
5. **Testing incremental:** Probar cada componente antes de integrar

---

## Notas Técnicas Importantes

### Sistemas de Coordenadas

**SceneKit (Preview):**
- Y+ es arriba
- Z- es hacia la cámara (right-handed)

**ARKit (World):**
- Y+ es arriba
- Z- es hacia adelante del dispositivo inicial
- Origin en posición inicial de la cámara

**Conversión:** No se requiere conversión especial si usamos simd_float4x4 consistentemente.

### Matemáticas de Rotación

**¿Por qué quaternions?**
- Evitan gimbal lock
- Interpolación suave
- Composición más eficiente
- Swift tiene `simd_quatf` built-in

**Orden de transformaciones:**
```
Final = Translation × Rotation × Scale
```
Este orden es crítico. Cambiar el orden produce resultados incorrectos.

### Limitaciones Conocidas

1. **Solo funciona con paredes planas:**
   - Paredes curvas no se detectan correctamente
   - Solución: Validar planaridad en hit testing

2. **Requiere LiDAR para mejor precisión:**
   - En dispositivos sin LiDAR, detección de planos es más lenta
   - Solución: Instrucciones más claras para movimiento

3. **Iluminación afecta detección:**
   - Luz muy baja reduce precisión
   - Solución: Validar condiciones antes de empezar

---

## Referencias

**Código Existente:**
- [ExpoARKitModule.swift](../modules/expo-arkit/ios/ExpoARKitModule.swift) - Patrón de módulos Expo
- [ExpoARKitView.swift](../modules/expo-arkit/ios/ExpoARKitView.swift) - Implementación ARKit
- [ARKitView.tsx](../modules/expo-arkit/src/ARKitView.tsx) - Componente React Native
- [ARTestScreen.tsx](../src/ui/screens/ARTestScreen.tsx) - Patrón de UI

**Documentación Apple:**
- [ARKit Documentation](https://developer.apple.com/documentation/arkit)
- [SceneKit Documentation](https://developer.apple.com/documentation/scenekit)
- [simd Library](https://developer.apple.com/documentation/accelerate/simd)

**Documentación Expo:**
- [Expo Modules API](https://docs.expo.dev/modules/overview/)
- [Native Module Tutorial](https://docs.expo.dev/modules/native-module-tutorial/)

---

## 📝 Registro de Cambios

### 2025-12-13 - Fases 1 y 2 Completadas

#### Archivos Creados

**Fase 1:**

1. `modules/expo-arkit/ios/SceneKitPreviewView.swift` (585 líneas)
   - Vista SceneKit para preview 3D no-AR
   - Hit testing para selección de paredes
   - Extracción de geometría y validaciones
   - Controles de cámara (pan/pinch)

2. `modules/expo-arkit/src/SceneKitPreviewView.tsx` (120 líneas)
   - Componente React Native wrapper
   - Interfaces TypeScript completas
   - Métodos imperativos vía ref

3. `src/ui/screens/ModelPreviewScreen.tsx` (384 líneas)
   - UI completa con DocumentPicker
   - Instrucciones dinámicas
   - Panel de información de pared seleccionada
   - Navegación a WallScanning

4. `modules/expo-arkit/index.ts` (37 líneas)
   - Exportaciones centralizadas del módulo

**Fase 2:**

1. `modules/expo-arkit/ios/ARWallScanningView.swift` (419 líneas)
   - Detección AR de planos verticales
   - Selección y resaltado de paredes reales
   - Extracción de datos con validaciones
   - Gestión completa de sesión AR

2. `modules/expo-arkit/src/ARWallScanningView.tsx` (139 líneas)
   - Componente React Native para AR scanning
   - Interfaces TypeScript para RealWallData
   - 5 eventos nativos tipados

3. `src/ui/screens/WallScanningScreen.tsx` (352 líneas)
   - UI completa con AR view
   - Panel de referencia de pared virtual
   - Timeout de 10s si no hay detección
   - Navegación a AlignmentView

#### Archivos Modificados

1. `modules/expo-arkit/ios/ExpoARKitModule.swift`
   - ✅ Agregadas funciones SceneKitPreview (3 funciones)
   - ✅ Agregadas funciones ARWallScanning (4 funciones)
   - ✅ View definitions para ambas vistas
   - ✅ Total: 7 nuevas funciones AsyncFunction

2. `modules/expo-arkit/src/ExpoARKitModule.ts`
   - ✅ Interfaces TypeScript para nuevas funciones
   - ✅ Firma de métodos SceneKitPreview
   - ✅ Firma de métodos ARWallScanning

3. `src/ui/navigation/types.ts`
   - ✅ Tipo WallScanning con parámetros
   - ✅ Tipo AlignmentView con parámetros
   - ✅ Imports de WallData y RealWallData

4. `src/ui/navigation/AppNavigator.tsx`
   - ✅ Import WallScanningScreen
   - ✅ Stack.Screen para WallScanning

#### Correcciones de Bugs

1. **Bug de "Unable to get view config"**
   - Problema: Nombre de vista nativa incorrecto
   - Solución: Cambio de `'ExpoARKit_SceneKitPreviewView'` → `'SceneKitPreviewView'`
   - Archivo: `modules/expo-arkit/src/SceneKitPreviewView.tsx:6`

2. **Archivo index.ts faltante**
   - Problema: package.json especifica `"main": "index.ts"` pero no existía
   - Solución: Creado con todas las exportaciones necesarias
   - Archivo: `modules/expo-arkit/index.ts`

#### Resumen de Líneas de Código

- **Swift nativo:** 1,004 líneas (SceneKitPreviewView + ARWallScanningView)
- **TypeScript componentes:** 259 líneas (wrappers React Native)
- **TypeScript screens:** 736 líneas (ModelPreview + WallScanning)
- **Navegación/tipos:** ~50 líneas
- **Total implementado:** ~2,049 líneas

#### Próximos Pasos

**Fase 3 - Motor de Alineación:**

1. Crear `WallAlignmentEngine.swift` con algoritmo matemático
2. Implementar cálculos de escala, rotación, traslación
3. Función `applyAlignmentTransform` en ExpoARKitView
4. Servicio TypeScript `WallAnchorService.ts`

**Fase 4 - Vista de Alineación:**

1. Crear `AlignmentViewScreen.tsx`
2. Componente `AlignmentControls.tsx`
3. Integración de navegación completa

---

**Última actualización:** 2025-12-15
**Estado:** Fases 1-4 completadas - Listo para testing
**Próxima revisión:** Durante Fase 5 (Testing y Polish)
