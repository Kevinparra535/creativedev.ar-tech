# Copilot Instructions for creativedev.ar-tech

## Project Overview

**AR Immersive Experience Platform** - React Native app for architectural AR visualization built with Expo SDK 54, React 19, TypeScript (strict mode), and Three.js. Enables architects to present 3D renders at real scale using native mobile AR.

**Version:** 1.0 POC  
**Status:** In Development - UI-First Architecture

### Core Concept

This platform allows architects to showcase interior designs immersively:
1. Architect uploads real-scale 3D model
2. Client visualizes the 3D render with AR overlay
3. Client explores different materials/finishes in real-time
4. Client walks through the design experiencing the space immersively

### Key Differentiator

Unlike "tap-to-place" AR apps (IKEA Place), this provides **full spatial immersion** - replacing reality with complete architectural design.

---

## Architecture

### UI-First Structure

**Current Decision:** All AR/3D logic lives within `src/ui/ar/` for simplified POC development.

```
src/ui/
├── ar/                        # Complete AR/3D feature
│   ├── components/            # AR-specific UI components
│   │   ├── ARCanvas.tsx       # 3D canvas with GLView
│   │   ├── ARControls.tsx     # Start/stop AR controls
│   │   ├── MaterialPicker.tsx # Material selector
│   │   └── ARPermissionPrompt.tsx
│   ├── hooks/                 # AR/3D business logic hooks
│   │   ├── use3DScene.ts      # Three.js scene management
│   │   ├── useARSession.ts    # AR session lifecycle
│   │   ├── useMaterialToggle.ts # Material switching
│   │   └── useDeviceOrientation.ts
│   └── utils/                 # AR/3D utilities
│       ├── SceneManager.ts    # Three.js Scene manager
│       ├── LightingSetup.ts   # Lighting configuration
│       ├── geometries.ts      # Geometry creation functions
│       └── materials.ts       # Material definitions (PBR)
├── screens/                   # Main screens
│   ├── HomeScreen.tsx
│   └── ARScreen.tsx          # Main AR screen
├── navigation/                # React Navigation
│   ├── AppNavigator.tsx
│   ├── TabNavigator.tsx
│   └── types.ts
└── theme/
    ├── colors.ts
    └── fonts.ts
```

**Principles:**
- **Separation of Concerns**: Components (UI) → Hooks (logic) → Utils (helpers)
- **Feature-based**: AR/3D is self-contained feature in `ui/ar/`
- **Shared vs Specific**: Global components in `ui/components/`, AR-specific in `ui/ar/components/`

### Navigation (@react-navigation v7)

Type-safe navigation with React Navigation:
- `src/ui/navigation/AppNavigator.tsx` - Root stack navigator
- `src/ui/navigation/TabNavigator.tsx` - Bottom tabs (Home, AR)
- `src/ui/navigation/types.ts` - TypeScript param lists

**Navigation Pattern:**
```tsx
// Type definitions in types.ts
export type RootStackParamList = {
  Tabs: undefined;
  ARView: { projectId?: string };
};

export type TabParamList = {
  Home: undefined;
  AR: undefined;
};

// Usage with hooks
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '@/ui/navigation/types';

const navigation = useNavigation<NavigationProp<RootStackParamList>>();
navigation.navigate('ARView', { projectId: '123' });
```

### Theming System

Central theme management with automatic light/dark mode support:
- `src/ui/theme/colors.ts` - Color palette for both modes
- `src/ui/theme/fonts.ts` - Typography definitions
- Components can accept `lightColor` and `darkColor` props to override defaults

**Example:**
```tsx
import { Colors } from '@/ui/theme/colors';
import { useColorScheme } from 'react-native';

const MyComponent = () => {
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  
  return <View style={{ backgroundColor }} />;
};
```

### Component Conventions

**UI Organization:**
- Global shared components → `src/ui/components/shared/`
- AR/3D specific components → `src/ui/ar/components/`
- Screen components → `src/ui/screens/`

**AR Component Patterns:**

1. **ARCanvas** - Renders 3D scene using GLView + expo-three
   ```tsx
   import { GLView } from 'expo-gl';
   import { Renderer } from 'expo-three';
   import { use3DScene } from '@/ui/ar/hooks/use3DScene';
   ```

2. **Controlled Components** - AR controls accept props, no internal state
   ```tsx
   interface ARControlsProps {
     isActive: boolean;
     onStart: () => void;
     onStop: () => void;
   }
   ```

3. **Hook-based Logic** - Business logic in custom hooks, not components
   - `use3DScene.ts` - Three.js scene setup
   - `useARSession.ts` - AR lifecycle (permissions, start/stop)
   - `useMaterialToggle.ts` - Material state management

**Platform-Specific Files:**
- Use `.ios.tsx`, `.android.tsx`, `.web.tsx` suffixes for platform overrides
- Example: `IconSymbol.ios.tsx` uses expo-symbols for SF Symbols

### Import Paths

Use `@/` alias for absolute imports (configured in `tsconfig.json` and `babel.config.js`):

```tsx
// UI imports
import { ARScreen } from '@/ui/screens/ARScreen';
import { ARCanvas } from '@/ui/ar/components/ARCanvas';
import { MaterialPicker } from '@/ui/ar/components/MaterialPicker';

// Hooks
import { use3DScene } from '@/ui/ar/hooks/use3DScene';
import { useARSession } from '@/ui/ar/hooks/useARSession';

// Utils and config
import { SceneManager } from '@/ui/ar/utils/SceneManager';
import { createRoom } from '@/ui/ar/utils/geometries';
import { getMaterial } from '@/ui/ar/utils/materials';

// Theme
import { Colors } from '@/ui/theme/colors';
import { Fonts } from '@/ui/theme/fonts';

// Navigation types
import type { RootStackParamList } from '@/ui/navigation/types';
```

**Current Alias Mapping:**
- `@/ui/*` - All UI code (screens, components, navigation, theme, ar)
- Future: `@/domain/*`, `@/data/*`, `@/core/*` (when migrating from UI-First)

## Development Workflow

### Running the App

```bash
# Start Expo dev server
npm start

# Clear Metro cache (after babel.config.js changes)
npm start -- --clear

# Platform-specific
npm run ios       # iOS Simulator
npm run android   # Android Emulator
npm run web       # Web preview
```

**Dev Tools:**
- iOS: `cmd+d` to open developer menu
- Android: `cmd+m` to open developer menu
- Web: `F12` for browser DevTools

### Code Quality

```bash
# Run linter
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

- ESLint flat config (v9) with `eslint-config-expo`
- Prettier integrated (auto-formats on lint)
- `simple-import-sort` for automatic import organization
- TypeScript strict mode enabled

### Import Sorting (simple-import-sort)

Imports are automatically organized:
1. React and external dependencies
2. Internal UI components (AR, screens, navigation)
3. Theme and styling
4. Custom hooks and utilities
5. Assets and types
6. Relative imports

### Recovering Previous 3D Code

The commit `a1bea4b` contained functional 3D room code (363 lines):

```bash
# View previous AR implementation
git show a1bea4b:app/\(tabs\)/ar-view.tsx

# Recover to temp file
git show a1bea4b:app/\(tabs\)/ar-view.tsx > temp-ar-view.tsx
```

See `docs/CODIGO_3D_ANTERIOR.md` for detailed analysis.

## Platform-Specific Considerations

### iOS
- **ARKit Integration (Future)**: For advanced AR, requires Expo Bare Workflow
- **SF Symbols**: Use `expo-symbols` for native icons (iOS 13+)
- **Haptic Feedback**: `expo-haptics` with `HapticTab` wrapper
- **Permissions**: Camera permissions configured in `app.json`
- **Performance**: ARKit provides superior tracking vs Android

### Android
- **ARCore Integration (Future)**: Requires Expo Bare Workflow
- **Material Icons**: Fallback for SF Symbols
- **Adaptive Icons**: Configured with foreground/background/monochrome
- **Edge-to-edge**: Enabled, predictive back gesture disabled
- **Permissions**: Camera runtime permissions handled

### Web
- **WebGL**: Three.js works via `expo-gl` and WebGL context
- **Limited AR**: No native AR APIs (WebXR is future consideration)
- **Static Output**: `web.output: "static"` configured
- **react-native-web**: Enables cross-platform components

### Current AR Approach

**POC Phase (Expo Managed Workflow):**
- Camera background: `expo-camera`
- Basic tracking: `expo-sensors` (gyroscope, accelerometer)
- 3D rendering: Three.js with `expo-three`
- **Limitation**: No plane detection, spatial mapping, or occlusion

**Future Advanced AR (Requires Migration):**
- Move to Expo Bare Workflow or React Native CLI
- Integrate ARKit (iOS) / ARCore (Android) native modules
- Room scanning with RoomPlan API (iOS 16+)
- Spatial anchors and occlusion rendering
- See `docs/PLAN_AR_INMERSIVO.md` for details

## Key Dependencies

### Core Framework
- **react-native** 0.81.5
- **expo** ~54.0.27
- **react** 19 (with experimental React Compiler)
- **typescript** 5.9.2

### 3D & AR Stack
- **three** ^0.166.0 - 3D engine
- **@react-three/fiber** ^8.17.10 - React integration for Three.js
- **expo-gl** ~16.0.8 - OpenGL ES context
- **expo-three** ^8.0.0 - Three.js renderer for Expo
- **expo-camera** ~17.0.10 - Camera access and permissions
- **expo-sensors** ~15.0.0 - Gyroscope, accelerometer

### Navigation & UI
- **@react-navigation/native** 7.x - Navigation framework
- **@react-navigation/bottom-tabs** - Bottom tab navigator
- **@react-navigation/native-stack** - Stack navigator
- **@react-navigation/elements** - Navigation UI primitives
- **expo-symbols** - SF Symbols (iOS)
- **@expo/vector-icons** - Icon library
- **expo-haptics** - Haptic feedback

### Animations & Gestures
- **react-native-reanimated** ~4.1.1
- **react-native-gesture-handler** ~2.28.0

### Development Tools
- **babel-plugin-module-resolver** - Import alias support
- **eslint-plugin-prettier** - Code formatting
- **eslint-plugin-simple-import-sort** - Auto-organize imports
- **prettier** - Code formatter

## Configuration Files

### `babel.config.js`
Configures module resolution and Babel plugins:
```javascript
module.exports = {
  plugins: [
    ['module-resolver', { alias: { '@': './src' } }],
    'react-native-reanimated/plugin',
  ],
};
```

### `tsconfig.json`
Configures TypeScript path aliases and compiler options:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### `eslint.config.js`
ESLint configuration with Prettier and simple-import-sort:
- Integrates Prettier for code formatting
- Organizes imports automatically
- Extends expo config with React best practices
- Disables conflicting rules for TypeScript projects

### `.prettierrc`
Prettier configuration:
```json
{
  "printWidth": 99,
  "singleQuote": true,
  "trailingComma": "none",
  "tabWidth": 2,
  "semi": true,
  "useTabs": false
}
```

## Experimental Features & Configuration

### React 19 Features
- `experiments.reactCompiler: true` - Automatic optimization enabled
- New Architecture for better performance
- Forward compatibility with React 19 patterns

### Asset Management
- Images: `assets/images/` - Use `require('@/assets/images/...')` or `expo-image`
- 3D Models: Future support for GLB/GLTF files
- Icons: Adaptive icons configured in `app.json` for iOS/Android
- Splash screen: Configured via Expo plugins

---

## AR/3D Technical Details

### Three.js Scene Structure

**Materials System (PBR):**
- `THREE.MeshStandardMaterial` with `roughness` and `metalness`
- Material presets: Default, Wood, Concrete
- Defined in `src/ui/ar/utils/materials.ts`

**Geometries:**
- Architectural room components (walls, floor, ceiling)
- Furniture primitives (tables, chairs, windows)
- Created via helper functions in `src/ui/ar/utils/geometries.ts`

**Lighting:**
- Ambient light for general illumination
- Directional lights for realistic shadows
- Configured in `src/ui/ar/utils/LightingSetup.ts`

**Scene Management:**
- `SceneManager` class handles THREE.Scene lifecycle
- Camera setup: PerspectiveCamera with 75° FOV
- Renderer: `expo-three` Renderer with GLView context

### Material Properties

**Default Material:**
- Walls: `#F5F5F5` (white), roughness: 0.7, metalness: 0
- Floor: `#CCCCCC` (light gray), roughness: 0.8, metalness: 0

**Wood Material:**
- Walls: `#D4A574` (warm beige), roughness: 0.8, metalness: 0.1
- Floor: `#8B4513` (dark brown), roughness: 0.9, metalness: 0

**Concrete Material:**
- Walls: `#808080` (medium gray), roughness: 0.9, metalness: 0.2
- Floor: `#606060` (dark gray), roughness: 0.95, metalness: 0.1

---

## Documentation Structure

### Available Documentation (`docs/`)

1. **[docs/README.md](../docs/README.md)** - Documentation index
2. **[docs/ARQUITECTURA_POC.md](../docs/ARQUITECTURA_POC.md)** - Complete architecture
   - Tech stack details
   - Proposed folder structure
   - Data flow diagrams
   - Feature roadmap
   - Success metrics
3. **[docs/ARQUITECTURA_SIMPLIFICADA.md](../docs/ARQUITECTURA_SIMPLIFICADA.md)** - UI-First approach
   - Current architectural decision
   - Separation of responsibilities
   - Code examples per layer
4. **[docs/PLAN_IMPLEMENTACION.md](../docs/PLAN_IMPLEMENTACION.md)** - Step-by-step guide
   - 4 phases over 15 days
   - Daily task breakdown
   - Code examples
   - Verification checklists
5. **[docs/PLAN_AR_INMERSIVO.md](../docs/PLAN_AR_INMERSIVO.md)** - Advanced AR plan
   - Room scanning requirements
   - Spatial alignment techniques
   - Occlusion rendering
   - ARKit/ARCore technical analysis
6. **[docs/CODIGO_3D_ANTERIOR.md](../docs/CODIGO_3D_ANTERIOR.md)** - Previous 3D code
   - Analysis of commit a1bea4b (363 lines)
   - Geometry specifications
   - Original material system
   - Refactoring guide

### When to Reference Documentation

- **Implementing AR features**: Check PLAN_IMPLEMENTACION.md
- **Architecture decisions**: Review ARQUITECTURA_SIMPLIFICADA.md
- **Advanced AR roadmap**: See PLAN_AR_INMERSIVO.md
- **Material/geometry specs**: Reference CODIGO_3D_ANTERIOR.md

---

## Implementation Roadmap

### Phase 1: Foundation (Days 1-3)
- ✅ Base Expo + React Navigation structure
- 🔄 Recover previous 3D code (commit a1bea4b)
- 🔄 Refactor into modular UI-First architecture
- 🔄 Implement ARScreen with basic 3D rendering
- **Output**: Room rendering with material toggle

### Phase 2: AR Integration (Days 4-7)
- ⏳ Integrate expo-camera as AR background
- ⏳ Basic tracking with expo-sensors
- ⏳ AR controls (start/stop)
- ⏳ Touch gestures (pinch, rotate, pan)
- **Output**: Active AR with basic scene anchoring

### Phase 3: Professional Features (Days 8-12)
- ⏳ Measurement system (tap two points)
- ⏳ Day/night mode (lighting changes)
- ⏳ Screenshot capture
- ⏳ Design variants (compare versions)
- **Output**: Premium tools functional

### Phase 4: Polish + Testing (Days 13-15)
- ⏳ Onboarding UX (gesture tutorial)
- ⏳ Performance optimization (lazy loading, cache)
- ⏳ Real device testing (iOS + Android)
- ⏳ Demo content (2-3 example projects)
- **Output**: Demo-ready POC

**Status Legend:** ✅ Complete | 🔄 In Progress | ⏳ Pending
