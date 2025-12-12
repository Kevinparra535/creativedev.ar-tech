# Fase 2: Model Alignment System

**Fecha:** 2025-12-12
**Duración Estimada:** 2-3 semanas
**Estado:** En Planificación
**Prioridad:** CRÍTICA

---

## Objetivo

Implementar un sistema completo de alineación que permita:

1. **Auto-scaling** de modelos basado en sus dimensiones reales
2. **Alineación automática** del modelo del arquitecto con el room scan
3. **Controles manuales** para ajuste fino (position, rotation, scale)
4. **Persistencia** de transformaciones entre sesiones

---

## Componentes a Implementar

### 1. Bounding Box Extraction (Swift) - 3-4 días

**Ubicación:** `modules/expo-arkit/ios/ExpoARKitView.swift`

**Funcionalidad:**
- Extraer bounding box de cualquier modelo USDZ cargado
- Calcular dimensiones reales en metros (width, height, depth)
- Calcular centro geométrico del modelo
- Exponer esta información a React Native

**Métodos Swift a agregar:**

```swift
// MARK: - Bounding Box Utilities

/// Extract bounding box dimensions from a SceneKit node
private func getBoundingBox(for node: SCNNode) -> (min: SCNVector3, max: SCNVector3, center: SCNVector3, size: SCNVector3) {
    let (min, max) = node.boundingBox

    // Calculate actual world-space bounds considering the node's transform
    let worldMin = node.convertPosition(min, to: nil)
    let worldMax = node.convertPosition(max, to: nil)

    // Calculate size
    let width = abs(worldMax.x - worldMin.x)
    let height = abs(worldMax.y - worldMin.y)
    let depth = abs(worldMax.z - worldMin.z)
    let size = SCNVector3(width, height, depth)

    // Calculate center
    let centerX = (worldMin.x + worldMax.x) / 2
    let centerY = (worldMin.y + worldMax.y) / 2
    let centerZ = (worldMin.z + worldMax.z) / 2
    let center = SCNVector3(centerX, centerY, centerZ)

    return (worldMin, worldMax, center, size)
}

/// Get model dimensions and emit to React Native
func getModelDimensions(for nodeId: String) -> [String: Any] {
    guard let node = anchoredNodes.first(where: { $0.key.uuidString == nodeId })?.value else {
        return ["error": "Model not found"]
    }

    let bbox = getBoundingBox(for: node)

    return [
        "width": bbox.size.x,
        "height": bbox.size.y,
        "depth": bbox.size.z,
        "center": [
            "x": bbox.center.x,
            "y": bbox.center.y,
            "z": bbox.center.z
        ],
        "volume": bbox.size.x * bbox.size.y * bbox.size.z
    ]
}
```

**Nuevo método en ExpoARKitModule.swift:**

```swift
// Get dimensions of a loaded model
AsyncFunction("getModelDimensions") { (viewTag: Int, modelId: String) -> [String: Any] in
  var result: [String: Any] = [:]

  DispatchQueue.main.sync { [weak self] in
    guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ExpoARKitView.self) else {
      result = ["error": "Could not find ARKit view"]
      return
    }
    result = view.getModelDimensions(for: modelId)
  }

  return result
}
```

---

### 2. Dimension Matching Service (TypeScript) - 2-3 días

**Ubicación:** `src/services/modelAlignment.ts` (nuevo archivo)

**Funcionalidad:**
- Comparar dimensiones de dos modelos (room scan vs modelo arquitecto)
- Calcular factor de escala óptimo
- Validar que las proporciones sean compatibles
- Sugerir ajustes de alineación

**Implementación:**

```typescript
export interface ModelDimensions {
  width: number;
  height: number;
  depth: number;
  center: { x: number; y: number; z: number };
  volume: number;
}

export interface AlignmentConfig {
  scale: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  confidence: number; // 0-1, how confident we are in the alignment
}

/**
 * Calculate optimal scale factor to match target dimensions
 */
export function calculateOptimalScale(
  sourceDimensions: ModelDimensions,
  targetDimensions: ModelDimensions
): number {
  // Calculate scale factor for each dimension
  const scaleX = targetDimensions.width / sourceDimensions.width;
  const scaleY = targetDimensions.height / sourceDimensions.height;
  const scaleZ = targetDimensions.depth / sourceDimensions.depth;

  // Use average scale (could also use median or weighted average)
  const averageScale = (scaleX + scaleY + scaleZ) / 3;

  console.log('[Alignment] Scale factors:', {
    scaleX: scaleX.toFixed(3),
    scaleY: scaleY.toFixed(3),
    scaleZ: scaleZ.toFixed(3),
    average: averageScale.toFixed(3)
  });

  return averageScale;
}

/**
 * Check if two models have compatible proportions
 * Returns confidence score (0-1)
 */
export function checkProportionCompatibility(
  sourceDimensions: ModelDimensions,
  targetDimensions: ModelDimensions
): number {
  // Calculate aspect ratios
  const sourceRatioXY = sourceDimensions.width / sourceDimensions.height;
  const sourceRatioXZ = sourceDimensions.width / sourceDimensions.depth;
  const targetRatioXY = targetDimensions.width / targetDimensions.height;
  const targetRatioXZ = targetDimensions.width / targetDimensions.depth;

  // Calculate similarity (1.0 = perfect match, 0.0 = no match)
  const similarityXY = 1 - Math.min(Math.abs(sourceRatioXY - targetRatioXY) / targetRatioXY, 1);
  const similarityXZ = 1 - Math.min(Math.abs(sourceRatioXZ - targetRatioXZ) / targetRatioXZ, 1);

  // Average similarity
  const confidence = (similarityXY + similarityXZ) / 2;

  console.log('[Alignment] Proportion compatibility:', {
    sourceRatios: { xy: sourceRatioXY.toFixed(2), xz: sourceRatioXZ.toFixed(2) },
    targetRatios: { xy: targetRatioXY.toFixed(2), xz: targetRatioXZ.toFixed(2) },
    confidence: (confidence * 100).toFixed(1) + '%'
  });

  return confidence;
}

/**
 * Calculate automatic alignment configuration
 */
export function calculateAutoAlignment(
  sourceModel: ModelDimensions,
  targetModel: ModelDimensions
): AlignmentConfig {
  // Calculate optimal scale
  const scale = calculateOptimalScale(sourceModel, targetModel);

  // Calculate position offset to align centers
  const position = {
    x: targetModel.center.x - sourceModel.center.x * scale,
    y: targetModel.center.y - sourceModel.center.y * scale,
    z: targetModel.center.z - sourceModel.center.z * scale
  };

  // For now, no rotation (could be enhanced with orientation detection)
  const rotation = { x: 0, y: 0, z: 0 };

  // Calculate confidence based on proportion compatibility
  const confidence = checkProportionCompatibility(sourceModel, targetModel);

  console.log('[Alignment] Auto-alignment calculated:', {
    scale: scale.toFixed(3),
    position,
    confidence: (confidence * 100).toFixed(1) + '%'
  });

  return {
    scale,
    position,
    rotation,
    confidence
  };
}

/**
 * Validate that models are at real-world scale (in meters)
 */
export function validateRealWorldScale(dimensions: ModelDimensions): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let valid = true;

  // Reasonable room dimensions: 1m to 20m per side
  const MIN_ROOM_SIZE = 1.0;
  const MAX_ROOM_SIZE = 20.0;

  if (dimensions.width < MIN_ROOM_SIZE || dimensions.width > MAX_ROOM_SIZE) {
    warnings.push(`Width ${dimensions.width.toFixed(2)}m seems unusual for a room`);
    valid = false;
  }

  if (dimensions.height < MIN_ROOM_SIZE || dimensions.height > MAX_ROOM_SIZE) {
    warnings.push(`Height ${dimensions.height.toFixed(2)}m seems unusual for a room`);
    valid = false;
  }

  if (dimensions.depth < MIN_ROOM_SIZE || dimensions.depth > MAX_ROOM_SIZE) {
    warnings.push(`Depth ${dimensions.depth.toFixed(2)}m seems unusual for a room`);
    valid = false;
  }

  // Typical ceiling height: 2.4m to 4.0m
  if (dimensions.height < 2.0 || dimensions.height > 5.0) {
    warnings.push(`Height ${dimensions.height.toFixed(2)}m is unusual for ceiling height`);
  }

  return { valid, warnings };
}
```

---

### 3. Manual Adjustment Controls UI (React Native) - 4-5 días

**Ubicación:** `src/ui/components/AlignmentControls.tsx` (nuevo archivo)

**Funcionalidad:**
- Sliders para Position (X, Y, Z)
- Slider para Rotation Y (principalmente horizontal)
- Slider para Scale uniforme
- Botón "Reset to Auto"
- Vista previa en tiempo real

**Implementación:**

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

export interface TransformConfig {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
}

interface AlignmentControlsProps {
  initialTransform: TransformConfig;
  onTransformChange: (transform: TransformConfig) => void;
  onReset: () => void;
}

export const AlignmentControls: React.FC<AlignmentControlsProps> = ({
  initialTransform,
  onTransformChange,
  onReset
}) => {
  const [transform, setTransform] = useState<TransformConfig>(initialTransform);

  const updatePosition = (axis: 'x' | 'y' | 'z', value: number) => {
    const newTransform = {
      ...transform,
      position: { ...transform.position, [axis]: value }
    };
    setTransform(newTransform);
    onTransformChange(newTransform);
  };

  const updateRotation = (value: number) => {
    const newTransform = {
      ...transform,
      rotation: { ...transform.rotation, y: value }
    };
    setTransform(newTransform);
    onTransformChange(newTransform);
  };

  const updateScale = (value: number) => {
    const newTransform = { ...transform, scale: value };
    setTransform(newTransform);
    onTransformChange(newTransform);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Model Alignment</Text>

      {/* Position Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Position</Text>

        <View style={styles.controlRow}>
          <Text style={styles.label}>X: {transform.position.x.toFixed(2)}m</Text>
          <Slider
            style={styles.slider}
            minimumValue={-5}
            maximumValue={5}
            value={transform.position.x}
            onValueChange={(value) => updatePosition('x', value)}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#E0E0E0"
          />
        </View>

        <View style={styles.controlRow}>
          <Text style={styles.label}>Y: {transform.position.y.toFixed(2)}m</Text>
          <Slider
            style={styles.slider}
            minimumValue={-5}
            maximumValue={5}
            value={transform.position.y}
            onValueChange={(value) => updatePosition('y', value)}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#E0E0E0"
          />
        </View>

        <View style={styles.controlRow}>
          <Text style={styles.label}>Z: {transform.position.z.toFixed(2)}m</Text>
          <Slider
            style={styles.slider}
            minimumValue={-5}
            maximumValue={5}
            value={transform.position.z}
            onValueChange={(value) => updatePosition('z', value)}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#E0E0E0"
          />
        </View>
      </View>

      {/* Rotation Control */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rotation</Text>

        <View style={styles.controlRow}>
          <Text style={styles.label}>Y: {(transform.rotation.y * 180 / Math.PI).toFixed(0)}°</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={Math.PI * 2}
            value={transform.rotation.y}
            onValueChange={updateRotation}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#E0E0E0"
          />
        </View>
      </View>

      {/* Scale Control */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scale</Text>

        <View style={styles.controlRow}>
          <Text style={styles.label}>{(transform.scale * 100).toFixed(0)}%</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.1}
            maximumValue={3.0}
            value={transform.scale}
            onValueChange={updateScale}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#E0E0E0"
          />
        </View>
      </View>

      {/* Reset Button */}
      <TouchableOpacity style={styles.resetButton} onPress={onReset}>
        <Text style={styles.resetButtonText}>Reset to Auto</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 16,
    margin: 16
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center'
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    opacity: 0.8
  },
  controlRow: {
    marginBottom: 12
  },
  label: {
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'monospace'
  },
  slider: {
    width: '100%',
    height: 40
  },
  resetButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  }
});
```

---

### 4. Transform Application (Swift) - 2-3 días

**Ubicación:** `modules/expo-arkit/ios/ExpoARKitView.swift`

**Funcionalidad:**
- Aplicar transformaciones a modelos en tiempo real
- Mantener física y collision detection
- Smooth transitions para cambios de transformación

**Métodos a agregar:**

```swift
// MARK: - Model Transformation

/// Apply transformation to a model node
func applyTransform(
    to nodeId: String,
    position: [Double],
    rotation: [Double],
    scale: Double
) {
    guard let node = anchoredNodes.first(where: { $0.key.uuidString == nodeId })?.value else {
        print("Error: Model node not found for ID \(nodeId)")
        return
    }

    // Apply transformation with animation
    SCNTransaction.begin()
    SCNTransaction.animationDuration = 0.3

    // Position
    if position.count == 3 {
        node.position = SCNVector3(
            x: Float(position[0]),
            y: Float(position[1]),
            z: Float(position[2])
        )
    }

    // Rotation (Euler angles in radians)
    if rotation.count == 3 {
        node.eulerAngles = SCNVector3(
            x: Float(rotation[0]),
            y: Float(rotation[1]),
            z: Float(rotation[2])
        )
    }

    // Scale (uniform)
    let scaleValue = Float(scale)
    node.scale = SCNVector3(scaleValue, scaleValue, scaleValue)

    SCNTransaction.commit()

    print("✅ Applied transform to model \(nodeId)")
}
```

**Nuevo método en ExpoARKitModule.swift:**

```swift
AsyncFunction("applyModelTransform") { (
  viewTag: Int,
  modelId: String,
  position: [Double],
  rotation: [Double],
  scale: Double
) -> Void in
  DispatchQueue.main.async { [weak self] in
    guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ExpoARKitView.self) else {
      print("Error: Could not find ARKit view")
      return
    }
    view.applyTransform(to: modelId, position: position, rotation: rotation, scale: scale)
  }
}
```

---

### 5. Persistence System - 2-3 días

**Ubicación:** `src/storage/alignmentStorage.ts` (nuevo archivo)

**Funcionalidad:**
- Guardar configuraciones de alineación en AsyncStorage
- Asociar configuraciones con proyectos/modelos específicos
- Cargar configuraciones guardadas al iniciar

**Implementación:**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedAlignment {
  id: string;
  sourceModelPath: string;
  targetModelPath: string;
  transform: TransformConfig;
  timestamp: number;
  name?: string;
}

const STORAGE_KEY_PREFIX = '@alignment_config_';

/**
 * Save alignment configuration
 */
export async function saveAlignmentConfig(
  sourceModelPath: string,
  targetModelPath: string,
  transform: TransformConfig,
  name?: string
): Promise<string> {
  const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const alignment: SavedAlignment = {
    id,
    sourceModelPath,
    targetModelPath,
    transform,
    timestamp: Date.now(),
    name
  };

  try {
    const key = `${STORAGE_KEY_PREFIX}${id}`;
    await AsyncStorage.setItem(key, JSON.stringify(alignment));
    console.log('[Storage] Saved alignment config:', id);
    return id;
  } catch (error) {
    console.error('[Storage] Failed to save alignment:', error);
    throw error;
  }
}

/**
 * Load alignment configuration by ID
 */
export async function loadAlignmentConfig(id: string): Promise<SavedAlignment | null> {
  try {
    const key = `${STORAGE_KEY_PREFIX}${id}`;
    const data = await AsyncStorage.getItem(key);

    if (!data) {
      console.log('[Storage] No alignment config found for ID:', id);
      return null;
    }

    const alignment: SavedAlignment = JSON.parse(data);
    console.log('[Storage] Loaded alignment config:', id);
    return alignment;
  } catch (error) {
    console.error('[Storage] Failed to load alignment:', error);
    return null;
  }
}

/**
 * List all saved alignment configurations
 */
export async function listAlignmentConfigs(): Promise<SavedAlignment[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const alignmentKeys = keys.filter(key => key.startsWith(STORAGE_KEY_PREFIX));

    const configs = await Promise.all(
      alignmentKeys.map(async (key) => {
        const data = await AsyncStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      })
    );

    const validConfigs = configs.filter(Boolean) as SavedAlignment[];

    // Sort by timestamp (newest first)
    validConfigs.sort((a, b) => b.timestamp - a.timestamp);

    console.log('[Storage] Found', validConfigs.length, 'alignment configs');
    return validConfigs;
  } catch (error) {
    console.error('[Storage] Failed to list alignments:', error);
    return [];
  }
}

/**
 * Delete alignment configuration
 */
export async function deleteAlignmentConfig(id: string): Promise<void> {
  try {
    const key = `${STORAGE_KEY_PREFIX}${id}`;
    await AsyncStorage.removeItem(key);
    console.log('[Storage] Deleted alignment config:', id);
  } catch (error) {
    console.error('[Storage] Failed to delete alignment:', error);
    throw error;
  }
}

/**
 * Find alignment config for specific model pair
 */
export async function findAlignmentForModels(
  sourceModelPath: string,
  targetModelPath: string
): Promise<SavedAlignment | null> {
  const configs = await listAlignmentConfigs();

  const match = configs.find(
    config =>
      config.sourceModelPath === sourceModelPath &&
      config.targetModelPath === targetModelPath
  );

  return match || null;
}
```

---

### 6. Integration with ARTestScreen - 3-4 días

**Cambios en:** `src/ui/screens/ARTestScreen.tsx`

**Nuevas funcionalidades:**
- Modo "Alignment" que se activa al cargar dos modelos
- Toggle entre modelo del arquitecto y room scan
- Overlay semi-transparente para comparación
- Guardar/cargar configuraciones

**Fragmento de código a agregar:**

```typescript
const [alignmentMode, setAlignmentMode] = useState(false);
const [sourceModelId, setSourceModelId] = useState<string | null>(null);
const [targetModelId, setTargetModelId] = useState<string | null>(null);
const [currentTransform, setCurrentTransform] = useState<TransformConfig>({
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: 1.0
});

const handleLoadArchitectModel = async () => {
  // Load architect's model
  const result = await DocumentPicker.getDocumentAsync({
    type: 'public.usd',
    copyToCacheDirectory: true
  });

  if (result.type === 'success') {
    // Load in Camera Mode to get dimensions
    arViewRef.current?.loadModel(result.uri, 1.0, [0, 0, -2]);
    setSourceModelId(generateModelId());

    // If we already have a room scan, enable alignment mode
    if (targetModelId) {
      await initiateAutoAlignment(result.uri);
    }
  }
};

const initiateAutoAlignment = async (architectModelPath: string) => {
  // Get dimensions of both models
  const sourceDims = await arViewRef.current?.getModelDimensions(sourceModelId!);
  const targetDims = await arViewRef.current?.getModelDimensions(targetModelId!);

  if (sourceDims && targetDims) {
    // Calculate auto-alignment
    const alignment = calculateAutoAlignment(sourceDims, targetDims);

    // Apply transformation
    setCurrentTransform({
      position: alignment.position,
      rotation: alignment.rotation,
      scale: alignment.scale
    });

    await arViewRef.current?.applyModelTransform(
      sourceModelId!,
      Object.values(alignment.position),
      Object.values(alignment.rotation),
      alignment.scale
    );

    // Show confidence
    Alert.alert(
      'Auto-Alignment Complete',
      `Confidence: ${(alignment.confidence * 100).toFixed(0)}%\n\n` +
      `You can now use manual controls to fine-tune the alignment.`,
      [{ text: 'OK', onPress: () => setAlignmentMode(true) }]
    );
  }
};
```

---

## Timeline Detallado

### Semana 1: Foundation (días 1-5)

**Días 1-2: Bounding Box Extraction**
- [ ] Implementar `getBoundingBox()` en Swift
- [ ] Agregar método `getModelDimensions()` en ExpoARKitView
- [ ] Exponer vía ExpoARKitModule
- [ ] Testing con modelos de prueba

**Días 3-4: Dimension Matching Service**
- [ ] Crear `src/services/modelAlignment.ts`
- [ ] Implementar algoritmos de cálculo de escala
- [ ] Implementar validación de proporciones
- [ ] Testing con casos de prueba

**Día 5: Integration Testing**
- [ ] Cargar dos modelos y obtener dimensiones
- [ ] Calcular auto-alignment
- [ ] Logging y debugging

---

### Semana 2: UI & Transformations (días 6-10)

**Días 6-7: Manual Controls UI**
- [ ] Crear componente `AlignmentControls.tsx`
- [ ] Implementar sliders de position/rotation/scale
- [ ] Styling y UX polish
- [ ] Instalar `@react-native-community/slider`

**Días 8-9: Transform Application**
- [ ] Implementar `applyTransform()` en Swift
- [ ] Smooth animations con SCNTransaction
- [ ] Conectar UI con Swift bridge
- [ ] Real-time preview

**Día 10: Integration Testing**
- [ ] Testing de controles manuales
- [ ] Performance testing
- [ ] Bug fixes

---

### Semana 3: Persistence & Polish (días 11-15)

**Días 11-12: Persistence System**
- [ ] Crear `src/storage/alignmentStorage.ts`
- [ ] Implementar save/load de configuraciones
- [ ] UI para guardar/cargar configuraciones
- [ ] Testing de persistencia

**Días 13-14: ARTestScreen Integration**
- [ ] Agregar modo "Alignment" a ARTestScreen
- [ ] Toggle entre modelos
- [ ] Overlay semi-transparente
- [ ] Save/load UI

**Día 15: Final Testing & Documentation**
- [ ] Testing end-to-end completo
- [ ] Casos edge (modelos incompatibles, etc.)
- [ ] Actualizar documentación
- [ ] Video demo

---

## Dependencias Nuevas

```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^1.21.0",
    "@react-native-community/slider": "^4.5.0"
  }
}
```

---

## Testing Strategy

### Unit Tests

1. **modelAlignment.ts:**
   - Test `calculateOptimalScale()` con diferentes dimensiones
   - Test `checkProportionCompatibility()` con casos válidos/inválidos
   - Test `validateRealWorldScale()` con dimensiones edge case

2. **alignmentStorage.ts:**
   - Test save/load cycle
   - Test list y filter
   - Test delete

### Integration Tests

1. **Swift ↔ React Native:**
   - Verificar que `getModelDimensions()` retorna valores correctos
   - Verificar que `applyModelTransform()` actualiza el modelo visualmente
   - Verificar eventos se emiten correctamente

2. **End-to-End:**
   - Cargar room scan
   - Cargar modelo arquitecto
   - Auto-alignment se calcula correctamente
   - Ajustes manuales funcionan
   - Save/load de configuración funciona

---

## Métricas de Éxito

### Funcionales

- ✅ Auto-scaling calcula factor de escala con < 10% error
- ✅ Alineación automática tiene > 70% confidence para modelos compatibles
- ✅ Controles manuales responden en < 100ms
- ✅ Persistencia guarda/carga en < 500ms

### UX

- ✅ Usuario puede alinear modelos en < 2 minutos
- ✅ Sliders son precisos y responsivos
- ✅ Preview en tiempo real sin lag
- ✅ Configuraciones guardadas se restauran correctamente

---

## Riesgos y Mitigaciones

### Riesgo 1: Bounding Box Incorrectos

**Problema:** SceneKit bounding box puede no reflejar geometría real

**Mitigación:**
- Usar `boundingBox` en world space (con transformaciones aplicadas)
- Considerar hierarchía de nodos (buscar recursivamente)
- Testing con múltiples formatos de USDZ

### Riesgo 2: Modelos Incompatibles

**Problema:** Modelo arquitecto y room scan tienen dimensiones muy diferentes

**Mitigación:**
- Mostrar warning si `confidence < 0.5`
- Permitir override manual con confirmación
- Proveer hints visuales de incompatibilidad

### Riesgo 3: Performance con Transformaciones

**Problema:** Aplicar transformaciones en tiempo real puede causar lag

**Mitigación:**
- Usar debouncing en sliders (actualizar cada 100ms)
- SCNTransaction con animaciones smooth
- Testing en dispositivo real (no simulator)

### Riesgo 4: Persistencia Compleja

**Problema:** Asociar configuraciones con modelos puede ser ambiguo

**Mitigación:**
- Usar hash de file paths como key
- Permitir nombres custom para configuraciones
- UI clara para seleccionar configuración correcta

---

## Próximos Pasos Inmediatos

### Esta Semana

1. **Instalar dependencias:**
   ```bash
   npm install @react-native-async-storage/async-storage @react-native-community/slider
   cd ios && pod install
   ```

2. **Crear estructura de archivos:**
   - `src/services/modelAlignment.ts`
   - `src/storage/alignmentStorage.ts`
   - `src/ui/components/AlignmentControls.tsx`

3. **Implementar Bounding Box Extraction en Swift:**
   - Agregar métodos en `ExpoARKitView.swift`
   - Exponer en `ExpoARKitModule.swift`
   - Testing básico

### Preguntas para Decisión

1. **¿Quieres comenzar con auto-alignment primero, o prefieres empezar con controles manuales?**
   - Auto-alignment es más complejo pero más impresionante
   - Controles manuales son más simples y garantizan funcionalidad básica

2. **¿Nivel de precisión necesario para auto-alignment?**
   - Alta precisión (< 5% error) requiere más tiempo
   - Precisión moderada (< 15% error) + ajuste manual es más práctico

3. **¿Persistencia es crítica desde el inicio?**
   - Sí: Implementar en paralelo con transformaciones
   - No: Dejar para última semana

---

**Última actualización:** 2025-12-12
**Autor:** Claude Code Assistant
**Estado:** Listo para iniciar implementación
