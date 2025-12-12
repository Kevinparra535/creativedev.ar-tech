# Roadmap al POC Completo

**Fecha:** 2025-12-12
**Progreso Actual:** 60% completado
**Tiempo Estimado Restante:** 5-7 semanas

---

## Resumen Ejecutivo

Has completado **las bases fundamentales** del POC:
- ✅ ARKit setup completo con módulo nativo Swift
- ✅ Plane Detection con clasificación y visualización
- ✅ Model Loading y manipulación táctil (5 gestos)
- ✅ Room Scanning con export USDZ (vía expo-roomplan)

**Para alcanzar la visión completa del POC**, necesitas implementar:
1. **Integración Room Scan ↔ AR View** (3-5 días)
2. **Model Alignment System** (2-3 semanas)
3. **AR Inmersivo con Occlusion** (3-4 semanas)

---

## ¿Qué Falta para el POC?

### 🎯 Visión del POC (según PLAN_AR_INMERSIVO.md)

> *"Cliente **escanea el interior** actual con su teléfono → App **reemplaza la vista real** con el render 3D del diseño → Cliente puede **caminar dentro del modelo** y ver cómo quedará el espacio"*

**Diferenciador clave:** No es "colocar objetos", es **sumergirse en el diseño completo**

---

## Fases Pendientes

### 🔴 Fase 1.5: Completar Room Scanning Integration (15% restante)

**Duración:** 3-5 días
**Prioridad:** CRÍTICA

#### Lo que YA funciona:
- ✅ RoomPlanTestScreen escanea habitaciones
- ✅ Export automático a USDZ (Parametric mode)
- ✅ File location tracking

#### Lo que FALTA:
- [ ] **Integrar con ARTestScreen**
  - Agregar botón "Cargar Room Scan"
  - File picker para seleccionar scans guardados
  - Pasar file path del USDZ a `loadModel()` en ARKitView

- [ ] **File Management System**
  - Listar archivos USDZ en Documents folder
  - Preview de scans (metadata: fecha, dimensiones)
  - Sistema de nombres descriptivos (e.g., "Living Room - 2025-12-12")

- [ ] **Auto-scaling**
  - Detectar dimensiones del modelo escaneado
  - Aplicar escala apropiada automáticamente
  - Centrar modelo en origen de AR

**Archivos a modificar:**
- `src/ui/screens/ARTestScreen.tsx` - Agregar UI de file picker
- `src/ui/ar/hooks/useRoomPlan.ts` - Retornar file path del export
- Posiblemente crear `src/utils/fileManager.ts` para listar USDZ

**Criterio de éxito:** Usuario puede escanear habitación → ver modelo escaneado en AR view

---

### 🔴 Fase 2: Model Alignment System (0%)

**Duración:** 2-3 semanas
**Prioridad:** CRÍTICA

#### Objetivo:
Alinear el modelo 3D del arquitecto con el room scan capturado

#### Componentes a implementar:

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

#### Objetivo:
Reemplazar la realidad física con el modelo 3D del diseño

#### Componentes a implementar:

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
