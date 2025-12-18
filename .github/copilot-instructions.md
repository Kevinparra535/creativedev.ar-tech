# Copilot Instructions for creativedev.ar-tech

## Project Overview

**AR Immersive Interior Design Platform** - React Native app using native iOS ARKit for architectural visualization. Architects scan real spaces with LiDAR, load 3D models, and clients experience immersive AR walkthroughs at 1:1 scale.

**Version:** 1.8.0 | **Status:** ~88% POC Complete | **Timeline:** 2 weeks max

### Current State (December 2025)

**Completed Phases:**
- ✅ Phase 0: Expo Bare Workflow + ARKit/SceneKit native integration
- ✅ Phase 0.5: Plane Detection with classification (7 surface types)
- ✅ Phase 1: Model Loading, Tap-to-Place, gesture manipulation (pan/rotate/pinch/scale)
- ✅ Phase 1.5: Room Scanning (expo-roomplan 1.2.1, USDZ export)
- ✅ Phase 1.7: SceneKit Preview (Apple Quick Look-style gestures, momentum, camera presets)
- ✅ Phase 2: Model Alignment System (auto-alignment + manual adjustment + persistence)
- ✅ Phase 3.1: Portal Mode (camera feed hiding for reality replacement)
- ✅ Phase 3.2: Mesh Classification (wall/floor/ceiling detection, surface-specific materials)
- ✅ Phase 3.3: Collision Detection (physics bodies + contact delegate + UI controls)
- ✅ Phase 3.4: Quality Settings (occlusion quality selector + FPS monitoring)

**In Progress:**
- 🔨 Interactive Multi-Wall Alignment (guided scan with visual feedback)
- 🔨 Wall Anchor System refinements

**Key Differentiator:** NOT "tap to place object" - this is **full environment replacement** where AR model replaces reality as user walks through space.

### Core Mission

**Success criteria:** User (architect) can select model → scan environment → navigate inside 3D model in **< 2 minutes**.

**POC Intent:** Validate viability of real-space scanning + immersive 3D visualization for interior design review on iOS devices.

---

## Critical Developer Workflows

### expo-arkit Native Module Architecture

This project uses a **custom Expo Module** (`expo-arkit`) to bridge ARKit/SceneKit to React Native. It's NOT using standard React Native native modules pattern - it uses Expo Modules API.

**Module Location:** `modules/expo-arkit/`

**Key Components:**

1. **ExpoARKitModule.swift** - Core imperative API (methods called from JS)
   - `loadModel(uri, scale)` - Load USDZ/USD models
   - `setPlaneDetection(enabled, config)` - Toggle plane detection
   - `setMeshReconstruction(enabled)` - Toggle scene mesh
   - `setPortalMode(enabled)` - Hide/show camera feed
   - `getModelDimensions(modelId)` - Get bounding box
   - `applyTransform(modelId, position, rotation, scale)` - Transform models
   - `calculateAutoAlignment(params)` - Auto-align model to scanned wall
   - `enableCollisionDetection(enabled)` - Toggle physics

2. **ARKit Views** (React Native components)
   - `ARKitView` - Main AR session with plane detection, tap-to-place, gestures
   - `SceneKitPreviewView` - 3D model preview with Apple Quick Look gestures
   - `ARWallScanningView` - Vertical plane detection for wall selection
   - `SimpleModelPreviewView` - Minimal 3D viewer (no gestures)

3. **Native Swift Files**
   - `ExpoARKitView.swift` - ARSCNView implementation, AR session management
   - `Plane.swift` - ARPlaneAnchor visualization with classification
   - `WallAlignmentEngine.swift` - Auto-alignment algorithm (scale + position matching)
   - `SceneKitPreviewView.swift` - Model viewer with momentum, gestures, camera presets

**Event System:**
```typescript
// Subscribe to native events in React
onPlaneDetected={(event) => { /* event.nativeEvent has id, type, dimensions, center */ }}
onModelLoaded={(event) => { /* event.nativeEvent has modelId, position, dimensions */ }}
onCollision={(event) => { /* event.nativeEvent has modelA, modelB, contactPoint */ }}
```

**Imperative Methods:**
```typescript
import { ExpoARKitModule } from 'expo-arkit';

// Load 3D model
await ExpoARKitModule.loadModel('file:///path/to/model.usdz', 1.0);

// Toggle portal mode (hide camera feed)
await ExpoARKitModule.setPortalMode(true);

// Auto-align model to scanned wall
const result = await ExpoARKitModule.calculateAutoAlignment({
  modelWallPosition: { x: 0, y: 0, z: -5 },
  modelWallNormal: { x: 0, y: 0, z: 1 },
  realWallCenter: { x: 0, y: 1.5, z: -2 },
  realWallNormal: { x: 0, y: 0, z: 1 },
  modelDimensions: { x: 10, y: 3, z: 8 },
  realWallDimensions: { x: 12, y: 3, z: 0 }
});
```

### Build & Run Workflow (Expo Bare)

```bash
# Development workflow - ALWAYS use two terminals
# Terminal 1: Metro bundler
npm start -- --clear

# Terminal 2: Build and run on physical device (required for AR)
npx expo run:ios --device

# Simulator (no AR/LiDAR support)
npx expo run:ios

# Production build
npx expo run:ios --configuration Release --device
```

**⚠️ CRITICAL BUILD RULES:**

1. **Physical device REQUIRED** - Simulator doesn't support ARKit plane detection, LiDAR, or scene reconstruction
2. **Clear Metro cache** after ANY native code changes (Swift, Objective-C, Podfile, Info.plist)
3. **Two separate terminals** - Metro hangs if mixed with build command
4. **Use `.xcworkspace`** NOT `.xcodeproj` when opening in Xcode (CocoaPods requirement)
5. **Xcode 14+** required for iOS 16+ ARKit APIs

**Common Build Fixes:**
```bash
# Clean everything and rebuild
rm -rf ios/build ios/Pods ~/Library/Developer/Xcode/DerivedData/*
cd ios && pod install --repo-update && cd ..
npm start -- --clear
# In another terminal:
npx expo run:ios --device

# If Metro hangs
killall -9 node expo
npm start -- --clear

# If pods out of sync
cd ios && pod deintegrate && pod install && cd ..
```

**Known Issues:**
- ❌ "Module not found" → Native files not added to Xcode target (add via Xcode UI)
- ❌ Build hangs → Separate Metro terminal from build terminal
- ❌ "Signing failed" → Let Expo auto-provision (requires Apple ID first run)
- ❌ Stale native code → Clear Metro cache with `--clear` flag

---

## Architecture

### Current Structure (Phases 0-3.4 Complete)

**Modular Native + React Native Architecture:**

```
expo-arkit (Custom Expo Module)
├── ExpoARKitModule.swift       # Core imperative API
├── ExpoARKitView.swift         # Main AR session view
├── SceneKitPreviewView.swift   # 3D model preview
├── ARWallScanningView.swift    # Wall selection view
├── SimpleModelPreviewView.swift # Minimal viewer
├── Plane.swift                 # Plane visualization
└── WallAlignmentEngine.swift   # Alignment math

React Native UI Layer
├── src/ui/screens/
│   ├── ModelPreviewScreen      # Model selection & preview
│   ├── WallScanningScreen      # Wall selection AR
│   ├── AlignmentViewScreen     # Model-to-real alignment
│   └── ImmersiveViewScreen     # Final immersive view
├── src/ui/ar/hooks/
│   ├── useARKitSession         # AR session lifecycle
│   ├── useModelAlignment       # Auto-alignment logic
│   └── useCollisionDetection   # Physics events
└── src/ui/ar/components/
    ├── ARKitView               # Main AR component
    └── AlignmentControls       # Manual adjustment UI
```

**Key Architectural Decisions:**

1. **Native-First:** SceneKit for rendering (NOT Three.js) - better ARKit integration, performance
2. **Expo Module Pattern:** Uses Expo Modules API, not legacy React Native native modules
3. **Event-Driven:** Swift emits events → React hooks consume → UI updates
4. **Screen Flow:** ModelPreview → WallScanning → AlignmentView → ImmersiveView
5. **State Management:** AsyncStorage for alignment persistence, hooks for runtime state

### Component Patterns

**ARKit Views (Native):**
```swift
// modules/expo-arkit/ios/ExpoARKitView.swift
class ExpoARKitView: ExpoView {
  let sceneView = ARSCNView()
  var arSession: ARSession { sceneView.session }
  
  // Event emitters
  func sendEvent(name: String, body: [String: Any?]) {
    onPlaneDetected?(["nativeEvent": body])
  }
  
  // Imperative methods (called from JS)
  func loadModel(uri: String, scale: Double) { /* ... */ }
}
```

**React Hooks Pattern:**
```typescript
// src/ui/ar/hooks/useARKitSession.ts
export const useARKitSession = () => {
  const [isActive, setIsActive] = useState(false);
  const arkitRef = useRef<ARKitViewRef>(null);
  
  const startSession = useCallback(() => {
    arkitRef.current?.startSession();
  }, []);
  
  return { isActive, startSession, arkitRef };
};
```

**Screen Orchestration:**
```tsx
// src/ui/screens/AlignmentViewScreen.tsx
export const AlignmentViewScreen = ({ route, navigation }) => {
  const { modelUri, realWallData } = route.params;
  const { alignment, calculate } = useModelAlignment();
  
  const handleComplete = () => {
    navigation.navigate('ImmersiveView', { modelUri, alignment });
  };
  
  return <ARKitView onModelLoaded={calculate} />;
};
```

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

---

## Key Dependencies

### Core Framework
- **react-native** 0.81.5
- **expo** ~54.0.27 (Bare Workflow with native modules)
- **react** 19.1.0
- **typescript** 5.9.2 (strict mode)

### AR & Native
- **expo-arkit** (custom module at `modules/expo-arkit`)
- **expo-roomplan** 1.2.1 - Room scanning API
- **expo-camera** ~17.0.10 - Camera access
- **expo-sensors** ~15.0.0 - Device motion
- **expo-haptics** ~15.0.8 - Haptic feedback

### Navigation & UI
- **@react-navigation/native** ^7.1.8
- **@react-navigation/native-stack** ^7.8.6
- **@react-navigation/bottom-tabs** ^7.4.0
- **expo-symbols** - SF Symbols (iOS 13+)

### Development Tools
- **babel-plugin-module-resolver** - `@/` import alias
- **eslint** ~9.0.0 with flat config
- **prettier** - Code formatting

---

## Platform-Specific Considerations

### iOS (Primary Focus)
- **Current:** Expo Bare Workflow with native ARKit integration
- **Hardware Requirements:**
  - iPhone 12 Pro+ OR iPad Pro 2020+ (LiDAR required)
  - iOS 16.0+ (for RoomPlan API)
- **Capabilities:**
  - ARKit World Tracking ✅
  - Scene Reconstruction (depth + mesh) ✅
  - Plane Detection (7 surface types) ✅
  - Portal Mode (reality replacement) ✅
  - Collision Detection ✅
- **Permissions:** Camera + LiDAR usage descriptions in Info.plist

### Debugging AR Features - Critical Limitations

**AR features require PHYSICAL device with LiDAR:**
- iPhone 12 Pro or later ✅ (tested on iPhone 14 Pro Max)
- iPad Pro 2020 or later ✅
- iOS 16.0+ ✅
- Simulator ❌ (no LiDAR, no ARKit depth/mesh)

**Device Capabilities by Feature:**
| Feature | iPhone 12+ | Simulator | Android |
|---------|-----------|-----------|---------|
| expo-camera | ✅ | ✅ (mock) | ✅ |
| expo-sensors | ✅ | ✅ (mock) | ✅ |
| ARKit plane detection | ✅ | ❌ | ❌ |
| Scene reconstruction | ✅ (LiDAR only) | ❌ | N/A |
| Portal mode | ✅ | ❌ | N/A |

**Testing Strategy:**
- All AR features: Test on real device only
- UI/navigation: Simulator OK
- Always iterate natively for AR features

---

## Documentation Structure

### Available Documentation (`docs/`)

**For quick orientation:** Start with [docs/00_START_HERE.md](../docs/00_START_HERE.md)
**For complete index:** See [docs/INDEX.md](../docs/INDEX.md)

### Active Documentation (10 files, ~4100 lines)

1. **[00_START_HERE.md](../docs/00_START_HERE.md)** - Entry point by role (5 min read)
2. **[INDEX.md](../docs/INDEX.md)** - Complete index + navigation by role
3. **[README.md](../docs/README.md)** - Project overview and stack
4. **[BUILD_AND_RUN.md](../docs/BUILD_AND_RUN.md)** - How to compile and execute (practical guide)
5. **[CURRENT_STATE.md](../docs/CURRENT_STATE.md)** - Complete feature status (88% POC progress)
6. **[PLAN_AR_INMERSIVO.md](../docs/PLAN_AR_INMERSIVO.md)** - Complete technical vision and roadmap
7. **[POC_BRIEF.md](../docs/POC_BRIEF.md)** - Intent, hypothesis, success criteria
8. **[INTERACTIVE_ALIGNMENT_GUIDE.md](../docs/INTERACTIVE_ALIGNMENT_GUIDE.md)** - Multi-wall alignment implementation guide
9. **[ARKIT_IMPLEMENTATION.md](../docs/ARKIT_IMPLEMENTATION.md)** - expo-arkit module details
10. **[ARKIT_FEATURES.md](../docs/ARKIT_FEATURES.md)** - Catalog of ARKit capabilities

### When to Reference Documentation

- **Developer onboarding:** [00_START_HERE.md](../docs/00_START_HERE.md) → [BUILD_AND_RUN.md](../docs/BUILD_AND_RUN.md) → [CURRENT_STATE.md](../docs/CURRENT_STATE.md)
- **Understand architecture:** [PLAN_AR_INMERSIVO.md](../docs/PLAN_AR_INMERSIVO.md) (full technical vision)
- **Current status:** [CURRENT_STATE.md](../docs/CURRENT_STATE.md) (88% POC complete)
- **Next work:** [INTERACTIVE_ALIGNMENT_GUIDE.md](../docs/INTERACTIVE_ALIGNMENT_GUIDE.md) (multi-wall alignment)
- **Native details:** [ARKIT_IMPLEMENTATION.md](../docs/ARKIT_IMPLEMENTATION.md) + [ARKIT_FEATURES.md](../docs/ARKIT_FEATURES.md)
- **Setup help:** [BUILD_AND_RUN.md](../docs/BUILD_AND_RUN.md) (step-by-step build guide)

---

## Implementation Roadmap

### Completed Phases ✅

#### Phase 0: Foundation
- ✅ Expo Bare Workflow migration
- ✅ ARKit + SceneKit native integration
- ✅ Expo module creation (expo-arkit)
- ✅ React Native ↔ Swift bridge

#### Phase 0.5: Plane Detection
- ✅ Plane visualization with classification
- ✅ 7 surface types (floor, wall, ceiling, table, seat, window, door)
- ✅ Real-time events to React Native

#### Phase 1: Model Loading & Manipulation
- ✅ USDZ/USD model loading
- ✅ Tap-to-place with raycast
- ✅ Gesture system (pan, rotate, pinch, scale)
- ✅ Undo/Redo functionality

#### Phase 1.5: Room Scanning
- ✅ expo-roomplan integration
- ✅ USDZ export from scanned rooms

#### Phase 1.7: SceneKit Preview
- ✅ Apple Quick Look gesture system
- ✅ Momentum/inertia animations
- ✅ Camera presets (Front/Right/Top/Perspective)

#### Phase 2: Model Alignment
- ✅ Auto-alignment algorithm
- ✅ Manual adjustment UI
- ✅ AsyncStorage persistence

#### Phase 3.1: Portal Mode
- ✅ Camera feed hiding
- ✅ Reality replacement toggle

#### Phase 3.2: Mesh Classification
- ✅ Surface type detection (wall/floor/ceiling)
- ✅ Classification-specific materials

#### Phase 3.3: Collision Detection
- ✅ Physics bodies
- ✅ Contact delegate
- ✅ Collision events to React Native

#### Phase 3.4: Quality Settings
- ✅ Occlusion quality selector
- ✅ FPS monitoring
- ✅ Performance stats

### In Progress 🔨

- Interactive Multi-Wall Alignment (guided scan with visual feedback)
- Wall Anchor System refinements

### Pending Features ⏳

- Enhanced collision response (bounce, haptics)
- Multi-model scene support
- Lighting controls
- Material editor

**Status Legend:** ✅ Complete | 🔨 In Progress | ⏳ Pending
