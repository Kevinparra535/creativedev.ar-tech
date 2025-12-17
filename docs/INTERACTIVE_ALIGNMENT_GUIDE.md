# 🚀 Interactive Multi-Wall Alignment - Guía de Implementación

**Fecha de inicio:** 2025-12-17  
**Estado:** Fase 0 - Documentación y Planeación  
**Objetivo:** Transformar AlignmentView en experiencia interactiva premium con escaneo multi-pared y modelo flotante

---

## 📖 Índice

1. [Visión y Objetivo](#visión-y-objetivo)
2. [Por Qué Este Enfoque](#por-qué-este-enfoque)
3. [Arquitectura Propuesta](#arquitectura-propuesta)
4. [Plan de Implementación](#plan-de-implementación)
5. [Análisis Técnico](#análisis-técnico)
6. [Cronograma](#cronograma)
7. [Criterios de Éxito](#criterios-de-éxito)

---

## 🎯 Visión y Objetivo

### Objetivo Principal

Crear una experiencia de alineación **interactiva e inmersiva** que transforme el proceso técnico de matching modelo-espacio en una experiencia memorable tipo **RoomPlan**.

### Problema Actual (AlignmentView v1)

```
❌ Usuario presiona "Calcular Alineación"
❌ Espera sin feedback visual
❌ Alineación automática single-wall (menos preciso)
❌ Sin controles manuales si falla
❌ Experiencia "funcional" no "memorable"
```

### Solución Propuesta (AlignmentView v2 - Guided Scan)

**Inspirado en RoomPlan de Apple:**

```
✅ Modelo YA ANCLADO desde el inicio (usando pared de referencia)
✅ Paredes del modelo coloreadas como guía:
   🔴 ROJO = Sin escanear (usuario debe escanear esta área)
   🟢 VERDE = Escaneada y matched (confirmado)
✅ Guided scan: Sistema INDICA qué paredes escanear
✅ Progress indicator: "3/5 paredes escaneadas"
✅ A medida que detecta planos → Pared cambia de rojo a verde
✅ Haptic feedback al detectar cada match
✅ Experiencia premium diferenciadora
```

### UX Flow Propuesto (Tipo RoomPlan)

```
┌─────────────────────────────────────┐
│ 1. INICIO (AlignmentView)           │
│ - Modelo se carga                   │
│ - Alineación inicial con realWall   │
│   (pared seleccionada en paso prev) │
│ - Modelo aparece ANCLADO en espacio │
│ - TODAS las paredes = ROJAS 🔴      │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ 2. GUIDED SCAN                      │
│ - Usuario VE dónde están las paredes│
│ - Sistema indica qué escanear       │
│ - Usuario mueve dispositivo         │
│ - Detección de planos continua      │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ 3. MATCH VISUAL (Rojo → Verde)      │
│ - Plano detectado hace match        │
│ - Pared modelo cambia ROJA → VERDE │
│ - Haptic feedback (light impact)    │
│ - Counter: "1/5 paredes escaneadas" │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ 4. SUFICIENTES MATCHES (3+)         │
│ - ≥3 paredes VERDES                 │
│ - Botón "Finalizar" enabled         │
│ - Color: verde brillante            │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ 5. MULTI-WALL CALCULATION           │
│ - Usuario presiona "Finalizar"      │
│ - Usa TODAS las paredes verdes      │
│ - Optimiza alignment multi-wall     │
│ - Transformación final aplicada     │
│ - Navigate → ImmersiveView          │
└─────────────────────────────────────┘
```

---

## 🧠 Por Qué Este Enfoque

### Diferenciación vs Competencia

| Aspecto | Standard AR Apps | Nuestro POC (RoomPlan-like) |
|---------|------------------|-----------------------------|
| **Alineación** | Manual (arrastrar/rotar) | Auto multi-wall con pared de referencia |
| **Feedback** | Ninguno o mínimo | Visual en tiempo real (🔴 → 🟢) |
| **Guía** | Usuario explora sin dirección | Sistema INDICA qué escanear |
| **Contexto** | Usuario no sabe dónde va | Usuario VE modelo en posición final |
| **Precisión** | Variable (single-point) | Alta (3-5 wall constraints) |
| **UX** | Técnico/funcional | Premium/memorable (RoomPlan style) |
| **Learning Curve** | Alta (requiere skill) | Baja (guided scan visual) |

### Ventajas Técnicas

1. **Modelo Anclado = Mejor Performance**: 
   - No overhead de tracking continuo
   - Modelo estático consume menos recursos
   - 60 FPS garantizado

2. **Guided Scan = Mejor UX**:
   - Usuario tiene contexto visual CLARO
   - Sistema INDICA qué escanear (rojo)
   - Feedback inmediato (rojo → verde)
   - No confusión sobre qué hacer

3. **Multi-Wall = Mayor Precisión**: 
   - Single wall: 4 DOF constraint
   - 3+ walls: Over-constrained system → mejor solve
   - Usa pared de referencia ya validada

4. **Real-Time Feedback = Confidence**:
   - Usuario ve progress instant
   - 🟢 Green walls = validación visual
   - Haptic feedback confirma detección
   - No "espera ciega"

5. **Extensible**:
   - Base para features futuras (floor matching, ceiling)
   - Multi-room scanning
   - Color-coded guidance para otros elementos

## 🏗️ Arquitectura Propuesta

### Componentes Nuevos

```
src/
├── services/
│   └── wallMatchingService.ts       (NEW - ~150 líneas)
│       ├── interface WallMatch
│       ├── checkPlaneMatchesModelWall()  (Compara plano con pared YA anclada)
│       └── calculateMatchConfidence()
│
├── ui/
│   ├── components/
│   │   └── ScanProgressPanel.tsx    (NEW - ~150 líneas)
│   │       ├── Progress bar
│   │       ├── Wall counter ("3/5 escaneadas")
│   │       └── "Finalizar" button
│   │
│   └── screens/
│       └── AlignmentViewScreen.tsx   (REFACTOR - ~350 líneas)
│           ├── Cargar modelo + alinear con realWall
│           ├── Colorear paredes ROJAS al inicio
│           ├── Plane detection handler
│           ├── Wall matching loop (Rojo → Verde)
│           └── Multi-wall calculation final
```

### Módulos Swift a Extender

```
modules/expo-arkit/ios/
├── ExpoARKitView.swift
│   ├── setModelWallColor()          (NEW METHOD - Color paredes del modelo)
│   ├── findWallNode()               (NEW HELPER - Encuentra pared en modelo)
│   └── getCurrentModelTransform()   (NEW METHOD - Posición actual del modelo)
│
└── ExpoARKitModule.swift
    ├── setModelWallColor()           (WRAPPER - Bridge a React Native)
    ├── getModelTransform()           (WRAPPER - Bridge a React Native)
    └── calculateAlignmentMultiWalls() (EXTEND EXISTING)
```

### Flujo de Datos

```
┌──────────────────────────────┐
│  AlignmentViewScreen.tsx     │
│  (React Native)              │
└──────────────────────────────┘
        ↓ ↑
   [Bridge Events]
        ↓ ↑
┌──────────────────────────────┐
│  ExpoARKitView.swift         │
│  - Plane detection           │
│  - Camera tracking           │
│  - Model rendering           │
└──────────────────────────────┘
        ↓
┌──────────────────────────────┐
│  Plane Data                  │
│  - center, extent, normal    │
│  - classification            │
└──────────────────────────────┘
        ↓
┌──────────────────────────────┐
│  wallMatchingService.ts      │
│  - Compare planes vs walls   │
│  - Calculate confidence      │
└──────────────────────────────┘
        ↓
┌──────────────────────────────┐
│  UI Update                   │
│  - Highlight planes          │
│  - Update counter            │
│  - Enable/disable button     │
└──────────────────────────────┘
```

---

## 📋 Plan de Implementación

### Fase 0: Setup y Planeación ✅ (Hoy)

**Duración:** 1 día  
**Objetivo:** Documentación y análisis de conflictos

**Tareas:**

- [x] Crear INTERACTIVE_ALIGNMENT_GUIDE.md
- [x] Identificar archivos a modificar/crear
- [x] Archivar documentación obsoleta
- [ ] Crear CONFLICT_ANALYSIS.md con detalles técnicos
- [ ] Review y aprobación del plan

**Entregables:**

- ✅ Documentación completa
- ⏳ Lista de conflictos potenciales resueltos
- ⏳ Plan de migración código existente

---

### Fase 1: Modelo Anclado + Color de Paredes

**Duración:** 2 días  
**Objetivo:** Cargar modelo, anclarlo con pared de referencia, colorear paredes rojas

**Tareas React Native:**

- [ ] Modificar AlignmentViewScreen.tsx
  - Cargar modelo al iniciar AR session
  - Aplicar alineación inicial con `realWall` (recibida de WallScanningScreen)
  - Extraer lista de paredes del modelo USDZ
  - Estado: `scannedWalls: Set<number>` para track paredes escaneadas
  - Colorear TODAS las paredes ROJAS (🔴) al inicio

**Tareas Swift:**

- [ ] Implementar `setModelWallColor(modelId: String, wallIndex: Int, color: UIColor)` method
  ```swift
  func setModelWallColor(modelId: String, wallIndex: Int, color: UIColor) {
    guard let modelNode = loadedModelNodes[modelId] else { return }
    
    // Find wall geometry by index or name
    let wallNode = findWallNode(in: modelNode, atIndex: wallIndex)
    
    // Apply colored material overlay
    if let geometry = wallNode?.geometry {
      let material = SCNMaterial()
      material.diffuse.contents = color.withAlphaComponent(0.6)
      material.transparency = 0.6
      material.isDoubleSided = true
      geometry.firstMaterial = material
    }
  }
  ```

- [ ] Implementar `findWallNode(in: SCNNode, atIndex: Int) -> SCNNode?` helper
  - Buscar nodos con nombre "wall_XX" o por índice
  - Recorrer jerarquía del modelo

- [ ] Implementar `getCurrentModelTransform(modelId: String) -> simd_float4x4` method
  - Retorna transformación actual del modelo en world space

- [ ] Bridge methods a React Native en ExpoARKitModule.swift

**Criterios de Éxito:**

- ✅ Modelo carga y se ancla con pared de referencia (realWall)
- ✅ Todas las paredes se colorean ROJAS al inicio
- ✅ Modelo visible en posición correcta en AR
- ✅ Performance >30fps
- ✅ Color es visible pero NO opaca geometría original (transparency 0.6)

**Riesgos:**

- ⚠️ Identificar paredes en modelo USDZ puede ser complejo
  - **Mitigación:** Establecer convención de nombres ("wall_01", "wall_02", etc.) en modelos 3D
- ⚠️ Color puede no ser visible si materiales son muy opacos
  - **Mitigación:** Usar transparency 0.6 + isDoubleSided = true

---

### Fase 2: Wall Matching Engine (Modelo Anclado)

**Duración:** 2 días  
**Objetivo:** Detectar planos reales que coinciden con paredes del modelo YA anclado

**Tareas TypeScript:**

- [ ] Crear `wallMatchingService.ts`

  ```typescript
  interface WallMatch {
    wallIndex: number; // Índice de pared en modelo
    detectedPlane: PlaneDetectedEvent;
    confidence: number; // 0-1
    distanceError: number; // meters (distance between plane and model wall)
    angleError: number; // degrees (angle between normals)
  }

  class WallMatchingService {
    /**
     * Check if detected plane matches a model wall position
     * Model is ALREADY ANCHORED, so we compare world positions
     */
    checkPlaneMatchesModelWall(
      plane: PlaneDetectedEvent,
      modelWall: VirtualWallData,
      modelTransform: simd_float4x4 // Current model position in world
    ): { matches: boolean; confidence: number };
    
    /**
     * Calculate confidence based on distance and angle errors
     */
    calculateMatchConfidence(
      distanceError: number,
      angleError: number
    ): number;
  }
  ```

- [ ] Implementar algoritmo de matching:

  ```typescript
  // 1. Filter: Only vertical planes (classification = wall)
  // 2. Transform model wall to world space using modelTransform
  // 3. Compare world positions: distance < 30cm
  // 4. Compare normal vectors: angle < 20°
  // 5. Calculate confidence: 1 - (normalized_errors)
  // 6. Return match if confidence > 0.7
  ```

**Tareas React Native:**

- [ ] AlignmentViewScreen: Hook plane detection events

  ```typescript
  useEffect(() => {
    const sub = arViewRef.current?.onPlaneDetected((plane) => {
      // Check each UNSCANNED wall
      modelWalls.forEach((wall, index) => {
        if (scannedWalls.has(index)) return; // Skip already scanned
        
        // Check if plane matches this wall position
        const { matches, confidence } = wallMatchingService.checkPlaneMatchesModelWall(
          plane,
          wall,
          currentModelTransform
        );
        
        if (matches && confidence > 0.7) {
          // Mark as scanned
          setScannedWalls(prev => new Set(prev).add(index));
          
          // Change wall color: RED → GREEN
          ExpoARKitModule.setModelWallColor(viewTag, modelId, index, '#00FF00');
          
          // Haptic feedback
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      });
    });
    return () => sub?.remove();
  }, [modelWalls, scannedWalls, currentModelTransform]);
  ```

- [ ] State management:

  ```typescript
  const [modelWalls, setModelWalls] = useState<VirtualWallData[]>([]);
  const [scannedWalls, setScannedWalls] = useState<Set<number>>(new Set());
  const [currentModelTransform, setCurrentModelTransform] = useState<simd_float4x4 | null>(null);
  ```

**Criterios de Éxito:**

- ✅ Detecta planos verticales (wall classification)
- ✅ Compara posiciones world space correctamente
- ✅ Tolerancias: distance < 30cm, angle < 20°
- ✅ Calcula confidence score correctamente
- ✅ Pared cambia de ROJA a VERDE al hacer match
- ✅ Log muestra matches en console

---

### Fase 3: Visual Feedback + Progress Panel

**Duración:** 1 día  
**Objetivo:** UI panel que muestra progreso y permite finalizar

**Tareas UI:**

- [ ] Crear ScanProgressPanel.tsx

  ```tsx
  interface ScanProgressPanelProps {
    scannedWalls: number;
    totalWalls: number;
    onFinishPress: () => void;
    isCalculating?: boolean;
  }

  export const ScanProgressPanel = ({ scannedWalls, totalWalls, onFinishPress, isCalculating }) => {
    const minRequired = 3;
    const isReady = scannedWalls >= minRequired && !isCalculating;
    const progress = Math.min(1, scannedWalls / minRequired);
    
    return (
      <View style={styles.panel}>
        <Text style={styles.title}>Escaneo de Paredes</Text>
        
        <Text style={styles.counter}>
          {scannedWalls}/{totalWalls} paredes escaneadas
        </Text>
        
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        
        {scannedWalls < minRequired && (
          <Text style={styles.hint}>
            Escanea al menos {minRequired} paredes para continuar
          </Text>
        )}
        
        <TouchableOpacity 
          disabled={!isReady}
          onPress={onFinishPress}
          style={[styles.button, isReady && styles.buttonEnabled]}
        >
          <Text style={styles.buttonText}>
            {isCalculating 
              ? '⏳ Calculando...'
              : isReady 
                ? '✅ Finalizar' 
                : `🔍 ${scannedWalls}/${minRequired}`}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };
  ```

**Tareas React Native:**

- [ ] Integrar ScanProgressPanel en AlignmentViewScreen

  ```typescript
  <ScanProgressPanel
    scannedWalls={scannedWalls.size}
    totalWalls={modelWalls.length}
    onFinishPress={handleFinishAlignment}
    isCalculating={isCalculating}
  />
  ```

**Criterios de Éxito:**

- ✅ Panel muestra "3/5 paredes escaneadas"
- ✅ Progress bar se actualiza en tiempo real
- ✅ Botón "Finalizar" enabled cuando ≥3 paredes escaneadas
- ✅ Hint text indica cuántas paredes faltan
- ✅ Estado "Calculando..." visible al presionar Finalizar

---

### Fase 4: Multi-Wall Alignment Calculation

**Duración:** 2 días  
**Objetivo:** Calcular transformación óptima con N paredes

**Tareas TypeScript:**

- [ ] Extender `wallAnchorService.ts`:

  ```typescript
  interface MultiWallAlignmentInput {
    modelWalls: VirtualWallData[];
    realWalls: RealWallData[];
    matches: WallMatch[];
  }

  class WallAnchorService {
    calculateAlignmentMultiWalls(
      input: MultiWallAlignmentInput
    ): AlignmentResultResponse {
      // 1. Build system of equations (one per wall pair)
      // 2. Solve for optimal position + rotation
      // 3. Calculate residual error for validation
      // 4. Return transformation matrix
    }
  }
  ```

- [ ] Algoritmo propuesto:

  ```typescript
  // For each matched wall pair:
  //   1. Position constraint: model wall center → real wall center
  //   2. Rotation constraint: model wall normal → real wall normal
  //   3. Scale constraint: model wall extent → real wall extent
  //
  // Solve least-squares optimization:
  //   minimize Σ (model_transformed - real)²
  //
  // Return: { position, rotation, scale, residualError }
  ```

**Tareas React Native:**

- [ ] AlignmentViewScreen: Botón "Anclar Modelo" handler

  ```typescript
  const handleAnchorModel = async () => {
    setIsCalculating(true);
    
    try {
      // Prepare input
      const input: MultiWallAlignmentInput = {
        modelWalls: getAllModelWalls(virtualWall), // extract from model
        realWalls: wallMatches.map(m => m.detectedPlane), // convert
        matches: wallMatches.filter(m => m.confidence > 0.7)
      };
      
      // Calculate
      const alignment = await wallAnchorService.calculateAlignmentMultiWalls(input);
      
      // Validate
      const validation = wallAnchorService.validateAlignment(alignment);
      if (validation.quality !== 'excellent') {
        Alert.alert('Alineación Incierta', 
          'Intenta escanear más paredes para mejorar precisión');
        setIsCalculating(false);
        return;
      }
      
      // Apply
      await wallAnchorService.applyAlignment(
        arViewRef.current.nativeTag, 
        modelId, 
        alignment
      );
      
      // Solidify model (alpha → 1.0)
      await ExpoARKitModule.setModelOpacity(
        arViewRef.current.nativeTag, 
        modelId, 
        1.0
      );
      
      // Disable plane detection
      await arViewRef.current?.setPlaneVisibility(false);
      
      // Navigate to ImmersiveView
      navigation.navigate('ImmersiveView', {
        modelPath,
        modelId,
        alignment,
        virtualWall,
        realWall: wallMatches[0].detectedPlane // main wall reference
      });
      
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsCalculating(false);
    }
  };
  ```

**Criterios de Éxito:**

- ✅ Multi-wall calculation ejecuta sin crash
- ✅ Transformación resulta en modelo alineado visualmente
- ✅ Residual error < 10cm promedio
- ✅ Validation quality = "excellent" o "good"
- ✅ Navegación a ImmersiveView funciona

---

## 🔧 Análisis Técnico

### Archivos a Modificar

| Archivo | Cambios | Complejidad | Riesgo |
|---------|---------|-------------|--------|
| **AlignmentViewScreen.tsx** | Refactor completo (~400 líneas) | 🔴 Alta | 🟡 Medio |
| **wallAnchorService.ts** | Agregar `calculateAlignmentMultiWalls` | 🟡 Media | 🟢 Bajo |
| **ExpoARKitView.swift** | Agregar highlight methods | 🟡 Media | 🟢 Bajo |
| **ExpoARKitModule.swift** | Agregar bridge wrappers | 🟢 Baja | 🟢 Bajo |

### Archivos a Crear

| Archivo | Propósito | Líneas Est. |
|---------|-----------|-------------|
| **wallMatchingService.ts** | Wall matching algorithm | ~200 |
| **ScanProgressPanel.tsx** | UI progress indicator | ~150 |

### Conflictos Potenciales

#### 1. AlignmentViewScreen - Estado Actual vs Nuevo

**Problema:** Actual implementación usa tap-to-place + auto-align single-wall. Nuevo enfoque usa modelo anclado + guided multi-wall scan.

**Solución:**

```typescript
// OLD (remove o comentar):
const handleModelPlaced = (event: ModelPlacedEvent) => { ... }
const handleCalculateAlignment = async () => { /* single-wall calc */ }

// NEW (agregar):
const [scannedWalls, setScannedWalls] = useState<Set<number>>(new Set());
const [modelWalls, setModelWalls] = useState<VirtualWallData[]>([]);

// Load model y alinear con realWall al inicio
useEffect(() => {
  if (arReady && modelId) {
    // Initial alignment con pared de referencia
    const initialAlignment = await wallAnchorService.calculateAlignment(
      virtualWall,
      realWall
    );
    await wallAnchorService.applyAlignment(viewTag, modelId, initialAlignment);
    
    // Colorear todas las paredes ROJAS
    modelWalls.forEach((wall, index) => {
      ExpoARKitModule.setModelWallColor(viewTag, modelId, index, '#FF0000');
    });
  }
}, [arReady, modelId]);
```

**Estrategia:** Crear branch backup antes de refactor. Keep old implementation commented durante testing.

#### 2. Plane Detection Events - Frecuencia

**Problema:** `onPlaneDetected` puede disparar muy frecuente (10+ eventos/segundo), causando exceso de checks.

**Solución:** Throttle matching check + early return si pared ya escaneada:

```typescript
useEffect(() => {
  const subscription = arViewRef.current?.onPlaneDetected((plane) => {
    // Early return si todas las paredes ya escaneadas
    if (scannedWalls.size >= modelWalls.length) return;
    
    // Check solo paredes NO escaneadas
    for (const [index, wall] of modelWalls.entries()) {
      if (scannedWalls.has(index)) continue; // Skip scanned
      
      const { matches, confidence } = wallMatchingService.checkPlaneMatchesModelWall(
        plane,
        wall,
        currentModelTransform
      );
      
      if (matches && confidence > 0.7) {
        // Mark as scanned (solo una vez)
        setScannedWalls(prev => new Set(prev).add(index));
        ExpoARKitModule.setModelWallColor(viewTag, modelId, index, '#00FF00');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break; // Stop checking más paredes para este plano
      }
    }
  });
  
  return () => subscription?.remove();
}, [scannedWalls, modelWalls, currentModelTransform]);
```

#### 3. Swift Model Wall Coloring - Performance

**Problema:** Cambiar materiales de paredes en cada update puede causar lag.

**Solución:**

- Cache materials pre-created (red, green)
- Solo update cuando estado cambia (no re-colorear si ya verde)
- Aplicar material overlay sin reemplazar material original

```swift
private var wallColorCache: [Int: UIColor] = [:] // Track current colors

func setModelWallColor(modelId: String, wallIndex: Int, color: UIColor) {
  // Skip si ya tiene ese color
  if wallColorCache[wallIndex] == color { return }
  
  guard let modelNode = loadedModelNodes[modelId] else { return }
  guard let wallNode = findWallNode(in: modelNode, atIndex: wallIndex) else { return }
  
  // Apply overlay material (no replace original)
  if let geometry = wallNode.geometry {
    let overlay = SCNMaterial()
    overlay.diffuse.contents = color.withAlphaComponent(0.6)
    overlay.transparency = 0.6
    overlay.isDoubleSided = true
    geometry.firstMaterial = overlay
  }
  
  // Update cache
  wallColorCache[wallIndex] = color
}
```

#### 4. Identificación de Paredes en Modelo USDZ

**Problema:** Modelos USDZ pueden tener naming inconsistente o sin estructura clara.

**Solución:** Establecer convención de nombres + fallback hierarchy search:

```swift
func findWallNode(in modelNode: SCNNode, atIndex: Int) -> SCNNode? {
  // Strategy 1: Por nombre con convención ("wall_01", "wall_02", etc.)
  if let namedNode = modelNode.childNode(withName: "wall_\(String(format: "%02d", index))", recursively: true) {
    return namedNode
  }
  
  // Strategy 2: Por tipo de geometría (planos verticales grandes)
  var wallNodes: [SCNNode] = []
  modelNode.enumerateChildNodes { node, _ in
    if isWallGeometry(node.geometry) {
      wallNodes.append(node)
    }
  }
  
  // Return por índice si encontrado
  return wallNodes.indices.contains(index) ? wallNodes[index] : nil
}

func isWallGeometry(_ geometry: SCNGeometry?) -> Bool {
  // Detect si es plano vertical grande (típico de paredes)
  // Check: tipo box o plane, altura > ancho, Y-axis aligned
  return /* implementation */
}
```

**Solución:** Least-squares optimization + weight by confidence:

```typescript
function calculateAlignmentMultiWalls(input: MultiWallAlignmentInput) {
  // Build weighted equations
  const equations = input.matches.map(match => ({
    wall: match.modelWall,
    plane: match.realWall,
    weight: match.confidence // higher confidence = more weight
  }));
  
  // Solve using least-squares
  const solution = solveLeastSquares(equations);
  
  // Calculate residual error
  const residual = calculateResidual(solution, equations);
  
  return {
    transformation: solution,
    confidence: 1 - (residual / input.matches.length)
  };
}
```

---

## 📅 Cronograma

| Fase | Duración | Inicio | Fin Est. | Status |
|------|----------|--------|----------|--------|
| **Fase 0: Planeación** | 1 día | 2025-12-17 | 2025-12-17 | 🔨 En progreso |
| **Fase 1: Floating Model** | 2 días | 2025-12-18 | 2025-12-19 | ⏳ Pendiente |
| **Fase 2: Wall Matching** | 2 días | 2025-12-20 | 2025-12-21 | ⏳ Pendiente |
| **Fase 3: Visual Feedback** | 1 día | 2025-12-22 | 2025-12-22 | ⏳ Pendiente |
| **Fase 4: Multi-Wall Calc** | 2 días | 2025-12-23 | 2025-12-24 | ⏳ Pendiente |
| **Testing + Polish** | 1 día | 2025-12-25 | 2025-12-25 | ⏳ Pendiente |
| **TOTAL** | **9 días** | 2025-12-17 | 2025-12-25 | - |

### Estimación Conservadora

- **Mejor caso:** 7 días (sin blockers)
- **Caso esperado:** 9 días (plan actual)
- **Peor caso:** 12 días (con refactors adicionales)

---

## ✅ Criterios de Éxito

### Funcionalidad Core

- [ ] Modelo flota siguiendo cámara smoothly
- [ ] Detecta ≥3 paredes verticales
- [ ] Compara dimensiones con tolerancia ±10%
- [ ] Highlight paredes matched en verde
- [ ] Progress indicator muestra "X/5 paredes detectadas"
- [ ] Botón "Anclar" enabled cuando ≥3 matches
- [ ] Multi-wall calculation ejecuta sin crash
- [ ] Modelo se ancla correctamente al presionar botón
- [ ] Navegación a ImmersiveView funcional

### Performance

- [ ] Floating model: ≥30 FPS
- [ ] Plane detection: No lag perceptible
- [ ] Wall matching: <100ms por match
- [ ] Multi-wall calc: <2 segundos total
- [ ] Haptic feedback: <50ms latency

### UX

- [ ] Experiencia se siente "diferente" y premium
- [ ] Feedback visual es claro (green = matched)
- [ ] Progress es obvio (no confusión)
- [ ] Botón "Anclar" es discoverable
- [ ] No crashes ni errores visuales

### Precisión

- [ ] Alignment residual error: <10cm promedio
- [ ] Validation quality: "excellent" o "good"
- [ ] Modelo alineado visualmente correcto
- [ ] ImmersiveView muestra modelo sin offset

---

## 📚 Referencias Técnicas

### Apple Documentation

- [ARPlaneAnchor](https://developer.apple.com/documentation/arkit/arplaneanchor)
- [ARSCNView](https://developer.apple.com/documentation/arkit/arscnview)
- [SCNMaterial](https://developer.apple.com/documentation/scenekit/scnmaterial)
- [RoomPlan Interactions](https://developer.apple.com/documentation/roomplan/roomplan/capturesession)

### Algoritmos

- **Wall Matching**: Dimensión + normal vector comparison
- **Multi-Wall Alignment**: Least-squares optimization (Kabsch algorithm)
- **Confidence Score**: `1 - (dimensionError + angleError) / 2`

### Recursos Externos

- [SceneKit Best Practices (WWDC 2017)](https://developer.apple.com/videos/play/wwdc2017/608/)
- [ARKit Performance Optimization (WWDC 2018)](https://developer.apple.com/videos/play/wwdc2018/610/)

---

## 🎯 Próximos Pasos Inmediatos

1. **Hoy (2025-12-17):**
   - ✅ Crear INTERACTIVE_ALIGNMENT_GUIDE.md
   - ⏳ Crear CONFLICT_ANALYSIS.md con detalles técnicos
   - ⏳ Archivar documentación obsoleta de fases
   - ⏳ Review de código existente (AlignmentViewScreen + wallAnchorService)
   - ⏳ Preparar branch backup: `git checkout -b backup-alignment-v1`

2. **Mañana (2025-12-18):**
   - Comenzar Fase 1: Floating Model
   - Proof of concept: Modelo flotante visible
   - Test en device real

3. **Checkpoint (2025-12-19):**
   - Demo Fase 1 funcionando
   - Decisión: continuar o ajustar approach

---

**Última actualización:** 2025-12-17  
**Próxima revisión:** 2025-12-18 (después de Fase 1)  
**Contacto:** Team creativedev.ar-tech
