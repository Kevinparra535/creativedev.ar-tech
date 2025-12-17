# Roadmap al POC Completo

**Fecha:** 2025-12-17
**Progreso Actual:** 75% completado
**Tiempo Estimado Restante:** 3-4 semanas

---

## Resumen Ejecutivo

Has completado **las bases fundamentales** del POC:

- ✅ ARKit setup completo con módulo nativo Swift
- ✅ Plane Detection con clasificación y visualización
- ✅ Model Loading y manipulación táctil (5 gestos)
- ✅ Room Scanning con export USDZ (vía expo-roomplan)
- ✅ **Model Alignment System completo** (auto + manual + persistence)
- 🔨 **Occlusion Groundwork** (scene reconstruction + mesh handling)

**Para alcanzar la visión completa del POC**, necesitas implementar:

1. ✅ ~~Integración Room Scan ↔ AR View~~ (COMPLETADO)
2. 🔨 **Completar Model Alignment testing** (3-5 días)
3. 🔴 **AR Inmersivo con Occlusion** (2-3 semanas)

---

## ¿Qué Falta para el POC?

### 🎯 Visión del POC (según PLAN_AR_INMERSIVO.md)

> *"Cliente **escanea el interior** actual con su teléfono → App **reemplaza la vista real** con el render 3D del diseño → Cliente puede **caminar dentro del modelo** y ver cómo quedará el espacio"*

**Diferenciador clave:** No es "colocar objetos", es **sumergirse en el diseño completo**

---

## Fases Pendientes

### ✅ Fase 1.5: Room Scanning Integration (COMPLETADA)

**Estado:** 100% completado
**Fecha finalización:** 2025-12-12

#### Implementado

- ✅ RoomPlanTestScreen escanea habitaciones
- ✅ Export automático a USDZ (Parametric mode)
- ✅ File location tracking
- ✅ **Integración con ARTestScreen**
  - Botón "Load Room Scan" agregado
  - File picker con lista de scans guardados
  - Modal UI para selección de archivos
- ✅ **File Management System**
  - Hook `useFileManager.ts` lista archivos USDZ
  - Preview de metadata (tamaño, fecha)
  - Carga de modelos en AR view (Camera Mode y Tap-to-Place)
- ✅ **ARTestScreen navegable**
  - Expuesto en Home y AppNavigator
  - Accesible desde menú principal

**Archivos creados:**

- `src/ui/ar/hooks/useFileManager.ts`
- `src/ui/screens/ARTestScreen.tsx` (actualizado)
- `src/ui/navigation/AppNavigator.tsx` (ruta ARTest)

---

### ✅ Fase 2: Model Alignment System (80%)

**Duración:** Completado en 2 semanas
**Estado:** 80% completado (core listo, falta testing/polish)

#### Objetivo

Alinear el modelo 3D del arquitecto con el room scan capturado ✅

#### Componentes implementados

**1. Auto-Alignment (Phase 2.1)** ✅

- ✅ Servicio `modelAlignment.ts`
  - `calculateOptimalScale()` - Factor de escala óptimo
  - `checkProportionCompatibility()` - Validación de proporciones
  - `calculateAutoAlignment()` - Alineación automática completa
- ✅ Hook `useAutoAlignment.ts` con state management
- ✅ Screen `AutoAlignmentTestScreen.tsx` para testing step-by-step
- ✅ Persistencia: guarda alignment aplicado en AsyncStorage
- ✅ Tests unitarios en `modelAlignment.test.ts`

**2. Manual Adjustment (Phase 2.2)** ✅

- ✅ Hook `useManualAdjustment.ts` para control manual de transforms
- ✅ Componente `AlignmentControls.tsx` con sliders precisos
  - Position X/Y/Z (-5 a +5m, step 0.01m)
  - Rotation X/Y/Z (0-360°, step 1°)
  - Scale X/Y/Z (0.1 a 3x, step 0.01)
- ✅ Screen `ManualAlignmentScreen.tsx` con AR view integrado
- ✅ Persistencia: save on Apply + restore on load

**3. Persistence System (Phase 2.3)** ✅

- ✅ Servicio `alignmentStorage.ts` usando AsyncStorage
  - `saveLastManualAlignment()` / `loadLastManualAlignment()`
  - `saveLastAutoAlignment()` / `loadLastAutoAlignment()`
  - Timestamps y metadata incluidos
- ✅ Integración en ambos hooks (auto y manual)

**4. Native Module Support** ✅

- ✅ `getModelDimensions()` - Extrae bounding box en world space
- ✅ `getAllModelIds()` - Lista todos los modelos cargados
- ✅ `updateModelTransform()` - Aplica transforms completos
- ✅ `setModelScale/Position/Rotation()` - Setters individuales
- ✅ `getModelTransform()` - Lee transforms actuales

#### Pendiente (último 20%)

**1. Dimension Matching (1 semana)**

- [ ] Algoritmo para comparar dimensiones
  - Extraer bounding box del room scan (USDZ metadata)
  - Extraer bounding box del modelo del arquitecto
  - Calcular factor de escala automático
  - Validar que modelos estén en metros reales

- [ ] Auto-alignment básico
  - Centrar ambos modelos en origen
  - Alinear ejes principales (floor = Y=0)
  - Aplicar transformación inicial

**2. Manual Adjustment UI (1 semana)**

- [ ] Controles de transformación en ARTestScreen
  - Sliders para Position (X, Y, Z)
  - Sliders para Rotation (Y-axis principalmente)
  - Slider para Scale global
  - Botón "Reset to Auto"

- [ ] Vista de comparación
  - Overlay semi-transparente del room scan
  - Toggle para alternar entre modelo arquitecto y scan
  - Indicadores de diferencias de dimensión

**3. Persistence System (3-5 días)**

- [ ] Guardar configuración de alineación
  - JSON con transformación (position, rotation, scale)
  - Asociar a proyecto específico
  - Cargar configuración guardada al iniciar

- [ ] Spatial Anchors
  - Guardar anchor como referencia
  - Re-aplicar transformación al cargar sesión

**Archivos a crear:**

- `src/services/modelAlignment.ts` - Lógica de matching
- `src/ui/components/AlignmentControls.tsx` - UI de ajuste
- `src/storage/alignmentStorage.ts` - Persistencia

**Criterio de éxito:** Modelo del arquitecto alineado con room scan, transformación guardada

---

### 🔴 Fase 3: AR Inmersivo - Reality Replacement (0%)

**Duración:** 3-4 semanas
**Prioridad:** ALTA (corazón del POC)

#### Objetivo

Reemplazar la realidad física con el modelo 3D del diseño

#### Componentes a implementar

**1. Occlusion Rendering (1.5-2 semanas)**

- [ ] Custom Shader en Swift
  - Shader para ocultar cámara real
  - Renderizar solo modelo 3D sobre fondo negro/blanco
  - Usar depth buffer de ARKit para oclusión precisa

- [ ] Depth-based Occlusion
  - Scene reconstruction mesh de ARKit
  - Objetos reales ocultan modelo (para mantener contexto)
  - Toggle modo "Full Immersion" vs "AR Mix"

**Archivos a modificar:**

- `modules/expo-arkit/ios/ExpoARKitView.swift` - Configurar occlusion
- Crear `modules/expo-arkit/ios/Shaders/OcclusionShader.metal`

**2. Immersive Navigation (1 semana)**

- [ ] 6DOF Tracking mejorado
  - Validar tracking continuo al caminar
  - Handling de tracking loss (relocalization)
  - Smooth camera movement

- [ ] Collision Detection (opcional)
  - Detectar cuando usuario "atraviesa" paredes virtuales
  - Warning visual o límites suaves
  - Basado en room scan geometry

**3. Materials System (1 semana - Nice-to-have)**

- [ ] Intercambio de materiales
  - Seleccionar superficie del modelo
  - UI con galería de materiales
  - Preview en tiempo real
  - Persistir selecciones

**Archivos a crear:**

- `modules/expo-arkit/ios/ImmersiveRenderer.swift` - Rendering inmersivo
- `src/ui/screens/ImmersiveARScreen.tsx` - Nueva pantalla inmersiva
- `src/ui/components/MaterialPicker.tsx` - UI de materiales

**Criterio de éxito:** Usuario camina dentro del modelo 3D sin ver cámara real

---

## Timeline Detallado

```
SEMANA 1 (Actual)
- Completar Fase 1.5 (15% restante)
  - Integrar room scan con AR view
  - File picker y management

SEMANAS 2-3
- Iniciar Fase 2: Model Alignment
  - Dimension matching algorithm
  - Manual adjustment UI

SEMANA 4
- Completar Fase 2
  - Persistence system
  - Testing de alineación

SEMANAS 5-7
- Fase 3: AR Inmersivo
  - Occlusion rendering (semanas 5-6)
  - Immersive navigation (semana 7)
  - Materials system (si hay tiempo)

SEMANA 8 (Buffer)
- Polish, testing, bug fixes
- Demo preparation
```

**Fecha estimada POC completo:** Principios de Febrero 2025

---

## Métricas de Progreso

### Estado Actual vs Objetivo

| Aspecto | Actual | Objetivo POC | Gap |
|---------|--------|--------------|-----|
| **Room Scanning** | ✅ Export USDZ | ✅ Cargar en AR | Integración |
| **Model Alignment** | ❌ No existe | ✅ Auto + Manual | Todo |
| **Occlusion** | ❌ No existe | ✅ Reality replacement | Todo |
| **Navigation** | ✅ 6DOF básico | ✅ Inmersivo mejorado | Refinamiento |
| **Materials** | ❌ No existe | 🟡 Nice-to-have | Opcional |

### Desglose por Feature

| Feature | Completado | Pendiente | Progreso |
|---------|------------|-----------|----------|
| ARKit Setup | 100% | 0% | ✅ |
| Plane Detection | 100% | 0% | ✅ |
| Model Loading | 100% | 0% | ✅ |
| Gestures | 100% | 0% | ✅ |
| Room Scanning | 85% | 15% | 🔨 |
| Model Alignment | 0% | 100% | ⏳ |
| Occlusion | 0% | 100% | ⏳ |
| Materials | 0% | 100% | ⏳ |

**Progreso Total:** 60% completado

---

## Riesgos y Mitigaciones

### Riesgo 1: Occlusion Rendering Complejo

**Problema:** Custom shaders en Metal son complejos
**Mitigación:**

- Estudiar ejemplos de Apple (Scene Reconstruction sample)
- Empezar con occlusion simple (background blanco)
- Iterar hacia depth-based occlusion

### Riesgo 2: Alineación Imprecisa

**Problema:** Auto-matching puede no ser perfecto
**Mitigación:**

- Priorizar UI de ajuste manual robusto
- Múltiples puntos de referencia (esquinas, puertas)
- Sistema de validación visual (overlay)

### Riesgo 3: Performance con Occlusion

**Problema:** Rendering inmersivo consume batería/procesamiento
**Mitigación:**

- LOD (Level of Detail) para modelos grandes
- Optimización de mesh (reduce polys)
- Testing temprano en dispositivo real

### Riesgo 4: Curva de Aprendizaje Metal Shaders

**Problema:** Si no hay experiencia con Metal
**Mitigación:**

- Fase 3 tiene buffer de 3-4 semanas
- Recursos: Metal by Example, Apple docs
- Considerar SceneKit shaders (más simple) primero

---

## Próximos Pasos Inmediatos

### Esta Semana (Prioridad #1)

**Completar Fase 1.5 → 100%**

1. **Modificar useRoomPlan.ts**

   ```typescript
   // Retornar file path del USDZ exportado
   const startScanning = async (scanName: string) => {
     const result = await startRoomPlan(scanName);
     return {
       success: true,
       filePath: result.fileLoc, // expo-roomplan retorna esto
       scanName: scanName
     };
   };
   ```

2. **Agregar File Picker en ARTestScreen**
   - Botón "📦 Cargar Room Scan"
   - Modal con lista de scans (usar FileSystem de Expo)
   - Al seleccionar: `arViewRef.current.loadModel(filePath, 1.0)`

3. **Testing**
   - Escanear habitación real
   - Cargar modelo escaneado en AR
   - Verificar escala y posicionamiento

**Criterio de éxito:** Fase 1.5 al 100% antes de fin de semana

---

## Recursos de Aprendizaje

### Para Fase 2 (Model Alignment)

- [ARKit World Anchors](https://developer.apple.com/documentation/arkit/arworldanchor)
- [SceneKit Bounding Box](https://developer.apple.com/documentation/scenekit/scnnode/1407975-boundingbox)

### Para Fase 3 (Occlusion)

- [ARKit Scene Reconstruction](https://developer.apple.com/documentation/arkit/arkit_in_ios/environmental_analysis/visualizing_a_point_cloud_using_scene_depth)
- [Metal Shading Language Guide](https://developer.apple.com/metal/Metal-Shading-Language-Specification.pdf)
- [SceneKit Rendering Techniques](https://developer.apple.com/documentation/scenekit/scntechnique)

### Ejemplos de Apple

- [Tracking and Visualizing Planes](https://developer.apple.com/documentation/arkit/tracking_and_visualizing_planes)
- [Creating a Multiuser AR Experience](https://developer.apple.com/documentation/arkit/arkit_in_ios/tracking_and_visualizing_planes)

---

## Preguntas Clave para Decidir

Antes de empezar Fase 3, considera:

1. **¿Qué nivel de occlusion necesitas?**
   - Simple: Fondo blanco/negro (más fácil, 1 semana)
   - Avanzado: Depth-based con objetos reales (complejo, 2-3 semanas)

2. **¿Materials system es crítico?**
   - Si sí: Agregar 1 semana más
   - Si no: Enfocarse en occlusion perfecto

3. **¿Performance target?**
   - Solo iPhone 14 Pro+: Puedes usar features avanzadas
   - Compatibilidad iPhone 12 Pro+: Optimización importante

---

## Conclusión

**Has construido una base sólida** (60% completo):

- ✅ Módulo ARKit nativo funcional
- ✅ Plane detection y visualización
- ✅ Model manipulation completo
- ✅ Room scanning operativo

**Lo que falta es el "diferenciador":**

- 🔴 Model Alignment (alinear diseño con espacio real)
- 🔴 Reality Replacement (experiencia inmersiva)

**Tiempo realista:** 5-7 semanas de trabajo enfocado

**Recomendación:** Completar Fase 1.5 esta semana, luego dedicar 2-3 semanas sólidas a Fase 2 antes de intentar Fase 3.

---

**Última actualización:** 2025-12-12
**Próxima revisión:** Al completar Fase 1.5 (100%)
