# Plan: AR Inmersivo para Visualización de Diseño de Interiores

**Documento:** Plan técnico completo para implementación AR avanzada
**Versión:** 2.5
**Fecha:** 2025-12-17
**Estado:** Fase 2 completada (80%) - Fase 3.2 completada (100%)

---

## Contexto

El usuario necesita implementar una experiencia AR **avanzada** para que arquitectos puedan mostrar diseños de interiores de forma inmersiva. NO es un simple "tap to place", sino un **reemplazo de la realidad** con el modelo 3D.

### Estado Actual

- ✅ ARKit nativo con SceneKit (Three.js removido)
- ✅ Plane Detection con clasificación completa
- ✅ Room Scanning con RoomPlan API (export USDZ)
- ✅ Model Alignment System (auto + manual + persistence)
- ✅ Scene reconstruction mesh (occlusion groundwork)
- ✅ Portal Mode (camera feed hiding)
- ✅ Mesh Classification (surface type detection & materials)
- ⏳ Collision Detection (en progreso)
- ⏳ Reality replacement completo (portal mode + collision)

### Objetivo del POC

**Caso de uso:** Arquitecto está remodelando un apartamento/casa:

1. Arquitecto sube modelo 3D **a escala real** del diseño final
2. Cliente **escanea el interior** actual con su teléfono (habitación, sala, etc.)
3. App **reemplaza la vista real** con el render 3D del diseño
4. Cliente puede **caminar dentro del modelo** y ver cómo quedará el espacio

**Diferenciador clave:** No es "colocar un objeto", es **sumergirse en el diseño completo**

---

## Respuestas del Usuario ✅

### 1. Timeline y Prioridad

- ✅ **No urgente** - tiempo para validar viabilidad
- ✅ **Implementación robusta** preferida sobre MVP rápido

### 2. Plataforma

- ✅ **Solo iOS** (ARKit es más maduro)
- ✅ Dispuesto a migrar a **Expo Bare Workflow**

### 3. Features Críticas

- ✅ **Escaneo completo del interior** (habitación/apartamento)
- ✅ **Reemplazo de la realidad** con modelo 3D
- ✅ **Navegación dentro del modelo** (caminar libremente)
- ❌ Cambio de materiales: Nice-to-have (no crítico)

---

## Análisis Técnico: Requerimientos para esta Experiencia

### Lo que necesitamos implementar

#### 1. Room Scanning (Fase de escaneo)

- Capturar geometría 3D del espacio real
- Detectar paredes, piso, techo, ventanas
- Generar mesh del entorno
- **Tecnología:** RoomPlan API (iOS 16+) o ARKit Scene Reconstruction

#### 2. Spatial Alignment (Alineación)

- Alinear modelo 3D del arquitecto con espacio escaneado
- Matching de dimensiones y orientación
- Anclar modelo al mundo real
- **Tecnología:** ARKit World Tracking + Spatial Anchors

#### 3. Occlusion Rendering (Visualización)

- Ocultar la realidad física
- Renderizar solo el modelo 3D
- Mantener tracking al caminar
- **Tecnología:** Custom shader + depth buffer ARKit

#### 4. Navigation (Interacción)

- 6DOF tracking preciso
- Actualización en tiempo real
- Colisión/límites opcionales
- **Tecnología:** ARKit Session Management

---

## Opciones Técnicas (RE-EVALUADAS para este scope)

### ❌ Opciones NO viables

**ViroReact:**

- NO tiene RoomPlan API integration
- Scene reconstruction muy limitada
- NO diseñada para "reemplazo de realidad completo"

**WebXR:**

- NO tiene acceso a RoomPlan
- Performance insuficiente para spatial mapping complejo

**Expo XR:**

- Demasiado experimental
- Sin soporte para este nivel de complejidad

---

### ✅ Opción RECOMENDADA: Expo Bare Workflow + Native Modules

**Stack propuesto:**

```text
┌─────────────────────────────────────┐
│  React Native (Expo Bare Workflow)  │
├─────────────────────────────────────┤
│  Custom Native Module (Swift)       │
│  - RoomPlan API wrapper             │
│  - ARKit Session management         │
│  - Spatial Anchors                  │
├─────────────────────────────────────┤
│  Rendering Engine                   │
│  Opción A: SceneKit (nativo iOS)    │
│  Opción B: Three.js + bridge        │
└─────────────────────────────────────┘
```

**Componentes necesarios:**

1. **Native iOS Module** (Swift)
   - Wrapper de RoomPlan para escaneo
   - ARSession configuration
   - Spatial anchor management
   - Camera feed + depth data

2. **React Native Bridge**
   - Comunicación RN ↔ Swift
   - Event emitters para estado de escaneo
   - Callbacks para tracking updates

3. **3D Rendering**
   - **Opción A (recomendada):** SceneKit nativo
     - Mejor performance
     - Integración directa con ARKit
     - Menos complejidad de bridge
   - **Opción B:** Mantener Three.js
     - Requiere bridge complejo
     - Mayor overhead
     - Beneficio: reutilizar código actual

**Pros:**

- ✅ Acceso completo a RoomPlan y ARKit 6+
- ✅ Máximo control sobre experiencia
- ✅ Performance nativo
- ✅ Escalable para features futuras

**Contras:**

- ❌ Requiere desarrollo nativo en Swift
- ❌ Complejidad alta inicialmente
- ❌ Curva de aprendizaje si no hay experiencia iOS
- ❌ Posible refactor del código Three.js actual

**Complejidad:** ALTA
**Esfuerzo estimado:** Plan por fases (ver abajo)

---

## Plan de Implementación Propuesto

### 🎯 Decisión Crítica: Rendering Engine

**Pregunta:** ¿Prefieres mantener Three.js o migrar a SceneKit nativo?

#### Opción A: SceneKit (Nativo iOS) - RECOMENDADA

**Pros:**

- Integración nativa con ARKit (cero overhead)
- Mejor performance y battery life
- Menos código de bridge
- Apple provee ejemplos con RoomPlan

**Contras:**

- Hay que reescribir la lógica de rendering 3D actual
- Aprender SceneKit (si no hay experiencia)

**Decisión:** ¿Aceptas reescribir el rendering en SceneKit?

---

#### Opción B: Mantener Three.js

**Pros:**

- Reutilizar código 3D existente
- Stack familiar (JavaScript)

**Contras:**

- Bridge complejo RN ↔ Native ↔ WebGL
- Performance overhead significativo
- Más puntos de fallo

**Decisión:** ¿Solo si el código Three.js actual es muy complejo?

---

### 📋 Roadmap de Implementación (Por Fases)

#### **FASE 0: Setup y Validación** ✅ COMPLETADA

**Objetivo:** Configurar entorno y probar APIs críticas

**Tareas:**

- [x] Migrar a Expo Bare Workflow
- [x] Configurar Xcode project
- [x] Crear módulo nativo Swift básico (expo-arkit)
- [x] Crear React Native bridge funcional
- [x] Implementar ARView con SceneKit
- [x] Validar ARKit World Tracking
- [x] Implementar comunicación bidireccional (eventos y métodos)
- [x] Crear pantalla de prueba (ARTestScreen)
- [x] Probar adición de objetos 3D a la escena
- [x] Plane Detection con visualización y clasificación
- [x] Sistema de gestos táctiles (Long Press, Pan, Rotation, Pinch)
- [x] Tap-to-Place con raycast a planos
- [x] Sistema de Undo/Redo y gestión de modelos

**Entregable:** ✅ App con ARKit funcional, plane detection, y manipulación completa de modelos 3D

**Fecha de finalización:** 2025-12-12

---

#### **FASE 1: Room Scanning** ✅ COMPLETADA (85%)

**Objetivo:** UI para escanear y capturar espacios

**Componentes:**

1. **expo-roomplan Integration** ✅
   - Integración con expo-roomplan v1.2.1
   - Wrapper hook useRoomPlan
   - Exportar geometría escaneada (paredes, piso, ventanas)
   - Guardar resultado como USDZ (Parametric mode)

2. **React Native UI:** ✅
   - RoomPlanTestScreen con instrucciones
   - Manejo de estados (scanning/listo/error)
   - Preview del modelo en Apple RoomPlan UI
   - File location tracking

**Entregable:** ✅ Usuario puede escanear habitación y exportar USDZ

**Pendiente:**
- [ ] Integrar con ARTestScreen (cargar modelo escaneado)
- [ ] File picker para seleccionar scans guardados
- [ ] Cargar USDZ escaneado en AR view

**Fecha de finalización:** 2025-12-12 (parcial)

---

#### **FASE 2: Model Loading & Alignment** ✅ COMPLETADA (80%)

**Duración:** 2 semanas (completado)
**Estado:** 80% completado (core listo, falta testing/polish)

**Objetivo:** Cargar modelo del arquitecto y alinearlo con escaneo ✅

**Componentes implementados:**

1. **Model Upload:** ✅
   - Soporte para USDZ/USD (formato nativo iOS)
   - DocumentPicker acepta todos los archivos
   - Validación de escala y dimensiones (bounding box)
   - Native methods: `getModelDimensions()`, `getAllModelIds()`

2. **Auto-Alignment System (Phase 2.1):** ✅
   - Algoritmo de matching dimensiones (`modelAlignment.ts`)
   - `calculateOptimalScale()` - Factor de escala óptimo
   - `checkProportionCompatibility()` - Validación de proporciones
   - `calculateAutoAlignment()` - Alineación automática completa
   - Hook `useAutoAlignment.ts` con state management
   - Screen `AutoAlignmentTestScreen.tsx` para testing step-by-step
   - Persistencia: guarda alignment aplicado en AsyncStorage

3. **Manual Adjustment UI (Phase 2.2):** ✅
   - Hook `useManualAdjustment.ts` para control manual de transforms
   - Componente `AlignmentControls.tsx` con sliders precisos
   - Screen `ManualAlignmentScreen.tsx` con AR view integrado
   - Sliders: Position X/Y/Z, Rotation X/Y/Z, Scale X/Y/Z
   - Persistencia: save on Apply + restore on load

4. **Persistence System (Phase 2.3):** ✅
   - Servicio `alignmentStorage.ts` usando AsyncStorage
   - Save/load para auto y manual alignment
   - Timestamps y metadata incluidos

**Pendiente (20%):**
- [ ] Testing en device real con room scans reales
- [ ] Integración end-to-end (flujo unificado entre screens)
- [ ] UI polish (loading states, preview de transform)
- [ ] Bot restante

**Entregable:** ✅ Modelo 3D alineado con espacio real (auto + manual + persistence)

**Fecha de finalización:** 2025-12-17

---

#### **FASE 3: AR Visualization** 🔨 EN PROGRESO (15%)

**Duración estimada:** 2-3 semanas
**Estado:** Occlusion groundwork implementado

**Objetivo:** Ver modelo en AR reemplazando la realidad

**Componentes implementados:**

1. **Occlusion Groundwork (15%):** ✅
   - Scene reconstruction mesh habilitado (iOS 13+ con LiDAR)
   - `ARWorldTrackingConfiguration.sceneReconstruction = .meshWithClassification`
   - ARMeshAnchor handling en `renderer(_:didAdd/didUpdate/didRemove:for:)`
   - Material de oclusión implementado:
     - `writesToDepthBuffer = true`
     - `readsFromDepthBuffer = true`
     - `colorBufferWriteMask = []` (invisible pero ocluye)
   - Eventos `onMeshAdded/Updated/Removed` hacia React Native
   - Throttling de updates (5Hz) para evitar spam
   - Función `buildOcclusionGeometry()` para convertir ARMeshAnchor a SCNGeometry

**Pendiente (85%):**

2. **ARSession Setup completo:**
   - Depth buffer optimization
   - Scene reconstruction configuration refinement
   - Performance monitoring

3. **Rendering avanzado:**
   - Portal mode (reemplazo completo de realidad)
   - Mesh classification usage (wall/floor/ceiling diferenciados)
   - Toggle occlusion mode en UI
   - Occlusion quality settings

4. **Navigation inmersiva:**
   - Tracking 6DOF continuo optimizado
   - Update de cámara en tiempo real
   - Handling de tracking loss mejorado
   - Collision detection con mesh real

**Entregable:** Usuario puede caminar dentro del diseño 3D con oclusión realista

---

#### **FASE 4: Polish & Optimization** (1-2 semanas)

**Objetivo:** Mejorar UX y performance

**Tareas:**

- [ ] Loading states y error handling
- [ ] Optimización de rendering (LOD, culling)
- [ ] Persistencia de sesiones (guardar/cargar escenas)
- [ ] Instrucciones y onboarding
- [ ] Testing en dispositivos reales

**Entregable:** POC listo para demostrar a arquitectos

---

### ⚠️ Requisitos Técnicos Críticos

#### Hardware

- **Obligatorio:** iPhone/iPad con LiDAR
  - iPhone 12 Pro, 13 Pro, 14 Pro, 15 Pro
  - iPad Pro (2020 o posterior)
- **iOS:** 16.0 o superior (para RoomPlan API)

#### Desarrollo

- **macOS** con Xcode 14+
- **Apple Developer Account** (para testing en dispositivo)
- **Conocimientos:**
  - Swift básico (para módulos nativos)
  - React Native bridge pattern
  - ARKit conceptos (world tracking, anchors)

---

### 🚨 Riesgos y Mitigaciones

#### Riesgo 1: Complejidad de RoomPlan

**Problema:** API nueva, documentación limitada
**Mitigación:** Estudiar ejemplos de Apple, comunidad

#### Riesgo 2: Alineación imprecisa

**Problema:** Modelo no coincide exactamente con escaneo
**Mitigación:** UI de ajuste manual + múltiples puntos de anclaje

#### Riesgo 3: Performance en dispositivos viejos

**Problema:** Rendering + tracking = alto consumo
**Mitigación:** LOD, optimización de mesh, testing temprano

#### Riesgo 4: Curva de aprendizaje Swift/ARKit

**Problema:** Si no hay experiencia iOS nativa
**Mitigación:** Tutoriales oficiales de Apple, fase 0 extendida

---

## ✅ Decisiones Finales (Confirmadas 2025-12-08)

### 1. Rendering Engine: **SceneKit** ✅

- Reescribir lógica 3D actual de Three.js a SceneKit nativo
- Mejor performance e integración con ARKit
- Menor complejidad de bridge

### 2. Hardware Disponible: **iPhone 14 Pro Max** ✅

- Dispositivo con LiDAR confirmado
- Compatible con RoomPlan API
- iOS 16+ soportado

### 3. Nivel de Experiencia: **Swift Básico** ✅

- Fase 0 estimada en 1.5-2 semanas
- Recursos de aprendizaje complementarios necesarios
- Tutoriales de Apple recomendados

### 4. Estado: **FASE 2 COMPLETADA (80%)** ✅

**Logros:**

- ✅ Módulo nativo expo-arkit completamente funcional
- ✅ ARView con SceneKit + ARKit integrado
- ✅ Bridge React Native ↔ Swift operativo
- ✅ Sistema de eventos y métodos imperativo implementado
- ✅ Plane Detection con clasificación y visualización
- ✅ Tap-to-Place con raycast a planos
- ✅ Sistema de gestos táctiles completo (5 gestos)
- ✅ Undo/Redo y gestión de modelos
- ✅ Room Scanning vía expo-roomplan
- ✅ Export de geometría escaneada como USDZ
- ✅ **SceneKit Preview con gestos Apple Quick Look**
- ✅ **Model rotation con momentum/inercia**
- ✅ **Gestos simultáneos (pinch+pan, rotation+pan)**
- ✅ **Preset camera views (Front/Right/Top/Perspective)**
- ✅ **Model Alignment System completo:**
  - Auto-alignment con algoritmos de matching
  - Manual adjustment con sliders precisos
  - Persistence system (AsyncStorage)
  - Native methods para transforms
- ✅ **Occlusion Groundwork (Fase 3 - 15%):**
  - Scene reconstruction mesh habilitado
  - Material de oclusión implementado
  - Mesh events hacia React Native

**Progreso del POC:** ~75% completado

**Próximo paso:** Completar Fase 3 - Occlusion rendering y portal mode

- Reescribir lógica 3D actual de Three.js a SceneKit nativo
- Mejor performance e integración con ARKit
- Menor complejidad de bridge

### 2. Hardware Disponible: **iPhone 14 Pro Max** ✅

- Dispositivo con LiDAR confirmado
- Compatible con RoomPlan API
- iOS 16+ soportado

### 3. Nivel de Experiencia: **Swift Básico** ✅

- Fase 0 estimada en 1.5-2 semanas
- Recursos de aprendizaje complementarios necesarios
- Tutoriales de Apple recomendados

### 4. Estado: **FASE 1 COMPLETADA (95%)** 🔨

**Logros:**

- ✅ Módulo nativo expo-arkit completamente funcional
- ✅ ARView con SceneKit + ARKit integrado
- ✅ Bridge React Native ↔ Swift operativo
- ✅ Sistema de eventos y métodos imperativo implementado
- ✅ Plane Detection con clasificación y visualización
- ✅ Tap-to-Place con raycast a planos
- ✅ Sistema de gestos táctiles completo (5 gestos)
- ✅ Undo/Redo y gestión de modelos
- ✅ Room Scanning vía expo-roomplan
- ✅ Export de geometría escaneada como USDZ
- ✅ **SceneKit Preview con gestos Apple Quick Look**
- ✅ **Model rotation con momentum/inercia**
- ✅ **Gestos simultáneos (pinch+pan, rotation+pan)**
- ✅ **Preset camera views (Front/Right/Top/Perspective)**

**Progreso del POC:** ~82% completado

**Próximo paso:** Fase 3.3 - Collision Detection

---

## 🎬 Comenzando FASE 0

Ver [FASE_0_SETUP.md](./FASE_0_SETUP.md) para pasos detallados de implementación.

---

## 📚 Referencias Técnicas

### Apple Documentation

- [RoomPlan API](https://developer.apple.com/documentation/roomplan)
- [ARKit Documentation](https://developer.apple.com/documentation/arkit)
- [SceneKit Documentation](https://developer.apple.com/documentation/scenekit)
- [ARMeshClassification](https://developer.apple.com/documentation/arkit/armeshclassification)
- [ARMeshAnchor](https://developer.apple.com/documentation/arkit/armeshanchor)

### React Native Resources

- [Expo Bare Workflow](https://docs.expo.dev/bare/overview/)
- [Creating Native Modules](https://reactnative.dev/docs/native-modules-ios)
- [React Native Bridge](https://reactnative.dev/docs/native-modules-intro)

### Community Examples

- [ARKit + RoomPlan Sample Code](https://developer.apple.com/sample-code/)
- [React Native ARKit](https://github.com/react-native-ar/react-native-arkit)

---

## 📝 Registro de Cambios

### Versión 2.5 - 2025-12-17

**Mesh Classification Complete:**

- ✅ Classification-aware occlusion materials (wall/floor/ceiling/etc)
- ✅ `ARMeshClassification` buffer reading implementation
- ✅ Material cache por tipo de superficie
- ✅ `getMeshClassificationStats()` method Swift + React Native
- ✅ UI para visualizar estadísticas de meshes
- ✅ Modal "📊 Mesh Stats" con desglose completo
- ✅ Eventos actualizados con clasificación real (no hardcoded)
- ✅ iOS 14+ support con fallback para iOS 13

**Arquitectura:**

- Materials por clasificación: `getOcclusionMaterial(for: ARMeshClassification)`
- Buffer reading: `withMemoryRebound(to: UInt8.self)` para leer classifications
- Primary classification: cuenta ocurrencias, retorna más común
- Stats method: totalMeshes, meshReconstructionEnabled, portalModeEnabled, meshClassifications dictionary

**Documentación actualizada:**

- CURRENT_STATE.md refleja Fase 3.2 completada (65% Fase 3)
- Progreso del POC: ~82% completado
- PHASE_3.2_MESH_CLASSIFICATION_COMPLETE.md con detalles completos

### Versión 2.4 - 2025-12-17

**Portal Mode Implemented:**

- ✅ Camera feed hiding capability
- ✅ Toggle button UI (🌌 Portal ON / 📹 Normal AR)
- ✅ Black background mode
- ✅ Scene reconstruction mesh con occlusion material
- ✅ Events: onPortalModeChanged
- ✅ Methods: setPortalMode, getPortalModeState

### Versión 2.3 - 2025-12-16

**SceneKit Preview Mejorado:**

- ✅ Sistema de gestos Apple Quick Look implementado
- ✅ Model rotation en lugar de camera orbit (paradigma turntable)
- ✅ Momentum/inercia para rotación natural
- ✅ Gestos simultáneos: pinch+pan, rotation+pan
- ✅ Two-finger rotation gesture para tilt/roll del modelo
- ✅ Dampening en zoom para sensación suave
- ✅ UIGestureRecognizerDelegate para múltiples gestos
- ✅ Timer-based momentum animation (60 FPS)
- ✅ Velocity tracking y friction decay

**Arquitectura:**

- Estado del modelo: `modelRotationY`, `modelRotationX`
- Velocidad de rotación: `rotationVelocity`
- Momentum timer: `momentumTimer`
- Gestos configurados: 1-finger pan, 2-finger rotation, 2-finger pan, pinch, double-tap

**Documentación actualizada:**

- CURRENT_STATE.md refleja nuevo sistema de gestos
- Progreso del POC: ~65% completado

### Versión 2.2 - 2025-12-12

**Fase 1 Completada (85%):**

- ✅ Migración exitosa a Expo Bare Workflow
- ✅ Módulo nativo `expo-arkit` completo con Swift
- ✅ Integración de ARKit + SceneKit funcional
- ✅ Bridge React Native completamente operativo
- ✅ Plane Detection con clasificación (7 tipos de superficie)
- ✅ Tap-to-Place con raycast moderno (iOS 13+)
- ✅ Sistema de gestos táctiles: Long Press, Pan, Rotation, Pinch
- ✅ Undo/Redo system y gestión de modelos
- ✅ Room Scanning vía expo-roomplan (v1.2.1)
- ✅ Export de geometría escaneada como USDZ

**Pendiente Fase 1:**

- [ ] Integración room scan con ARTestScreen
- [ ] File picker para scans guardados
- [ ] Cargar USDZ escaneado en AR view

**Documentación actualizada:**

- CURRENT_STATE.md refleja estado real del proyecto
- Métricas de progreso actualizadas (~60% POC completo)
- Roadmap actualizado con próximos pasos claros

### Versión 2.0 - 2025-12-08

- Decisiones técnicas confirmadas
- Plan detallado por fases
- Selección de SceneKit como rendering engine

---

**Última actualización:** 2025-12-12
**Autor:** Equipo creativedev.ar-tech
**Progreso del POC:** 60% completado (Fase 0 y Fase 1 completas)
