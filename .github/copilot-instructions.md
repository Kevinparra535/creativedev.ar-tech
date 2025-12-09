# Copilot Instructions for creativedev.ar-tech

## Project Overview

**AR Immersive Experience Platform** - React Native app for architectural AR visualization. Currently on **`feature/bare-workflow-migration`** branch migrating from Expo Managed → Bare Workflow to enable native iOS AR (RoomPlan API, ARKit integration).

**Version:** 1.0 POC | **Status:** Bare Workflow Migration (Phase 0 - 88% Complete) | **Branch:** `feature/bare-workflow-migration`

### Current State & Roadmap

- ✅ **Phase 1 (Foundation):** UI-First AR with Three.js rendering + material system working
- 🚀 **Phase 0 (In Progress - 88%):** Expo Bare Workflow migration, native iOS module scaffolding (8/9 steps)
  - ✅ Steps 1-7 Complete (RoomPlanView ViewManager integration done)
  - ⏳ Steps 8-9: USDZ validation & file management
- ⏳ **Phases 2-4:** Advanced AR (RoomPlan scanning, spatial alignment, occlusion)

### Latest Completion: Paso 7 ✅

**RoomPlanView ViewManager Integration** (88% Progress)
- ViewManager files added to Xcode Build Target
- iOS 16+ availability checks implemented
- React Native component wrapper functional
- State management hook complete (useRoomPlan)
- RoomPlanTestScreen integrated in navigation
- Commit: `3cd04ea` - ViewManager iOS 16 fix + Xcode integration
- Documentation: `docs/PASO_7_ROOMPLAN_VIEW_COMPLETE.md`

**Next:** Paso 8 (USDZ Export Validation) and Paso 9 (File Management & Sharing)

### Core Vision

AR visualization tool allowing architects to showcase interior designs at 1:1 scale:
- Scan real spaces with LiDAR (iOS 16+ with RoomPlan API)
- Overlay/replace with architectural 3D models
- Walk through immersively exploring materials in real-time

**Key Differentiator:** Not "tap to place" objects - full room scanning and replacement with architectural render.

---

## Critical Developer Workflows

### Native Module Development Pattern (React Native ↔ Swift Bridge)

This project uses **React Native native modules** to expose iOS RoomPlan API to JavaScript:

**Swift Module Structure:**
```swift
// ios/RoomPlanModule/RoomPlanModule.swift
@objc(RoomPlanModule)
class RoomPlanModule: RCTEventEmitter {
  override func supportedEvents() -> [String]! {
    return ["onScanStart", "onScanProgress", "onScanComplete", "onScanError"]
  }
  
  @objc func startScanning() { /* native implementation */ }
}
```

**Objective-C Bridge (required for RN):**
```objective-c
// ios/RoomPlanModule/RoomPlanBridge.m
@interface RCT_EXTERN_MODULE(RoomPlanModule, RCTEventEmitter)
RCT_EXTERN_METHOD(startScanning)
@end
```

**JavaScript Hook:**
```typescript
// src/hooks/useRoomPlan.ts
import { NativeModules, NativeEventEmitter } from 'react-native';
const { RoomPlanModule } = NativeModules;
const emitter = new NativeEventEmitter(RoomPlanModule);
```

**CRITICAL:** When adding Swift files to native modules:
1. Create `.swift` file + `.m` bridge file
2. Add BOTH to Xcode target via Xcode UI (right-click → "Add Files to...")
3. Verify in Build Phases → Compile Sources
4. Clean build folder (Cmd+Shift+K) before rebuild

### Build & Run Workflow (Post-Bare Migration)

```bash
# Always use Expo CLI (handles signing/provisioning automatically)
npx expo run:ios --device           # Build & install on connected iPhone
npx expo run:ios                    # Use simulator
npx expo run:ios --configuration Release  # Production build

# NEVER use xcodebuild directly - complex provisioning requirements
# Use Expo's wrapper which auto-manages certificates

# After native code changes (Swift/Objective-C):
npm start -- --clear                # Clear Metro cache first
npx expo run:ios --device          # Full rebuild required
```

**Common Build Errors:**
- "Module not found": Files exist but not added to Xcode target (see above)
- "Signing failed": Let Expo handle it, don't configure manually
- "Pods not found": Run `cd ios && pod install && cd ..`

### Testing Native Modules

```bash
# 1. Start Metro bundler
npm start -- --clear

# 2. In another terminal, build on device
npx expo run:ios --device

# 3. Check logs in THREE places:
# - Metro terminal (JavaScript errors)
# - Xcode console (Swift/native errors) 
# - Device system logs (crashes)

# Xcode console access:
# Window → Devices and Simulators → Select device → Open Console
```

### Debugging AR Features

**AR features require PHYSICAL device with LiDAR:**
- iPhone 12 Pro or later
- iPad Pro 2020 or later
- iOS 16.0+ for RoomPlan API

**Simulator limitations:**
- expo-camera: ✅ Works (mock feed)
- expo-sensors: ✅ Works (simulated data)
- RoomPlan API: ❌ Requires real hardware + LiDAR
- ARKit depth: ❌ Requires real hardware

---

## Architecture

### Current Structure (Phase 1 - Complete)

**UI-First Design:** All AR/3D logic colocated in `src/ui/ar/` for POC simplicity. Future refactoring into `src/core/`, `src/data/` layers after POC validation.

**Key Architectural Decision:** Keeping business logic in `src/ui/` initially to iterate fast. When stable, extract to:
- `src/core/` - Business logic, managers, AR engine
- `src/data/` - Models, constants, asset loading
- `src/ui/` - Pure presentation components

```
src/ui/
├── ar/                         # AR feature (all logic colocated)
│   ├── components/             # UI-only components
│   │   ├── ARCanvas.tsx       # GLView + Three.js rendering
│   │   ├── ARControls.tsx     # Start/stop AR buttons
│   │   ├── MaterialPicker.tsx # Material selector UI
│   │   └── ARPermissionPrompt.tsx
│   ├── hooks/                  # Business logic with state
│   │   ├── use3DScene.ts      # SceneManager lifecycle
│   │   ├── useARSession.ts    # AR start/stop lifecycle
│   │   ├── useMaterialToggle.ts # Material change logic
│   │   └── useDeviceOrientation.ts # Gyroscope tracking
│   └── utils/                  # Pure functions/helpers
│       ├── SceneManager.ts    # THREE.Scene lifecycle
│       ├── LightingSetup.ts   # 3-point lighting setup
│       ├── geometries.ts      # createRoom(), createWalls(), etc
│       └── materials.ts       # PBR material presets
├── screens/
│   ├── HomeScreen.tsx
│   └── ARScreen.tsx          # Orchestrates AR components + hooks
├── navigation/
│   ├── AppNavigator.tsx
│   ├── TabNavigator.tsx      # Bottom tabs: Home, AR, RoomPlanTest
│   └── types.ts
└── theme/
    ├── colors.ts
    └── fonts.ts

# Native modules (iOS-specific)
ios/RoomPlanModule/
├── RoomPlanBridge.m           # Objective-C bridge (required)
├── RoomPlanModule.swift       # RoomPlan scanning implementation
├── RoomPlanViewManager.m      # View bridge
└── RoomPlanViewManager.swift  # Native view component

# React Native hooks for native modules
src/hooks/
├── useRoomPlan.ts             # Bridge to RoomPlanModule.swift
src/components/
└── RoomPlanView.tsx           # Bridge to RoomPlanViewManager.swift
src/screens/
└── RoomPlanTestScreen.tsx     # Testing UI for RoomPlan
```

**Navigation Flow:**
```
AppNavigator (Stack)
  └─ TabNavigator (Tabs)
      ├─ Home
      ├─ AR (Three.js rendering)
      └─ RoomPlanTest (Native RoomPlan scanning)
```

### Three.js Rendering Details

**Scene Setup (`SceneManager` constructor):**
- Camera: `PerspectiveCamera(70 FOV, 0.01-100 near-far, positioned at [0, 1.5, 3])`
- Background: Transparent (black with alpha=0) in AR mode for camera blending
- Lighting: Ambient (0.6 intensity) + directional primary (0.8) + directional fill (0.4)

**Material System:**
- **Default:** Gray (`#F5F5F5` walls, `#CCCCCC` floor), roughness 0.7-0.8, metalness 0
- **Wood:** Warm beige (`#D4A574` walls, `#8B4513` floor), roughness 0.8-0.9, metalness 0.1
- **Concrete:** Gray (`#808080` walls, `#606060` floor), roughness 0.9-0.95, metalness 0.2

**Room Geometry:**
- Floor: `PlaneGeometry(8, 8)` rotated -90° at Y=-2
- Walls: 3x `BoxGeometry(8, 4, 0.1)` (back, left, right)
- Window: `PlaneGeometry(2, 1.5)` transparent with metalness 0.9 (simulates glass)
- Table: `BoxGeometry(2, 0.1, 1)` + 4x leg `BoxGeometry(0.1, 0.8, 0.1)`

### Device Orientation Tracking

`ARCanvas` uses `useDeviceOrientation(isARMode)` hook to apply device gyro/accel data:
```typescript
// Camera rotation updated from device orientation (beta/gamma/alpha)
camera.rotation.x = orientation.beta * 0.5;
camera.rotation.y = orientation.gamma * 0.5;
camera.rotation.z = orientation.alpha * 0.5;
```

Renderer transparency toggled: `setClearColor(0x000000, isARMode ? 0 : 1)` for camera overlay.

### Navigation (@react-navigation v7)

Type-safe navigation with React Navigation:
- Root: `AppNavigator.tsx` (stack navigator)
- Main: `TabNavigator.tsx` (bottom tabs with Home, AR screens)
- Types: `navigation/types.ts` (RootStackParamList, TabParamList)

### Workflow: Adding Features to AR

**Pattern for new AR component/feature:**

1. **If stateless UI:** Create in `src/ui/ar/components/`
   ```tsx
   interface ComponentProps { prop1: string; onPress: () => void; }
   export const MyComponent: React.FC<ComponentProps> = ({ prop1, onPress }) => (...)
   ```

2. **If has state/logic:** Create hook in `src/ui/ar/hooks/`
   ```tsx
   export const useMyFeature = () => {
     const [state, setState] = useState(...);
     return { state, updateState };
   };
   ```

3. **If utility function:** Add to `src/ui/ar/utils/`
   ```tsx
   export const helperFunction = (input: Type): Result => (...)
   ```

4. **Import and use in `ARScreen.tsx`** - it orchestrates all components

**Never:** Create state in components if logic needs testing or sharing. Always lift to hooks.

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
# Start Expo dev server (Managed Workflow)
npm start

# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Clear Metro bundler cache (after native changes)
npm start -- --clear
```

**For Bare Workflow (after Phase 0 migration):**
```bash
# iOS device/simulator
npx expo run:ios --device
npx expo run:ios  # uses simulator

# Android device/emulator
npx expo run:android --device
```

### Build & Native Development

**Current:** Expo Managed Workflow
- Edit `app.json` for Expo configuration (plugins, permissions, icons)
- No `ios/` or `android/` native directories yet

**Post-Migration (Phase 0):** Bare Workflow
- Native iOS: `ios/creativedevartech/` (Swift source, Info.plist, assets)
- Native Android: `android/` (Java/Kotlin, gradle configs)
- Native modules bridge via React Native native modules API
- Xcode: `ios/creativedevartech.xcworkspace` (NOT .xcodeproj)

### Code Quality & Linting

```bash
# Lint with auto-fix
npm run lint -- --fix

# Check only
npm run lint
```

**ESLint config:** `eslint.config.js` (flat config v9)
- `eslint-config-expo` base
- `simple-import-sort` auto-organizes imports
- Prettier integrated for formatting
- TypeScript strict mode enforced

## Platform-Specific Considerations

### iOS (Primary Focus)
- **Current:** Expo Managed Workflow with basic AR via expo-sensors
- **Phase 0 (In Progress):** Migrate to Bare Workflow for RoomPlan API + ARKit access
- **Future:** Native Swift modules for:
  - RoomPlan API (room scanning with LiDAR, iOS 16+)
  - ARKit World Tracking (6DOF + spatial anchors)
  - Scene Reconstruction (depth buffer for occlusion)
- **Permissions:** Camera + LiDAR (in Info.plist & app.json)
- **Min iOS Version:** 16.0 (required for RoomPlan)

### Android
- **Status:** Lower priority; current focus on iOS POC
- **Future consideration:** ARCore integration via Bare Workflow
- **Not required for Phase 0**

### Web (Not Supported)
- AR features are mobile-only
- Three.js rendering works via WebGL but no native AR APIs
- `web` target configured but AR disabled on this platform

### AR Tracking Architecture

**Expo Managed (Current):**
```
expo-camera (video feed)
    ↓
GLView (WebGL context)
    ↓
Three.js renderer (device orientation applied)
expo-sensors (gyro/accel) → camera rotation
```

**Bare Workflow (Phase 0+):**
```
Native ARKit Session (world tracking)
    ↓
Custom native module (Swift)
    ↓
React Native Bridge
    ↓
Three.js OR SceneKit renderer
```

**RoomPlan Integration (Future):**
```
RoomCaptureSession (LiDAR scanning)
    ↓
Export USDZ mesh
    ↓
Load + align with architectural model
    ↓
Replace reality with 3D render
```

## Key Dependencies

### Core Framework
- **react-native** 0.81.5
- **expo** ~54.0.27 (Managed Workflow during Phase 1, migrating to Bare in Phase 0)
- **react** 19.1.0 (with experimental React Compiler)
- **typescript** 5.9.2 (strict mode)

### 3D & AR Stack
- **three** ^0.166.0 - 3D engine
- **expo-gl** ~16.0.8 - OpenGL ES context
- **expo-three** ^8.0.0 - Three.js renderer bridge
- **expo-camera** ~17.0.10 - Camera feed + permissions
- **expo-sensors** ~15.0.0 - Gyroscope, accelerometer (device orientation)

**Future (Phase 0+):**
- **RoomPlan API** (native Swift, wraps iOS 16+ framework)
- **ARKit** (native, via custom React Native bridge)

### Navigation & UI
- **@react-navigation/native** ^7.1.8
- **@react-navigation/native-stack** ^7.8.6
- **@react-navigation/bottom-tabs** ^7.4.0
- **expo-symbols** - SF Symbols (iOS 13+)
- **@expo/vector-icons** - Icon library

### Animations & Gestures
- **react-native-reanimated** ~4.1.1
- **react-native-gesture-handler** ~2.28.0

### Development Tools
- **babel-plugin-module-resolver** - `@/` import alias
- **eslint** ~9.0.0 with flat config
- **prettier** - Code formatting
- **simple-import-sort** - Auto-organize imports

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
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### `eslint.config.js`
ESLint configuration with Prettier and simple-import-sort:
- Flat config v9
- Integrates Prettier for code formatting
- Organizes imports automatically
- Extends expo config with React best practices

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

### `app.json`
Expo configuration:
- Plugins configured (iOS/Android permissions, splash screen, icons)
- Camera permissions: `expo-camera`
- Sensors permissions: `expo-sensors`

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
2. **[docs/ARQUITECTURA_POC.md](../docs/ARQUITECTURA_POC.md)** - Complete architecture (tech stack, proposed structure, roadmap)
3. **[docs/ARQUITECTURA_SIMPLIFICADA.md](../docs/ARQUITECTURA_SIMPLIFICADA.md)** - UI-First approach (current decision, layer separation, examples)
4. **[docs/PLAN_IMPLEMENTACION.md](../docs/PLAN_IMPLEMENTACION.md)** - 4-phase implementation plan (15 days, daily tasks, examples)
5. **[docs/PLAN_AR_INMERSIVO.md](../docs/PLAN_AR_INMERSIVO.md)** - Advanced AR plan (RoomPlan API, spatial alignment, rendering engines)
6. **[docs/FASE_0_SETUP.md](../docs/FASE_0_SETUP.md)** - Bare Workflow migration guide (step-by-step setup, Xcode, native modules)
7. **[docs/CODIGO_3D_ANTERIOR.md](../docs/CODIGO_3D_ANTERIOR.md)** - Analysis of recovered 3D code (commit a1bea4b, geometries, materials)

### When to Reference Documentation

- **Bare Workflow migration:** Check `FASE_0_SETUP.md` (Phase 0 in progress)
- **Adding AR features:** See `PLAN_IMPLEMENTACION.md` (Phases 2-4 roadmap)
- **Understanding 3D system:** Reference `CODIGO_3D_ANTERIOR.md` (material specs, geometry definitions)
- **Advanced AR (RoomPlan):** See `PLAN_AR_INMERSIVO.md` (post-Phase 0 planning)
- **Architecture decisions:** Review `ARQUITECTURA_SIMPLIFICADA.md` (UI-First rationale)

---

## Implementation Roadmap

### Phase 1: Foundation (Days 1-3)
- ✅ Base Expo + React Navigation structure
- ✅ Recover previous 3D code (commit a1bea4b)
- ✅ Refactor into modular UI-First architecture
- ✅ Implement ARScreen with basic 3D rendering
- **Output**: Room rendering with material toggle (COMPLETE)

### Phase 0: Bare Workflow Migration (2 weeks, IN PROGRESS)
- 🚀 Migrate to Expo Bare Workflow (`expo prebuild`)
- 🚀 Setup Xcode project + Swift configuration
- 🚀 Create native module bridge for RoomPlan API
- 🚀 Validate RoomPlan API on device with LiDAR
- **Output**: App can scan rooms with RoomPlan

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

**Status Legend:** ✅ Complete | 🚀 In Progress | ⏳ Pending

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
2. **[docs/ARQUITECTURA_POC.md](../docs/ARQUITECTURA_POC.md)** - Complete architecture (tech stack, proposed structure, roadmap)
3. **[docs/ARQUITECTURA_SIMPLIFICADA.md](../docs/ARQUITECTURA_SIMPLIFICADA.md)** - UI-First approach (current decision, layer separation, examples)
4. **[docs/PLAN_IMPLEMENTACION.md](../docs/PLAN_IMPLEMENTACION.md)** - 4-phase implementation plan (15 days, daily tasks, examples)
5. **[docs/PLAN_AR_INMERSIVO.md](../docs/PLAN_AR_INMERSIVO.md)** - Advanced AR plan (RoomPlan API, spatial alignment, rendering engines)
6. **[docs/FASE_0_SETUP.md](../docs/FASE_0_SETUP.md)** - Bare Workflow migration guide (step-by-step setup, Xcode, native modules)
7. **[docs/CODIGO_3D_ANTERIOR.md](../docs/CODIGO_3D_ANTERIOR.md)** - Analysis of recovered 3D code (commit a1bea4b, geometries, materials)

### When to Reference Documentation

- **Bare Workflow migration:** Check `FASE_0_SETUP.md` (Phase 0 in progress)
- **Adding AR features:** See `PLAN_IMPLEMENTACION.md` (Phases 2-4 roadmap)
- **Understanding 3D system:** Reference `CODIGO_3D_ANTERIOR.md` (material specs, geometry definitions)
- **Advanced AR (RoomPlan):** See `PLAN_AR_INMERSIVO.md` (post-Phase 0 planning)
- **Architecture decisions:** Review `ARQUITECTURA_SIMPLIFICADA.md` (UI-First rationale)

---

## Implementation Roadmap

### Phase 1: Foundation (Days 1-3)
- ✅ Base Expo + React Navigation structure
- ✅ Recover previous 3D code (commit a1bea4b)
- ✅ Refactor into modular UI-First architecture
- ✅ Implement ARScreen with basic 3D rendering
- **Output**: Room rendering with material toggle (COMPLETE)

### Phase 0: Bare Workflow Migration (2 weeks, IN PROGRESS)
- 🚀 Migrate to Expo Bare Workflow (`expo prebuild`)
- 🚀 Setup Xcode project + Swift configuration
- 🚀 Create native module bridge for RoomPlan API
- 🚀 Validate RoomPlan API on device with LiDAR
- **Output**: App can scan rooms with RoomPlan

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

**Status Legend:** ✅ Complete | 🚀 In Progress | ⏳ Pending
