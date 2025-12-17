# Phase 2: Auto-Alignment Testing Guide

**Fecha:** 2025-12-17
**Estado:** Implementation Complete - Ready for Device Testing
**Screen:** `AutoAlignmentTestScreen.tsx`

---

## 🎯 Objetivo

Validar el sistema de alineación automática entre:
- **Modelo de diseño** (USDZ del arquitecto)
- **Room scan** (USDZ de expo-roomplan)

---

## 📋 Pre-requisitos

1. **Device:** iPhone con LiDAR (12 Pro+, 14 Pro, etc.)
2. **iOS:** 16.0+
3. **Build:** App instalada y corriendo
4. **Archivos USDZ:**
   - Modelo de diseño del arquitecto
   - Room scan de expo-roomplan (usar RoomPlanTestScreen primero)

---

## 🚀 Workflow de Testing (5 Pasos)

### Paso 1: Cargar Modelo de Diseño

1. Abrir la app → Home → **"🎯 Auto-Alignment Test (Phase 2)"**
2. Click **"Load Design Model"**
3. Seleccionar archivo USDZ del diseño (File Picker)
4. Modelo se carga en AR frente a la cámara (posición: `[0, 0, -1.5]`)
5. **Verificar:** Alert "Success - Design model loaded"

**Logs esperados:**
```
[AutoAlignmentTestScreen] Loading design model
[ExpoARKitModule] loadModel called with path: file://...
```

---

### Paso 2: Cargar Room Scan

1. Click **"Load Room Scan"**
2. Seleccionar archivo USDZ del room scan
3. Modelo se carga en el origen (posición: `[0, 0, 0]`)
4. **Verificar:** Alert "Success - Room scan loaded"

**Logs esperados:**
```
[AutoAlignmentTestScreen] Loading room scan model
[ExpoARKitModule] loadModel called with path: file://...
```

---

### Paso 3: Obtener Dimensiones

1. Click **"Get Dimensions"**
2. Sistema consulta dimensiones de ambos modelos via `getModelDimensions()`
3. **Verificar:** Cards de dimensiones aparecen en UI

**Dimensiones mostradas:**
- **Design Model:**
  - Width (X), Height (Y), Depth (Z) en metros
  - Volume en m³
  - modelId almacenado
  
- **Room Scan:**
  - Width (X), Height (Y), Depth (Z) en metros
  - Volume en m³
  - modelId almacenado

**Logs esperados:**
```
[AutoAlignmentTestScreen] Getting dimensions
[ExpoARKitModule] getModelDimensions returned: {x: 3.2, y: 2.4, z: 4.5}
```

---

### Paso 4: Validar Compatibilidad

1. Click **"Validate Compatibility"**
2. Sistema valida proporciones con `validateModels()`
3. **Verificar:** Resultado de validación mostrado

**Validación incluye:**
- ✅ Aspect ratio match (X:Y:Z)
- ✅ Scale range check (0.1x - 10x)
- ⚠️ Warnings si tolerancias excedidas

**Expected Result:**
- **Status:** "Compatible" o "Warning"
- **Warnings:** Lista de advertencias (si aplican)
- **Confidence:** Preliminar basado en proporciones

**Logs esperados:**
```
[useAutoAlignment] Validating models
[useAutoAlignment] Validation result: {isValid: true, warnings: [...]}
```

---

### Paso 5: Calcular y Aplicar Alineación

1. Click **"Calculate & Apply Alignment"**
2. Sistema calcula transformación óptima via `alignModels()`
3. Si confidence > 50%, aplica transformación via `applyAlignment()`
4. **Verificar:** Resultado de alineación mostrado

**Métricas de Alignment Result:**
- **Scale:** Factor de escala calculado
- **Position:** [x, y, z] en metros
- **Rotation:** [x, y, z] en radianes
- **Confidence:** 0-100% (basado en matching)
- **Method:** "automatic" o "fallback"

**Logs esperados:**
```
[useAutoAlignment] Calculating alignment
[modelAlignment] calculateOptimalScale: {scaleX: 1.2, scaleY: 1.15, ...}
[useAutoAlignment] Alignment result: {scale: 1.18, confidence: 85%}
[ExpoARKitModule] updateModelTransform called
```

---

## ✅ Criterios de Éxito

### Funcional
- [ ] Ambos modelos cargan sin errores
- [ ] Dimensiones se obtienen correctamente
- [ ] Validación ejecuta y muestra resultado
- [ ] Alineación calcula y aplica transformación
- [ ] Confidence score > 70% (ideal)
- [ ] Modelos visualmente alineados en AR

### Performance
- [ ] Load time < 3s por modelo
- [ ] Dimension query < 500ms
- [ ] Alignment calculation < 1s
- [ ] Transform apply instantáneo

### UX
- [ ] Todos los botones responden
- [ ] Alerts informativos claros
- [ ] Cards de dimensiones legibles
- [ ] Resultado de alignment comprensible
- [ ] No crashes durante workflow

---

## 🐛 Troubleshooting

### Error: "Design model ID not found"
**Causa:** loadModel falló o modelId no se asignó
**Solución:** Verificar logs de ExpoARKitModule, reintentar Load Design Model

### Error: "Models have incompatible proportions"
**Causa:** Aspect ratios muy diferentes (>20% tolerance)
**Solución:** Verificar que sean modelos del mismo espacio, revisar dimensiones

### Warning: "Models differ significantly in scale"
**Causa:** Scale factor < 0.1x o > 10x
**Solución:** Normal si room scan es pequeño preview vs design real, continuar

### Confidence < 50%
**Causa:** Dimensiones muy diferentes o proporciones no compatibles
**Solución:** 
1. Verificar que room scan sea del mismo espacio que design
2. Revisar dimensiones en cards (pueden estar invertidas X/Z)
3. Considerar manual adjustment si auto-alignment no funciona

### Transform no se aplica visualmente
**Causa:** updateModelTransform falló o modelId incorrecto
**Solución:** Verificar logs de ExpoARKitModule, verificar modelId en state

---

## 📊 Testing Checklist

```
[ ] Build compila sin errores
[ ] App se instala en device
[ ] Navegación a AutoAlignmentTestScreen funciona
[ ] ARKitView se inicializa correctamente
[ ] File picker se abre para design model
[ ] Design model carga y aparece en AR
[ ] File picker se abre para room scan
[ ] Room scan carga y aparece en AR
[ ] Get Dimensions retorna valores válidos
[ ] Dimension cards muestran valores correctos
[ ] Validate Compatibility ejecuta sin crash
[ ] Validation result muestra warnings (si aplican)
[ ] Calculate & Apply Alignment ejecuta sin crash
[ ] Alignment result muestra métricas
[ ] Confidence score es razonable (>50%)
[ ] Transform se aplica visualmente
[ ] Modelos están visualmente alineados
[ ] No memory leaks después de múltiples runs
[ ] Performance es aceptable
```

---

## 📝 Notas de Testing

**Formato para reportar resultados:**

```
Date: 2025-12-17
Device: iPhone 14 Pro Max
iOS: 16.4
Design Model: kitchen_design.usdz (3.5m x 2.4m x 4.2m)
Room Scan: kitchen_scan.usdz (3.2m x 2.3m x 4.0m)

Results:
- Load Design: ✅ Success (2.1s)
- Load Room: ✅ Success (1.8s)
- Get Dimensions: ✅ Success (420ms)
- Validate: ✅ Compatible (1 warning: scale diff)
- Alignment: ✅ Success (confidence: 82%)
  - Scale: 1.09
  - Position: [0.15, 0.05, 0.10]
  - Rotation: [0, 0, 0]
- Visual Check: ✅ Models aligned correctly

Issues: None
Notes: Perfect alignment, room scan slightly smaller than design
```

---

## 🔄 Próximos Pasos

Después de validar que auto-alignment funciona:

1. **Phase 2.2:** Manual Adjustment UI
   - Sliders para Position X/Y/Z
   - Slider para Rotation Y
   - Slider para Scale
   - Real-time preview

2. **Phase 2.3:** Persistence
   - Save alignment to AsyncStorage
   - Load alignment on app restart
   - ARWorldMap integration

3. **Phase 3:** Occlusion Rendering **CRITICAL**
   - Replace reality with design model
   - Depth buffer integration
   - Immersive mode toggle

---

**Document Created:** 2025-12-17
**Status:** Ready for Testing
**Next Update:** After device testing results
