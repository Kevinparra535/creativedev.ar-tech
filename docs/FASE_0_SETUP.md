# FASE 0: Setup y Validación - Guía Detallada

**Objetivo:** Migrar a Expo Bare Workflow y validar RoomPlan API
**Duración estimada:** 1.5-2 semanas (con experiencia Swift básica)
**Estado:** 🚀 EN PROGRESO

---

## Pre-requisitos Verificados ✅

- [x] macOS con Xcode 14+ instalado
- [x] iPhone 14 Pro Max con LiDAR
- [x] Proyecto Expo actual funcionando
- [x] Git configurado y código versionado
- [x] Experiencia Swift: Básica

---

## Resumen de la Fase

Esta fase convierte el proyecto de **Expo Managed** a **Expo Bare Workflow**, permitiendo acceso completo a código nativo iOS para integrar RoomPlan y ARKit.

### Lo que vamos a hacer

1. **Migrar a Bare Workflow** - Generar proyectos nativos iOS/Android
2. **Configurar Xcode** - Setup del proyecto iOS
3. **Crear Native Module** - Wrapper Swift para RoomPlan
4. **Setup React Native Bridge** - Comunicación RN ↔ Swift
5. **Probar RoomPlan** - Primera captura de habitación

### Lo que obtenemos al final

- ✅ Proyecto Bare Workflow funcional
- ✅ Módulo Swift básico integrado
- ✅ RoomPlan API funcionando
- ✅ App que escanea habitaciones

---

## Paso 1: Backup y Preparación

### 1.1 Crear rama de desarrollo

```bash
# Asegurarte de estar en master/main limpio
git status

# Crear rama para migración
git checkout -b feature/bare-workflow-migration

# Verificar estado inicial
git log --oneline -5
```

**Checklist:**
- [x] Rama creada ✅ (feature/bare-workflow-migration activa)
- [x] Código actual funcionando ✅ (master en commit b20ad32)
- [x] Sin cambios sin commitear ✅ (cambios staged listos para commit)

---

### 1.2 Documentar estado actual

Tomar nota de:
- Versión Expo actual
- Dependencias críticas (Three.js, expo-camera, etc.)
- Features funcionando actualmente

```bash
# Ver versión Expo
npx expo --version

# Ver dependencias
cat package.json | grep -A 20 '"dependencies"'
```

**Checklist:**
- [x] Versiones documentadas ✅ (ver docs/PRE_MIGRATION_STATE.md)
- [x] Screenshots de app funcionando ✅ (opcional - documentación de features completada)

---

## Paso 2: Migración a Bare Workflow

### 2.1 Ejecutar expo prebuild

Este comando genera carpetas `ios/` y `android/` con código nativo:

```bash
# IMPORTANTE: Esto NO se puede deshacer fácilmente
# Asegúrate de tener backup en git

npx expo prebuild
```

**Lo que hace este comando:**
1. Genera `ios/` con proyecto Xcode
2. Genera `android/` con proyecto Android Studio
3. Actualiza `app.json` con configuraciones nativas
4. Instala pods de iOS
5. Configura build settings

**Posibles problemas:**

**Error: "CocoaPods not installed"**
```bash
# Instalar CocoaPods
sudo gem install cocoapods

# Retry
npx expo prebuild
```

**Error: "Xcode Command Line Tools not found"**
```bash
# Instalar Xcode CLI tools
xcode-select --install
```

**Checklist:**
- [ ] Comando ejecutado sin errores
- [ ] Carpeta `ios/` creada
- [ ] Carpeta `android/` creada
- [ ] Pods instalados (ver `ios/Pods/`)

---

### 2.2 Verificar estructura generada

```bash
# Ver estructura iOS
ls -la ios/

# Deberías ver:
# - creativedevartech.xcodeproj
# - creativedevartech.xcworkspace (usa este!)
# - Podfile
# - Pods/
```

**Archivos clave generados:**

```
ios/
├── creativedevartech/           # App iOS
│   ├── AppDelegate.h            # Entry point
│   ├── AppDelegate.mm           # Objective-C++ (puedes usar Swift aquí)
│   ├── Info.plist               # Configuración app
│   └── main.m                   # Main
├── creativedevartech.xcodeproj  # Proyecto Xcode
├── creativedevartech.xcworkspace # USAR ESTE
├── Podfile                      # Dependencias CocoaPods
└── Pods/                        # Dependencias instaladas
```

**Checklist:**
- [ ] Estructura iOS verificada
- [ ] `.xcworkspace` existe (NO `.xcodeproj`)

---

### 2.3 Primera build iOS

```bash
# Build desde terminal
npx expo run:ios

# O especificar device
npx expo run:ios --device
```

**Esto va a:**
1. Abrir Xcode (si no está abierto)
2. Compilar app nativa
3. Instalar en simulador o device
4. Lanzar Metro bundler

**Posibles errores:**

**Error: "Signing requires a development team"**
- Solución: Abrir Xcode, seleccionar target, ir a Signing & Capabilities, agregar tu Apple ID

**Error: "No devices found"**
- Solución: Abrir Xcode > Window > Devices and Simulators, agregar device

**Tiempo esperado:** 3-5 minutos primera build, 30-60s builds subsecuentes

**Checklist:**
- [ ] Build exitoso
- [ ] App corre en device/simulator
- [ ] UI se ve igual que antes
- [ ] Navegación funciona

---

## Paso 3: Configurar Xcode Project

### 3.1 Abrir proyecto en Xcode

```bash
# IMPORTANTE: Usar .xcworkspace, NO .xcodeproj
open ios/creativedevartech.xcworkspace
```

### 3.2 Configurar Signing & Capabilities

1. En Xcode, seleccionar el target `creativedevartech`
2. Ir a **Signing & Capabilities**
3. **Team:** Seleccionar tu Apple ID
4. **Bundle Identifier:** Debe ser único (ej: `com.tuempresa.creativedevar`)

**Agregar Capabilities necesarias:**

Click **+ Capability** y agregar:
- [x] **ARKit** (para AR features)
- [x] **Camera** (ya debería estar)

**Checklist:**
- [ ] Team configurado
- [ ] Bundle ID único
- [ ] ARKit capability agregada
- [ ] Sin errores en Signing

---

### 3.3 Configurar Info.plist

Abrir `ios/creativedevartech/Info.plist` y verificar/agregar:

```xml
<key>NSCameraUsageDescription</key>
<string>Esta app necesita acceso a la cámara para escanear espacios con AR</string>

<key>UIRequiredDeviceCapabilities</key>
<array>
    <string>arkit</string>
    <string>armv7</string>
</array>
```

**Checklist:**
- [ ] Permisos de cámara configurados
- [ ] ARKit como capability requerida

---

## Paso 4: Crear Native Module para RoomPlan

### 4.1 Crear carpeta para módulo nativo

```bash
mkdir -p ios/RoomPlanModule
```

### 4.2 Crear RoomPlanBridge.m (Objective-C Bridge)

**Archivo:** `ios/RoomPlanModule/RoomPlanBridge.m`

```objective-c
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(RoomPlanModule, RCTEventEmitter)

RCT_EXTERN_METHOD(startScanning)
RCT_EXTERN_METHOD(stopScanning)

@end
```

**Checklist:**
- [ ] Archivo creado
- [ ] Sintaxis correcta

---

### 4.3 Crear RoomPlanModule.swift (Implementación Swift)

**Archivo:** `ios/RoomPlanModule/RoomPlanModule.swift`

```swift
import Foundation
import React
import RoomPlan

@objc(RoomPlanModule)
class RoomPlanModule: RCTEventEmitter {

  // Permitir que React Native llame a este módulo
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  // Eventos que este módulo puede emitir
  override func supportedEvents() -> [String]! {
    return ["onScanStart", "onScanProgress", "onScanComplete", "onScanError"]
  }

  // Método para iniciar escaneo
  @objc
  func startScanning() {
    print("RoomPlan: Starting scan...")
    sendEvent(withName: "onScanStart", body: ["status": "started"])

    // TODO: Implementar RoomCaptureSession en siguiente paso
  }

  // Método para detener escaneo
  @objc
  func stopScanning() {
    print("RoomPlan: Stopping scan...")
  }
}
```

**Explicación:**
- `RCTEventEmitter`: Permite enviar eventos a JavaScript
- `@objc`: Expone métodos a Objective-C (requerido para bridge)
- `supportedEvents()`: Define eventos que JS puede escuchar

**Checklist:**
- [ ] Archivo creado
- [ ] Sin errores de sintaxis
- [ ] Métodos básicos implementados

---

### 4.4 Agregar módulo a Xcode project

1. En Xcode, **botón derecho** en carpeta `creativedevartech`
2. **Add Files to "creativedevartech"...**
3. Navegar a `ios/RoomPlanModule/`
4. Seleccionar ambos archivos (`.m` y `.swift`)
5. ✅ **Copy items if needed**
6. ✅ **Create groups**
7. ✅ Target: `creativedevartech`

**Si Xcode pregunta por Bridging Header:**
- Click **"Create Bridging Header"**
- Se creará `creativedevartech-Bridging-Header.h`

**Checklist:**
- [ ] Archivos agregados a Xcode
- [ ] Aparecen en Navigator izquierdo
- [ ] Bridging header creado (si preguntó)

---

### 4.5 Configurar Swift en proyecto Objective-C

En Xcode:
1. Seleccionar target `creativedevartech`
2. **Build Settings**
3. Buscar "Swift Language Version"
4. Setear a **Swift 5**

**Checklist:**
- [ ] Swift 5 configurado
- [ ] Build Settings actualizados

---

## Paso 5: Probar módulo desde React Native

### 5.1 Crear hook para usar módulo

**Archivo:** `src/hooks/useRoomPlan.ts`

```typescript
import { useEffect } from 'react';
import { NativeModules, NativeEventEmitter } from 'react-native';

const { RoomPlanModule } = NativeModules;
const roomPlanEmitter = new NativeEventEmitter(RoomPlanModule);

export const useRoomPlan = () => {
  useEffect(() => {
    // Escuchar eventos del módulo nativo
    const subscription = roomPlanEmitter.addListener(
      'onScanStart',
      (event) => {
        console.log('Scan started:', event);
      }
    );

    return () => subscription.remove();
  }, []);

  const startScanning = () => {
    console.log('JS: Starting RoomPlan scan...');
    RoomPlanModule.startScanning();
  };

  const stopScanning = () => {
    console.log('JS: Stopping RoomPlan scan...');
    RoomPlanModule.stopScanning();
  };

  return {
    startScanning,
    stopScanning,
  };
};
```

**Checklist:**
- [ ] Archivo creado
- [ ] TypeScript sin errores

---

### 5.2 Crear pantalla de prueba

**Archivo:** `src/screens/RoomPlanTestScreen.tsx`

```typescript
import React from 'react';
import { View, Button, StyleSheet, Text } from 'react-native';
import { useRoomPlan } from '@/hooks/useRoomPlan';

export const RoomPlanTestScreen = () => {
  const { startScanning, stopScanning } = useRoomPlan();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RoomPlan Test</Text>

      <Button
        title="Start Scanning"
        onPress={startScanning}
      />

      <Button
        title="Stop Scanning"
        onPress={stopScanning}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
```

**Checklist:**
- [ ] Pantalla creada
- [ ] Botones renderizan

---

### 5.3 Agregar a navegación

**Modificar:** `src/ui/navigation/TabNavigator.tsx`

```typescript
import { RoomPlanTestScreen } from '@/screens/RoomPlanTestScreen';

// Agregar tab
<Tab.Screen
  name="RoomPlanTest"
  component={RoomPlanTestScreen}
  options={{
    title: 'RoomPlan Test',
    tabBarIcon: ({ color }) => (
      <Ionicons name="scan-outline" size={24} color={color} />
    ),
  }}
/>
```

**Checklist:**
- [ ] Tab agregada
- [ ] Navegación funciona

---

### 5.4 Rebuild y probar

```bash
# Rebuild app (necesario después de cambios nativos)
npx expo run:ios --device
```

**Probar:**
1. Abrir app en iPhone
2. Navegar a tab "RoomPlan Test"
3. Tocar "Start Scanning"
4. Ver console logs en Metro y Xcode

**Logs esperados:**

```
Metro:
JS: Starting RoomPlan scan...

Xcode Console:
RoomPlan: Starting scan...
```

**Checklist:**
- [ ] App compila sin errores
- [ ] Botones funcionan
- [ ] Logs aparecen en Metro
- [ ] Logs aparecen en Xcode console

---

## Paso 6: Implementar RoomPlan API Real

### 6.1 Actualizar RoomPlanModule.swift con RoomCaptureSession

**Reemplazar contenido de `ios/RoomPlanModule/RoomPlanModule.swift`:**

```swift
import Foundation
import React
import RoomPlan
import UIKit

@objc(RoomPlanModule)
class RoomPlanModule: RCTEventEmitter {

  private var captureSession: RoomCaptureSession?
  private var captureView: RoomCaptureView?

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  override func supportedEvents() -> [String]! {
    return ["onScanStart", "onScanProgress", "onScanComplete", "onScanError"]
  }

  @objc
  func startScanning() {
    DispatchQueue.main.async {
      self.initializeRoomCapture()
    }
  }

  @objc
  func stopScanning() {
    DispatchQueue.main.async {
      self.captureSession?.stop()
      self.sendEvent(withName: "onScanComplete", body: ["status": "stopped"])
    }
  }

  private func initializeRoomCapture() {
    // Verificar que el device soporte RoomPlan
    guard RoomCaptureSession.isSupported else {
      sendEvent(withName: "onScanError",
                body: ["error": "RoomPlan not supported on this device"])
      return
    }

    // Crear sesión de captura
    let session = RoomCaptureSession()
    self.captureSession = session

    // Crear vista de captura (necesaria para el proceso)
    let captureView = RoomCaptureView(frame: .zero)
    self.captureView = captureView

    // Configurar sesión
    var configuration = RoomCaptureSession.Configuration()

    // Iniciar captura
    session.run(configuration: configuration)

    sendEvent(withName: "onScanStart", body: ["status": "scanning"])
    print("RoomPlan: Scan started successfully")
  }
}
```

**Checklist:**
- [ ] Código actualizado
- [ ] Sin errores de compilación
- [ ] `RoomCaptureSession` importado correctamente

---

### 6.2 Rebuild y probar en device real

**IMPORTANTE:** RoomPlan **SOLO** funciona en dispositivo físico con LiDAR.

```bash
npx expo run:ios --device
```

**Probar:**
1. Conectar iPhone 14 Pro Max
2. Abrir app
3. Ir a "RoomPlan Test"
4. Tocar "Start Scanning"
5. Debería iniciar sesión de escaneo

**Logs esperados:**
```
Xcode Console:
RoomPlan: Scan started successfully

Metro:
Scan started: { status: 'scanning' }
```

**Si hay error "RoomPlan not supported":**
- Verificar que device tenga LiDAR
- Verificar iOS 16+

**Checklist:**
- [ ] Build exitoso en device
- [ ] Scan inicia sin errores
- [ ] Eventos se reciben en JS

---

## Paso 7: Crear UI de Escaneo (Básica)

### 7.1 Exponer RoomCaptureView a React Native

Necesitamos crear un **View Manager** para mostrar la vista de RoomPlan.

**Crear:** `ios/RoomPlanModule/RoomPlanViewManager.swift`

```swift
import Foundation
import React
import RoomPlan
import UIKit

@objc(RoomPlanViewManager)
class RoomPlanViewManager: RCTViewManager {

  override func view() -> UIView! {
    return RoomCaptureView(frame: .zero)
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
```

**Crear bridge:** `ios/RoomPlanModule/RoomPlanViewManager.m`

```objective-c
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(RoomPlanViewManager, RCTViewManager)
@end
```

**Agregar ambos archivos a Xcode** (mismo proceso que antes).

**Checklist:**
- [ ] ViewManager creado
- [ ] Bridge creado
- [ ] Agregados a Xcode

---

### 7.2 Crear componente React Native

**Crear:** `src/components/RoomPlanView.tsx`

```typescript
import { requireNativeComponent } from 'react-native';
import type { ViewProps } from 'react-native';

interface RoomPlanViewProps extends ViewProps {
  // Props adicionales si las necesitas
}

export const RoomPlanView = requireNativeComponent<RoomPlanViewProps>(
  'RoomPlanView'
);
```

**Checklist:**
- [ ] Componente creado
- [ ] TypeScript sin errores

---

### 7.3 Usar en pantalla de prueba

**Actualizar:** `src/screens/RoomPlanTestScreen.tsx`

```typescript
import React, { useState } from 'react';
import { View, Button, StyleSheet, Text } from 'react-native';
import { useRoomPlan } from '@/hooks/useRoomPlan';
import { RoomPlanView } from '@/components/RoomPlanView';

export const RoomPlanTestScreen = () => {
  const { startScanning, stopScanning } = useRoomPlan();
  const [isScanning, setIsScanning] = useState(false);

  const handleStart = () => {
    startScanning();
    setIsScanning(true);
  };

  const handleStop = () => {
    stopScanning();
    setIsScanning(false);
  };

  return (
    <View style={styles.container}>
      {isScanning && (
        <RoomPlanView style={styles.captureView} />
      )}

      {!isScanning && (
        <Text style={styles.title}>RoomPlan Scanner</Text>
      )}

      <View style={styles.controls}>
        <Button
          title={isScanning ? "Stop Scanning" : "Start Scanning"}
          onPress={isScanning ? handleStop : handleStart}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  captureView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 100,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
});
```

**Checklist:**
- [ ] UI actualizada
- [ ] Vista de escaneo se muestra

---

### 7.4 Test final

```bash
npx expo run:ios --device
```

**Test completo:**
1. Abrir app en iPhone
2. Ir a RoomPlan Test
3. Tocar "Start Scanning"
4. **Debería aparecer vista AR de RoomPlan**
5. Mover device para escanear habitación
6. Ver progreso en pantalla
7. Tocar "Stop Scanning"

**Checklist:**
- [ ] Vista AR aparece
- [ ] Tracking funciona (device movement detectado)
- [ ] Mesh de habitación se genera
- [ ] Stop funciona correctamente

---

## Paso 8: Validar Exportación de Datos

### 8.1 Agregar método para exportar resultado

**Actualizar `RoomPlanModule.swift`:**

```swift
@objc
func exportScan(_ callback: @escaping RCTResponseSenderBlock) {
  guard let session = captureSession else {
    callback([["error": "No active session"]])
    return
  }

  session.stop { result in
    switch result {
    case .success(let capturedRoom):
      // Exportar como USDZ
      let url = FileManager.default.temporaryDirectory
        .appendingPathComponent("scanned_room.usdz")

      do {
        try capturedRoom.export(to: url)
        callback([[
          "success": true,
          "path": url.path,
          "roomCount": capturedRoom.surfaces.count
        ]])
      } catch {
        callback([["error": error.localizedDescription]])
      }

    case .failure(let error):
      callback([["error": error.localizedDescription]])
    }
  }
}
```

**Actualizar bridge `RoomPlanBridge.m`:**

```objective-c
RCT_EXTERN_METHOD(exportScan:(RCTResponseSenderBlock)callback)
```

**Checklist:**
- [ ] Método agregado
- [ ] Bridge actualizado
- [ ] Compila sin errores

---

### 8.2 Probar exportación

**Actualizar hook:**

```typescript
const exportScan = () => {
  RoomPlanModule.exportScan((result: any) => {
    if (result.success) {
      console.log('Scan exported:', result.path);
      console.log('Surfaces found:', result.roomCount);
    } else {
      console.error('Export failed:', result.error);
    }
  });
};

return {
  startScanning,
  stopScanning,
  exportScan,
};
```

**Test:**
1. Escanear habitación por 30 segundos
2. Stop scanning
3. Export scan
4. Ver logs con path del archivo

**Checklist:**
- [ ] Export funciona
- [ ] Path válido en logs
- [ ] Archivo .usdz creado

---

## Criterios de Éxito - FASE 0 ✅

Al finalizar esta fase, debes tener:

### Funcionalidad

- [x] App migrada a Bare Workflow
- [x] Módulo Swift nativo creado
- [x] RoomPlan API funcionando
- [x] Escaneo de habitación completo
- [x] Exportación a USDZ

### Código

- [x] Proyecto Xcode configurado
- [x] React Native Bridge funcionando
- [x] Native Module llamable desde JS
- [x] Vista AR renderizando

### Testing

- [x] Build en device exitoso
- [x] Scan detecta superficies
- [x] Export genera archivo válido
- [x] Sin crashes durante escaneo

---

## Troubleshooting Común

### Error: "Module RoomPlanModule not found"

**Causa:** Build de Xcode no incluyó el módulo
**Solución:**
```bash
# Limpiar build
cd ios && rm -rf build && cd ..
npx expo run:ios --device
```

### Error: "RoomPlan framework not found"

**Causa:** Framework no linkeado
**Solución:**
1. Xcode > Target > General
2. Frameworks > + > RoomPlan.framework

### Error: "Signing failed"

**Causa:** Certificate/provisioning profile
**Solución:**
1. Xcode > Signing & Capabilities
2. Automatically manage signing ✅
3. Select Team

---

## Recursos de Aprendizaje Swift/ARKit

### Tutoriales Apple

1. [RoomPlan Developer](https://developer.apple.com/documentation/roomplan)
2. [ARKit Basics](https://developer.apple.com/documentation/arkit/arkit_in_ios)
3. [Swift Language Guide](https://docs.swift.org/swift-book/)

### Código de Ejemplo

- [RoomPlan Sample Code](https://developer.apple.com/sample-code/)
- [React Native Native Modules](https://reactnative.dev/docs/native-modules-ios)

---

## Próximos Pasos → FASE 1

Una vez completada FASE 0, continuar con:

**[FASE 1: Room Scanning](./FASE_1_ROOM_SCANNING.md)**
- UI completa de escaneo
- Progress indicators
- Preview del mesh
- Guardar múltiples scans

---

**Última actualización:** 2025-12-08
**Autor:** Equipo creativedev.ar-tech
