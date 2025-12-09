# AR Immersive Experience Platform - Documentación

**Versión:** 1.0 POC
**Fecha:** 2025-12-08
**Decisión:** App Nativa para Arquitectos (Opción 1)

---

## Índice de Documentación

Esta carpeta contiene toda la documentación técnica y de arquitectura del proyecto POC.

### Documentos Principales

1. **[ARQUITECTURA_POC.md](./ARQUITECTURA_POC.md)**
   - Arquitectura técnica completa
   - Stack tecnológico
   - Estructura de carpetas propuesta
   - Flujo de datos
   - Roadmap de features
   - Métricas de éxito

2. **[PLAN_IMPLEMENTACION.md](./PLAN_IMPLEMENTACION.md)**
   - Guía paso a paso de implementación
   - 4 fases detalladas (15 días)
   - Tareas por día
   - Código de ejemplo
   - Checklists de verificación

3. **[CODIGO_3D_ANTERIOR.md](./CODIGO_3D_ANTERIOR.md)**
   - Análisis del código 3D eliminado (commit `a1bea4b`)
   - Especificaciones técnicas de geometrías
   - Sistema de materiales original
   - Guía de refactorización

---

## Resumen Ejecutivo del Proyecto

### Concepto
Plataforma de experiencias inmersivas en AR que permite a arquitectos presentar renders 3D en escala real usando AR nativo móvil.

### Stack Tecnológico
- **Framework:** React Native 0.81.5 + Expo SDK 54
- **3D Engine:** Three.js 0.166.0 + React Three Fiber 8.17.10
- **AR:** expo-camera + expo-sensors (básico), migrable a ARKit/ARCore
- **Navigation:** React Navigation 7
- **Language:** TypeScript 5.9.2

### Arquitectura en Capas

```
┌─────────────────────────────────────────┐
│         UI Layer (React Native)         │
│  - Screens, Components, Navigation      │
├─────────────────────────────────────────┤
│         Core Layer (Business Logic)     │
│  - 3D Engine, AR Manager, Hooks         │
├─────────────────────────────────────────┤
│         Data Layer (Models & Assets)    │
│  - Geometries, Materials, Constants     │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│      Device APIs (Expo Modules)         │
│  - expo-camera, expo-gl, expo-sensors   │
└─────────────────────────────────────────┘
```

---

## Estado Actual del Proyecto

### ✅ Lo que existe
- Estructura base Expo + React Native
- Sistema de navegación (React Navigation)
- Permisos de cámara configurados
- Dependencias 3D instaladas (Three.js, expo-three)
- TypeScript + alias `@` configurado
- Sistema de temas (colors.ts, fonts.ts)

### ❌ Lo que falta implementar
- Pantallas AR (eliminadas en refactorización)
- Lógica 3D modular
- Sistema de materiales
- Controles AR
- Features profesionales (mediciones, screenshots, etc.)

---

## Plan de Implementación

### Fase 1: Foundation (Días 1-3)
- Recuperar código 3D anterior
- Refactorizar en arquitectura modular
- Crear estructura de carpetas
- Implementar ARScreen básico

**Output:** Sala 3D renderizando con toggle de materiales

---

### Fase 2: AR Integration (Días 4-7)
- Integrar expo-camera como fondo
- Implementar plane detection (simulado o real)
- Agregar controles AR
- Gestos táctiles

**Output:** AR activo con anclaje básico

---

### Fase 3: Features Profesionales (Días 8-12)
- Sistema de mediciones
- Modo día/noche
- Capturas de pantalla
- Variantes de diseño

**Output:** Herramientas premium funcionales

---

### Fase 4: Polish + Testing (Días 13-15)
- Onboarding UX
- Optimización de performance
- Testing en dispositivos reales
- Demo content

**Output:** POC demo-ready

---

## Cómo Usar Esta Documentación

### Si eres Developer:
1. Lee [ARQUITECTURA_POC.md](./ARQUITECTURA_POC.md) primero para contexto general
2. Sigue [PLAN_IMPLEMENTACION.md](./PLAN_IMPLEMENTACION.md) paso a paso
3. Consulta [CODIGO_3D_ANTERIOR.md](./CODIGO_3D_ANTERIOR.md) cuando refactorices

### Si eres Arquitecto de Software:
1. Revisa decisiones técnicas en [ARQUITECTURA_POC.md](./ARQUITECTURA_POC.md)
2. Valida estructura de carpetas propuesta
3. Evalúa trade-offs (Expo Managed vs Bare Workflow)

### Si eres Product Owner:
1. Lee "Concepto Core" y "Propuesta de Valor" en proyecto raíz
2. Revisa "Roadmap de Features" en [ARQUITECTURA_POC.md](./ARQUITECTURA_POC.md)
3. Chequea "Métricas de Éxito del POC"

---

## Estructura de Carpetas (Post-Implementación)

```
creativedev.ar-tech/
├── src/
│   ├── core/                    # Lógica de negocio
│   │   ├── ar/                  # AR Engine
│   │   ├── scene/               # Motor 3D
│   │   ├── hooks/               # Custom hooks
│   │   └── context/             # State global
│   ├── data/                    # Datos y modelos
│   │   ├── models/              # Geometrías y materiales
│   │   ├── assets/              # Assets estáticos
│   │   └── constants/           # Configuraciones
│   └── ui/                      # Interfaz de usuario
│       ├── screens/             # Pantallas
│       ├── components/          # Componentes compartidos
│       ├── navigation/          # Navegación
│       └── theme/               # Tema
├── docs/                        # Esta carpeta
│   ├── README.md                # Este archivo
│   ├── ARQUITECTURA_POC.md
│   ├── PLAN_IMPLEMENTACION.md
│   └── CODIGO_3D_ANTERIOR.md
├── App.tsx
├── package.json
└── tsconfig.json
```

---

## Comandos Útiles

### Development
```bash
# Iniciar proyecto
npm start

# iOS
npm run ios

# Android
npm run android

# Web (si es necesario)
npm run web
```

### Git
```bash
# Ver código 3D anterior
git show a1bea4b:app/\(tabs\)/ar-view.tsx

# Ver cambios del último refactor
git show dc5e662 --stat
```

---

## Decisiones Técnicas Importantes

### ¿Por qué App Nativa primero?
1. Stack existente optimizado (Expo + Three.js)
2. Menor riesgo técnico (código 3D previo funcionaba)
3. Valor percibido más alto (arquitectos pagan más)
4. Tracking AR más preciso que WebXR

### ¿Por qué Expo Managed Workflow?
**Pros:**
- Setup rápido para POC
- Menor fricción de desarrollo
- Hot reload out-of-the-box

**Contras:**
- Plane detection limitado (sin ARKit/ARCore nativo)
- Posible migración a Bare Workflow si POC tiene tracción

**Decisión:** Empezar con Managed, migrar si es necesario

---

## Referencias Externas

### Documentación Técnica
- [Three.js Docs](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Expo GL](https://docs.expo.dev/versions/latest/sdk/gl-view/)
- [Expo Three](https://github.com/expo/expo-three)

### Inspiración
- **IKEA Place App** (AR para muebles)
- **Fologram** (AR para arquitectos)
- **ARki** (Visualización arquitectónica)

---

## Contacto y Contribuciones

Para preguntas o sugerencias sobre la arquitectura del proyecto, consulta los documentos específicos o abre un issue en el repositorio.

---

**Última actualización:** 2025-12-08
**Autor:** Equipo creativedev.ar-tech