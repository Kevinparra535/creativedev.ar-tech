# AR Immersive Experience Platform

**Versión:** 1.0 POC  
**Fecha:** Diciembre 2025  
**Estado:** En desarrollo - Arquitectura UI-First

Plataforma de experiencias inmersivas en AR que permite a arquitectos presentar renders 3D en escala real usando tecnología AR nativa móvil.

---

## 🎯 Concepto del Proyecto

### Caso de Uso Principal: Arquitectura

**Escenario:** Un arquitecto está remodelando un apartamento/casa

1. **Arquitecto** sube modelo 3D a escala real del diseño final
2. **Cliente** visualiza el render 3D con AR en el espacio físico
3. **Cliente** explora diferentes materiales y acabados en tiempo real
4. **Cliente** camina dentro del diseño y experimenta el espacio inmersivamente

### Diferenciador Clave

A diferencia de apps como IKEA Place (colocar objetos), esta plataforma permite **sumergirse en el diseño completo** del espacio arquitectónico.

---

## 📊 Estado Actual del Proyecto

### ✅ Phase 1 (Foundation) - COMPLETADO

- ✅ Base Expo + React Navigation estructura
- ✅ Código 3D anterior recuperado y refactorizado
- ✅ Sistema de materiales implementado
- ✅ Renderizado Three.js funcional

### 🚀 Phase 0 (Bare Workflow Migration) - 88% COMPLETADO

**Paso 7 - RoomPlanView ViewManager Integration ✅ COMPLETADO**
- ✅ ViewManager files (Swift + Objective-C) integrados en Xcode target
- ✅ iOS 16+ availability checks implementados
- ✅ React Native component wrapper funcional
- ✅ useRoomPlan hook con state management
- ✅ RoomPlanTestScreen navegación integrada
- ✅ Commit: `3cd04ea` - ViewManager iOS 16 fix + Xcode integration

**Próximos: Pasos 8-9 (USDZ Validation & File Management)**

**Progreso:** 8/9 pasos completados

```
src/ui/
├── ar/                        # Feature AR completa
│   ├── components/            # ARCanvas, ARControls, MaterialPicker
│   ├── hooks/                 # use3DScene, useARSession, useMaterialToggle
│   └── utils/                 # SceneManager, geometries, materials
├── screens/                   # HomeScreen, ARScreen
├── navigation/                # AppNavigator, TabNavigator
└── theme/                     # colors, fonts
```

### 📝 Código 3D Anterior (Recuperable)

El commit `a1bea4b` contenía una implementación funcional de sala 3D (363 líneas) que fue refactorizada. Incluía:

- Sala arquitectónica completa con paredes, piso, ventana, mesa
- Sistema de materiales intercambiables (Default, Wood, Concrete)
- Iluminación realista y rotación de cámara

Ver [docs/CODIGO_3D_ANTERIOR.md](./docs/CODIGO_3D_ANTERIOR.md) para análisis completo.

## 🛠 Stack Tecnológico

### Core Framework

- **React Native** 0.81.5 + **Expo SDK** 54
- **React** 19 con React Compiler experimental
- **TypeScript** 5.9.2 (strict mode)
- **New Architecture** de React Native habilitada

### 3D & AR

- **Three.js** 0.166.0 - Motor 3D
- **React Three Fiber** 8.17.10 - Integración React/Three.js
- **expo-gl** ~16.0.8 - OpenGL context
- **expo-three** 8.0.0 - Renderer para Expo
- **expo-camera** ~17.0.10 - Acceso a cámara
- **expo-sensors** ~15.0.0 - Giroscopio y acelerómetro

### Navigation & UI

- **React Navigation** 7 con type-safe routing
- **expo-symbols** - SF Symbols (iOS)
- **expo-haptics** - Feedback háptico
- **react-native-reanimated** - Animaciones
- **react-native-gesture-handler** - Gestos táctiles

## 🚀 Instalación y Ejecución

### Pre-requisitos

- **Node.js** 18+
- **npm** o yarn
- **Expo CLI** (se instala automáticamente)
- **Dispositivo físico** (recomendado para AR) o simulador/emulador

### Instalación

```bash
# Navegar al proyecto
cd creativedev.ar-tech

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

### Ejecutar en Plataforma

```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web (preview)
npm run web
```

### Reiniciar Metro Bundler

Después de cambiar `babel.config.js`, siempre reinicia con caché limpia:

```bash
npm start -- --clear
```

> **⚠️ Nota AR:** Para funcionalidad AR avanzada (ARKit/ARCore), se requiere compilar build nativa. El POC actual usa tracking básico con sensores.

## 📱 Uso de la App

1. Al abrir la app, navega a la tab **"AR"** en el bottom navigation
2. Acepta los permisos de cámara cuando se soliciten
3. Observa la habitación arquitectónica renderizada en 3D
4. **Cambia materiales** usando los botones en la parte inferior:
   - **Default**: Paredes blancas, piso gris claro
   - **Madera**: Acabado en madera cálida
   - **Concreto**: Estilo industrial con concreto
5. La cámara rotará automáticamente para mostrar diferentes ángulos de la habitación

## 📂 Estructura del Proyecto

### Arquitectura UI-First

El proyecto sigue un enfoque **UI-First** donde toda la lógica relacionada con AR y 3D está organizada dentro de `src/ui/ar/`:

```text
creativedev.ar-tech/
├── src/ui/                           # Todo el código de la app
│   ├── ar/                           # Feature AR/3D completa
│   │   ├── components/               # Componentes específicos AR
│   │   │   ├── ARCanvas.tsx          # Canvas 3D con GLView
│   │   │   ├── ARControls.tsx        # Botones de control
│   │   │   ├── MaterialPicker.tsx    # Selector de materiales
│   │   │   └── ARPermissionPrompt.tsx
│   │   ├── hooks/                    # Hooks específicos AR/3D
│   │   │   ├── use3DScene.ts         # Lógica Three.js
│   │   │   ├── useARSession.ts       # Gestión sesión AR
│   │   │   ├── useMaterialToggle.ts  # Cambio materiales
│   │   │   └── useDeviceOrientation.ts
│   │   └── utils/                    # Utilidades AR/3D
│   │       ├── SceneManager.ts       # Gestor escena Three.js
│   │       ├── LightingSetup.ts      # Configuración luces
│   │       ├── geometries.ts         # Crear geometrías
│   │       └── materials.ts          # Definiciones materiales
│   ├── screens/                      # Pantallas principales
│   │   ├── HomeScreen.tsx
│   │   └── ARScreen.tsx              # Pantalla AR principal
│   ├── navigation/                   # React Navigation
│   │   ├── AppNavigator.tsx          # Stack navigator
│   │   ├── TabNavigator.tsx          # Bottom tabs
│   │   └── types.ts                  # Type-safe routing
│   └── theme/                        # Sistema de temas
│       ├── colors.ts                 # Paleta claro/oscuro
│       └── fonts.ts                  # Tipografías
├── docs/                             # Documentación técnica
│   ├── README.md                     # Índice documentación
│   ├── ARQUITECTURA_POC.md           # Arquitectura completa
│   ├── ARQUITECTURA_SIMPLIFICADA.md  # UI-First approach
│   ├── PLAN_IMPLEMENTACION.md        # Roadmap 15 días
│   ├── PLAN_AR_INMERSIVO.md          # Plan AR avanzado
│   └── CODIGO_3D_ANTERIOR.md         # Análisis código previo
├── assets/images/                    # Assets estáticos
├── App.tsx                           # Componente raíz
├── index.js                          # Entry point
├── app.json                          # Config Expo
├── babel.config.js                   # Module resolver + alias
├── tsconfig.json                     # TypeScript + paths
├── eslint.config.js                  # ESLint flat config
├── .prettierrc                       # Code formatting
└── package.json                      # Dependencias
```

## 🔑 Archivos Clave

### AR/3D Feature (`src/ui/ar/`)

**Components:**

- `ARCanvas.tsx` - Renderiza escena 3D con GLView + expo-three
- `ARControls.tsx` - Botones para iniciar/detener AR
- `MaterialPicker.tsx` - Selector de materiales (Default/Wood/Concrete)
- `ARPermissionPrompt.tsx` - Manejo de permisos de cámara

**Hooks:**

- `use3DScene.ts` - Encapsula lógica Three.js (scene, camera, renderer)
- `useARSession.ts` - Gestiona ciclo de vida AR (start/stop)
- `useMaterialToggle.ts` - Estado y cambio de materiales
- `useDeviceOrientation.ts` - Tracking con expo-sensors

**Utils:**

- `SceneManager.ts` - Clase principal para gestionar THREE.Scene
- `LightingSetup.ts` - Configuración de luces (ambient, directional)
- `geometries.ts` - Funciones para crear paredes, piso, muebles
- `materials.ts` - Definiciones de materiales PBR

### Navigation (`src/ui/navigation/`)

- `AppNavigator.tsx` - Root stack navigator
- `TabNavigator.tsx` - Bottom tabs (Home, AR)
- `types.ts` - Type-safe navigation params

### Theme (`src/ui/theme/`)

- `colors.ts` - Paleta de colores con soporte dark mode
- `fonts.ts` - Sistema de tipografías

### Config Files

- `babel.config.js` - Module resolver para alias `@/`
- `tsconfig.json` - Paths mapping para imports absolutos
- `eslint.config.js` - ESLint v9 flat config + Prettier
- `.prettierrc` - Reglas de formato de código

## 📍 Importaciones con Alias

El proyecto usa alias `@/` para importaciones absolutas desde `src/`:

```typescript
// ✅ Correcto - Usando alias
import { ThemedText } from '@/ui/components/ThemedText';
import { Colors } from '@/ui/theme/colors';
import { useColorScheme } from '@/core/hooks/use-color-scheme';

// ❌ Evitar - Rutas relativas complejas
import { ThemedText } from '../../../ui/components/ThemedText';
```

**Alias disponibles:**

- `@/ui/*` - UI components, screens, navigation, theme
- `@/domain/*` - Business entities and use cases
- `@/data/*` - Repositories and data sources
- `@/core/*` - Shared hooks, utils, constants

## 🎨 Sistema de Materiales

Los materiales usan `THREE.MeshStandardMaterial` con propiedades PBR (Physically Based Rendering):

| Material | Paredes | Piso | Características |
|----------|---------|------|----------------|
| **Default** | #F5F5F5 | #CCCCCC | Blanco hueso, estilo minimalista |
| **Wood** | #D4A574 | #8B4513 | Tonos cálidos, acabado rústico |
| **Concrete** | #808080 | #606060 | Gris industrial, textura áspera |

**Propiedades:**

- `roughness`: 0.7-0.95 (controla reflectividad)
- `metalness`: 0-0.2 (aspecto metálico)
- Iluminación realista con luces ambient + directional

## 🗺 Roadmap de Implementación

### Fase 1: Foundation (Días 1-3)

- ✅ Estructura base Expo + React Navigation
- 🔄 Recuperar código 3D anterior (commit a1bea4b)
- 🔄 Refactorizar en arquitectura modular UI-First
- 🔄 Implementar ARScreen con renderizado 3D básico
- **Output:** Sala 3D renderizando con toggle de materiales

### Fase 2: AR Integration (Días 4-7)

- ⏳ Integrar expo-camera como fondo AR
- ⏳ Implementar tracking básico con expo-sensors
- ⏳ Agregar controles AR (start/stop)
- ⏳ Gestos táctiles (pinch, rotate, pan)
- **Output:** AR activo con anclaje básico de escena

### Fase 3: Features Profesionales (Días 8-12)

- ⏳ Sistema de mediciones (tap dos puntos)
- ⏳ Modo día/noche (cambio de iluminación)
- ⏳ Capturas de pantalla
- ⏳ Variantes de diseño (comparar versiones)
- **Output:** Herramientas premium funcionales

### Fase 4: Polish + Testing (Días 13-15)

- ⏳ Onboarding UX (tutorial de gestos)
- ⏳ Optimización de performance (lazy loading, caché)
- ⏳ Testing en dispositivos reales (iOS + Android)
- ⏳ Demo content (2-3 proyectos de ejemplo)
- **Output:** POC demo-ready

**Leyenda:** ✅ Completado | 🔄 En progreso | ⏳ Pendiente

### AR Avanzado (Futuro)

Para experiencia AR inmersiva completa (reemplazo de realidad):

- Migrar a Expo Bare Workflow
- Implementar ARKit (iOS) o ARCore (Android)
- Room scanning con RoomPlan API (iOS 16+)
- Spatial alignment y occlusion rendering
- Ver [docs/PLAN_AR_INMERSIVO.md](./docs/PLAN_AR_INMERSIVO.md)

## 🔧 Comandos Útiles

### Development

```bash
# Iniciar dev server
npm start

# Limpiar caché Metro
npm start -- --clear

# Ejecutar en plataformas específicas
npm run ios
npm run android
npm run web
```

### Code Quality

```bash
# Ejecutar linter
npm run lint

# Auto-fix problemas
npm run lint -- --fix

# Formatear código (Prettier automático en ESLint)
```

### Git - Recuperar Código Anterior

```bash
# Ver código 3D anterior (commit a1bea4b)
git show a1bea4b:app/\(tabs\)/ar-view.tsx

# Recuperar en archivo temporal
git show a1bea4b:app/\(tabs\)/ar-view.tsx > temp-ar-view.tsx

# Ver cambios del refactor
git show dc5e662 --stat
```

### Build Nativo (Producción)

Para AR avanzado con ARKit/ARCore:

```bash
# Configurar EAS
eas login
eas build:configure

# Build iOS
eas build --platform ios

# Build Android
eas build --platform android
```

> **Nota:** Se requiere cuenta Expo y configuración de `eas.json`

## 🎯 Diferenciadores Clave

### vs IKEA Place / ARki / Fologram

**Esta plataforma se diferencia por:**

1. **Experiencia inmersiva completa**
   - No solo "colocar objetos"
   - Sumergirse en el diseño arquitectónico completo
   - Reemplazo de la realidad con el render 3D

2. **Cambio de materiales instantáneo**
   - Sin recargar modelos
   - Toggle en tiempo real
   - Comparación visual inmediata

3. **Arquitectura modular y escalable**
   - Código organizado en capas
   - Fácil agregar nuevos materiales/geometrías
   - Preparado para backend futuro

4. **Zero backend inicial**
   - Todo el render en cliente
   - Ideal para POC y demos
   - Migrable a CMS arquitectónico

5. **UI minimalista**
   - Enfocada en la experiencia, no en herramientas complejas
   - Gestos intuitivos
   - Perfecto para presentaciones a clientes

---

## 📄 Licencia

Este es un proyecto POC privado. Todos los derechos reservados.

---

**Última actualización:** Diciembre 2025  
**Versión:** 1.0 POC

## 📚 Documentación Técnica

La carpeta `docs/` contiene documentación completa del proyecto:

### Documentos Principales

1. **[docs/README.md](./docs/README.md)** - Índice de toda la documentación
2. **[docs/ARQUITECTURA_POC.md](./docs/ARQUITECTURA_POC.md)** - Arquitectura técnica completa
   - Stack tecnológico detallado
   - Estructura de carpetas propuesta
   - Flujo de datos
   - Roadmap de features
   - Métricas de éxito

3. **[docs/ARQUITECTURA_SIMPLIFICADA.md](./docs/ARQUITECTURA_SIMPLIFICADA.md)** - UI-First Approach
   - Decisión arquitectónica actual
   - Separación de responsabilidades
   - Ejemplos de código por capa

4. **[docs/PLAN_IMPLEMENTACION.md](./docs/PLAN_IMPLEMENTACION.md)** - Guía paso a paso
   - 4 fases de 15 días
   - Tareas diarias detalladas
   - Código de ejemplo
   - Checklists de verificación

5. **[docs/PLAN_AR_INMERSIVO.md](./docs/PLAN_AR_INMERSIVO.md)** - AR Avanzado
   - Room scanning
   - Spatial alignment
   - Occlusion rendering
   - Análisis técnico ARKit/ARCore

6. **[docs/CODIGO_3D_ANTERIOR.md](./docs/CODIGO_3D_ANTERIOR.md)** - Código 3D Previo
   - Análisis del commit a1bea4b (363 líneas)
   - Especificaciones de geometrías
   - Sistema de materiales original
   - Guía de refactorización

### Cómo Usar la Documentación

**Desarrolladores:** Sigue [PLAN_IMPLEMENTACION.md](./docs/PLAN_IMPLEMENTACION.md) paso a paso

**Arquitectos:** Revisa [ARQUITECTURA_POC.md](./docs/ARQUITECTURA_POC.md) para decisiones técnicas

**Product Owners:** Lee roadmap y métricas de éxito en los docs principales

- Tipos en `navigation/types.ts`

### Sistema de Temas

Los componentes se adaptan automáticamente a modo claro/oscuro:

- Colores: `src/ui/theme/colors.ts`
- Fuentes: `src/ui/theme/fonts.ts`
- Componentes temáticos: `ThemedText`, `ThemedView`

## 📄 Licencia

Proyecto POC privado - CreativeDev.ar

---

**Desarrollado con** ❤️ **usando Expo + Three.js + React Navigation**
