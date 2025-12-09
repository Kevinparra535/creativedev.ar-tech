# Estado Pre-Migración

**Fecha:** 2025-12-09
**Rama:** master (último commit: b20ad32)
**Nueva rama:** feature/bare-workflow-migration

---

## Versiones

- **Expo CLI:** 54.0.18
- **Expo SDK:** ~54.0.27
- **React Native:** 0.81.5
- **React:** 19.1.0
- **TypeScript:** ~5.9.2

---

## Dependencias Críticas para AR

### Rendering 3D
- `three`: ^0.166.0
- `@react-three/fiber`: ^8.17.10
- `expo-three`: ^8.0.0
- `expo-gl`: ~16.0.8

### AR/Camera
- `expo-camera`: ~17.0.10
- `expo-sensors`: ~15.0.0

### Navigation
- `@react-navigation/native`: ^7.1.8
- `@react-navigation/native-stack`: ^7.8.6
- `@react-navigation/bottom-tabs`: ^7.4.0

---

## Features Actuales Funcionando

- ✅ Modelo 3D renderizado con Three.js
- ✅ expo-camera como fondo
- ✅ Tracking básico con expo-sensors (orientación del dispositivo)
- ✅ Navegación con tabs
- ✅ UI básica de AR

---

## Próximo Paso

Ejecutar `npx expo prebuild` para migrar a Bare Workflow
