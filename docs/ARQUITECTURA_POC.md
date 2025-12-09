# Arquitectura del POC - AR Immersive Experience Platform

**Fecha:** 2025-12-08
**Versión:** 1.0
**Decisión:** POC de Arquitectura (App Nativa) - Opción 1

---

## Índice

1. [Contexto y Decisión](#contexto-y-decisión)
2. [Estado Actual del Proyecto](#estado-actual-del-proyecto)
3. [Arquitectura Técnica](#arquitectura-técnica)
4. [Estructura de Carpetas](#estructura-de-carpetas)
5. [Plan de Implementación](#plan-de-implementación)
6. [Stack Tecnológico](#stack-tecnológico)
7. [Flujo de Datos](#flujo-de-datos)
8. [Roadmap de Features](#roadmap-de-features)

---

## Contexto y Decisión

### ¿Por qué App Nativa primero?

**Razones estratégicas:**
1. ✅ **Infraestructura existente**: Ya tenemos Expo + Three.js + permisos de cámara configurados
2. ✅ **Menor riesgo técnico**: Código 3D previo funcionaba (commit `a1bea4b`)
3. ✅ **Valor percibido alto**: Arquitectos pagan más por herramientas profesionales
4. ✅ **Tracking preciso**: ARKit/ARCore superior a WebXR
5. ✅ **Path to MVP claro**: Dominar AR nativo primero, luego migrar a web

### Objetivo del POC

**Crear una app móvil nativa que permita:**
- Visualizar renders arquitectónicos en AR a escala real
- Caminar físicamente explorando el espacio
- Cambiar materiales/acabados en tiempo real
- Tomar mediciones y capturas de pantalla
- Demostrar valor tangible a arquitectos y sus clientes

---

## Estado Actual del Proyecto

### Lo que tenemos instalado

```json
{
  "@react-three/fiber": "^8.17.10",
  "expo": "~54.0.27",
  "expo-camera": "~17.0.10",
  "expo-gl": "~16.0.8",
  "expo-sensors": "~15.0.0",
  "expo-three": "^8.0.0",
  "react-native": "0.81.5",
  "three": "^0.166.0"
}
```

### Lo que existe actualmente

**Estructura base:**
```
creativedev.ar-tech/
├── src/ui/
│   ├── navigation/
│   │   ├── AppNavigator.tsx      # Stack navigator configurado
│   │   ├── TabNavigator.tsx      # Bottom tabs (solo Home activo)
│   │   └── types.ts              # Type definitions
│   ├── screens/
│   │   └── HomeScreen.tsx        # Pantalla vacía (solo "Hola")
│   └── theme/
│       ├── colors.ts             # Tema claro/oscuro
│       └── fonts.ts              # Sistema de fuentes
├── App.tsx                       # Root component
├── app.json                      # Permisos de cámara configurados ✅
└── package.json
```

**Estado de navegación:**
- React Navigation v7 configurado
- Un solo tab (Home) activo
- Permisos de cámara en app.json listos
- TypeScript + alias `@` configurado

### Código 3D anterior (ELIMINADO pero recuperable)

**Commit `a1bea4b` contenía:**
- Pantalla `ar-view.tsx` (363 líneas) con sala 3D completa
- THREE.Scene con paredes, piso, ventana, mesa con patas
- Sistema de materiales intercambiables (Default, Wood, Concrete)
- Rotación automática de cámara
- Iluminación configurada
- Renderizado con GLView + expo-three

**Estado actual:** Eliminado en commit `dc5e662` por refactorización

---

## Arquitectura Técnica

### Stack Completo

```
┌─────────────────────────────────────────┐
│         FRONTEND (React Native)         │
├─────────────────────────────────────────┤
│  UI Layer                               │
│  - Screens (AR, Home, Settings)         │
│  - Components (Controls, HUD)           │
│  - Navigation (React Navigation)        │
├─────────────────────────────────────────┤
│  Core Layer                             │
│  - 3D Engine (Three.js + expo-three)    │
│  - AR Manager (Camera + Sensors)        │
│  - State Management (Context API)       │
│  - Hooks personalizados                 │
├─────────────────────────────────────────┤
│  Data Layer                             │
│  - Models (Geometrías 3D)               │
│  - Materials (Sistema de materiales)    │
│  - Assets (GLB files)                   │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│       DEVICE APIs (Expo Modules)        │
├─────────────────────────────────────────┤
│  - expo-camera (Acceso a cámara)        │
│  - expo-sensors (Gyro, Accel)           │
│  - expo-gl (OpenGL context)             │
│  - expo-three (Three.js renderer)       │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│      NATIVE AR (ARKit / ARCore)         │
│  - Plane Detection                      │
│  - 6DOF Tracking                        │
│  - Light Estimation                     │
└─────────────────────────────────────────┘
```

### Principios de Diseño

1. **Separación de concerns**: UI, lógica 3D, y AR en capas independientes
2. **Modularidad**: Cada feature en su propio módulo
3. **Type-safety**: TypeScript estricto en todo el proyecto
4. **Performance-first**: Optimización de renders y geometrías
5. **Testability**: Hooks y lógica separados de componentes visuales

---

## Estructura de Carpetas

### Arquitectura propuesta (Post-implementación)

```
creativedev.ar-tech/
│
├── src/
│   ├── core/                           # Lógica de negocio
│   │   ├── ar/                         # AR Engine
│   │   │   ├── ARManager.ts            # Coordinador AR principal
│   │   │   ├── CameraController.ts     # Control de cámara
│   │   │   ├── PlaneDetector.ts        # Detección de superficies
│   │   │   └── types.ts                # Tipos AR
│   │   │
│   │   ├── scene/                      # Motor 3D
│   │   │   ├── SceneManager.ts         # Gestor de escena Three.js
│   │   │   ├── LightingController.ts   # Sistema de iluminación
│   │   │   ├── MaterialController.ts   # Cambio de materiales
│   │   │   └── types.ts                # Tipos 3D
│   │   │
│   │   ├── hooks/                      # Custom hooks
│   │   │   ├── use3DScene.ts           # Hook para escenas 3D
│   │   │   ├── useARSession.ts         # Hook para sesiones AR
│   │   │   ├── useMaterialToggle.ts    # Toggle de materiales
│   │   │   └── useGestures.ts          # Gestos táctiles
│   │   │
│   │   └── context/                    # State global
│   │       ├── ARContext.tsx           # Contexto AR
│   │       └── SceneContext.tsx        # Contexto de escena
│   │
│   ├── data/                           # Datos y modelos
│   │   ├── models/                     # Definiciones 3D
│   │   │   ├── geometries/             # Primitivos geométricos
│   │   │   │   ├── ArchitecturalRoom.ts
│   │   │   │   ├── Furniture.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── materials/              # Sistema de materiales
│   │   │       ├── MaterialLibrary.ts  # Librería de materiales
│   │   │       ├── presets.ts          # Presets (Wood, Concrete, etc)
│   │   │       └── index.ts
│   │   │
│   │   ├── assets/                     # Assets estáticos
│   │   │   └── models/                 # Archivos GLB/GLTF
│   │   │
│   │   └── constants/                  # Configuraciones
│   │       ├── ar-config.ts            # Config AR
│   │       └── scene-config.ts         # Config 3D
│   │
│   └── ui/                             # Interfaz de usuario
│       ├── screens/                    # Pantallas principales
│       │   ├── HomeScreen.tsx          # Home (existente)
│       │   │
│       │   ├── ARScreen/               # Pantalla AR principal
│       │   │   ├── ARScreen.tsx        # Componente principal
│       │   │   ├── components/         # Componentes AR
│       │   │   │   ├── ARCanvas.tsx    # Canvas 3D/AR
│       │   │   │   ├── ARControls.tsx  # Controles AR
│       │   │   │   ├── MaterialPicker.tsx
│       │   │   │   └── MeasurementTool.tsx
│       │   │   └── styles.ts
│       │   │
│       │   └── ProjectListScreen/     # Lista de proyectos
│       │       ├── ProjectListScreen.tsx
│       │       └── components/
│       │
│       ├── components/                 # Componentes compartidos
│       │   ├── shared/
│       │   │   ├── Button.tsx
│       │   │   ├── Card.tsx
│       │   │   └── LoadingSpinner.tsx
│       │   │
│       │   └── ar/                     # Componentes AR reutilizables
│       │       ├── ARPermissionPrompt.tsx
│       │       └── ARCalibrationGuide.tsx
│       │
│       ├── navigation/                 # Navegación (existente)
│       │   ├── AppNavigator.tsx
│       │   ├── TabNavigator.tsx
│       │   └── types.ts                # Actualizar con nuevas rutas
│       │
│       └── theme/                      # Tema (existente)
│           ├── colors.ts
│           └── fonts.ts
│
├── docs/                               # Documentación
│   ├── ARQUITECTURA_POC.md             # Este archivo
│   ├── PLAN_IMPLEMENTACION.md          # Plan detallado
│   └── API_REFERENCE.md                # Referencia de APIs
│
├── App.tsx                             # Root component
├── app.json                            # Config Expo
├── package.json
└── tsconfig.json
```

### Justificación de la estructura

**`src/core/`** → Lógica de negocio pura, sin dependencias de UI
- Testeable independientemente
- Reutilizable en web si migramos

**`src/data/`** → Separación de datos y modelos
- Assets 3D centralizados
- Fácil agregar nuevos materiales/geometrías

**`src/ui/`** → Todo lo visual
- Componentes React Native puros
- Screens organizadas por feature

---

## Plan de Implementación

### Fase 1: Foundation (Días 1-3)

**Objetivo:** Recuperar y mejorar el código 3D anterior

**Tareas:**
1. Recuperar `ar-view.tsx` del commit `a1bea4b`
2. Refactorizar en arquitectura modular:
   - Extraer lógica Three.js a `SceneManager.ts`
   - Crear hook `use3DScene.ts`
   - Separar geometrías a `data/models/`
3. Crear `ARScreen.tsx` en nueva estructura
4. Implementar navegación hacia pantalla AR
5. Verificar rendering 3D funcional

**Criterio de éxito:**
- ✅ Sala 3D renderiza correctamente
- ✅ Toggle de materiales funciona
- ✅ Performance estable (60 FPS)

---

### Fase 2: AR Integration (Días 4-7)

**Objetivo:** Integrar AR real con plane detection

**Tareas:**
1. Crear `ARManager.ts` con expo-camera
2. Implementar `PlaneDetector.ts` para superficies
3. Anclar escena 3D en mundo real
4. Implementar controles gestuales:
   - Pinch to zoom
   - Two-finger rotate
   - Pan to move
5. Calibración inicial (guía UX)

**Criterio de éxito:**
- ✅ Escena se ancla en superficie detectada
- ✅ Escala 1:1 con mundo real
- ✅ Gestos funcionan fluídamente

**Nota técnica:**
```typescript
// Expo no tiene soporte nativo completo de ARKit/ARCore
// Alternativa: Usar expo-camera + expo-sensors para tracking básico
// O evaluar migrar a React Native CLI con react-native-arkit/arcore
```

---

### Fase 3: Features Profesionales (Días 8-12)

**Objetivo:** Herramientas que justifican valor premium

**Tareas:**
1. **Sistema de mediciones**
   - Tap dos puntos para medir distancia
   - Mostrar dimensiones en metros

2. **Modo día/noche**
   - Toggle de iluminación
   - Simular diferentes horas del día

3. **Capturas de pantalla**
   - Botón para screenshot
   - Guardar en galería del dispositivo

4. **Variantes de diseño**
   - Comparar 2-3 versiones del proyecto
   - Swipe entre variantes

**Criterio de éxito:**
- ✅ Arquitecto puede medir espacios
- ✅ Cliente puede ver proyecto en diferentes condiciones
- ✅ Capturas de alta calidad

---

### Fase 4: Polish + Testing (Días 13-15)

**Objetivo:** Preparar para demo con clientes reales

**Tareas:**
1. **Onboarding UX**
   - Tutorial inicial de gestos
   - Guía de calibración AR

2. **Optimización**
   - Lazy loading de modelos 3D
   - Caché de geometrías
   - Reducir draw calls

3. **Testing**
   - Probar en iPhone y Android
   - Diferentes condiciones de luz
   - Performance profiling

4. **Demo content**
   - Crear 2-3 proyectos de ejemplo
   - Assets 3D optimizados

**Criterio de éxito:**
- ✅ App no crashea
- ✅ Performance consistente (>30 FPS mínimo)
- ✅ UX clara para no técnicos

---

## Stack Tecnológico

### Core Dependencies

```json
{
  "react-native": "0.81.5",
  "expo": "~54.0.27",
  "three": "^0.166.0",
  "@react-three/fiber": "^8.17.10",
  "expo-three": "^8.0.0",
  "expo-gl": "~16.0.8"
}
```

### AR & Sensors

```json
{
  "expo-camera": "~17.0.10",
  "expo-sensors": "~15.0.0",
  "react-native-gesture-handler": "~2.28.0",
  "react-native-reanimated": "~4.1.1"
}
```

### Navigation

```json
{
  "@react-navigation/native": "^7.1.8",
  "@react-navigation/native-stack": "^7.8.6",
  "@react-navigation/bottom-tabs": "^7.4.0"
}
```

### Development

```json
{
  "typescript": "~5.9.2",
  "@types/three": "^0.181.0"
}
```

### Consideraciones de AR Nativo

**Limitación actual de Expo:**
- Expo Managed Workflow no soporta ARKit/ARCore nativos completamente
- expo-camera + expo-sensors permiten AR básico (markerless tracking limitado)

**Opciones:**
1. **POC con Expo actual** (más rápido): AR básico sin plane detection nativo
2. **Migrar a Expo Bare Workflow**: Acceso a módulos nativos ARKit/ARCore
3. **Evaluar alternativas**: ViroReact, react-native-arkit (requiere eject)

**Recomendación para POC:** Empezar con Expo actual, evaluar migración si el POC tiene tracción

---

## Flujo de Datos

### Arquitectura de Estado

```
┌──────────────────────────────────────────────────┐
│              ARContext (Global)                  │
│  - isARActive: boolean                           │
│  - planeDetected: boolean                        │
│  - currentProject: Project | null               │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│           SceneContext (Global)                  │
│  - scene: THREE.Scene                            │
│  - camera: THREE.Camera                          │
│  - selectedMaterial: MaterialType                │
│  - lightingMode: 'day' | 'night'                 │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│              ARScreen Component                  │
│  ├─ use3DScene() hook                            │
│  ├─ useARSession() hook                          │
│  ├─ useMaterialToggle() hook                     │
│  └─ useGestures() hook                           │
└──────────────────────────────────────────────────┘
                    ↓
┌────────────────────┬─────────────────────────────┐
│    ARCanvas        │    ARControls               │
│  (GLView render)   │  (UI overlay)               │
│  - Renders 3D      │  - Material picker          │
│  - Handles camera  │  - Measurement tool         │
│                    │  - Screenshot button        │
└────────────────────┴─────────────────────────────┘
```

### Flujo de usuario típico

```
1. Usuario abre app
   ↓
2. HomeScreen → Tap "Ver Proyecto AR"
   ↓
3. ARScreen se monta
   ↓
4. ARPermissionPrompt (si es primera vez)
   ↓
5. Cámara se activa → Busca superficie
   ↓
6. PlaneDetector detecta piso/mesa
   ↓
7. Escena 3D se ancla en superficie
   ↓
8. Usuario puede:
   - Cambiar materiales (MaterialPicker)
   - Medir espacios (MeasurementTool)
   - Toggle día/noche (LightingController)
   - Screenshot (SaveButton)
   ↓
9. Usuario sale → Escena se limpia
```

---

## Roadmap de Features

### MVP (Semanas 1-2)

- [x] Rendering 3D básico funcional
- [ ] Sala arquitectónica 3D renderizada
- [ ] Toggle de 3 materiales (Default, Wood, Concrete)
- [ ] Cámara AR activada
- [ ] Anclaje básico en superficie

### POC Demo-Ready (Semanas 3-4)

- [ ] Plane detection confiable
- [ ] Gestos táctiles (rotate, zoom, pan)
- [ ] Sistema de mediciones
- [ ] Capturas de pantalla
- [ ] Modo día/noche
- [ ] Onboarding UX

### Post-POC (Futuro)

- [ ] Upload de proyectos custom (arquitecto sube GLB)
- [ ] Múltiples proyectos guardados
- [ ] Anotaciones en AR (sticky notes 3D)
- [ ] Compartir sesión AR (multiplayer)
- [ ] Exportar video walkthrough
- [ ] Integración con plataformas de renders (Enscape, V-Ray)

### Migración a Web (Paralelo)

Una vez validado el POC nativo:

- [ ] Fork del proyecto a Next.js + React Three Fiber
- [ ] Implementar WebXR con `@react-three/xr`
- [ ] Crear versión simplificada para restaurantes
- [ ] Deploy en Vercel con CDN para assets

---

## Métricas de Éxito del POC

### Técnicas

- ✅ **Performance:** Min 30 FPS en dispositivos mid-range
- ✅ **Latency:** <100ms de lag en cambio de materiales
- ✅ **Stability:** 0 crashes en sesión de 10 minutos
- ✅ **Compatibility:** Funciona en iPhone 12+ y Android 11+

### Negocio

- ✅ **Engagement:** Usuario promedio pasa >3 minutos en AR
- ✅ **Conversión:** 2/3 arquitectos que ven demo quieren probarlo
- ✅ **Feedback:** NPS >8 en encuestas post-demo
- ✅ **Diferenciación:** "Nunca vi algo así" en 80%+ de demos

---

## Próximos Pasos Inmediatos

1. ✅ Leer y entender esta documentación
2. [ ] Recuperar código 3D del commit `a1bea4b`
3. [ ] Crear estructura de carpetas propuesta
4. [ ] Refactorizar código 3D en arquitectura modular
5. [ ] Implementar ARScreen con navegación

---

## Referencias y Recursos

### Documentación Técnica

- [Three.js Docs](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Expo GL](https://docs.expo.dev/versions/latest/sdk/gl-view/)
- [Expo Three](https://github.com/expo/expo-three)
- [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/)

### Inspiración

- **Aesop Store AR Experience**
- **IKEA Place App**
- **Fologram** (AR para arquitectos)
- **ARki** (Visualización arquitectónica)

### Assets 3D

- [Sketchfab](https://sketchfab.com/) (modelos gratuitos/premium)
- [Poly Haven](https://polyhaven.com/) (texturas PBR)
- [Three.js Examples](https://threejs.org/examples/) (geometrías de referencia)

---

**Documento vivo:** Este archivo se actualiza conforme avanza la implementación.

**Última actualización:** 2025-12-08
**Autor:** Equipo creativedev.ar-tech
