# Guía de Debugging: Detección de Planos ARKit

**Fecha:** 2025-12-10
**Problema:** La detección de planos no está funcionando correctamente

---

## ✅ Cambios Implementados

### 1. Logging Extensivo en Swift

Se agregaron logs detallados en [modules/expo-arkit/ios/ExpoARKitView.swift](../modules/expo-arkit/ios/ExpoARKitView.swift):

- 🔧 Inicialización de ARView
- ✅ Configuración de ARKit
- 📍 Detección de anchors
- ✈️ Eventos de planos (detected, updated, removed)
- 📹 Estado de tracking de cámara
- ❌ Errores de sesión

### 2. Debug Overlay en React Native

Nuevo componente [ARDebugOverlay.tsx](../src/ui/ar/components/ARDebugOverlay.tsx) que muestra:

- Estado de AR (Ready/Initializing)
- Cantidad de planos detectados
- Lista de planos con dimensiones
- Detalles del plano seleccionado
- Instrucciones para el usuario

---

## 🧨 Crash al pasar a Wall Scanning (pared de referencia)

**Síntoma típico:**

- Seleccionas modelo ✅
- Seleccionas pared virtual ✅
- Entras a `WallScanningScreen` ✅
- Se detectan 1-2 planos verticales (`onVerticalPlaneDetected`) y la app crashea

**Causa común (iOS):**

- ARKit puede ejecutar callbacks de `ARSCNViewDelegate` fuera del main thread.
- Si el callback modifica estado compartido (ej. diccionarios de anchors/nodes) mientras el UI thread lo lee (tap, selección, etc.), es fácil caer en `EXC_BAD_ACCESS` por data races.

**Fix aplicado (recomendado):**

- Mantener *todas* las mutaciones de estado + SceneKit nodes en main thread dentro de `ARWallScanningView`.
- Asegurar que los eventos hacia React Native envíen solo valores serializables (números como `Double`, strings, arrays).

**Archivo clave:**

- [modules/expo-arkit/ios/ARWallScanningView.swift](../modules/expo-arkit/ios/ARWallScanningView.swift)

**Rebuild obligatorio:**

```bash
npm start -- --clear
npx expo run:ios --device
```


## 🔍 Cómo Debuggear

### Paso 1: Reconstruir la App iOS

**⚠️ CRÍTICO:** Los cambios en Swift requieren recompilación nativa

```bash
# Limpiar build anterior
rm -rf ios/build

# Opción 1: Reconstruir con Expo
npx expo run:ios --device

# Opción 2: Usar Xcode
open ios/creativedevartech.xcworkspace
# Product > Clean Build Folder (⇧⌘K)
# Product > Run (⌘R)
```

### Paso 2: Ver Logs en Xcode

1. **Abrir Console:**
   - Xcode > Window > Devices and Simulators
   - Seleccionar dispositivo
   - View Device Logs > Open Console

2. **Filtrar por ARKit:**
   - Buscar: `[ARKit]`
   - Verás logs como:
     ```
     🔧 [ARKit] setupARView called
     ✅ [ARKit] ARWorldTrackingConfiguration is supported
     ✅ [ARKit] Session delegate set
     📹 [ARKit] Camera tracking state: normal
     ✈️ [ARKit] PLANE DETECTED: <UUID>
     ```

### Paso 3: Usar Debug Overlay

1. La app ahora tiene un botón **"🐛 Show Debug"** en la esquina superior derecha
2. Toca el botón para ver información en tiempo real:
   - Estado de AR
   - Cantidad de planos
   - Lista de planos detectados
   - Detalles del plano seleccionado

---

## 🔎 Diagnóstico de Problemas

### Problema 1: No se detectan planos

**Síntomas:**
- Debug overlay muestra "Total: 0"
- No hay logs de `PLANE DETECTED` en Xcode

**Posibles causas:**

#### A) App no reconstruida
```
❌ Los cambios en Swift no se aplicaron
✅ Solución: Reconstruir (ver Paso 1)
```

#### B) Tracking limitado
```bash
# Busca en logs:
📹 [ARKit] Camera tracking state: limited
   ⚠️ Tracking LIMITED: insufficientFeatures
```

**Soluciones:**
- **Insufficient Features:** Apuntar a superficies con más textura
- **Excessive Motion:** Mover el dispositivo más lento
- **Initializing:** Esperar 2-3 segundos

#### C) Iluminación insuficiente
```
La detección de planos requiere buena iluminación
✅ Solución: Ir a un área con más luz
```

#### D) Superficie no detectada
```
ARKit puede tardar en detectar planos
✅ Solución: Mover dispositivo lentamente sobre la superficie (5-10 segundos)
```

### Problema 2: Solo detecta planos horizontales

**Síntomas:**
- Debug overlay: "Horizontal: 5, Vertical: 0"
- Solo se ven planos azules

**Diagnóstico:**
```bash
# Verificar en logs:
🔧 [ARKit] Configuration: planeDetection = [horizontal, vertical]
```

Si solo muestra `[horizontal]`:
- La configuración no se aplicó
- **Solución:** Reconstruir la app

### Problema 3: Planos detectados pero no visibles

**Síntomas:**
- Debug overlay muestra planos
- Logs muestran `PLANE DETECTED`
- No se ven en la pantalla

**Posibles causas:**

#### A) Error en renderizado
```bash
# Buscar en logs:
✈️ [ARKit] PLANE DETECTED: <UUID>
# Debería seguir con logs de visualización
```

#### B) Material invisible
- Los materiales pueden ser demasiado transparentes
- **Solución:** Ajustar alpha en `createGridMaterial` y `createFillMaterial`

### Problema 4: Session failed

**Síntomas:**
- Debug overlay: Status NOT Ready
- Logs: `❌ [ARKit] Session failed with error`

**Diagnóstico:**
```bash
# Ver error específico en logs
❌ [ARKit] Session failed with error: <descripción>
```

**Soluciones comunes:**
- **Camera access denied:** Verificar permisos en Info.plist
- **ARKit not supported:** Dispositivo muy viejo (pre-iPhone 6s)
- **Sensor failure:** Reiniciar dispositivo

---

## 📋 Checklist de Debugging

Verifica en orden:

- [ ] **1. App reconstruida** después de cambios en Swift
  ```bash
  npx expo run:ios --device
  ```

- [ ] **2. Debug overlay visible** en pantalla
  - Toca botón "🐛 Show Debug"

- [ ] **3. AR Status = Ready** en debug overlay
  - Si no: Verificar logs de error

- [ ] **4. Camera tracking = Normal** en logs Xcode
  - Buscar: `📹 [ARKit] Camera tracking state: normal`

- [ ] **5. Superficie adecuada:**
  - ✅ Buena iluminación
  - ✅ Superficie con textura (no lisa/reflectante)
  - ✅ Movimiento lento del dispositivo

- [ ] **6. Esperar 5-10 segundos** apuntando a superficie

- [ ] **7. Ver logs de detección:**
  ```
  ✈️ [ARKit] PLANE DETECTED: <UUID>
     - Alignment: horizontal
     - Extent: SIMD3<Float>(...)
  ```

---

## 🧪 Test Cases

### Test 1: Plano Horizontal (Piso/Mesa)

1. Apuntar dispositivo hacia abajo al piso
2. Mover lentamente en círculo
3. **Esperado:**
   - Debug overlay: "Horizontal: 1+"
   - Plano azul visible en piso
   - Log: `Alignment: horizontal`

### Test 2: Plano Vertical (Pared)

1. Apuntar dispositivo a una pared
2. Mover lentamente de lado a lado
3. **Esperado:**
   - Debug overlay: "Vertical: 1+"
   - Plano naranja visible en pared
   - Log: `Alignment: vertical`

### Test 3: Selección de Plano

1. Detectar un plano
2. Tocar el plano en pantalla
3. **Esperado:**
   - Plano cambia a amarillo
   - Debug overlay muestra "Selected Plane" con detalles
   - Log: `PLANE SELECTED`

---

## 🔧 Comandos Útiles

### Ver logs en tiempo real (Terminal)

```bash
# macOS: Instalar log tool
brew install --cask sf-symbols

# Stream logs del dispositivo
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "creativedev"' --level debug

# Filtrar solo ARKit
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "creativedev"' --level debug | grep ARKit
```

### Limpiar todo y empezar de cero

```bash
# Limpiar caché de Metro
npx expo start --clear

# Limpiar build de iOS
rm -rf ios/build
rm -rf ios/DerivedData

# Reinstalar pods
cd ios && pod install && cd ..

# Reconstruir
npx expo run:ios --device
```

---

## 📚 Referencias

- [ARKit Plane Detection](https://developer.apple.com/documentation/arkit/arplaneanchor)
- [ARSessionDelegate](https://developer.apple.com/documentation/arkit/arsessiondelegate)
- [Debugging ARKit](https://developer.apple.com/documentation/arkit/verifying_device_support_and_user_permission)

---

## 📝 Registro de Debugging

### Session 1 - 2025-12-10

**Problema reportado:**
- "No detecta paredes ni nada al respecto"

**Acciones tomadas:**
1. ✅ Agregado logging extensivo en Swift
2. ✅ Creado ARDebugOverlay para debugging en tiempo real
3. ⏳ Pendiente: Reconstruir app y verificar logs

**Próximos pasos:**
1. Reconstruir app iOS
2. Probar en dispositivo físico
3. Revisar logs en Xcode Console
4. Reportar hallazgos

---

**Última actualización:** 2025-12-10
**Autor:** Equipo creativedev.ar-tech
