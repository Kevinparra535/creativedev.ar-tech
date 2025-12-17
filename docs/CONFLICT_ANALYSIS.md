# 🔍 Análisis de Conflictos - Interactive Alignment Migration

**Fecha:** 2025-12-17  
**Objetivo:** Identificar todos los archivos que necesitan modificación y posibles conflictos

---

## 📋 Archivos a Modificar

### 🔴 Cambios Críticos (Alta Complejidad)

#### 1. `src/ui/screens/AlignmentViewScreen.tsx`

**Cambios Necesarios:**

```typescript
// ❌ REMOVER: Tap-to-place logic
const handleModelPlaced = (event: ModelPlacedEvent) => { ... }

// ❌ REMOVER: Auto-load con anchor
useEffect(() => {
  if (modelPlaced && !isCalculating) {
    handleCalculateAlignment();
  }
}, [modelPlaced]);

// ✅ AGREGAR: Floating model mode
const [floatingMode, setFloatingMode] = useState(true);
const [detectedPlanes, setDetectedPlanes] = useState<PlaneDetectedEvent[]>([]);
const [wallMatches, setWallMatches] = useState<WallMatch[]>([]);
const [matchedWallsCount, setMatchedWallsCount] = useState(0);

// ✅ AGREGAR: Start floating model on mount
useEffect(() => {
  if (arReady && floatingMode) {
    arViewRef.current?.startPlacementPreview(modelPath, 1.0);
    setModelOpacity(0.7); // Semi-transparent
  }
}, [arReady, floatingMode, modelPath]);

// ✅ AGREGAR: Plane detection handler
useEffect(() => {
  const subscription = arViewRef.current?.onPlaneDetected((plane) => {
    setDetectedPlanes(prev => {
      const updated = [...prev, plane];
      
      // Run wall matching
      debouncedWallMatching(updated);
      
      return updated;
    });
  });
  
  return () => subscription?.remove();
}, []);

// ✅ AGREGAR: Wall matching handler
const debouncedWallMatching = useMemo(
  () => debounce((planes: PlaneDetectedEvent[]) => {
    const modelWalls = extractModelWalls(virtualWall); // NEW helper
    const matches = wallMatchingService.findBestMatches(modelWalls, planes);
    
    setWallMatches(matches);
    setMatchedWallsCount(matches.filter(m => m.confidence > 0.7).length);
    
    // Highlight matched planes
    matches.forEach(match => {
      if (match.confidence > 0.7) {
        ExpoARKitModule.highlightPlane(
          arViewRef.current.nativeTag,
          match.detectedPlane.id,
          '#00FF00' // green
        );
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    });
  }, 500),
  [virtualWall]
);

// ✅ MODIFICAR: Calculate alignment button → Anchor button
const handleAnchorModel = async () => {
  if (matchedWallsCount < 3) {
    Alert.alert('Insuficientes Paredes', 'Escanea al menos 3 paredes para continuar');
    return;
  }
  
  setIsCalculating(true);
  
  try {
    const input: MultiWallAlignmentInput = {
      modelWalls: extractModelWalls(virtualWall),
      realWalls: wallMatches.map(m => convertPlaneToRealWall(m.detectedPlane)),
      matches: wallMatches.filter(m => m.confidence > 0.7)
    };
    
    const alignment = await wallAnchorService.calculateAlignmentMultiWalls(input);
    
    // Validate
    const validation = wallAnchorService.validateAlignment(alignment);
    if (validation.quality === 'poor') {
      Alert.alert('Alineación Baja Calidad', 'Intenta escanear más paredes');
      setIsCalculating(false);
      return;
    }
    
    // Apply
    await wallAnchorService.applyAlignment(
      arViewRef.current.nativeTag,
      modelId,
      alignment
    );
    
    // Solidify model
    await ExpoARKitModule.setModelOpacity(
      arViewRef.current.nativeTag,
      modelId,
      1.0
    );
    
    // Disable planes
    await arViewRef.current?.setPlaneVisibility(false);
    
    // Navigate
    navigation.navigate('ImmersiveView', {
      modelPath,
      modelId,
      alignment,
      virtualWall,
      realWall: convertPlaneToRealWall(wallMatches[0].detectedPlane)
    });
    
  } catch (error) {
    Alert.alert('Error', error.message);
  } finally {
    setIsCalculating(false);
  }
};
```

**Funciones Helper Nuevas:**

```typescript
// Extract model walls from VirtualWallData
function extractModelWalls(virtualWall: VirtualWallData): VirtualWallData[] {
  // TODO: Load full model USDZ and extract all walls
  // For now, return single wall (will extend in Phase 2)
  return [virtualWall];
}

// Convert PlaneDetectedEvent to RealWallData
function convertPlaneToRealWall(plane: PlaneDetectedEvent): RealWallData {
  return {
    center: plane.center,
    extent: plane.extent,
    normal: plane.normal || { x: 0, y: 0, z: 1 },
    identifier: plane.id
  };
}
```

**Riesgos:**
- 🔴 **Alto:** Refactor completo cambia flow existente
- 🟡 **Medio:** Posible regresión en alignment calculation
- 🟢 **Bajo:** Typing ya existe, solo refactor lógica

**Estrategia de Migración:**
1. Crear branch backup: `git checkout -b backup-alignment-v1`
2. Comentar código viejo (no borrar todavía)
3. Implementar nuevo código en paralelo
4. Test exhaustivo en device
5. Borrar código viejo solo después de validación completa

---

### 🟡 Cambios Medios (Complejidad Media)

#### 2. `src/services/wallAnchorService.ts`

**Cambios Necesarios:**

```typescript
// ✅ AGREGAR: Multi-wall alignment calculation
interface MultiWallAlignmentInput {
  modelWalls: VirtualWallData[];
  realWalls: RealWallData[];
  matches: WallMatch[];
}

class WallAnchorService {
  // ... existing methods ...
  
  /**
   * Calculate optimal alignment using multiple wall constraints
   * More accurate than single-wall alignment
   */
  calculateAlignmentMultiWalls(
    input: MultiWallAlignmentInput
  ): AlignmentResultResponse {
    if (input.matches.length < 2) {
      throw new Error('At least 2 wall matches required for multi-wall alignment');
    }
    
    // Build weighted system of equations
    const equations: AlignmentEquation[] = input.matches.map(match => ({
      modelWall: match.modelWall,
      realWall: match.realWall,
      weight: match.confidence // Higher confidence = more influence
    }));
    
    // Solve least-squares optimization
    const solution = this.solveLeastSquares(equations);
    
    // Calculate residual error for validation
    const residual = this.calculateResidual(solution, equations);
    
    // Calculate confidence based on residual
    const confidence = Math.max(0, 1 - (residual / input.matches.length));
    
    return {
      position: solution.position,
      rotation: solution.rotation,
      scale: solution.scale || { x: 1, y: 1, z: 1 },
      confidence,
      residualError: residual
    };
  }
  
  /**
   * Solve least-squares optimization for wall alignment
   * Uses Kabsch algorithm for optimal rotation + translation
   */
  private solveLeastSquares(equations: AlignmentEquation[]): AlignmentSolution {
    // 1. Calculate weighted centroids
    const modelCentroid = this.calculateWeightedCentroid(
      equations.map(eq => ({ point: eq.modelWall.center, weight: eq.weight }))
    );
    const realCentroid = this.calculateWeightedCentroid(
      equations.map(eq => ({ point: eq.realWall.center, weight: eq.weight }))
    );
    
    // 2. Center points around centroids
    const centeredModel = equations.map(eq => 
      subtract(eq.modelWall.center, modelCentroid)
    );
    const centeredReal = equations.map(eq => 
      subtract(eq.realWall.center, realCentroid)
    );
    
    // 3. Calculate rotation using Kabsch algorithm
    const rotation = this.kabschRotation(centeredModel, centeredReal, 
      equations.map(eq => eq.weight));
    
    // 4. Calculate translation
    const rotatedModelCentroid = this.applyRotation(modelCentroid, rotation);
    const translation = subtract(realCentroid, rotatedModelCentroid);
    
    return {
      position: translation,
      rotation: this.matrixToEuler(rotation)
    };
  }
  
  /**
   * Kabsch algorithm for optimal rotation matrix
   */
  private kabschRotation(
    modelPoints: Vector3[], 
    realPoints: Vector3[], 
    weights: number[]
  ): Matrix3x3 {
    // Build covariance matrix H
    const H = this.buildCovarianceMatrix(modelPoints, realPoints, weights);
    
    // Singular Value Decomposition (SVD)
    const { U, V } = this.svd(H);
    
    // Optimal rotation R = V * U^T
    const R = this.multiply(V, this.transpose(U));
    
    // Check for reflection (det(R) should be 1, not -1)
    if (this.determinant(R) < 0) {
      V[2] = V[2].map(v => -v); // Flip third column
      return this.multiply(V, this.transpose(U));
    }
    
    return R;
  }
  
  /**
   * Calculate residual error for validation
   */
  private calculateResidual(
    solution: AlignmentSolution, 
    equations: AlignmentEquation[]
  ): number {
    let totalError = 0;
    
    for (const eq of equations) {
      // Transform model point with solution
      const transformed = this.transformPoint(
        eq.modelWall.center, 
        solution
      );
      
      // Calculate distance to real point
      const error = this.distance(transformed, eq.realWall.center);
      
      // Weight by confidence
      totalError += error * eq.weight;
    }
    
    return totalError / equations.length;
  }
  
  // ... helper methods: svd, multiply, transpose, determinant, etc ...
}

interface AlignmentEquation {
  modelWall: VirtualWallData;
  realWall: RealWallData;
  weight: number;
}

interface AlignmentSolution {
  position: Vector3;
  rotation: Vector3; // Euler angles
  scale?: Vector3;
}

interface Matrix3x3 {
  // 3x3 matrix representation
  [row: number]: [number, number, number];
}
```

**Riesgos:**
- 🟡 **Medio:** Algoritmo Kabsch es complejo (usar librería si needed)
- 🟡 **Medio:** SVD puede ser numéricamente inestable
- 🟢 **Bajo:** API pública no cambia, solo se agrega método

**Mitigación:**
- Usar librería matemática robusta: `gl-matrix` o `mathjs`
- Test exhaustivo con casos edge (paredes perpendiculares, paralelas, etc.)
- Fallback a single-wall si multi-wall falla

---

#### 3. `modules/expo-arkit/ios/ExpoARKitView.swift`

**Cambios Necesarios:**

```swift
// ✅ AGREGAR: Plane highlight functionality
private var highlightedPlanes: Set<UUID> = []
private var greenMaterial: SCNMaterial = {
  let material = SCNMaterial()
  material.diffuse.contents = UIColor.systemGreen.withAlphaComponent(0.6)
  material.isDoubleSided = true
  return material
}()
private var grayMaterial: SCNMaterial = {
  let material = SCNMaterial()
  material.diffuse.contents = UIColor.systemGray.withAlphaComponent(0.3)
  material.isDoubleSided = true
  return material
}()

/**
 * Highlight a plane with specified color (green = matched, gray = default)
 */
func setPlaneHighlightColor(planeId: UUID, matched: Bool) {
  guard let planeNode = planeNodes[planeId] else {
    print("[ExpoARKitView] Plane not found: \(planeId)")
    return
  }
  
  // Skip if already in correct state
  let isHighlighted = highlightedPlanes.contains(planeId)
  if matched && isHighlighted { return }
  if !matched && !isHighlighted { return }
  
  // Update material
  if let geometry = planeNode.geometry {
    geometry.firstMaterial = matched ? greenMaterial : grayMaterial
  }
  
  // Update tracking set
  if matched {
    highlightedPlanes.insert(planeId)
    
    // Optional: Add glow effect for extra polish
    if let geometryNode = planeNode.childNode(withName: "geometry", recursively: false) {
      addGlowEffect(to: geometryNode)
    }
  } else {
    highlightedPlanes.remove(planeId)
  }
  
  print("[ExpoARKitView] Plane \(planeId) highlighted: \(matched)")
}

/**
 * Add subtle glow effect to matched planes (optional polish)
 */
private func addGlowEffect(to node: SCNNode) {
  // Remove existing glow
  node.filters?.removeAll { ($0 as? CIFilter)?.name == "CIBloom" }
  
  // Create bloom filter
  let bloom = CIFilter(name: "CIBloom")
  bloom?.setValue(0.5, forKey: kCIInputIntensityKey)
  bloom?.setValue(10.0, forKey: kCIInputRadiusKey)
  
  // Apply
  node.filters = [bloom].compactMap { $0 }
}

/**
 * Set model opacity (for floating model transparency)
 */
func setModelOpacity(modelId: String, opacity: Float) {
  guard let node = loadedModelNodes[modelId] else {
    print("[ExpoARKitView] Model not found: \(modelId)")
    return
  }
  
  // Apply opacity to all materials recursively
  node.enumerateChildNodes { childNode, _ in
    if let geometry = childNode.geometry {
      geometry.materials.forEach { material in
        material.transparency = CGFloat(opacity)
      }
    }
  }
  
  print("[ExpoARKitView] Model \(modelId) opacity set to \(opacity)")
}
```

**Riesgos:**
- 🟢 **Bajo:** Solo agrega métodos, no modifica existentes
- 🟢 **Bajo:** Glow effect es opcional (puede omitirse)

---

#### 4. `modules/expo-arkit/ios/ExpoARKitModule.swift`

**Cambios Necesarios:**

```swift
// ✅ AGREGAR: Bridge methods for plane highlighting
AsyncFunction("highlightPlane") { (viewTag: Int, planeId: String, matched: Bool) -> Void in
  DispatchQueue.main.async {
    guard let view = self.appContext?.reactBridge?.uiManager.view(forReactTag: NSNumber(value: viewTag)) as? ExpoARKitView else {
      print("[ExpoARKitModule] View not found for tag: \(viewTag)")
      return
    }
    
    guard let uuid = UUID(uuidString: planeId) else {
      print("[ExpoARKitModule] Invalid UUID: \(planeId)")
      return
    }
    
    view.setPlaneHighlightColor(planeId: uuid, matched: matched)
  }
}
.runOnQueue(.main)

AsyncFunction("setModelOpacity") { (viewTag: Int, modelId: String, opacity: Double) -> Void in
  DispatchQueue.main.async {
    guard let view = self.appContext?.reactBridge?.uiManager.view(forReactTag: NSNumber(value: viewTag)) as? ExpoARKitView else {
      print("[ExpoARKitModule] View not found for tag: \(viewTag)")
      return
    }
    
    view.setModelOpacity(modelId: modelId, opacity: Float(opacity))
  }
}
.runOnQueue(.main)
```

**Riesgos:**
- 🟢 **Bajo:** Pattern ya establecido en módulo
- 🟢 **Bajo:** Solo wrappers, lógica está en ExpoARKitView

---

### 🟢 Archivos Nuevos (Sin Conflicto)

#### 5. `src/services/wallMatchingService.ts` (NUEVO)

```typescript
/**
 * Wall Matching Service
 * Compares model walls with detected planes to find best matches
 */

import type { PlaneDetectedEvent } from '../../../modules/expo-arkit';
import type { VirtualWallData } from './wallAnchorService';

export interface WallMatch {
  detectedPlane: PlaneDetectedEvent;
  modelWall: VirtualWallData;
  confidence: number; // 0-1
  dimensionError: number; // meters
  angleError: number; // degrees
}

export class WallMatchingService {
  private readonly DIMENSION_TOLERANCE = 0.1; // ±10%
  private readonly ANGLE_TOLERANCE = 15; // ±15 degrees
  
  /**
   * Compare a model wall with a detected plane
   * Returns match if dimensions and orientation are compatible
   */
  compareWallWithPlane(
    wall: VirtualWallData,
    plane: PlaneDetectedEvent
  ): WallMatch | null {
    // 1. Filter: Only vertical planes (walls)
    if (plane.classification !== 'wall') {
      return null;
    }
    
    // 2. Compare dimensions (width x height)
    const wallWidth = wall.extent.width;
    const wallHeight = wall.extent.height;
    const planeWidth = plane.extent.x;
    const planeHeight = plane.extent.z; // ARKit: Y is vertical
    
    const widthError = Math.abs(wallWidth - planeWidth);
    const heightError = Math.abs(wallHeight - planeHeight);
    const dimensionError = (widthError + heightError) / 2;
    
    // Check tolerance
    const widthTolerance = wallWidth * this.DIMENSION_TOLERANCE;
    const heightTolerance = wallHeight * this.DIMENSION_TOLERANCE;
    
    if (widthError > widthTolerance || heightError > heightTolerance) {
      return null; // Dimensions don't match
    }
    
    // 3. Compare normal vectors (orientation)
    const angleError = this.calculateAngleBetweenVectors(
      wall.normal,
      plane.normal || { x: 0, y: 0, z: 1 }
    );
    
    if (angleError > this.ANGLE_TOLERANCE) {
      return null; // Wrong orientation
    }
    
    // 4. Calculate confidence score
    const confidence = this.calculateMatchConfidence({
      dimensionError,
      angleError,
      wallWidth,
      wallHeight
    });
    
    return {
      detectedPlane: plane,
      modelWall: wall,
      confidence,
      dimensionError,
      angleError
    };
  }
  
  /**
   * Find best matches between model walls and detected planes
   */
  findBestMatches(
    modelWalls: VirtualWallData[],
    detectedPlanes: PlaneDetectedEvent[]
  ): WallMatch[] {
    const matches: WallMatch[] = [];
    const usedPlanes = new Set<string>();
    
    // For each model wall, find best matching plane
    for (const wall of modelWalls) {
      let bestMatch: WallMatch | null = null;
      
      for (const plane of detectedPlanes) {
        // Skip if plane already matched
        if (usedPlanes.has(plane.id)) continue;
        
        const match = this.compareWallWithPlane(wall, plane);
        if (!match) continue;
        
        // Keep best match (highest confidence)
        if (!bestMatch || match.confidence > bestMatch.confidence) {
          bestMatch = match;
        }
      }
      
      if (bestMatch) {
        matches.push(bestMatch);
        usedPlanes.add(bestMatch.detectedPlane.id);
      }
    }
    
    // Sort by confidence (best first)
    return matches.sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * Calculate confidence score (0-1) based on errors
   */
  private calculateMatchConfidence(params: {
    dimensionError: number;
    angleError: number;
    wallWidth: number;
    wallHeight: number;
  }): number {
    const { dimensionError, angleError, wallWidth, wallHeight } = params;
    
    // Normalize errors
    const avgDimension = (wallWidth + wallHeight) / 2;
    const normalizedDimensionError = dimensionError / avgDimension;
    const normalizedAngleError = angleError / this.ANGLE_TOLERANCE;
    
    // Combined error (weighted average)
    const combinedError = (normalizedDimensionError * 0.6) + (normalizedAngleError * 0.4);
    
    // Confidence = 1 - error
    return Math.max(0, Math.min(1, 1 - combinedError));
  }
  
  /**
   * Calculate angle between two vectors in degrees
   */
  private calculateAngleBetweenVectors(v1: Vector3, v2: Vector3): number {
    // Dot product
    const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    
    // Magnitudes
    const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2 + v1.z ** 2);
    const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2 + v2.z ** 2);
    
    // Angle in radians
    const angleRad = Math.acos(dot / (mag1 * mag2));
    
    // Convert to degrees
    return (angleRad * 180) / Math.PI;
  }
}

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export const wallMatchingService = new WallMatchingService();
```

---

#### 6. `src/ui/components/ScanProgressPanel.tsx` (NUEVO)

```typescript
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ScanProgressPanelProps {
  matchedWalls: number;
  requiredWalls: number; // default: 3
  onAnchorPress: () => void;
  isCalculating?: boolean;
}

export const ScanProgressPanel: React.FC<ScanProgressPanelProps> = ({
  matchedWalls,
  requiredWalls,
  onAnchorPress,
  isCalculating = false
}) => {
  const isReady = matchedWalls >= requiredWalls && !isCalculating;
  const progress = Math.min(1, matchedWalls / requiredWalls);
  
  return (
    <View style={styles.container}>
      {/* Progress Text */}
      <Text style={styles.title}>
        {isCalculating ? 'Anclando modelo...' : 'Escaneo de Paredes'}
      </Text>
      
      <Text style={styles.counter}>
        {matchedWalls}/{requiredWalls} paredes detectadas
      </Text>
      
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>
      
      {/* Instructions */}
      {matchedWalls < requiredWalls && (
        <Text style={styles.instructions}>
          Mueve el dispositivo para escanear más paredes
        </Text>
      )}
      
      {/* Anchor Button */}
      <TouchableOpacity
        disabled={!isReady}
        onPress={onAnchorPress}
        style={[
          styles.button,
          isReady ? styles.buttonEnabled : styles.buttonDisabled
        ]}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.buttonText,
          isReady ? styles.buttonTextEnabled : styles.buttonTextDisabled
        ]}>
          {isCalculating 
            ? '⏳ Calculando...'
            : isReady 
              ? '✅ Anclar Modelo' 
              : '🔍 Escaneando...'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  counter: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00FF00',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00FF00',
    borderRadius: 4,
  },
  instructions: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonEnabled: {
    backgroundColor: '#00FF00',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonTextEnabled: {
    color: '#000000',
  },
  buttonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
```

---

## ⚠️ Conflictos Potenciales y Soluciones

### 1. TypeScript Types - ExpoARKitModule.ts

**Conflicto:** Necesitamos agregar nuevos métodos pero module está autogenerado parcialmente.

**Solución:**

```typescript
// modules/expo-arkit/src/ExpoARKitModule.ts

export interface ExpoARKitModule {
  // ... existing methods ...
  
  // NEW: Plane highlighting
  highlightPlane(viewTag: number, planeId: string, matched: boolean): Promise<void>;
  
  // NEW: Model opacity control
  setModelOpacity(viewTag: number, modelId: string, opacity: number): Promise<void>;
}
```

---

### 2. Plane Detection Throttling

**Conflicto:** `onPlaneDetected` puede disparar 10+ eventos/segundo, causando lag.

**Solución:** Debounce con lodash:

```typescript
import { debounce } from 'lodash';

const debouncedWallMatching = useMemo(
  () => debounce((planes: PlaneDetectedEvent[]) => {
    // Wall matching logic
  }, 500), // 500ms debounce
  [modelWalls]
);

// Cleanup on unmount
useEffect(() => {
  return () => {
    debouncedWallMatching.cancel();
  };
}, []);
```

---

### 3. Multi-Wall Math Complexity

**Conflicto:** Kabsch algorithm + SVD son complejos de implementar desde cero.

**Solución:** Usar librería matemática robusta:

```bash
npm install gl-matrix
```

```typescript
import { mat3, vec3 } from 'gl-matrix';

// Use gl-matrix for matrix operations
private kabschRotation(modelPoints: vec3[], realPoints: vec3[], weights: number[]): mat3 {
  // Implementation using gl-matrix
}
```

---

### 4. Floating Model Transparency

**Conflicto:** Modelo flotante necesita opacity 0.7, pero cuando se ancla debe volver a 1.0.

**Solución:** Método `setModelOpacity` en Swift + Bridge.

```swift
// ExpoARKitView.swift
func setModelOpacity(modelId: String, opacity: Float) {
  guard let node = loadedModelNodes[modelId] else { return }
  
  node.enumerateChildNodes { childNode, _ in
    if let geometry = childNode.geometry {
      geometry.materials.forEach { $0.transparency = CGFloat(opacity) }
    }
  }
}
```

---

## 📊 Matriz de Riesgo

| Archivo | Líneas Est. | Complejidad | Riesgo | Mitigación |
|---------|-------------|-------------|--------|------------|
| AlignmentViewScreen.tsx | ~400 | 🔴 Alta | 🟡 Medio | Branch backup + test exhaustivo |
| wallAnchorService.ts | ~200 | 🟡 Media | 🟡 Medio | Usar gl-matrix para math |
| wallMatchingService.ts | ~200 | 🟡 Media | 🟢 Bajo | Algoritmo simple, bien definido |
| ScanProgressPanel.tsx | ~150 | 🟢 Baja | 🟢 Bajo | UI pura, no lógica compleja |
| ExpoARKitView.swift | ~100 | 🟡 Media | 🟢 Bajo | Solo agrega métodos, no modifica |
| ExpoARKitModule.swift | ~50 | 🟢 Baja | 🟢 Bajo | Wrappers simples |

---

## ✅ Checklist Pre-Implementación

- [ ] Crear branch backup: `git checkout -b backup-alignment-v1`
- [ ] Commit estado actual: `git commit -am "Pre-migration: AlignmentView v1"`
- [ ] Instalar dependencias:
  - [ ] `npm install lodash @types/lodash`
  - [ ] `npm install gl-matrix @types/gl-matrix`
- [ ] Review documentación completa
- [ ] Confirmar que device con LiDAR está disponible
- [ ] Verificar que RoomPlan scans previos funcionan
- [ ] Test build actual sin cambios: `npx expo run:ios --device`

---

**Última actualización:** 2025-12-17  
**Próxima acción:** Implementar Fase 1 - Floating Model
