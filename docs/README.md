# AR Immersive Experience Platform - Documentación

**Versión:** 1.0 POC | **Estado:** Fase 0 (88% completo) | **Actualizado:** 2025-12-09

---

## ⭐ START HERE

**IMPORTANTE:** Comienza por [00_START_HERE.md](./00_START_HERE.md) para una guía rápida según tu rol.

---

## Concepto del POC

Plataforma de experiencias inmersivas en AR que permite a arquitectos presentar diseños de interiores a escala real usando la cámara y el LiDAR del iPhone.

**Caso de uso:** Arquitecto presenta remodelación de apartamento con un cliente. Cliente ve el diseño final superpuesto al espacio real en tiempo real.

### Stack Tecnológico (Actual)

- **Framework:** React Native 0.81.5 + Expo 54.0.27 (Bare Workflow)
- **AR Core:** RoomPlan API (iOS 16+) para escaneo + ARKit para tracking
- **Native Bridge:** Swift + Objective-C para módulos nativos
- **State Management:** React Hooks + NativeEventEmitter
- **Navigation:** React Navigation 7
- **Language:** TypeScript 5.9.2 (strict mode)

### Arquitectura Actual

```
React Native App
    ├─ RoomPlanTestScreen (UI)
    │   ├─ useRoomPlan hook (state)
    │   └─ RoomPlanView native component
    │
    ├─ Native Modules (Swift)
    │   ├─ RoomPlanModule (scanning, export)
    │   └─ RoomPlanViewManager (AR visualization)
    │
    └─ iOS Native APIs
        ├─ RoomPlan Framework (LiDAR scanning)
        └─ ARKit (6DOF tracking)
```

---

## Estado Actual del Proyecto

### ✅ Completado (Fase 0)

- Migración a Expo Bare Workflow
- Módulos nativos Swift integrados
- RoomPlan API funcionando (escaneo, export USDZ)
- ViewManager para RoomCaptureView
- React Native bridge completo
- TypeScript compilando sin errores
- ESLint clean
- Worklets version mismatch resuelto

### ⏳ Pendiente (Fase 0)

- Paso 8: Validación de exportes USDZ
- Paso 9: UI para gestionar escaneos guardados
- Fase 1: Cargar y alinear modelos 3D del arquitecto
- Fase 2-4: AR visualization, professional features, polish

---

## 📚 Documentación Disponible

Ver [00_START_HERE.md](./00_START_HERE.md) para guía rápida según tu rol.

### Documentación Activa
- **[BUILD_AND_RUN.md](./BUILD_AND_RUN.md)** - Cómo compilar y ejecutar
- **[FASE_0_RESUMEN_FINAL.md](./FASE_0_RESUMEN_FINAL.md)** - Estado actual (88% completo)
- **[PLAN_AR_INMERSIVO.md](./PLAN_AR_INMERSIVO.md)** - Visión técnica y roadmap
- **[NEXT_STEPS.md](./NEXT_STEPS.md)** - Pasos 8-9 y Fase 1
- **[FASE_0_SETUP.md](./FASE_0_SETUP.md)** - Guía detallada de configuración

### Referencia Técnica
- **[PASO_6_ROOMPLAN_API.md](./PASO_6_ROOMPLAN_API.md)** - Detalles RoomPlan implementation
- **[PASO_7_ROOMPLAN_VIEW_COMPLETE.md](./PASO_7_ROOMPLAN_VIEW_COMPLETE.md)** - ViewManager integration
- **[PLAN_IMPLEMENTACION.md](./PLAN_IMPLEMENTACION.md)** - Plan original (referencia histórica)

---

## 🚀 Quick Links

- **Comenzar desarrollo:** [BUILD_AND_RUN.md](./BUILD_AND_RUN.md)
- **Entender el proyecto:** [00_START_HERE.md](./00_START_HERE.md)
- **Ver progreso actual:** [FASE_0_RESUMEN_FINAL.md](./FASE_0_RESUMEN_FINAL.md)
- **Próximos pasos:** [NEXT_STEPS.md](./NEXT_STEPS.md)

---

**Última actualización:** 2025-12-09
**Rama activa:** `feature/bare-workflow-migration`
**Estado:** Fase 0 - 88% completo