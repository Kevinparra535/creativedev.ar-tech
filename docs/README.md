# Documentación - creativedev.ar-tech

**AR Immersive Interior Design Platform**

**Estado:** Fase 0.5 - Plane Detection (20%)
**Última actualización:** 2025-12-11

---

## Inicio Rápido

### Para Desarrolladores

1. **Setup inicial:** Ver [../BUILD_INSTRUCTIONS.md](../BUILD_INSTRUCTIONS.md)
2. **Estado actual:** Ver [CURRENT_STATE.md](./CURRENT_STATE.md)
3. **Próximos pasos:** Ver [PLANE_DETECTION_PLAN.md](./PLANE_DETECTION_PLAN.md)

### Para Product/Tech Leads

- **Visión completa:** [PLAN_AR_INMERSIVO.md](./PLAN_AR_INMERSIVO.md)
- **Roadmap por fases:** Ver sección "Plan de Implementación" en PLAN_AR_INMERSIVO.md

---

## Estado del Proyecto

### Completado (Fase 0)

- Expo Bare Workflow configurado
- Módulo nativo `expo-arkit` funcional (Swift)
- Bridge React Native ↔ Swift operativo
- ARKit + SceneKit integrados
- Sistema de eventos bidireccional

### En Progreso (Fase 0.5 - 20%)

- **Plane Detection Implementation**
  - ✅ Visualización de planos (Plane.swift)
  - ✅ Clasificación de planos (floor, wall, ceiling, etc.)
  - ✅ Compatibilidad iOS 16+ (API moderna)
  - ⏳ Eventos hacia React Native
  - ⏳ UI overlay con estadísticas
  - ⏳ Selección de planos con gestos

### Próximo (Fase 1)

- Carga de modelos USDZ personalizados
- Sistema de alineación con planos detectados
- UI para ajuste manual

---

## Documentos Principales

### Documentación Activa

| Documento | Propósito | Audiencia |
|-----------|-----------|-----------|
| [CURRENT_STATE.md](./CURRENT_STATE.md) | Estado actual del proyecto | Todos |
| [BUILD_INSTRUCTIONS.md](../BUILD_INSTRUCTIONS.md) | Cómo compilar y ejecutar | Desarrolladores |
| [PLAN_AR_INMERSIVO.md](./PLAN_AR_INMERSIVO.md) | Visión técnica completa | Tech Leads |
| [PLANE_DETECTION_PLAN.md](./PLANE_DETECTION_PLAN.md) | Plan detallado plane detection | Desarrolladores |
| [ARKIT_IMPLEMENTATION.md](./ARKIT_IMPLEMENTATION.md) | Detalles implementación ARKit | Desarrolladores |
| [FASE_0_RESUMEN_FINAL.md](./FASE_0_RESUMEN_FINAL.md) | Resumen Fase 0 completada | Todos |

### Documentación de Referencia

| Documento | Propósito |
|-----------|-----------|
| [EXPO_ROOMPLAN_MIGRATION.md](./EXPO_ROOMPLAN_MIGRATION.md) | Integración expo-roomplan (para Fase 2) |
| [DEBUGGING_PLANE_DETECTION.md](./DEBUGGING_PLANE_DETECTION.md) | Troubleshooting plane detection |

### Documentos Obsoletos/Archivados

Los siguientes documentos contienen información de arquitecturas previas que no se alinean con la implementación actual:

- `ARQUITECTURA_POC.md` - Arquitectura Three.js (obsoleta)
- `ARQUITECTURA_SIMPLIFICADA.md` - UI-First con Three.js (obsoleta)
- `PLAN_IMPLEMENTACION.md` - Plan 15 días con Three.js (obsoleto)
- `CODIGO_3D_ANTERIOR.md` - Código Three.js recuperable (referencia histórica)

**Nota:** Estos documentos se mantienen como referencia histórica pero no reflejan la arquitectura actual basada en ARKit nativo.

---

## Arquitectura Actual

```
React Native (Expo Bare Workflow)
    │
    ├─ src/ui/screens/ARTestScreen.tsx
    │   └─ Componente ARKitView
    │
    ├─ modules/expo-arkit/
    │   ├─ src/ExpoARKitView.tsx (React component)
    │   └─ ios/
    │       ├─ ExpoARKitModule.swift (Module bridge)
    │       ├─ ExpoARKitView.swift (ARSCNView wrapper)
    │       └─ Plane.swift (Plane visualization)
    │
    └─ iOS Native (ARKit + SceneKit)
        ├─ ARSession (world tracking)
        ├─ ARSCNView (AR scene view)
        └─ Plane detection & visualization
```

---

## Stack Tecnológico

### Core

- React Native 0.81.5 (New Architecture)
- Expo SDK 54 (Bare Workflow)
- TypeScript 5.9.2

### AR Nativo

- **ARKit** (iOS) - World tracking & plane detection
- **SceneKit** - Renderizado 3D nativo
- **Módulo expo-arkit** - Bridge Swift ↔ React Native

### Futuro

- RoomPlan API (iOS 16+) - Para room scanning completo (Fase 2)
- USDZ/USD - Formato de modelos 3D nativo iOS (Fase 1)

---

## Roadmap

| Fase | Estado | Descripción |
|------|--------|-------------|
| **0** | ✅ Completada | Setup ARKit básico |
| **0.5** | 🔨 20% | Plane detection completo |
| **1** | ⏳ Pendiente | Model loading & alignment |
| **2** | ⏳ Pendiente | Room scanning (RoomPlan) |
| **3** | ⏳ Pendiente | AR inmersivo final |

---

## Recursos Externos

### Apple Documentation

- [ARKit Documentation](https://developer.apple.com/documentation/arkit)
- [SceneKit Documentation](https://developer.apple.com/documentation/scenekit)
- [RoomPlan API](https://developer.apple.com/documentation/roomplan)
- [Apple Sample: TrackingAndVisualizingPlanes](https://developer.apple.com/documentation/arkit/tracking_and_visualizing_planes)

### Expo & React Native

- [Expo Bare Workflow](https://docs.expo.dev/bare/overview/)
- [Creating Native Modules (iOS)](https://reactnative.dev/docs/native-modules-ios)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)

---

## Comandos Rápidos

```bash
# Desarrollo
npm start
npx expo run:ios --device

# Limpiar caché
npm start -- --clear

# Matar procesos
lsof -ti:8081 | xargs kill -9
killall node
```

---

**Última actualización:** 2025-12-11
**Versión:** 0.5.0
