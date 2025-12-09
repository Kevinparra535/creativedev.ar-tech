# AR Immersive Experience Platform - POC

Plataforma de experiencias inmersivas en AR para transformar información estática en espacios tridimensionales interactivos.

## 🎯 Objetivo del POC

Este POC demuestra una **app nativa en Expo** para el caso de uso de **arquitectura**, permitiendo a los clientes explorar renders arquitectónicos en 3D con toggle de materiales en tiempo real.

## ✨ Características Implementadas

- ✅ **Render 3D de habitación arquitectónica** con paredes, piso, ventana y mobiliario
- ✅ **Toggle de materiales en tiempo real**: Default, Madera, Concreto
- ✅ **Rotación automática de cámara** para explorar el espacio
- ✅ **UI overlay minimalista** con controles táctiles
- ✅ **Permisos de cámara** configurados para iOS y Android
- ✅ **Iluminación realista** con luces ambientales y direccionales

## 🛠 Stack Tecnológico

- **Framework**: React Native + Expo SDK 54
- **3D Engine**: Three.js (v0.166.0)
- **Expo Modules**:
  - `expo-gl` - WebGL support
  - `expo-three` - Three.js integration
  - `expo-camera` - Camera permissions
  - `expo-sensors` - Device sensors (future use)
- **Navigation**: Expo Router
- **Language**: TypeScript

## 🚀 Instalación y Ejecución

### Pre-requisitos

- Node.js 18+ instalado
- npm o yarn
- Expo CLI
- Dispositivo físico o emulador iOS/Android

### Pasos

1. **Clonar o navegar al proyecto**

```bash
cd creativedev.ar-tech
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Iniciar el servidor de desarrollo**

```bash
npm start
```

4. **Ejecutar en dispositivo**

- **iOS**: Presiona `i` en la terminal o escanea el QR con la app Expo Go
- **Android**: Presiona `a` en la terminal o escanea el QR con la app Expo Go

> **Nota**: Para funcionalidad AR completa (tracking de planos), se requiere compilar una build nativa con Expo EAS.

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

```
creativedev.ar-tech/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Home screen
│   │   ├── explore.tsx        # Explore screen
│   │   ├── ar-view.tsx        # 🔥 AR Experience (POC principal)
│   │   └── _layout.tsx        # Tab navigation layout
│   └── _layout.tsx            # Root layout
├── components/                 # Reusable components
├── constants/                  # Theme and constants
├── hooks/                      # Custom hooks
├── assets/                     # Images and assets
├── app.json                    # 🔧 Expo configuration (permisos AR)
└── package.json               # Dependencies
```

## 🔑 Archivos Clave

### [app/(tabs)/ar-view.tsx](app/(tabs)/ar-view.tsx)
Pantalla principal del POC que contiene:
- Configuración de Three.js scene
- Creación de geometrías arquitectónicas (habitación, muebles)
- Sistema de materiales intercambiables
- Renderizado en GLView
- UI de controles

### [app.json](app.json)
Configuración de permisos:
- `NSCameraUsageDescription` (iOS)
- `CAMERA` permission (Android)
- Plugin `expo-camera` configurado

## 🎨 Materiales Disponibles

| Material | Características |
|----------|----------------|
| **Default** | Paredes blancas (#F5F5F5), piso gris (#CCCCCC), estilo minimalista |
| **Madera** | Paredes tonos cálidos (#D4A574), piso marrón oscuro (#8B4513), textura rústica |
| **Concreto** | Paredes gris medio (#808080), piso gris oscuro (#606060), estilo industrial |

## 🧪 Próximos Pasos (Roadmap)

- [ ] Integración de giroscopio para controlar cámara con movimiento del dispositivo
- [ ] Gestos táctiles (pinch to zoom, pan, rotate)
- [ ] Soporte para cargar modelos GLTF/GLB externos desde backend
- [ ] Tracking de planos AR real usando ARKit/ARCore
- [ ] Anclaje de objetos en el mundo real
- [ ] Mediciones en escala real
- [ ] Captura de screenshots del render
- [ ] Modo de comparación (side-by-side materials)
- [ ] Backend para gestión de proyectos arquitectónicos

## 🏗 Build para Producción

Para compilar una build nativa con ARKit/ARCore:

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

Asegúrate de configurar `eas.json` antes de compilar.

## 📊 Diferenciador vs Competencia

A diferencia de herramientas como Fologram o ARki, este POC demuestra:
- **Zero backend inicial**: Todo el render se genera en cliente
- **Cambio de materiales instantáneo**: No requiere recargar modelos
- **UI minimalista**: Enfocada en la experiencia, no en herramientas complejas
- **Escalabilidad**: Preparado para conectar con CMS de contenido arquitectónico

## 🏗️ Arquitectura del Proyecto

Este proyecto sigue **clean architecture** con clara separación de responsabilidades:

```
src/
├── ui/                 # Capa de UI
│   ├── screens/        # Pantallas de la app
│   ├── components/     # Componentes reutilizables
│   ├── navigation/     # Configuración de navegación (React Navigation)
│   └── theme/          # Tema y estilos
├── domain/             # Capa de lógica de negocio
│   ├── entities/       # Entidades de negocio
│   └── usecases/       # Casos de uso
├── data/               # Capa de datos
│   ├── repositories/   # Implementaciones de repositorios
│   └── datasources/    # Fuentes de datos (API, local, etc.)
└── core/               # Capa compartida
    ├── hooks/          # React hooks compartidos
    ├── utils/          # Funciones utilitarias
    └── constants/      # Constantes de la app
```

### Navegación

- Usa **React Navigation 7** con type-safe routing
- `AppNavigator.tsx` - Navegador raíz
- `TabNavigator.tsx` - Navegación por pestañas
- Definiciones de tipos en `navigation/types.ts`

### Sistema de Temas

Los componentes se adaptan automáticamente a modo claro/oscuro:
- Colores: `src/ui/theme/colors.ts`
- Fuentes: `src/ui/theme/fonts.ts`
- Componentes temáticos: `ThemedText`, `ThemedView`

## 📄 Licencia

Proyecto POC privado - CreativeDev.ar

---

**Desarrollado con** ❤️ **usando Expo + Three.js + React Navigation**
