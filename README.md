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
├── src/                       # Código fuente (clean architecture)
│   ├── ui/                    # Capa de presentación
│   │   ├── screens/           # Pantallas de la app
│   │   ├── components/        # Componentes reutilizables
│   │   ├── navigation/        # Configuración de React Navigation
│   │   └── theme/             # Colores, fuentes y estilos
│   ├── domain/                # Capa de lógica de negocio
│   │   ├── entities/          # Entidades de negocio
│   │   └── usecases/          # Casos de uso
│   ├── data/                  # Capa de acceso a datos
│   │   ├── repositories/      # Implementaciones de repositorios
│   │   └── datasources/       # Fuentes de datos
│   └── core/                  # Capa compartida
│       ├── hooks/             # Custom hooks
│       ├── utils/             # Funciones utilitarias
│       └── constants/         # Constantes
├── assets/                    # Imágenes y assets
├── App.tsx                    # Componente raíz
├── index.js                   # Entry point
├── app.json                   # Configuración de Expo
├── tsconfig.json              # Configuración de TypeScript
├── babel.config.js            # Configuración de Babel
├── package.json               # Dependencias
└── README.md                  # Este archivo
```

## 🔑 Archivos Clave

### `src/ui/navigation/`
- `AppNavigator.tsx` - Navegador raíz con stack de pantallas
- `TabNavigator.tsx` - Navegación por pestañas
- `types.ts` - Tipos type-safe para navegación

### `src/ui/screens/`
- `HomeScreen.tsx` - Pantalla principal
- Otras pantallas específicas de la app

### `src/ui/theme/`
- `colors.ts` - Definiciones de colores para modo claro y oscuro
- `fonts.ts` - Familias de fuentes

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

## 🏗️ Arquitectura del Código

Este proyecto implementa **clean architecture** con clara separación de responsabilidades en la carpeta `src/`:

### Capas

- **UI Layer** (`src/ui/`) - Componentes visuales, pantallas, navegación
- **Domain Layer** (`src/domain/`) - Lógica de negocio, entidades
- **Data Layer** (`src/data/`) - Acceso a datos, repositorios
- **Core Layer** (`src/core/`) - Hooks compartidos, utilidades

### Navegación

- **React Navigation 7** con type-safe routing
- `AppNavigator.tsx` - Navegador raíz
- `TabNavigator.tsx` - Navegación por pestañas
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
