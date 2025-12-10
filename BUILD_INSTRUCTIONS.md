# 🚀 Next: How to Build & Test

**Status:** ✅ Phase 0 Complete, Ready for Phase 1  
**Date:** 2025-12-09

---

## Quick Build Instructions

### Prerequisites

- ✅ macOS with Xcode 14+ (have it?)
- ✅ iPhone 14 Pro Max with iOS 17+ (have it?)
- ✅ npm dependencies installed (just did it)
- ✅ expo-roomplan installed (done)

### Build on Device (Recommended)

```bash
# Terminal 1: Start Metro bundler with clean cache
npm start -- --clear

# Terminal 2: Build on device (wait for Metro to start)
npx expo run:ios --device

# Expected output:
# ✨  Expo CLI starting...
# ✅ Device 'iPhone 14 Pro Max' found
# 📱 Building app...
# 🎉 App installed and launched!
```

### Test the RoomPlan Integration

Once app launches:

1. **Look for bottom tab "RoomPlan Test"** (should show 3 dots or similar)
2. **Tap the tab**
3. **You should see:**
   - Header: "RoomPlan Scanner"
   - Status card showing "⏸ Listo"
   - Single blue button: "📱 Iniciar Escaneo"
   - Help text and info cards below

4. **Tap "📱 Iniciar Escaneo"**
   - RoomPlan modal opens (Apple's official UI)
   - Should show: "Room Capture" title
   - Instructions for scanning
   - Live camera feed

5. **Scan a small area** (5-10 seconds)
   - Move device slowly around
   - Follow Apple's on-screen guidance

6. **Apple's Preview appears**
   - Shows 3D mesh of what was scanned
   - Has options to finish or add another room

7. **Auto-export happens**
   - USDZ file generated
   - JSON metadata saved

8. **Return to app**
   - Modal closes
   - "Último Escaneo" card shows with scan name
   - Success alert: "✅ Éxito - Escaneo completado: Room_XXXXX"

---

## What Just Happened

### Old Approach (❌ Abandoned)

- Complex manual RoomPlan modules
- Multiple state management
- Event listeners
- Manual export buttons
- 161 lines in hook + 376 lines in screen

### New Approach (✅ Active)

- Single expo-roomplan package
- Async/await wrapper
- Apple's native UI modal
- Automatic export
- 18 lines in hook + 156 lines in screen

### Code Reduction

```
useRoomPlan.ts:       161 lines → 18 lines  (-88%)
RoomPlanTestScreen.tx: 376 lines → 156 lines (-58%)
Native files:         7 files → 0 files    (-100%)
Total reduction:      ~530 lines → ~170 lines (-68%)
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   React Native App                  │
│         (RoomPlanTestScreen.tsx - 156 lines)        │
└────────────┬────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────┐
│               useRoomPlan Hook                       │
│      (Wrapper around expo-roomplan - 18 lines)      │
└────────────┬────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────┐
│            expo-roomplan Package v1.2.1             │
│     (Managed Expo modules, auto-linked via plugin)  │
│  ├─ ExpoRoomPlanModule                              │
│  └─ ExpoRoomPlanViewModule                          │
└────────────┬────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────┐
│          iOS Native (RoomPlan Framework)            │
│    ├─ RoomCaptureSession (scanning)                 │
│    ├─ RoomCaptureView (UI)                          │
│    ├─ LiDAR hardware                                │
│    └─ CoreML scene recognition                      │
└─────────────────────────────────────────────────────┘
```

---

## Expected Console Output

### Metro (Terminal 1)

```
[RoomPlanTest] Starting scan with name: Room_1702145400000
[RoomPlan] Scan completed: { scanUrl: "...", jsonUrl: "..." }
```

### Device Console (Xcode Window > Devices > Select Device > View Device Logs)

```
RoomPlan: Scan started
RoomPlan: Surfaces detected: 8
RoomPlan: Exporting USDZ...
RoomPlan: Export complete: scanned_room_XXXXX.usdz (2.3 MB)
```

---

## Troubleshooting

### Build Fails: "Module not found: expo-roomplan"

```bash
# Solution 1: Clean and reinstall
rm -rf node_modules package-lock.json
npm install

# Solution 2: Clean iOS build
rm -rf ios/build ~/Library/Developer/Xcode/DerivedData/*
npx expo prebuild --clean --platform ios

# Solution 3: Rebuild
npm start -- --clear
npx expo run:ios --device
```

### RoomPlan Modal Doesn't Open

**Check:**

1. Device has LiDAR (iPhone 14 Pro Max ✓)
2. iOS 17+ (Settings > General > About > Version)
3. Check logs for errors

```bash
# If logs show "RoomPlan not supported":
# Device must have LiDAR. Test device must be iPhone 12 Pro+ or iPad Pro 2020+
```

### Export Fails or Doesn't Appear

**Most likely:** Share sheet appeared (wrong config)

**Fix:**

```typescript
// Ensure sendFileLoc: true in useRoomPlanLib options
const { startRoomPlan } = useExpoRoomPlanLib({
  exportType: ExportType.Parametric,
  sendFileLoc: true  // ← Must be true to skip share sheet
});
```

### App Crashes on Modal Open

```bash
# Check Xcode console for crash logs
open ios/creativedevartech.xcworkspace

# Window > Devices and Simulators > Select Device > View Device Logs

# Common causes:
# - Device doesn't support RoomPlan (no LiDAR)
# - iOS version < 17.0
# - Plugin not loaded (check app.json)
```

---

## Phase 0 vs Phase 1

### Phase 0 (✅ Complete)

- [x] React Native Bare Workflow setup
- [x] RoomPlan API integration
- [x] Async scanning workflow
- [x] USDZ export automation
- [x] Clean, maintainable codebase

**Status:** Ready to build and test on device

### Phase 1 (⏳ Next - Model Loading & Alignment)

- [ ] Upload/select 3D model (USDZ/glTF)
- [ ] Model preview in app
- [ ] Manual alignment tools
  - Scale slider
  - Rotation controls
  - Position adjustment
- [ ] Save alignment data
- [ ] Persist models locally

**Estimated:** 2-3 weeks
**Depends on:** Phase 0 ✅ complete

---

## Important Files

| File | Purpose | Status |
|------|---------|--------|
| src/ui/ar/hooks/useRoomPlan.ts | Async wrapper | ✅ Ready (18 lines) |
| src/ui/screens/RoomPlanTestScreen.tsx | Test UI | ✅ Ready (156 lines) |
| app.json | Plugin config | ✅ Ready |
| package.json | Dependencies | ✅ expo-roomplan@1.2.1 |
| docs/EXPO_ROOMPLAN_MIGRATION.md | Migration guide | ✅ Detailed |
| PHASE_0_COMPLETE.md | Completion summary | ✅ Here |

---

## Success Criteria

After building and testing, you should have:

- ✅ App launches without crashes
- ✅ RoomPlan Test tab visible
- ✅ "Iniciar Escaneo" button clickable
- ✅ RoomPlan modal opens and shows instructions
- ✅ Can scan a room (see mesh appear in real-time)
- ✅ Preview UI shows scanned result
- ✅ Export happens automatically
- ✅ Return to app shows success message
- ✅ Metro console shows no errors
- ✅ Xcode console shows no crashes

---

## Next Steps After Build

1. **Document test results**
   - Screenshots of each step
   - Console output
   - File sizes of exports

2. **Identify any issues**
   - Device-specific problems
   - Permission requests
   - Performance concerns

3. **Start Phase 1 planning**
   - Model upload mechanism
   - Alignment UI components
   - Data persistence strategy

---

## Quick Reference

```bash
# Development loop
npm start -- --clear          # Terminal 1: Metro
npx expo run:ios --device     # Terminal 2: Build

# After code changes
# - JS changes: Auto refresh (< 1s)
# - Native changes: Full rebuild needed

# View device logs
open ios/creativedevartech.xcworkspace
# Window > Devices and Simulators > Select device > View Console

# Kill stuck processes
lsof -i :19000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Clean build
rm -rf ios/build Pods Podfile.lock
npx expo prebuild --clean --platform ios
npm start -- --clear
```

---

## Resources

- **expo-roomplan:** <https://github.com/fordat/expo-roomplan>
- **Apple RoomPlan:** <https://developer.apple.com/documentation/roomplan>
- **Expo Docs:** <https://docs.expo.dev>
- **React Native:** <https://reactnative.dev>

---

## Support

If issues arise:

1. Check `docs/EXPO_ROOMPLAN_MIGRATION.md` troubleshooting section
2. Check Metro console for JavaScript errors
3. Check Xcode console for native errors
4. Check device logs (Xcode > Window > Devices)

---

**Ready to build?** 🚀

```bash
npm start -- --clear
npx expo run:ios --device
```

Good luck! Let me know when the build succeeds. Next is Phase 1: Model loading! 🎨
