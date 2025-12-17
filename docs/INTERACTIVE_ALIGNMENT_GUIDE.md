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

### Solución Propuesta (AlignmentView v2 - Interactive)

```
✅ Modelo flota siguiendo cámara (como RoomPlan)
✅ Escaneo multi-pared con feedback visual en tiempo real
✅ Paredes detectadas se iluminan en verde al hacer match
✅ Progress indicator: "3/5 paredes detectadas"
✅ Cuando suficientes matches → botón "Anclar Modelo" enabled
✅ Haptic feedback al detectar cada pared
✅ Experiencia premium diferenciadora
```

### UX Flow Propuesto

```
┌─────────────────────────────────────┐
│ 1. INICIO                            │
│ - Modelo aparece flotando           │
│ - Semi-transparente (alpha 0.7)     │
│ - Sigue movimiento de cámara        │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ 2. ESCANEO ACTIVO                   │
│ - Usuario mueve dispositivo         │
│ - Detección de planos continua      │
│ - Comparación en tiempo real        │
│   modelo-walls vs planos reales     │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ 3. MATCH VISUAL                     │
│ - Pared detectada → Highlight verde│
│ - Haptic feedback (light impact)    │
│ - Counter: "1/5 paredes detectadas" │
│ - Modelo ajusta orientación suave   │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ 4. SUFICIENTES MATCHES (3+)         │
│ - Botón "Anclar Modelo" enabled     │
│ - Color: verde brillante            │
│ - Animación pulse sutil             │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ 5. ANCLAJE FINAL                    │
│ - Usuario presiona "Anclar"         │
│ - Cálculo alignment multi-wall      │
│ - Transformación aplicada           │
│ - Modelo solidifica (alpha → 1.0)   │
│ - Planos disabled                   │
│ - Navigate → ImmersiveView          │
└─────────────────────────────────────┘
```

---

## 🧠 Por Qué Este Enfoque

### Diferenciación vs Competencia

| Aspecto | Standard AR Apps | Nuestro POC |
|---------|------------------|-------------|
| **Alineación** | Manual (arrastrar/rotar) | Auto multi-wall + Interactive scan |
| **Feedback** | Ninguno o mínimo | Visual en tiempo real (green walls) |
| **Precisión** | Variable (single-point) | Alta (3-5 wall constraints) |
| **UX** | Técnico/funcional | Premium/memorable |
| **Learning Curve** | Alta (requiere skill) | Baja (guided scan) |

### Ventajas Técnicas

1. **Multi-Wall = Mayor Precisión**:
   - Single wall: 4 DOF constraint (position + normal)
   - 3+ walls: Over-constrained system → mejor solve

2. **Real-Time Feedback = Confidence**:
   - Usuario ve progress instant
   - Green walls = validación visual
   - No "espera ciega"

3. **Floating Model = Context**:
   - Usuario ve modelo mientras escanea
   - Puede comparar mentalmente dimensiones
   - Orientación dinámica ayuda a matching

4. **Extensible**:
   - Base para features futuras (floor matching, ceiling, furniture)
   - Multi-room scanning
   - Model library integration

---

## 🏗️ Arquitectura Propuesta

### Componentes Nuevos

```
src/
├── services/
│   └── wallMatchingService.ts       (NEW - ~200 líneas)
│       ├── interface WallMatch
│       ├── compareWallWithPlane()
│       ├── calculateMatchConfidence()
│       └── findBestMatches()
│
├── ui/
│   ├── components/
│   │   └── ScanProgressPanel.tsx    (NEW - ~150 líneas)
│   │       ├── Progress bar
│   │       ├── Wall counter
│   │       └── "Anclar Modelo" button
│   │
│   └── screens/
│       └── AlignmentViewScreen.tsx   (REFACTOR - ~400 líneas)
│           ├── Estado: floating model mode
│           ├── Plane detection handler
│           ├── Wall matching loop
│           └── Multi-wall calculation
```

### Módulos Swift a Extender

```
modules/expo-arkit/ios/
├── ExpoARKitView.swift
│   ├── setPlaneHighlightColor()     (NEW METHOD)
│   └── highlightPlaneNode()         (NEW METHOD)
│
└── ExpoARKitModule.swift
    ├── startFloatingModel()          (WRAPPER)
    ├── highlightPlane()              (WRAPPER)
    └── applyMultiWallAlignment()     (EXTEND EXISTING)
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

### Fase 1: Floating Model (Proof of Concept)

**Duración:** 2 días  
**Objetivo:** Modelo flota siguiendo cámara

**Tareas React Native:**

- [ ] Modificar AlignmentViewScreen.tsx
  - Estado: `floatingMode = true`
  - Llamar `startPlacementPreview` en mount
  - Disable tap-to-place
  - Model semi-transparent (alpha 0.7)

**Tareas Swift:**

- [ ] Verificar `startPlacementPreview` method en ExpoARKitModule
- [ ] Confirmar que reticle sigue cámara smooth
- [ ] Ajustar distancia default (2m frente a cámara)
- [ ] Test performance (should be 60fps)

**Criterios de Éxito:**

- ✅ Modelo visible flotando frente a cámara
- ✅ Sigue movimiento del dispositivo smooth
- ✅ Semi-transparente (alpha 0.7)
- ✅ Performance >30fps

**Riesgos:**

- ⚠️ Lag en tracking (mitigar: reducir poly count si needed)
- ⚠️ Model scale incorrect (ajustar en preview phase)

---

### Fase 2: Wall Matching Engine

**Duración:** 2 días  
**Objetivo:** Comparar paredes del modelo vs planos detectados

**Tareas TypeScript:**

- [ ] Crear `wallMatchingService.ts`

  ```typescript
  interface WallMatch {
    detectedPlane: PlaneDetectedEvent;
    modelWall: VirtualWallData;
    confidence: number; // 0-1
    dimensionError: number; // meters
    angleError: number; // degrees
  }

  class WallMatchingService {
    compareWallWithPlane(
      wall: VirtualWallData, 
      plane: PlaneDetectedEvent
    ): WallMatch | null;
    
    calculateMatchConfidence(match: WallMatch): number;
    
    findBestMatches(
      modelWalls: VirtualWallData[], 
      detectedPlanes: PlaneDetectedEvent[]
    ): WallMatch[];
  }
  ```

- [ ] Implementar algoritmo de matching:

  ```typescript
  // 1. Filter: Only vertical planes (classification = wall)
  // 2. Compare dimensions: width, height (tolerance ±10%)
  // 3. Compare normal vectors (angle tolerance ±15°)
  // 4. Calculate confidence score
  // 5. Return matches sorted by confidence
  ```

**Tareas React Native:**

- [ ] AlignmentViewScreen: Hook plane detection events

  ```typescript
  useEffect(() => {
    const sub = arViewRef.current?.onPlaneDetected((plane) => {
      // Add to detected planes array
      // Run wall matching
      // Update UI if match found
    });
    return () => sub?.remove();
  }, []);
  ```

- [ ] State management:

  ```typescript
  const [detectedPlanes, setDetectedPlanes] = useState<PlaneDetectedEvent[]>([]);
  const [wallMatches, setWallMatches] = useState<WallMatch[]>([]);
  ```

**Criterios de Éxito:**

- ✅ Detecta planos verticales (wall classification)
- ✅ Compara dimensiones con tolerancia ±10%
- ✅ Calcula confidence score correctamente
- ✅ Log muestra matches en console

---

### Fase 3: Visual Feedback System

**Duración:** 1 día  
**Objetivo:** Highlight paredes detectadas en verde

**Tareas Swift:**

- [ ] Implementar `setPlaneHighlightColor` method

  ```swift
  func setPlaneHighlightColor(planeId: UUID, color: UIColor) {
    guard let planeNode = planeNodes[planeId] else { return }
    
    // Update plane material color
    let material = planeNode.geometry?.firstMaterial
    material?.diffuse.contents = color.withAlphaComponent(0.6)
    
    // Optionally: add glow effect
    if color == .green {
      addGlowEffect(to: planeNode)
    }
  }
  ```

- [ ] Bridge to React Native:

  ```swift
  AsyncFunction("highlightPlane") { (viewTag: Int, planeId: String, color: String) in
    // Parse color string (hex or name)
    // Call setPlaneHighlightColor
  }
  ```

**Tareas React Native:**

- [ ] Cuando wall match detectado:

  ```typescript
  if (match.confidence > 0.8) {
    await ExpoARKitModule.highlightPlane(
      viewRef.current.nativeTag, 
      match.detectedPlane.id, 
      '#00FF00' // green
    );
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Update counter
    setMatchedWallsCount(prev => prev + 1);
  }
  ```

**Tareas UI:**

- [ ] Crear ScanProgressPanel.tsx

  ```tsx
  interface ScanProgressPanelProps {
    matchedWalls: number;
    requiredWalls: number; // default: 3
    onAnchorPress: () => void;
  }

  export const ScanProgressPanel = ({ matchedWalls, requiredWalls, onAnchorPress }) => {
    const isReady = matchedWalls >= requiredWalls;
    
    return (
      <View style={styles.panel}>
        <Text style={styles.counter}>
          {matchedWalls}/{requiredWalls} paredes detectadas
        </Text>
        
        <ProgressBar progress={matchedWalls / requiredWalls} />
        
        <TouchableOpacity 
          disabled={!isReady}
          onPress={onAnchorPress}
          style={[styles.button, isReady && styles.buttonEnabled]}
        >
          <Text style={styles.buttonText}>
            {isReady ? '✅ Anclar Modelo' : '🔍 Escaneando...'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };
  ```

**Criterios de Éxito:**

- ✅ Planos matched se iluminan en verde
- ✅ Haptic feedback al detectar match
- ✅ Progress panel muestra "3/5 paredes detectadas"
- ✅ Botón "Anclar" enabled cuando ≥3 matches

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

**Problema:** Actual implementación usa tap-to-place + auto-align. Nuevo enfoque usa floating model + multi-scan.

**Solución:**

```typescript
// OLD (remove):
const handleModelPlaced = (event: ModelPlacedEvent) => { ... }
useEffect(() => { /* auto-load model with tap */ }, []);

// NEW (add):
const [floatingMode, setFloatingMode] = useState(true);
useEffect(() => {
  if (floatingMode) {
    arViewRef.current?.startPlacementPreview(modelPath, 1.0);
  }
}, [floatingMode]);
```

**Estrategia:** Crear branch backup antes de refactor. Keep old implementation commented durante testing.

#### 2. Plane Detection Events - Frecuencia

**Problema:** `onPlaneDetected` puede disparar muy frecuente (10+ eventos/segundo).

**Solución:** Throttle wall matching calculation:

```typescript
const debouncedWallMatching = useMemo(
  () => debounce((planes) => {
    const matches = wallMatchingService.findBestMatches(modelWalls, planes);
    setWallMatches(matches);
  }, 500), // 500ms debounce
  [modelWalls]
);
```

#### 3. Swift Plane Highlighting - Performance

**Problema:** Actualizar materiales de planos en cada frame puede causar lag.

**Solución:**

- Solo highlight planos matched (max 5)
- Cache materials pre-created
- Update only cuando match status changes

```swift
private var highlightedPlanes: Set<UUID> = []
private var greenMaterial: SCNMaterial = createGreenMaterial()
private var grayMaterial: SCNMaterial = createGrayMaterial()

func highlightPlane(id: UUID, matched: Bool) {
  guard let node = planeNodes[id] else { return }
  
  // Skip if already correct state
  if matched && highlightedPlanes.contains(id) { return }
  if !matched && !highlightedPlanes.contains(id) { return }
  
  // Update
  node.geometry?.firstMaterial = matched ? greenMaterial : grayMaterial
  
  if matched {
    highlightedPlanes.insert(id)
  } else {
    highlightedPlanes.remove(id)
  }
}
```

#### 4. Multi-Wall Calculation - Over-Constrained System

**Problema:** 5+ paredes puede crear sistema sobre-determinado con soluciones contradictorias.

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
