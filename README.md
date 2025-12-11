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

### Fase 0.5: Plane Detection (En progreso - 20%)

**Implementado:**
- Detección de planos en tiempo real
- Visualización de mesh geometry
- Clasificación de planos (floor, wall, ceiling, table, etc.)
- Colores diferentes para horizontales (azul) vs verticales (naranja)
- Compatibilidad iOS 16+ con API moderna

**Archivos clave:**
- `modules/expo-arkit/ios/Plane.swift` - Visualización de planos
- `modules/expo-arkit/ios/ExpoARKitView.swift` - Vista ARKit
- `modules/expo-arkit/ios/ExpoARKitModule.swift` - Bridge module

**Próximo:**
- Integrar eventos de plane detection con React Native
- UI overlay para mostrar estadísticas de planos
- Selección de planos con tap gestures

### Fase 1: Model Loading & Alignment (Próximo)

- Cargar modelos USDZ personalizados
- Sistema de alineación con planos detectados
- Escala automática según dimensiones reales
- UI para ajuste manual (drag/rotate/scale)

### Fase 2: Room Scanning (Futuro)

- Integración completa de RoomPlan API
- Export de geometría escaneada
- Matching de dimensiones espacio real vs modelo

### Fase 3: AR Visualization (Futuro)

- Occlusion rendering
- Reemplazo de realidad con modelo 3D
- Navegación inmersiva (6DOF tracking)
- Sistema de materiales intercambiables

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

### 2025-12-11

**Plane Detection Build Fix**
- Corregidos errores de compilación en `Plane.swift`
- Implementada función helper `classificationString(for:)` para convertir enum a String
- Implementada función `getPlaneExtent(from:)` compatible con iOS 16+
- Reemplazadas APIs deprecated (`anchor.extent` → `anchor.planeExtent`)
- Build exitoso en iOS

**Archivos modificados:**
- `modules/expo-arkit/ios/Plane.swift` - Visualización de planos compatible iOS 16+

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
| **Fase 0.5** | 🔨 20% | 1 semana | Plane detection completo |
| **Fase 1** | ⏳ Pendiente | 2-3 semanas | Carga de modelos USDZ |
| **Fase 2** | ⏳ Pendiente | 2-3 semanas | Room scanning completo |
| **Fase 3** | ⏳ Pendiente | 3-4 semanas | AR inmersivo final |

**Leyenda:** ✅ Completado | 🔨 En progreso | ⏳ Pendiente

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

**Última actualización:** 2025-12-11
**Versión:** 0.5.0 (Plane Detection)
