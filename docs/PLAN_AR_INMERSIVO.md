# Plan: AR Inmersivo para Visualización de Diseño de Interiores

**Documento:** Plan técnico completo para implementación AR avanzada
**Versión:** 2.0
**Fecha:** 2025-12-08
**Estado:** Pendiente aprobación de decisiones técnicas

---

## Contexto

El usuario necesita implementar una experiencia AR **avanzada** para que arquitectos puedan mostrar diseños de interiores de forma inmersiva. NO es un simple "tap to place", sino un **reemplazo de la realidad** con el modelo 3D.

### Estado Actual

- ✅ Modelo 3D renderizado con Three.js
- ✅ expo-camera como fondo
- ✅ Tracking básico con expo-sensors (orientación del dispositivo)
- ❌ NO tiene spatial mapping
- ❌ NO tiene room scanning
- ❌ NO tiene occlusion/reemplazo de realidad

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

```
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

#### **FASE 0: Setup y Validación** (1-2 semanas)

**Objetivo:** Configurar entorno y probar APIs críticas

**Tareas:**

- [ ] Migrar a Expo Bare Workflow
- [ ] Configurar Xcode project
- [ ] Crear módulo nativo Swift básico
- [ ] Probar RoomPlan API (requiere dispositivo con LiDAR)
  - iPhone 12 Pro o superior
  - iPad Pro 2020 o superior
- [ ] Validar ARKit Scene Reconstruction
- [ ] Setup React Native bridge básico

**Entregable:** App que puede escanear una habitación simple con RoomPlan

---

#### **FASE 1: Room Scanning** (2-3 semanas)

**Objetivo:** UI para escanear y capturar espacios

**Componentes:**

1. **Native Module: RoomPlanScanner**
   - Wrapper de RoomCaptureSession
   - Exportar geometría escaneada (paredes, piso, ventanas)
   - Guardar resultado como USD/USDZ

2. **React Native UI:**
   - Pantalla de scanning con instrucciones
   - Progress indicator (% completado)
   - Preview del mesh escaneado
   - Botón "Completar escaneo"

**Entregable:** Usuario puede escanear habitación y ver resultado

---

#### **FASE 2: Model Loading & Alignment** (2-3 semanas)

**Objetivo:** Cargar modelo del arquitecto y alinearlo con escaneo

**Componentes:**

1. **Model Upload:**
   - Soporte para USDZ/USD (formato nativo iOS)
   - Conversión desde glTF/FBX si es necesario
   - Validación de escala y dimensiones

2. **Alignment System:**
   - Algoritmo de matching dimensiones
   - UI para ajuste manual (drag/rotate/scale)
   - Guardar transformación en Spatial Anchor

**Entregable:** Modelo 3D alineado con espacio real

---

#### **FASE 3: AR Visualization** (3-4 semanas)

**Objetivo:** Ver modelo en AR reemplazando la realidad

**Componentes:**

1. **ARSession Setup:**
   - World Tracking configuration
   - Scene reconstruction mesh
   - Depth buffer para occlusion

2. **Rendering:**
   - Si SceneKit: Renderizar modelo directamente
   - Si Three.js: Bridge WebGL con ARKit camera
   - Occlusion shader (ocultar realidad física)

3. **Navigation:**
   - Tracking 6DOF continuo
   - Update de cámara en tiempo real
   - Handling de tracking loss

**Entregable:** Usuario puede caminar dentro del diseño 3D

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

## 🎬 Próximos Pasos

Para avanzar necesito tu confirmación en:

### 1. ¿SceneKit o Three.js?

- **SceneKit** = mejor performance, hay que reescribir rendering
- **Three.js** = reutilizar código, más complejidad de bridge

### 2. ¿Tienes dispositivo con LiDAR para testing?

- Si no, necesitas conseguir uno (iPhone 12 Pro o superior)

### 3. ¿Nivel de experiencia con Swift/iOS?

- **Nulo:** Fase 0 tomará más tiempo
- **Básico:** Podemos arrancar
- **Avanzado:** Aceleramos desarrollo

### 4. ¿Empezamos con FASE 0 (Setup)?

- Migrar a Bare Workflow
- Configurar módulo nativo básico
- Validar RoomPlan funciona

**Responde estas 4 preguntas y arrancamos con la implementación.**

---

## 📚 Referencias Técnicas

### Apple Documentation

- [RoomPlan API](https://developer.apple.com/documentation/roomplan)
- [ARKit Documentation](https://developer.apple.com/documentation/arkit)
- [SceneKit Documentation](https://developer.apple.com/documentation/scenekit)

### React Native Resources

- [Expo Bare Workflow](https://docs.expo.dev/bare/overview/)
- [Creating Native Modules](https://reactnative.dev/docs/native-modules-ios)
- [React Native Bridge](https://reactnative.dev/docs/native-modules-intro)

### Community Examples

- [ARKit + RoomPlan Sample Code](https://developer.apple.com/sample-code/)
- [React Native ARKit](https://github.com/react-native-ar/react-native-arkit)

---

**Última actualización:** 2025-12-08
**Autor:** Equipo creativedev.ar-tech