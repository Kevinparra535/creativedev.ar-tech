# BUILD & RUN GUIDE - FASE 0 (88% Completado)

**Proyecto:** creativedev.ar-tech (Expo Bare Workflow)  
**Estado:** Paso 7 Completado ✅  
**Rama:** `feature/bare-workflow-migration`  
**Últimas Actualizaciones:** 2025-12-08

---

## 🚀 Quick Start

### Prerequisitos

- ✅ Node.js 18+ (check: `node --version`)
- ✅ macOS with Xcode 14+ (check: `xcode-select -p`)
- ✅ CocoaPods (check: `pod --version`)
- ✅ iPhone 14 Pro Max with iOS 16+ (physical device)
- ✅ Apple Developer Account (free provisioning OK)

### Setup Inicial (Primera Vez)

```bash
# 1. Clonar o navegar al proyecto
cd /Users/kevinparra/Documents/personal_projects/creativedev.ar-tech

# 2. Instalar dependencias Node
npm install

# 3. Instalar pods de iOS
cd ios && pod install --repo-update && cd ..

# 4. Limpiar caché
rm -rf node_modules/.cache
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# 5. Verificar estado
npm start -- --version
npx expo --version
```

---

## 🔨 Build & Run Commands

### A. Desarrollo Local (Metro Bundler + Device)

**OPCIÓN A.1: Device físico (Recomendado)**

```bash
# Terminal 1: Iniciar Metro bundler
cd /Users/kevinparra/Documents/personal_projects/creativedev.ar-tech
npm start -- --clear

# Terminal 2: Build en device (aguarda a que Metro esté listo)
npx expo run:ios --device

# Expected output:
# ✨  Expo CLI starting...
# ✅ Device 'iPhone 14 Pro Max' found
# 📱 Building app...
# 🎉 App installed and launched!
```

**OPCIÓN A.2: Simulador iOS**

```bash
# Terminal 1: Iniciar Metro bundler
npm start -- --clear

# Terminal 2: Build en simulador
npx expo run:ios

# Si quieres un simulador específico:
npx expo run:ios --simulator "iPhone 14 Pro"
```

**OPCIÓN A.3: Device Específico**

```bash
# Ver devices disponibles
xcrun xcode-select -p

# Build en device específico
npx expo run:ios --device "Kevin's iPhone"
```

---

### B. Production Build (Para distribución)

**OPCIÓN B.1: Local Release Build**

```bash
# Build optimizado sin Metro
npx expo run:ios --configuration Release

# This will:
# - Compile optimized native code
# - Bundle JavaScript minified
# - Generate release APK
# - Install on device
```

**OPCIÓN B.2: EAS Build (Recomendado para CI/CD)**

```bash
# Config EAS (primera vez)
eas build:configure

# Build en cloud para iOS
eas build --platform ios --wait

# Build y instalar automáticamente
eas build --platform ios --wait && npx eas-cli install --platform ios
```

---

## 📱 Testing on Device

### Paso 1: Conectar Device

```bash
# Verificar que device está reconocido
xcrun xcode-select -p

# Ejecutar build (maneja provisioning automáticamente)
npx expo run:ios --device
```

### Paso 2: Trust Developer Certificate

**En el device iOS:**
1. Abre **Settings** → **General** → **Device Management**
2. Busca tu Apple ID
3. Tap **Trust**

### Paso 3: Verificar App

```bash
# Los logs aparecerán en Terminal
# Busca líneas como:
# [useRoomPlan] Hook initialized
# [RoomPlanTestScreen] Component mounted
```

---

## 🧪 Testing Specific Features

### Test RoomPlan Integration (Paso 7)

```bash
# 1. Start dev environment
npm start -- --clear

# 2. Build on device
npx expo run:ios --device

# 3. En la app:
#    - Tab "RoomPlan Test" debería aparecer
#    - Click "Iniciar Escaneo"
#    - RoomPlanView debe renderizarse
#    - Check logs en Metro console

# 4. Ver logs
tail -f ~/Library/Logs/com.apple.CoreSimulator/com.apple.CoreSimulator.SimServiceErrorHandler.log
```

### Test AR Features

```bash
# Navegar a pantalla AR
# - Tab "AR"
# - Debería ver sala 3D
# - Botones de material picker funcionando
# - Material changes visibles en render

npm start -- --clear
npx expo run:ios --device
```

---

## 🛠️ Troubleshooting Commands

### Limpiar Build Completo

```bash
# Limpiar todos los caches y rebuilt
rm -rf ios/Pods ios/Podfile.lock
rm -rf ~/Library/Developer/Xcode/DerivedData/*
npm install
cd ios && pod install --repo-update && cd ..
npx expo run:ios --device
```

### Verificar Provisioning Profile

```bash
# Listar profiles disponibles
security find-identity -v -p codesigning

# Si hay problemas:
# 1. Abrir Xcode
# 2. Xcode > Settings > Accounts
# 3. Select Apple ID
# 4. Manage Certificates
# 5. "Refresh"
```

### Metro Bundler Issues

```bash
# Si Metro se queda colgado:
killall -9 expo node

# Reiniciar completamente
npm start -- --clear --reset-cache

# Si persiste:
rm -rf node_modules
npm install
npm start -- --clear
```

### Xcode Build Failures

```bash
# Limpiar Xcode build folder
cd ios
rm -rf build
xcodebuild clean -workspace creativedevartech.xcworkspace -scheme creativedevartech

# O desde CLI:
npx expo run:ios --device -- clean
```

---

## 📊 Monitoring & Logging

### Metro Console Logs

```bash
# Los logs JavaScript aparecen aquí automáticamente
npm start -- --clear

# Filtrar por componente
npm start -- --clear 2>&1 | grep -i "useRoomPlan\|RoomPlanTestScreen"
```

### Xcode Console Logs

```bash
# Abrir Xcode y device logs
open ios/creativedevartech.xcworkspace

# En Xcode:
# Window > Devices and Simulators
# Seleccionar device
# Click "Open Console"

# O desde terminal:
xcrun simctl spawn booted log stream --predicate 'eventMessage contains "RoomPlan"'
```

### Combined Logging

```bash
# Terminal 1: Metro
npm start -- --clear

# Terminal 2: Device logs
xcrun xcode-select -p && xcrun simctl spawn booted log stream --level debug

# Terminal 3: Build output
npx expo run:ios --device
```

---

## 🔍 Debug Mode

### React Native Debugger

```bash
# 1. Instalar React Native Debugger
brew install react-native-debugger

# 2. En Metro:
#    Presionar 'j' para abrir Chrome DevTools (deprecated)
#    O usar Flipper (recomendado)

# 3. Alternative: Usar Flipper
npm install flipper-plugin-react-native-bridge
```

### Flipper (Recomendado)

```bash
# 1. Instalar Flipper
brew install flipper

# 2. Enable en proyecto
# En App.tsx:
import { initializeFlipper } from 'react-native-flipper';

if (__DEV__) {
  initializeFlipper(() => {});
}

# 3. Connect device to Flipper
# Flipper detectará app automáticamente
```

---

## 📦 Build Artifacts

### Ubicación de archivos compilados

```bash
# Metro bundle cache
~/.expo/cache/

# Xcode derived data
~/Library/Developer/Xcode/DerivedData/

# CocoaPods
ios/Pods/

# Build output
ios/build/
```

### Limpieza de Espacio

```bash
# Ver tamaño de Xcode cache
du -sh ~/Library/Developer/Xcode/DerivedData/

# Limpiar
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Ver tamaño de node_modules
du -sh node_modules/

# Limpiar si es necesario
npm ci (reinstalar versiones exactas)
```

---

## 🚀 CI/CD with EAS

### Setup EAS (Primera Vez)

```bash
# Crear cuenta en eas.expo.dev
# Login
npx eas-cli login

# Configure proyecto
npx eas-cli build:configure

# Ver configuración
cat eas.json
```

### Build en Cloud

```bash
# Build para iOS
eas build --platform ios

# Build y esperar
eas build --platform ios --wait

# Build específico
eas build --platform ios --wait \
  --profile preview \
  --message "RoomPlan integration test"

# Descargar APK/IPA después
eas build:list
eas build:download --id build-id-here
```

### Install desde Cloud

```bash
# Instalar última build
eas install --platform ios --latest

# Instalar build específico
eas install --platform ios --id build-id-here
```

---

## 📋 Command Cheat Sheet

```bash
# Desarrollo
npm start -- --clear                    # Metro bundler
npx expo run:ios --device             # Build en device
npx expo run:ios                       # Build en simulador

# Production
npx expo run:ios --configuration Release  # Release build
eas build --platform ios --wait        # Cloud build

# Cleaning
npm install                             # Reinstalar deps
cd ios && pod install && cd ..         # Reinstalar pods
rm -rf ~/Library/Developer/Xcode/DerivedData/*  # Clean Xcode

# Debugging
npm start -- --clear 2>&1 | grep "error"  # Filter errors
xcrun simctl spawn booted log stream    # Device logs
open ios/creativedevartech.xcworkspace # Open Xcode

# Testing
npx expo run:ios --device --clear       # Clean build
npx eas build --platform ios --wait    # Cloud build
```

---

## ✅ Typical Workflow

```bash
# Día 1: Setup inicial
git clone <repo> creativedev.ar-tech
cd creativedev.ar-tech
npm install
cd ios && pod install && cd ..

# Día 2+: Desarrollo diario
npm start -- --clear          # Terminal 1: Metro
npx expo run:ios --device     # Terminal 2: Build

# Cambios en código:
# - Save file
# - Fast Refresh automático
# - Ver cambios en device en <2s

# Cambios nativos (Swift/Objective-C):
# - Ctrl+C en Metro
# - npm start -- --clear
# - npx expo run:ios --device

# Antes de commit:
npm run lint
npm test (si hay tests)
```

---

## 🔗 Related Documentation

- `docs/FASE_0_SETUP.md` - Detailed setup steps
- `docs/NEXT_STEPS.md` - Continuación de FASE 0
- `docs/PASO_7_ROOMPLAN_VIEW_COMPLETE.md` - RoomPlan ViewManager guide
- `.github/copilot-instructions.md` - Project guidelines

---

## 📞 Support & Resources

### Apple Documentation
- [Building for Physical Devices](https://developer.apple.com/documentation/xcode/building_and_running_your_app)
- [Provisioning profiles](https://developer.apple.com/support/account/)
- [RoomPlan API](https://developer.apple.com/documentation/roomplan)

### React Native
- [Expo Documentation](https://docs.expo.dev)
- [React Native CLI](https://reactnative.dev/docs/environment-setup)
- [Native Modules](https://reactnative.dev/docs/native-modules-ios)

### Community
- [Expo Discussions](https://github.com/expo/expo/discussions)
- [React Native Community](https://github.com/react-native-community)

---

**Last Updated:** 2025-12-08  
**Status:** Phase 0 - 88% Complete (Paso 7 ✅)  
**Next:** Paso 8 - USDZ Export Validation
