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
- **RoomPlan Integration:** `expo-roomplan@1.2.1` (en vez de módulos nativos manuales)
- **State Management:** React Hooks con hook `useRoomPlan` simplificado (async/await)
- **Navigation:** React Navigation 7
- **Language:** TypeScript 5.9.2 (strict mode)

### Arquitectura Actual

```
React Native App
    ├─ RoomPlanTestScreen (UI simplificada)
    │   └─ useRoomPlan (expo-roomplan) → startRoomPlan()
    │
    ├─ Expo Modules (autolinked)
    │   └─ expo-roomplan (scan modal + export automático)
    │
    └─ iOS Native APIs (gestionadas por expo-roomplan)
        ├─ RoomPlan Framework (LiDAR scanning)
        └─ ARKit (6DOF tracking)
```

---

## Estado Actual del Proyecto

### ✅ Fase 0 - COMPLETADA

- ✅ Migración a Expo Bare Workflow
- ✅ Integración de `expo-roomplan@1.2.1` (módulo oficial Expo)
- ✅ RoomPlan API funcionando (escaneo LiDAR + export USDZ automático)
- ✅ Hook `useRoomPlan` con API simplificada (async/await)
- ✅ RoomPlanTestScreen con UI modal nativa de Apple
- ✅ Export parametric USDZ integrado
- ✅ TypeScript strict mode sin errores
- ✅ ESLint clean

### 🚀 Próximo (Fase 1)

- Cargar modelos 3D del arquitecto (USDZ/glTF)
- Alinear modelo 3D con escaneo de RoomPlan
- Renderizar modelo en AR con occlusion
- UI para gestionar múltiples escaneos guardados

---

## 📚 Documentación Disponible

Ver [00_START_HERE.md](./00_START_HERE.md) para guía rápida según tu rol.

### Documentación Activa

- **[BUILD_AND_RUN.md](./BUILD_AND_RUN.md)** - Cómo compilar y ejecutar
- **[FASE_0_RESUMEN_FINAL.md](./FASE_0_RESUMEN_FINAL.md)** - Resumen completo Fase 0
- **[PLAN_AR_INMERSIVO.md](./PLAN_AR_INMERSIVO.md)** - Visión técnica y roadmap
- **[EXPO_ROOMPLAN_MIGRATION.md](./EXPO_ROOMPLAN_MIGRATION.md)** - Implementación actual con expo-roomplan



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
