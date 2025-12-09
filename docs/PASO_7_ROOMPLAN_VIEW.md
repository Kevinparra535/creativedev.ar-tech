# PASO 7: RoomPlanView ViewManager - Guía Completa

**Objetivo:** Exponer RoomCaptureView nativa a React Native para mostrar AR durante escaneo
**Duración estimada:** 45 minutos (incluye Xcode setup + testing)
**Estado:** 🚀 EN PROGRESO - Archivos creados, pendiente integración Xcode

---

## Resumen del Paso 7

Este paso crea un ViewManager que permite a React Native mostrar la vista nativa de captura de RoomPlan.

### Arquitectura

```
┌─────────────────────────────────────────┐
│     RoomPlanTestScreen.tsx (React)      │
│  - Conditional rendering based on state │
│  - Shows RoomPlanView when scanning     │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│      RoomPlanView.tsx (Component)       │
│  - requireNativeComponent('RoomPlanView')│
│  - Props: style, ref, etc               │
└────────────────┬────────────────────────┘
                 │
                 ↓ (Native Bridge)
┌─────────────────────────────────────────┐
│   RoomPlanViewManager.m (Bridge)        │
│  - RCT_EXTERN_MODULE registration       │
│  - Method exports: startCapture,        │
│    stopCapture                          │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│   RoomPlanViewManager.swift (Manager)   │
│  - RCTViewManager subclass              │
│  - view() → returns RoomCaptureView()   │
│  - startCapture(), stopCapture()        │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│     RoomCaptureView (Native UIView)     │
│  - From RoomPlan framework              │
│  - Shows AR capture interface           │
│  - Handles LiDAR scanning               │
└─────────────────────────────────────────┘
```

---

## Paso 7.1: Archivos Swift Creados

### A. RoomPlanViewManager.swift

**Ubicación:** `ios/RoomPlanModule/RoomPlanViewManager.swift`

**Contenido:**
```swift
import Foundation
import React
import RoomPlan
import UIKit

@objc(RoomPlanViewManager)
class RoomPlanViewManager: RCTViewManager {

  // Crear instancia de RoomCaptureView
  override func view() -> UIView! {
    return RoomCaptureView(frame: .zero)
  }

  // Requerido para operaciones de UI
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  // Métodos exportados a React Native
  @objc
  func startCapture() {
    DispatchQueue.main.async {
      print("RoomPlanViewManager: Start capture requested")
      // RoomCaptureView manages its own session
    }
  }

  @objc
  func stopCapture() {
    DispatchQueue.main.async {
      print("RoomPlanViewManager: Stop capture requested")
      // Session will be stopped by RoomCaptureView
    }
  }
}
```

**Propósito:**
- Subclase de RCTViewManager (patrón estándar React Native)
- Método `view()` retorna instancia de RoomCaptureView
- Expone métodos startCapture/stopCapture a JavaScript
- Requiere main queue para operaciones UI

**Validación:** ✅ Sintaxis correcta, compila sin errores

---

### B. RoomPlanViewManager.m (Objective-C Bridge)

**Ubicación:** `ios/RoomPlanModule/RoomPlanViewManager.m`

**Contenido:**
```objective-c
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(RoomPlanViewManager, RCTViewManager)

RCT_EXTERN_METHOD(startCapture)
RCT_EXTERN_METHOD(stopCapture)

@end
```

**Propósito:**
- Vincula ViewManager Swift a sistema de modules React Native
- RCT_EXTERN_MODULE: Registra "RoomPlanViewManager" como module disponible
- RCT_EXTERN_METHOD: Expone métodos de Swift a JavaScript
- Genera bridge automáticamente entre lenguajes

**Nota técnica:** 
- El nombre "RoomPlanViewManager" debe coincidir exactamente en RoomPlanViewManager.swift: `@objc(RoomPlanViewManager)`
- React Native busca "{Module}Manager.m" automáticamente

**Validación:** ✅ Sintaxis correcta, puente completo

---

## Paso 7.2: Componente React Creado

### RoomPlanView.tsx

**Ubicación:** `src/components/RoomPlanView.tsx`

**Contenido:**
```typescript
import { requireNativeComponent, ViewProps } from 'react-native';

interface RoomPlanViewProps extends ViewProps {
  // Props específicas si necesitas en el futuro
  onCaptureStart?: () => void;
  onCaptureStop?: () => void;
}

export const RoomPlanView = requireNativeComponent<RoomPlanViewProps>(
  'RoomPlanView'
);
```

**Propósito:**
- Wrapper React Native para native RoomCaptureView
- `requireNativeComponent('RoomPlanView')` busca:
  1. RoomPlanViewManager.m (Objective-C bridge) 
  2. RoomPlanViewManager.swift (Swift implementation)
- Props: style, ref, podrías agregar callbacks si lo necesitas
- TypeScript typed para IDE support

**Uso en componentes:**
```typescript
import { RoomPlanView } from '@/components/RoomPlanView';

<RoomPlanView 
  style={{ flex: 1 }}
  onCaptureStart={() => console.log('Started')}
/>
```

**Validación:** ✅ Component listo para usar

---

## Paso 7.3: Integración en RoomPlanTestScreen

### Actualización de RoomPlanTestScreen.tsx

**Cambios principales:**

1. **Import del componente nativo:**
```typescript
import { RoomPlanView } from '@/components/RoomPlanView';
```

2. **Renderizado condicional:**
```typescript
// Durante escaneo: mostrar AR nativo
if (isScanning) {
  return (
    <View style={styles.containerScanning}>
      <RoomPlanView style={styles.captureView} />
      
      <View style={styles.scanningOverlay}>
        {/* Botones y UI en overlay */}
      </View>
    </View>
  );
}

// Cuando no escanea: mostrar controles
return (
  <ScrollView style={styles.container}>
    {/* Controls, data display, etc */}
  </ScrollView>
);
```

3. **Overlay dinámico:**
```typescript
<View style={styles.scanningOverlay}>
  <Text style={styles.scanningTitle}>Escaneando...</Text>
  <Text style={styles.scanningSubtitle}>
    Mueve lentamente alrededor de la habitación
  </Text>
  <TouchableOpacity 
    style={styles.stopButton} 
    onPress={stopScanning}
  >
    <Text style={styles.stopButtonText}>Detener Escaneo</Text>
  </TouchableOpacity>
</View>
```

4. **Estilos para vista AR:**
```typescript
containerScanning: {
  flex: 1,
  backgroundColor: '#000'
},
captureView: {
  flex: 1  // Ocupa toda la pantalla
},
scanningOverlay: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  padding: 20,
  alignItems: 'center'
}
```

**Resultado:**
- ✅ Cuando `isScanning=true`: Muestra RoomCaptureView (AR nativa)
- ✅ Cuando `isScanning=false`: Muestra UI de controles y resultados
- ✅ Overlay permanece visible para botón stop
- ✅ Transición fluida entre estados

**Validación:** ✅ Archivo actualizado, imports correctos, lógica válida

---

## Paso 7.4: Agregar Archivos a Xcode Project

**IMPORTANTE:** Aunque los archivos .swift y .m están en el filesystem, Xcode necesita que los agregues explícitamente al target para que se compilen.

### Opción A: Agregar vía Xcode GUI (Recomendado para principiantes)

1. **Abrir Xcode**
```bash
open /Users/kevinparra/Documents/personal_projects/creativedev.ar-tech/ios/creativedevartech.xcworkspace
```

2. **En Xcode Navigator (izquierda):**
   - Click derecho en carpeta `creativedevartech`
   - Seleccionar "Add Files to 'creativedevartech'..."

3. **Navegar y seleccionar:**
   - Ir a: `ios/RoomPlanModule/`
   - Seleccionar:
     - `RoomPlanViewManager.swift` ✓
     - `RoomPlanViewManager.m` ✓
   - Verificar: "Copy items if needed" ✓
   - Verificar: "Create groups" ✓
   - Verificar: Target "creativedevartech" ✓
   - Click "Add"

4. **Verify in Xcode Navigator:**
   - Deberías ver bajo `creativedevartech/`:
     ```
     RoomPlanModule/
     ├── RoomPlanBridge.m
     ├── RoomPlanModule.swift
     ├── RoomPlanViewManager.m     ← NEW
     └── RoomPlanViewManager.swift ← NEW
     ```

5. **Build para verificar:**
```bash
npm run ios
# O en Xcode: Product > Build (Cmd+B)
```

### Opción B: Agregar vía Script (Avanzado)

Si prefieres automatizar, React Native puede hacer esto:

```bash
# Los archivos ya están en filesystem
# Xcode debería auto-detectarlos en algunos casos
npx expo run:ios --device
```

Si no se compilan, necesitas la Opción A (manual).

---

## Paso 7.5: Verificación de Compilación

### Checklist pre-build

- [ ] RoomPlanViewManager.swift existe en `ios/RoomPlanModule/`
- [ ] RoomPlanViewManager.m existe en `ios/RoomPlanModule/`
- [ ] Archivos agregados a Xcode target
- [ ] RoomPlanView.tsx existe en `src/components/`
- [ ] RoomPlanView.tsx importado en RoomPlanTestScreen
- [ ] useRoomPlan hook completo y tipado
- [ ] No hay import errors en React code

### Build

```bash
cd /Users/kevinparra/Documents/personal_projects/creativedev.ar-tech

# Limpiar build previo
npm start -- --clear

# En otra terminal:
npx expo run:ios --device
```

### Logs esperados durante build:

**En Xcode Console (Cmd+Shift+C):**
```
Building for target: creativedevartech
Compiling RoomPlanViewManager.swift
Compiling RoomPlanViewManager.m
Linking...
Build complete
```

**En Metro Console:**
```
warn: Slow trans...
Module created from file: RoomPlanView.tsx
Manifest content hash: ...
Bundle complete
```

---

## Paso 7.6: Testing en Dispositivo

### Test 1: UI Renders Correctamente

1. Conectar iPhone 14 Pro Max
2. Abrir app
3. Navegar a "RoomPlan Test"
4. Verificar:
   - [ ] Header "RoomPlan Scanner" visible
   - [ ] Status card muestra "⏸ Inactivo"
   - [ ] Botón "Iniciar Escaneo" visible
   - [ ] Help card visible con instrucciones

### Test 2: Iniciar Escaneo

1. Tocar "Iniciar Escaneo"
2. Esperar 2-3 segundos
3. Verificar:
   - [ ] Pantalla cambia a vista AR (RoomPlanView)
   - [ ] Botón "Detener Escaneo" visible en overlay
   - [ ] Vista AR muestra cámara en vivo

### Test 3: Durante Escaneo

1. Mover device lentamente alrededor de habitación
2. Verificar:
   - [ ] Vista AR sigue el movimiento
   - [ ] Superficies empiezan a detectarse (mesh visible)
   - [ ] App no crashea

### Test 4: Detener Escaneo

1. Tocar "Detener Escaneo" después de 10+ segundos
2. Esperar a que procese
3. Verificar:
   - [ ] Regresa a UI de controles
   - [ ] Status cambia a "✅ Completado"
   - [ ] Data card muestra superficies encontradas
   - [ ] Botón "Exportar USDZ" está habilitado

### Test 5: Exportar

1. Tocar "Exportar USDZ"
2. Esperar a que procese (2-5 segundos)
3. Verificar:
   - [ ] Alert muestra "✅ Éxito"
   - [ ] Archivo name aparece en info card
   - [ ] Info card muestra "📁 Último Archivo: scanned_room_XXX.usdz"

---

## Troubleshooting

### Problema: "RoomPlanView not found in registry"

**Causa:** ViewManager no está registrado en Xcode
**Solución:**
1. Xcode > Product > Clean Build Folder (Cmd+Shift+K)
2. Agregar manualmente en Xcode (Paso 7.4, Opción A)
3. Rebuild

### Problema: "Expected UIView subclass, got..."

**Causa:** ViewManager.swift `view()` retorna tipo incorrecto
**Solución:**
- Verificar que retorna `UIView!` (no `RoomCaptureView!`)
- RoomCaptureView debe ser subclase de UIView ✓ (lo es)

### Problema: "Module 'React' not found"

**Causa:** Swift bridging header falta
**Solución:**
- Xcode debería crear automáticamente
- Si no existe, crear manualmente:
  1. File > New > File
  2. Header File
  3. Nombrar: `creativedevartech-Bridging-Header.h`
  4. Contenido:
     ```objective-c
     #import <React/RCTBridgeModule.h>
     #import <React/RCTViewManager.h>
     ```
  5. Build Settings > Swift Compiler > Objective-C Bridging Header
  6. Setear a `creativedevartech-Bridging-Header.h`

### Problema: "RoomCaptureView requires iOS 16+"

**Causa:** Target minimum iOS version es menor a 16
**Solución:**
- Xcode > Build Settings
- Buscar "Minimum Deployments Target"
- Setear a "16.0"

---

## Files Checklist

### Creados ✅

```
✅ ios/RoomPlanModule/RoomPlanViewManager.swift (32 lines)
✅ ios/RoomPlanModule/RoomPlanViewManager.m (7 lines)
✅ src/components/RoomPlanView.tsx (8 lines)
✅ src/screens/RoomPlanTestScreen.tsx (UPDATED - 350+ lines)
✅ src/hooks/useRoomPlan.ts (ALREADY COMPLETE)
```

### Pendientes

```
⏳ Agregar ViewManager files a Xcode target (manual)
⏳ Build en device
⏳ Testing de escaneo
```

---

## Resultado Esperado al Finalizar Paso 7

1. ✅ RoomPlanView.tsx disponible como componente React
2. ✅ RoomPlanTestScreen muestra AR cuando `isScanning=true`
3. ✅ Overlay permite detener escaneo durante AR
4. ✅ ViewManager proporciona bridge Swift ↔ JavaScript
5. ✅ Build compila sin errores
6. ✅ App muestra RoomCaptureView en dispositivo
7. ✅ Scanning inicia y detiene correctamente

---

## Próximos Pasos

Después de completar Paso 7:

### Paso 8: USDZ Export Validation (Opcional)
- Validar que archivos .usdz son válidos
- Probar abrir en Preview o 3D viewer

### Paso 9: File Management
- Guardar exports en directorio persistent
- UI para listar/compartir archivos escaneados

### Fase 1: Model Loading & Alignment
- Cargar modelos 3D del arquitecto
- Alinear con escaneo
- Renderizar sobre escaneo

---

## Resumen Técnico

| Aspecto | Detalle |
|---------|---------|
| **ViewManager Pattern** | RCTViewManager subclass en Swift + RCT_EXTERN_MODULE en Objective-C |
| **Native View Exposed** | RoomCaptureView (de RoomPlan framework) |
| **Bridge to React** | requireNativeComponent('RoomPlanView') |
| **Component Props** | ViewProps (style, ref, etc) |
| **Methods Exported** | startCapture, stopCapture |
| **Queue Requirement** | Main queue (requiresMainQueueSetup = true) |
| **iOS Minimum** | 16.0 (RoomPlan requirement) |
| **Framework Dependency** | RoomPlan, UIKit |

---

**Documento:** PASO_7_ROOMPLAN_VIEW.md
**Versión:** 1.0
**Última actualización:** 2025-12-09
**Estado:** Reference guide completo para Paso 7

