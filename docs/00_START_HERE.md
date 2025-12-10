# 🚀 Proyecto: AR Immersive Experience Platform - START HERE

**Versión:** 1.0 POC | **Estado:** Fase 0 - 88% Completo | **Última actualización:** 2025-12-09

---

## 📍 Eres Nuevo? Comienza Aquí

**¿Perdido en la documentación?** Ve a [INDEX.md](./INDEX.md) para un índice completo por rol.

---

## 📖 Estructura de Documentación - Quick Reference

### 🎯 Por Rol (Elige el Tuyo)

#### 👨‍💻 Developer (Quiero desarrollar)

1. Lee: [BUILD_AND_RUN.md](./BUILD_AND_RUN.md) - Cómo compilar y ejecutar
2. Lee: [FASE_0_RESUMEN_FINAL.md](./FASE_0_RESUMEN_FINAL.md) - Estado actual del proyecto
3. Lee: [EXPO_ROOMPLAN_MIGRATION.md](./EXPO_ROOMPLAN_MIGRATION.md) - Nuevo approach expo-roomplan (más alineado a la visión y más fácil de implementar)
4. Lee: [NEXT_STEPS.md](./NEXT_STEPS.md) - Qué viene después

#### 🏗️ Architect (Quiero entender la arquitectura)

1. Lee: [PLAN_AR_INMERSIVO.md](./PLAN_AR_INMERSIVO.md) - Visión técnica completa
2. Lee: [FASE_0_RESUMEN_FINAL.md](./FASE_0_RESUMEN_FINAL.md) - Implementación actual
3. Lee: [NEXT_STEPS.md](./NEXT_STEPS.md) - Roadmap futuro

#### 🎬 Product Owner (Quiero entender el POC)

1. Lee: [README.md](./README.md) - Concepto y visión
2. Lee: [FASE_0_RESUMEN_FINAL.md](./FASE_0_RESUMEN_FINAL.md) - Progreso actual

---

## 📚 Documentos Disponibles

### ✅ Documentación Activa

**[BUILD_AND_RUN.md](./BUILD_AND_RUN.md)** - GUÍA OPERACIONAL

- Cómo compilar la app
- Cómo ejecutar en simulador/device
- Troubleshooting común

**[FASE_0_RESUMEN_FINAL.md](./FASE_0_RESUMEN_FINAL.md)** - ESTADO ACTUAL

- Fase 0 completada (100%)
- Integración expo-roomplan
- Arquitectura simplificada
- Sin módulos nativos manuales

**[PLAN_AR_INMERSIVO.md](./PLAN_AR_INMERSIVO.md)** - VISIÓN TÉCNICA

- Stack tecnológico completo
- Arquitectura nativa iOS (RoomPlan API + ARKit)
- Fase 0-4 roadmap
- Decisiones técnicas clave

**[NEXT_STEPS.md](./NEXT_STEPS.md)** - TAREAS PENDIENTES

- Paso 8: USDZ Export Validation
- Paso 9: File Management & Sharing
- Fase 1: Model Loading & Alignment
- Timeline estimado

**[EXPO_ROOMPLAN_MIGRATION.md](./EXPO_ROOMPLAN_MIGRATION.md)** - GUÍA DE IMPLEMENTACIÓN

- Implementación con `expo-roomplan` (enfoque oficial)
- API simplificada sin código nativo manual
- Modal UI nativa de Apple integrada automáticamente

**[README.md](./README.md)** - ÍNDICE Y VISIÓN

- Concepto del POC
- Stack tecnológico resumido
- Estructura de carpetas

### 📖 Documentación de Referencia



---

## 🎯 Visión del POC

**Problema:** Los arquitectos necesitan mostrar diseños de interiores en AR a escala real.

**Solución:** App nativa iOS que permite:

1. Escanear espacios interiores con LiDAR (RoomPlan API)
2. Cargar modelos 3D del diseño a escala 1:1
3. Visualizar el diseño en AR superpuesto al espacio real
4. Cambiar materiales, tomar screenshots, medir espacios

**Hardware requerido:** iPhone 12 Pro+ o iPad Pro 2020+ (con LiDAR)

**Status:** Fase 0 (Setup) - 88% completo. App compila, RoomPlan API funciona, ViewManager integrado.

**Actualización 2025-12-09:** Se adopta `expo-roomplan` para el flujo de escaneo/export. Este enfoque es más cercano a la visión y elimina la complejidad del bridge manual. Ver `EXPO_ROOMPLAN_MIGRATION.md`.

---

## 📊 Estado Actual (Fase 0 - COMPLETADA)

```text
✅ Migración a Expo Bare Workflow
✅ Integración expo-roomplan@1.2.1
✅ Hook useRoomPlan implementado
✅ RoomPlanTestScreen funcional
✅ Export USDZ automático
✅ Sin módulos nativos manuales

Progress: 100% ✅
```

**Implementación final:** `expo-roomplan` oficial de Expo, eliminando la necesidad de código Swift/Objective-C manual. App compila sin errores.

---

## 🔧 Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend** | React Native 0.81.5, Expo 54.0.27 (Bare Workflow), TypeScript 5.9.2 |
| **AR Core** | RoomPlan API (iOS 16+) vía expo-roomplan |
| **RoomPlan** | `expo-roomplan@1.2.1` (módulo oficial Expo) |
| **Native** | Autolink vía Expo Modules (sin código Swift/ObjC manual) |
| **State** | React Hooks, `useRoomPlan` (async/await) |
| **Build** | Metro Bundler, CocoaPods, Xcode |

---

## 🚀 Próximas Fases (Post-Fase 0)

**Fase 1: Model Loading & Alignment** (2-3 weeks)

- Upload modelos 3D (USDZ/glTF)
- Alineación con espacio escaneado
- Transformación (scale, rotate, position)

**Fase 2: AR Visualization** (3-4 weeks)

- Renderizar modelo en AR
- Occlusion con depth buffer
- 6DOF tracking contínuo
- Navigation dentro del modelo

**Fase 3: Professional Features** (2-3 weeks)

- Cambio de materiales
- Sistema de mediciones
- Screenshots
- Comparación de variantes

**Fase 4: Polish & Testing** (1-2 weeks)

- Optimización y performance
- Testing en devices reales
- Demo content
- Onboarding UX

---

## 🔗 Enlaces Rápidos

- **GitHub:** <https://github.com/Kevinparra535/creativedev.ar-tech>
- **Branch Activa:** `feature/bare-workflow-migration`
- **Device Testing:** iPhone 14 Pro Max (LiDAR disponible)

---

## ❓ Dudas Frecuentes

**P: ¿Por qué Three.js fue removido?**
R: RoomPlan API y ARKit proporcionan mejor performance y precisión para AR nativo. Three.js era innecesario.

**P: ¿Cuándo estará listo para demostrar?**
R: Fin de Paso 9 (USDZ validation + file management). ~1-2 weeks desde hoy.

**P: ¿Funciona en Android?**
R: No. RoomPlan es iOS 16+ only. Android requeriría ARCore scene reconstruction (diferente workflow).

**P: ¿Necesito device con LiDAR para probar?**
R: Sí. RoomPlan **requiere** LiDAR. Simulador no funciona para scanning.

---

**Última actualización:** 2025-12-09
**Mantenido por:** Equipo creativedev.ar-tech
