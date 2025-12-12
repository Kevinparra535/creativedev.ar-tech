# creativedev.ar-tech

**AR Immersive Interior Design Platform**

Plataforma de realidad aumentada que permite a arquitectos mostrar diseños de interiores a escala real usando ARKit nativo en iOS.

---

## Estado Actual

**Fase 0.5 - ARKit Plane Detection** (En progreso)

- Expo Bare Workflow configurado
- Módulo nativo `expo-arkit` funcional
- ARKit plane detection implementado
- Visualización de planos en tiempo real
- Build iOS nativo funcional

---

## Concepto del Proyecto

### Caso de Uso: Visualización Arquitectónica Inmersiva

Un arquitecto está remodelando un apartamento:

1. Arquitecto sube modelo 3D a escala real del diseño final
2. Cliente **escanea el espacio** con su iPhone (usando ARKit)
3. App **detecta las superficies** (pisos, paredes, techos)
4. Modelo 3D se **alinea con el espacio real**
5. Cliente **camina dentro del diseño** y experimenta el espacio inmersivamente

### Diferenciador Clave

A diferencia de apps como IKEA Place (colocar objetos), esta plataforma permite **sumergirse en el diseño completo** del espacio arquitectónico con **reemplazo de la realidad**.

---

## Stack Tecnológico

### Core
- **React Native** 0.81.5 (New Architecture)
- **Expo SDK** 54 (Bare Workflow)
- **TypeScript** 5.9.2

### AR Nativo
- **ARKit** (iOS) - Módulo nativo Swift
- **SceneKit** - Renderizado 3D nativo
- **RoomPlan API** (iOS 16+) - Para escaneo de espacios (próximo)

### Módulos Nativos
- `expo-arkit` - Módulo custom Swift con bridge React Native
- `expo-roomplan` 1.2.1 - Para room scanning
- `expo-camera` - Acceso a cámara
- `expo-sensors` - Giroscopio y acelerómetro

---

## Instalación

### Pre-requisitos

- **macOS** con Xcode 14+
- **Node.js** 18+
- **iOS Device con LiDAR** (iPhone 12 Pro+, iPad Pro 2020+)
- iOS 16.0+

### Setup

```bash
# Instalar dependencias
npm install

# iOS Pods
cd ios && pod install && cd ..

# Desarrollo
npm start

# Build iOS (requiere dispositivo físico para AR)
npx expo run:ios --device
```

---

## Progreso del Proyecto

### Fase 0: Setup y Validación (Completada)

- Migración a Expo Bare Workflow
- Configuración de Xcode project
- Módulo nativo Swift básico (expo-arkit)
- Bridge React Native funcional
- ARView con SceneKit/ARKit
- Validación de ARKit World Tracking
- Comunicación bidireccional (eventos y métodos)

### Fase 0.5: Plane Detection (Completada ✅)

**Implementado:**
- ✅ Detección de planos en tiempo real (horizontal y vertical)
- ✅ Visualización de mesh geometry con clasificación
- ✅ Colores personalizables según tipo de superficie
- ✅ Eventos de plane detection en React Native
- ✅ UI overlay con estadísticas de planos
- ✅ Fase de escaneo con feedback visual
- ✅ Control de visibilidad de planos
- ✅ Auto-ocultación al colocar modelos

### Fase 1: Model Loading & Manipulation (Completada ✅)

**Implementado:**
- ✅ Carga de modelos USDZ personalizados
- ✅ Dos modos de colocación: Camera y Tap-to-Place
- ✅ Sistema de gestos táctiles:
  - Long Press: Selección de modelos
  - Pan: Mover modelos sobre planos
  - Rotation: Rotar modelos (dos dedos)
  - Pinch: Escalar modelos
- ✅ Feedback visual de selección (outline azul)
- ✅ Sistema de Undo para eliminar último modelo
- ✅ Clear All para limpiar escena completa
- ✅ Contador de modelos en tiempo real
- ✅ Fix de transparencia en modelos 3D
- ✅ Anchoring automático a planos detectados

**Archivos clave:**
- `modules/expo-arkit/ios/Plane.swift` - Visualización de planos
- `modules/expo-arkit/ios/ExpoARKitView.swift` - Vista ARKit con gestos
- `modules/expo-arkit/ios/ExpoARKitModule.swift` - Bridge module
- `src/ui/screens/ARTestScreen.tsx` - UI completa de AR
- `src/ui/ar/components/ARKitView.tsx` - Componente React

### Fase 1.5: Room Scanning (Completada ✅ - 85%)

**Implementado:**
- ✅ Integración expo-roomplan v1.2.1
- ✅ RoomPlanTestScreen con UI completa
- ✅ Hook useRoomPlan para scanning
- ✅ Export automático a USDZ (Parametric mode)
- ✅ Manejo de estados y errores
- ✅ File location tracking

**Pendiente:**
- Integración con ARTestScreen (cargar modelo escaneado)
- File picker para seleccionar scans guardados
- Sistema de alineación automática

### Fase 2: Model Alignment (Próximo - 0%)

- Matching automático de dimensiones (room scan vs modelo arquitecto)
- UI de ajuste manual (drag/rotate/scale)
- Persistencia de transformación en Spatial Anchors
- Validación de escala metros reales

### Fase 3: AR Inmersivo (Futuro - 0%)

- Occlusion rendering (depth-based)
- Reemplazo de realidad con modelo 3D
- Navegación inmersiva mejorada (6DOF tracking)
- Sistema de materiales intercambiables
- Portal mode (solo modelo, sin realidad)

---

## Estructura del Proyecto

```
creativedev.ar-tech/
├── modules/
│   └── expo-arkit/              # Módulo nativo ARKit
│       ├── ios/
│       │   ├── ExpoARKitModule.swift    # Module bridge
│       │   ├── ExpoARKitView.swift      # ARKit view
│       │   └── Plane.swift              # Plane visualization
│       ├── src/
│       │   └── ExpoARKitView.tsx        # React component
│       └── expo-module.config.json
├── src/
│   └── ui/
│       ├── ar/                  # AR feature components
│       │   ├── components/
│       │   │   ├── ARKitView.tsx
│       │   │   └── index.ts
│       │   └── hooks/
│       │       └── useARKit.ts
│       └── screens/
│           └── ARTestScreen.tsx  # Pantalla de prueba AR
├── ios/                         # Xcode project
├── docs/                        # Documentación técnica
│   ├── PLAN_AR_INMERSIVO.md    # Visión completa del proyecto
│   ├── PLANE_DETECTION_PLAN.md # Plan de detección de planos
│   └── BUILD_INSTRUCTIONS.md   # Instrucciones de build
└── BUILD_INSTRUCTIONS.md       # Quick start guide
```

---

## Comandos Principales

### Desarrollo

```bash
# Iniciar Metro bundler
npm start

# Build en dispositivo iOS
npx expo run:ios --device

# Limpiar y rebuild
npm start -- --clear
npx expo run:ios --device
```

### Testing

```bash
# Ver logs del dispositivo
# Xcode > Window > Devices and Simulators > Select Device > Open Console

# Matar procesos
lsof -ti:8081 | xargs kill -9
killall node
```

---

## Documentación

### Documentos Principales

- **[BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md)** - Guía rápida de build y testing
- **[docs/ARKIT_FEATURES.md](docs/ARKIT_FEATURES.md)** - 📚 **NUEVO:** Documentación completa de características
- **[docs/PLAN_AR_INMERSIVO.md](docs/PLAN_AR_INMERSIVO.md)** - Visión completa del POC
- **[docs/PLANE_DETECTION_PLAN.md](docs/PLANE_DETECTION_PLAN.md)** - Plan técnico de plane detection
- **[docs/ARKIT_IMPLEMENTATION.md](docs/ARKIT_IMPLEMENTATION.md)** - Detalles de implementación ARKit

### Estado de Fase 0

Ver [docs/FASE_0_RESUMEN_FINAL.md](docs/FASE_0_RESUMEN_FINAL.md) para:
- Resumen de lo implementado
- Arquitectura del módulo nativo
- Próximos pasos

---

## Requisitos Técnicos

### Hardware Obligatorio

- **iPhone/iPad con LiDAR**:
  - iPhone 12 Pro, 13 Pro, 14 Pro, 15 Pro
  - iPad Pro (2020 o posterior)
- **iOS 16.0+** (para RoomPlan API en futuro)

### Desarrollo

- macOS con Xcode 14+
- Apple Developer Account (para testing en dispositivo)
- Conocimientos básicos de:
  - Swift (para módulos nativos)
  - ARKit (world tracking, anchors)
  - React Native bridge pattern

---

## Últimas Actualizaciones

### 2025-12-12 (Actualización)

**✨ Documentación Actualizada - Estado Real del Proyecto**

**Fases Completadas:**
- ✅ Fase 0: Setup ARKit completo
- ✅ Fase 0.5: Plane Detection (clasificación, visualización, eventos)
- ✅ Fase 1: Model Manipulation (gestos, tap-to-place, undo/redo)
- ✅ Fase 1.5: Room Scanning (85% - vía expo-roomplan v1.2.1)

**Características Implementadas:**
- ✅ Gestos táctiles completos (Long Press, Pan, Rotation, Pinch)
- ✅ Sistema de Undo/Clear All para gestión de modelos
- ✅ Dos modos de colocación: Camera y Tap-to-Place
- ✅ Control de visibilidad de planos con auto-ocultación
- ✅ Room scanning con export USDZ
- ✅ 10 eventos AR (onPlaneDetected, onModelPlaced, etc.)
- ✅ 6 métodos nativos expuestos a React Native

**Documentación Actualizada:**
- 📚 `docs/CURRENT_STATE.md` - Refleja estado real (60% POC completo)
- 📚 `docs/PLAN_AR_INMERSIVO.md` - Fase 1 marcada como completa
- 📚 `docs/ARKIT_FEATURES.md` - Documentación completa de características
- 📚 README.md - Progreso y roadmap actualizados

**Próximo Paso:** Completar integración room scan con AR view (Fase 1.5 → 100%)

### 2025-12-11

**Plane Detection Build Fix**
- Corregidos errores de compilación en `Plane.swift`
- Implementada función helper `classificationString(for:)` para convertir enum a String
- Implementada función `getPlaneExtent(from:)` compatible con iOS 16+
- Reemplazadas APIs deprecated (`anchor.extent` → `anchor.planeExtent`)
- Build exitoso en iOS

### 2025-12-10

**Fase 0 Completada**
- Módulo nativo expo-arkit funcional
- ARKit + SceneKit integrados
- Bridge React Native ↔ Swift operativo
- Sistema de eventos y métodos imperativo

---

## Roadmap

| Fase | Estado | Duración | Entregable |
|------|--------|----------|------------|
| **Fase 0** | ✅ Completada | 2 semanas | ARKit básico funcional |
| **Fase 0.5** | ✅ Completada | 1 semana | Plane detection completo |
| **Fase 1** | ✅ Completada | 1 semana | Carga y manipulación de modelos |
| **Fase 1.5** | 🔨 En progreso | 3-5 días | Room scanning (85% completo) |
| **Fase 2** | ⏳ Pendiente | 2-3 semanas | Model alignment completo |
| **Fase 3** | ⏳ Pendiente | 3-4 semanas | AR inmersivo final |

**Leyenda:** ✅ Completado | 🔨 En progreso | ⏳ Pendiente

### Progreso Actual: Fase 1.5 🔨 (60% del POC completado)

---

## Recursos

- [ARKit Documentation](https://developer.apple.com/documentation/arkit)
- [RoomPlan API](https://developer.apple.com/documentation/roomplan)
- [SceneKit Documentation](https://developer.apple.com/documentation/scenekit)
- [Expo Bare Workflow](https://docs.expo.dev/bare/overview/)
- [React Native Native Modules](https://reactnative.dev/docs/native-modules-ios)

---

## Licencia

Proyecto POC privado - CreativeDev.ar
Todos los derechos reservados.

---

## Características Destacadas

### 🎮 Interacción Intuitiva
- **Gestos táctiles** naturales para manipular objetos 3D
- **Selección visual** con feedback inmediato
- **Dos modos** de colocación para máxima flexibilidad

### 🎨 Experiencia Visual
- **Planos coloreados** según clasificación de superficie
- **Auto-ocultación** de planos al colocar modelos
- **Transparencia optimizada** de modelos 3D
- **Outline de selección** para claridad visual

### ⚡ Gestión Eficiente
- **Sistema de Undo** para corrección rápida
- **Historial de modelos** ordenado
- **Contador en tiempo real** de objetos en escena
- **Clear All** para reset instantáneo

### 📐 Precisión ARKit
- **Detección de planos** en tiempo real
- **Clasificación inteligente** de superficies
- **Anchoring automático** a planos reales
- **Raycast preciso** para colocación

---

**Última actualización:** 2025-12-12
**Versión:** 1.2.0 (Model Manipulation + Room Scanning)
**Progreso del POC:** 60% completado
