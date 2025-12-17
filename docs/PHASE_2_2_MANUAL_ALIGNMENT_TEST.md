# Phase 2.2: Manual Alignment Testing Guide

**Fecha:** 2025-12-17
**Estado:** Implementation Complete - Ready for Device Testing
**Screen:** `ManualAlignmentScreen.tsx`

---

## 🎯 Objetivo

Permitir ajuste manual fino de modelos 3D mediante sliders en tiempo real:
- **Position:** X/Y/Z (-5m a +5m)
- **Rotation:** X/Y/Z (-180° a +180°)
- **Scale:** 0.1x a 10x

---

## 📋 Componentes Implementados

### 1. Hook: `useManualAdjustment.ts`

**Funcionalidad:**
- Gestión de estado de transformaciones (position, rotation, scale)
- Aplicación de transformaciones via `ExpoARKitModule.updateModelTransform()`
- Presets: center, rotate90, scaleUp/Down
- Error handling y estado de operaciones

**API:**
```typescript
const {
  state,              // Current transformation state
  isApplying,         // Boolean loading state
  lastResult,         // Last operation result
  error,              // Error message if any
  setModel,           // Set modelId and viewTag
  updatePosition,     // Update position X/Y/Z
  updateRotation,     // Update rotation X/Y/Z
  updateScale,        // Update uniform scale
  applyTransformation,// Apply to ARKit model
  reset,              // Reset to defaults
  loadTransformation, // Load from existing config
  presets             // Quick transformations
} = useManualAdjustment();
```

### 2. Component: `AlignmentControls.tsx`

**UI:**
- Sliders para Position X/Y/Z (metros)
- Sliders para Rotation X/Y/Z (grados)
- Slider para Scale uniforme (0.1x - 10x)
- Valores en tiempo real con 2 decimales
- Labels descriptivos (X, Y, Z + Pitch/Yaw/Roll)

### 3. Screen: `ManualAlignmentScreen.tsx`

**Layout:**
- **Top 40%:** ARKitView con modelo en AR
- **Bottom 60%:** ScrollView con controles

**Features:**
- Load Model button (DocumentPicker)
- Apply button (aplica transformación)
- Reset button (vuelve a defaults)
- Preset buttons: Center, Rotate ±90°, Scale x2/÷2
- Status cards (success/error feedback)
- Loading indicators

---

## 🚀 Workflow de Testing (3 Pasos)

### Paso 1: Cargar Modelo

1. Abrir app → Home → **"🎚️ Manual Alignment (Phase 2.2)"**
2. Click **"Load Model"**
3. Seleccionar archivo USDZ
4. Modelo aparece flotando frente a cámara
5. Tap en AR para colocar modelo

**Logs esperados:**
```
[ManualAlignmentScreen] Loading model: file://...
[ExpoARKitModule] loadModel called
[ManualAlignmentScreen] Model placed: <modelId>
```

---

### Paso 2: Ajustar con Sliders

1. **Position Sliders:**
   - X: Mover izquierda/derecha
   - Y: Mover arriba/abajo
   - Z: Mover adelante/atrás

2. **Rotation Sliders:**
   - X (Pitch): Inclinar adelante/atrás
   - Y (Yaw): Rotar horizontalmente
   - Z (Roll): Inclinar lateral

3. **Scale Slider:**
   - Ajustar tamaño uniforme

4. Observar valores en tiempo real (azul)

**Nota:** Los sliders actualizan el state pero NO aplican a ARKit hasta hacer "Apply"

---

### Paso 3: Aplicar Transformación

1. Click **"Apply"**
2. Sistema aplica transformación via `updateModelTransform()`
3. Modelo se transforma en AR inmediatamente
4. Card verde muestra: "✅ Success - Transformation applied successfully"

**Logs esperados:**
```
[useManualAdjustment] Applying transformation
[ExpoARKitModule] updateModelTransform called
[useManualAdjustment] Transformation applied
```

---

## 🎮 Preset Transformations

**Quick buttons para transformaciones comunes:**

| Preset | Acción | Descripción |
|--------|--------|-------------|
| 📍 Center | `presets.center()` | Position a [0, 0, 0] |
| ↻ 90° | `presets.rotate90()` | Rotar 90° horario en Y |
| ↺ -90° | `presets.rotate90CCW()` | Rotar 90° anti-horario en Y |
| 🔍+ x2 | `presets.scaleUp()` | Duplicar escala (max 10x) |
| 🔍- ÷2 | `presets.scaleDown()` | Dividir escala entre 2 (min 0.1x) |

**Uso:**
1. Click preset button
2. State se actualiza automáticamente
3. Click "Apply" para ver cambios en AR

---

## ✅ Criterios de Éxito

### Funcional
- [ ] Modelo carga sin errores
- [ ] ARKitView se inicializa correctamente
- [ ] Sliders responden al tocar/arrastrar
- [ ] Valores se actualizan en tiempo real
- [ ] Apply button ejecuta transformación
- [ ] Modelo se transforma visualmente en AR
- [ ] Reset button vuelve a defaults
- [ ] Presets funcionan correctamente

### UX
- [ ] Sliders son responsivos (no lag)
- [ ] Valores legibles (2 decimales)
- [ ] Apply no bloquea UI (loading spinner)
- [ ] Success/error feedback claro
- [ ] No crashes durante operación
- [ ] Múltiples apply funcionan

### Performance
- [ ] Load model < 3s
- [ ] Apply transformation < 500ms
- [ ] Slider response < 16ms (60fps)

---

## 🐛 Troubleshooting

### Error: "No model ID set"
**Causa:** Apply sin cargar modelo primero
**Solución:** Load Model → Tap to place → luego Apply

### Error: "No view tag set"
**Causa:** ARKitView no inicializado
**Solución:** Esperar a que AR se inicialice (1-2s)

### Sliders no responden
**Causa:** Model no cargado (disabled=true)
**Solución:** Cargar modelo primero

### Apply no hace nada visualmente
**Causa:** modelId incorrecto o no colocado
**Solución:** Verificar que modelo esté colocado en AR (tap después de load)

### Scale out of range warning
**Causa:** Valores clampeados a 0.1-10.0
**Solución:** Normal, limits previenen valores inválidos

---

## 🔄 Integración con Phase 2.1

**Posible workflow combinado:**

1. **Phase 2.1 (Auto-Alignment):**
   - Cargar design model + room scan
   - Calculate alignment automático
   - Obtener confidence score

2. **Phase 2.2 (Manual Adjustment):**
   - Si confidence < 70%, usar manual adjustment
   - Cargar transformation de auto-alignment con `loadTransformation()`
   - Fine-tune con sliders
   - Apply final transformation

**Código de ejemplo:**
```typescript
// En AutoAlignmentTestScreen, después de calculate:
const alignmentResult = await alignModels(...);

if (alignmentResult.confidence < 0.7) {
  // Navigate to ManualAlignment con config inicial
  navigation.navigate('ManualAlignment', {
    initialTransform: {
      position: alignmentResult.position,
      rotation: alignmentResult.rotation,
      scale: alignmentResult.scale
    }
  });
}
```

---

## 📊 Testing Checklist

```
[ ] Build compila sin errores
[ ] App se instala en device
[ ] Navegación a ManualAlignment funciona
[ ] ARKitView se inicializa
[ ] Load Model button funciona
[ ] File picker se abre
[ ] Modelo carga y aparece en AR
[ ] Tap to place funciona
[ ] Sliders Position X/Y/Z responden
[ ] Sliders Rotation X/Y/Z responden
[ ] Slider Scale responde
[ ] Valores se actualizan en UI
[ ] Apply button ejecuta sin crash
[ ] Transformación se aplica visualmente
[ ] Reset button vuelve a defaults
[ ] Preset Center funciona
[ ] Preset Rotate 90° funciona
[ ] Preset Rotate -90° funciona
[ ] Preset Scale Up funciona
[ ] Preset Scale Down funciona
[ ] Success card aparece después de Apply
[ ] Error handling funciona (sin modelId)
[ ] Múltiples Apply consecutivos funcionan
[ ] No memory leaks después de 10+ applies
```

---

## 📝 Notas de Testing

**Formato para reportar resultados:**

```
Date: 2025-12-17
Device: iPhone 14 Pro Max
iOS: 16.4
Model: chair.usdz (0.6m x 0.8m x 0.6m)

Results:
- Load Model: ✅ Success (1.8s)
- Tap to Place: ✅ Success
- Position Sliders: ✅ Responsive, smooth
- Rotation Sliders: ✅ Responsive, smooth
- Scale Slider: ✅ Responsive, smooth
- Apply (first): ✅ Success (320ms)
- Visual Transform: ✅ Model moved/rotated/scaled correctly
- Presets: ✅ All 5 presets work
- Reset: ✅ Returns to defaults
- Apply (10x): ✅ No performance degradation

Issues: None
Notes: Excellent responsiveness, real-time feedback perfect
```

---

## 🔜 Próximos Pasos

Después de validar que manual adjustment funciona:

1. **Integration con Auto-Alignment**
   - Pasar transformación inicial de Phase 2.1
   - Botón "Refine Manually" en AutoAlignmentTestScreen

2. **Phase 2.3: Persistence** (1 week)
   - Save transformations to AsyncStorage
   - Load on app restart
   - ARWorldMap integration

3. **Phase 3: Occlusion Rendering** ⚠️ **CRITICAL**
   - Reality replacement (corazón del POC)
   - Depth buffer integration
   - Immersive mode toggle

---

**Document Created:** 2025-12-17
**Status:** Ready for Testing
**Next Update:** After device testing results

---

## 📚 Related Documentation

- [PHASE_2_AUTO_ALIGNMENT_TEST.md](./PHASE_2_AUTO_ALIGNMENT_TEST.md) - Phase 2.1 testing guide
- [PLAN_AR_INMERSIVO.md](./PLAN_AR_INMERSIVO.md) - Complete roadmap
- [CURRENT_STATE.md](./CURRENT_STATE.md) - Project status
