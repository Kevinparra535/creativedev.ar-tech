# Copilot Instructions for creativedev.ar-tech

## Project Overview

**AR Immersive Experience Platform** - React Native app for architectural AR visualization. Expo Bare Workflow migration (**Phase 0 - 88% complete**) to enable native iOS AR (RoomPlan API scanning, ARKit integration).

**Version:** 1.0 POC | **Status:** Phase 0 In Progress (Steps 1-7 ✅, Steps 8-9 ⏳) | **Branch:** `feature/bare-workflow-migration`

### Current Progress Snapshot

- ✅ **Phase 1 Complete:** UI-First AR with Three.js + material system (walls, floor, furniture, 3 material presets)
- 🚀 **Phase 0 At 88%:** Bare Workflow setup, RoomPlan API scaffolding, ViewManager integration complete
  - ✅ Steps 1-7: Bare migration, Xcode config, native modules, RoomPlanView working
  - ⏳ Steps 8-9: USDZ export validation, file management UI (next focus)
- ⏳ **Phases 2-4:** AR camera integration, spatial alignment, occlusion rendering

### Core Mission

**Use case:** Architect scans real interior with LiDAR → App overlays design 3D model at 1:1 scale → Client walks through immersively.

**NOT:** Simple "tap to place object" app. Full environment replacement with architectural renders.

---

## Critical Developer Workflows

### Native Module Development Pattern (React Native ↔ Swift Bridge)

This project uses **React Native native modules** to expose iOS RoomPlan API to JavaScript. Existing modules:

**RoomPlanModule** (Scan control):
```swift
// ios/RoomPlanModule/RoomPlanModule.swift - Event emitter for scan lifecycle
@objc(RoomPlanModule)
class RoomPlanModule: RCTEventEmitter {
  override func supportedEvents() -> [String]! {
    return ["onScanStart", "onScanProgress", "onScanComplete", "onScanError", "onRoomDataReady"]
  }
  @objc func startScanning() { /* RoomCaptureSession setup */ }
  @objc func stopScanning() { /* cleanup */ }
  @objc func exportScan(_ callback: @escaping RCTResponseSenderBlock) { /* USDZ export */ }
}
```

**RoomPlanViewManager** (UI rendering):
```swift
// ios/RoomPlanModule/RoomPlanViewManager.swift - Exposes RoomCaptureView
@objc(RoomPlanViewManager)
class RoomPlanViewManager: RCTViewManager {
  override func view() -> UIView! {
    return RoomCaptureView(frame: .zero) // iOS 16+ only
  }
}
```

**Bridge files** (required - do NOT skip):
```objective-c
// ios/RoomPlanModule/RoomPlanBridge.m
@interface RCT_EXTERN_MODULE(RoomPlanModule, RCTEventEmitter)
RCT_EXTERN_METHOD(startScanning)
RCT_EXTERN_METHOD(stopScanning)
RCT_EXTERN_METHOD(exportScan:(RCTResponseSenderBlock)callback)
@end

// ios/RoomPlanModule/RoomPlanViewManager.m
@interface RCT_EXTERN_MODULE(RoomPlanViewManager, RCTViewManager)
@end
```

**JavaScript consumers:**
```typescript
// src/ui/ar/hooks/useRoomPlan.ts
const { RoomPlanModule } = NativeModules;
const emitter = new NativeEventEmitter(RoomPlanModule);
emitter.addListener('onScanStart', () => { /* ... */ });
```

**⚠️ CRITICAL PITFALLS (learned from Phase 0):**
1. **After creating `.swift` file:** MUST add to Xcode target manually (right-click → "Add Files to...")
2. **Bridge file is NOT optional:** `.m` file must match module name exactly
3. **Availability annotations required:** Use `@available(iOS 16.0, *)` for RoomPlan APIs
4. **Metro cache causes stale native code:** Always run `npm start -- --clear` after native changes
5. **Build caching issue:** `rm -rf ios/build` if Xcode complains about missing symbols
6. **Xcode.xcworkspace required:** Use `.xcworkspace` (not `.xcodeproj`) to avoid CocoaPods linking issues

### Build & Run Workflow (Post-Bare Migration)

```bash
# ALWAYS use Expo CLI - it auto-manages signing, provisioning, Metro cache
npx expo run:ios --device                    # Physical device (preferred for AR testing)
npx expo run:ios                              # Simulator (no RoomPlan/LiDAR support)
npx expo run:ios --configuration Release     # Production build

# After native code changes (Swift/Objective-C/iOS config changes):
npm start -- --clear                          # Clear Metro bundler cache FIRST
# In another terminal:
npx expo run:ios --device                    # Full rebuild required

# NEVER use xcodebuild directly
# Expo wraps it with auto-provisioning, Metro integration, cache clearing
```

**Recent Build Issues Resolved (Phase 0):**
- ❌ `expo run:ios` hanging/timing out → Solution: Use separate terminals for `npm start` and `npx expo run:ios`
- ❌ "Module not found" errors → Solution: Ensure `.swift` files added to Xcode target via UI
- ❌ "Signing failed" → Solution: Let Expo handle it (`-` signs automatically via Apple ID on first run)
- ❌ "Pods not found" → Solution: Run `cd ios && pod install && cd ..` if CocoaPods out of sync

**Actual working workflow (proven with RoomPlanView):**
```bash
# Terminal 1
npm start -- --clear

# Terminal 2 (wait for Metro bundler to start)
npx expo run:ios --device
# Watch logs in both terminals - Metro shows JS errors, Xcode console shows native errors
```

### Testing Native Modules

```bash
# Terminal setup (critical for debugging):
# Terminal 1: Metro bundler with clear cache
npm start -- --clear

# Terminal 2: Build app on device
npx expo run:ios --device

# Check logs in THREE places:
# 1. Metro terminal (JavaScript errors, hook lifecycle logs)
# 2. Xcode → Window → Devices and Simulators → Select device → View Device Logs
# 3. Xcode console (if building from Xcode directly)

# Example: Testing useRoomPlan hook lifecycle:
# Metro logs: [RoomPlan] Scan started, [RoomPlan] Room data ready, etc.
# Device logs: Native Swift print() statements
```

### Current Native Module Implementation Status

**Module Structure (Phase 0 - 88% complete):**

| Component | File | Status | Purpose |
|-----------|------|--------|---------|
| **RoomPlanModule** | `ios/RoomPlanModule/RoomPlanModule.swift` | ✅ Functional | Event emitter for scan lifecycle, export USDZ |
| RoomPlanBridge | `ios/RoomPlanModule/RoomPlanBridge.m` | ✅ Functional | Bridge module to React Native |
| **RoomPlanViewManager** | `ios/RoomPlanModule/RoomPlanViewManager.swift` | ✅ Functional | Renders native RoomCaptureView UI |
| RoomPlanViewManagerBridge | `ios/RoomPlanModule/RoomPlanViewManager.m` | ✅ Functional | Bridge view to React Native |
| useRoomPlan Hook | `src/ui/ar/hooks/useRoomPlan.ts` | ✅ Functional | State management for scanning, exports, events |
| RoomPlanView Component | `src/ui/ar/components/RoomPlanView.tsx` | ✅ Functional | React wrapper for native view |
| RoomPlanTestScreen | `src/ui/screens/RoomPlanTestScreen.tsx` | ✅ Functional | Full testing UI with export/progress |

**Known Working Features:**
- ✅ Scan start/stop via native module events
- ✅ RoomCaptureView renders and accepts device input
- ✅ Progress tracking (surfaces detected, walls/doors/windows counted)
- ✅ Export to USDZ file (callback-based)
- ✅ Error handling with user feedback
- ✅ iOS 16+ availability checks with fallbacks

**Next Steps (Pasos 8-9):**
- [ ] Validate exported USDZ files (mesh integrity, scale)
- [ ] File management UI (browse, rename, delete saved scans)
- [ ] Share functionality (email, AirDrop, file picker)

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

### Current Structure (Phase 1 - Complete, Phase 0 - In Progress)

**UI-First Design:** All AR/3D logic colocated in `src/ui/ar/` for POC simplicity. Future refactoring into `src/core/`, `src/data/` layers after POC validation.

**Key Architectural Decision:** Keeping business logic in `src/ui/` initially to iterate fast. When stable, extract to:
- `src/core/` - Business logic, managers, AR engine (future refactoring)
- `src/data/` - Models, constants, asset loading (future refactoring)
- `src/ui/` - Pure presentation components (current home for everything)

**Current Feature Organization - `/src/ui/ar/`:**

```
src/ui/ar/
├── components/                   # UI-only components (stateless)
│   ├── ARCanvas.tsx             # GLView + Three.js rendering (Phase 1)
│   ├── ARControls.tsx           # Start/stop AR buttons (Phase 1)
│   ├── MaterialPicker.tsx        # Material selector UI (Phase 1)
│   ├── ARPermissionPrompt.tsx    # Camera permission flows (Phase 1)
│   └── RoomPlanView.tsx          # Native RoomCaptureView wrapper (Phase 0 - CURRENT)
│
├── hooks/                        # Business logic with state
│   ├── use3DScene.ts            # Three.js SceneManager lifecycle (Phase 1)
│   ├── useARSession.ts          # AR start/stop lifecycle (Phase 1)
│   ├── useMaterialToggle.ts      # Material change logic (Phase 1)
│   ├── useDeviceOrientation.ts  # Gyroscope tracking (Phase 1)
│   └── useRoomPlan.ts           # RoomPlan scanning, export, state (Phase 0 - CURRENT)
│
└── utils/                        # Pure functions/helpers (no state)
    ├── SceneManager.ts          # THREE.Scene lifecycle (Phase 1)
    ├── LightingSetup.ts         # 3-point lighting config (Phase 1)
    ├── geometries.ts            # createRoom(), createWalls(), etc (Phase 1)
    └── materials.ts             # PBR material presets (Phase 1)

# Navigation & Screens
src/ui/screens/
├── HomeScreen.tsx               # Landing page
├── ARScreen.tsx                 # Three.js AR scene (Phase 1)
└── RoomPlanTestScreen.tsx       # RoomPlan testing (Phase 0 - CURRENT)

src/ui/navigation/
├── AppNavigator.tsx             # Root stack
├── TabNavigator.tsx             # Bottom tabs (Home | AR | RoomPlanTest)
└── types.ts                     # RootStackParamList, TabParamList

# Native Modules (iOS only)
ios/RoomPlanModule/
├── RoomPlanBridge.m             # Objective-C bridge (required)
├── RoomPlanModule.swift         # RoomPlan scanning implementation
├── RoomPlanViewManager.m        # View bridge
└── RoomPlanViewManager.swift    # Native view component
```

**Why This Structure?**
- ✅ AR logic self-contained in `ui/ar/` (easy to find, modify)
- ✅ Hooks encapsulate state (reusable, testable)
- ✅ Utils are pure functions (no React dependencies)
- ✅ Easy to move to `src/core/` when stable (non-UI imports minimal)
- ✅ Components stay dumb/presentational (better for reuse)

**Adding New Features - Pattern to Follow:**

1. **Stateless UI?** → `src/ui/ar/components/MyComponent.tsx`
2. **Needs state/hooks?** → `src/ui/ar/hooks/useMyFeature.ts` + component
3. **Pure helper function?** → `src/ui/ar/utils/helperFunction.ts`
4. **New screen?** → `src/ui/screens/MyScreen.tsx`
5. **Import in orchestrator** → `ARScreen.tsx` or `TabNavigator.tsx`

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

4. **Import and use in `ARScreen.tsx` or `RoomPlanTestScreen.tsx`** - screens orchestrate all components

5. **Add to navigation if new screen** → Update `src/ui/navigation/TabNavigator.tsx`

**Never:** Create state in components if logic needs testing or sharing. Always lift to hooks.

**Example: Adding RoomPlan feature**
- Hook: `useRoomPlan.ts` manages scan state, events, exports
- Component: `RoomPlanView.tsx` is the wrapper for native RoomCaptureView
- Screen: `RoomPlanTestScreen.tsx` orchestrates hook + component
- Result: Fully integrated with state management and native events

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
- **Current:** Expo Bare Workflow with RoomPlan API scaffolding (Phase 0 - 88%)
- **RoomPlan Requirements:**
  - **Hardware:** iPhone 12 Pro+ OR iPad Pro 2020+ (must have LiDAR scanner)
  - **iOS:** 16.0+ (RoomPlan API is iOS 16+)
  - **App:** Must use `@available(iOS 16.0, *)` annotations for RoomPlan code
  - **Fallback:** Provide graceful UIView() fallback for iOS < 16
- **Phase 0 (In Progress):** Bare Workflow enables RoomPlan API + ARKit access
- **Future:** Native Swift modules for:
  - RoomPlan API (room scanning with LiDAR, iOS 16+) ← CURRENT FOCUS
  - ARKit World Tracking (6DOF + spatial anchors)
  - Scene Reconstruction (depth buffer for occlusion)
- **Permissions:** Camera + LiDAR usage descriptions in Info.plist
- **Min iOS Version:** 16.0 (required for RoomPlan)

### Debugging AR Features - Critical Limitations

**AR features require PHYSICAL device with LiDAR:**
- iPhone 12 Pro or later ✅ (tested on iPhone 14 Pro Max)
- iPad Pro 2020 or later ✅
- iOS 16.0+ ✅
- Simulator ❌ (no LiDAR, no RoomPlan API)

**Device Capabilities by Feature:**
| Feature | iPhone 12+ | Simulator | Android |
|---------|-----------|-----------|---------|
| expo-camera | ✅ | ✅ (mock) | ✅ |
| expo-sensors | ✅ | ✅ (mock) | ✅ |
| RoomPlan API | ✅ (LiDAR only) | ❌ | ❌ |
| ARKit depth | ✅ (LiDAR only) | ❌ | N/A |
| Three.js rendering | ✅ | ✅ | ✅ |

**Testing Strategy:**
- Phase 0 (current): Test RoomPlan on real device with LiDAR
- Phase 1: Test Three.js AR on simulator or device
- Always iterate natively for AR features

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

### Three.js Scene Structure & Material Properties

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
8. **[docs/PASO_7_ROOMPLAN_VIEW_COMPLETE.md](../docs/PASO_7_ROOMPLAN_VIEW_COMPLETE.md)** - Current progress on ViewManager integration (Phase 0 - 88%)
9. **[docs/FASE_0_RESUMEN_FINAL.md](../docs/FASE_0_RESUMEN_FINAL.md)** - Phase 0 summary with all steps completed

### When to Reference Documentation

- **Current Native Module Status:** Check `PASO_7_ROOMPLAN_VIEW_COMPLETE.md` (latest Phase 0 progress)
- **Bare Workflow migration:** See `FASE_0_SETUP.md` (detailed step-by-step)
- **Understanding Three.js AR:** Reference `CODIGO_3D_ANTERIOR.md` (material specs, geometry definitions)
- **Building new features:** See `PLAN_IMPLEMENTACION.md` (Phases 2-4 patterns)
- **Architecture decisions:** Review `ARQUITECTURA_SIMPLIFICADA.md` (UI-First rationale)

---

## Implementation Roadmap

### Phase 1: Foundation (Days 1-3) ✅ COMPLETE
- ✅ Base Expo + React Navigation structure
- ✅ Recover previous 3D code (commit a1bea4b)
- ✅ Refactor into modular UI-First architecture
- ✅ Implement ARScreen with basic 3D rendering
- **Output**: Room rendering with material toggle

### Phase 0: Bare Workflow Migration 🚀 IN PROGRESS (88%)
- ✅ Steps 1-7: Bare migration, Xcode config, native modules, RoomPlanView working
- ⏳ Steps 8-9: USDZ validation, file management UI
- **Current:** RoomPlanView ViewManager functional, scan lifecycle events working
- **Next:** File export validation and sharing UI

### Phase 2: AR Integration ⏳ PENDING
- ⏳ Integrate expo-camera as AR background
- ⏳ Basic tracking with expo-sensors
- ⏳ AR controls (start/stop)
- ⏳ Touch gestures (pinch, rotate, pan)
- **Output**: Active AR with basic scene anchoring

### Phase 3: Professional Features ⏳ PENDING
- ⏳ Measurement system (tap two points)
- ⏳ Day/night mode (lighting changes)
- ⏳ Screenshot capture
- ⏳ Design variants (compare versions)
- **Output**: Premium tools functional

### Phase 4: Polish + Testing ⏳ PENDING
- ⏳ Onboarding UX (gesture tutorial)
- ⏳ Performance optimization (lazy loading, cache)
- ⏳ Real device testing (iOS + Android)
- ⏳ Demo content (2-3 example projects)
- **Output**: Demo-ready POC

**Status Legend:** ✅ Complete | 🚀 In Progress | ⏳ Pending
