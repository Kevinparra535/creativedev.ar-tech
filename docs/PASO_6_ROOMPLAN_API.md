# Paso 6: Implementar RoomPlan API - Guía Completa

**Objetivo:** Completar la implementación real del escaneo de habitaciones con RoomPlan API
**Duración estimada:** 60 minutos
**Estado:** ✅ COMPLETE

---

## Resumen de Cambios

### 1. RoomPlanModule.swift - Implementación Completa

**Archivo:** `ios/RoomPlanModule/RoomPlanModule.swift`

**Cambios principales:**

#### Método `stopScanning()` - Captura y procesa resultado

```swift
@objc
func stopScanning() {
  DispatchQueue.main.async {
    guard let session = self.captureSession else {
      self.sendEvent(withName: "onScanError", body: ["error": "No active session"])
      return
    }

    session.stop { result in
      switch result {
      case .success(let capturedRoom):
        self.handleScanSuccess(capturedRoom)
      case .failure(let error):
        self.sendEvent(
          withName: "onScanError",
          body: ["error": "Scan failed: \(error.localizedDescription)"]
        )
      }
    }

    self.isScanning = false
  }
}
```

**Qué hace:**
- Accede a la sesión activa
- Llama `session.stop()` con handler de resultado
- En caso de éxito: procesa `CapturedRoom` y emite eventos
- En caso de error: emite evento de error

#### Método `exportScan()` - Exportación a USDZ

```swift
@objc
func exportScan(_ callback: @escaping RCTResponseSenderBlock) {
  guard let session = self.captureSession else {
    callback([["error": "No active session"]])
    return
  }

  session.stop { result in
    switch result {
    case .success(let capturedRoom):
      self.exportRoomAsUSDZ(capturedRoom, callback: callback)
    case .failure(let error):
      callback([["error": error.localizedDescription]])
    }
  }
}
```

**Qué hace:**
- Verifica que hay sesión activa
- Detiene sesión y obtiene resultado
- Delega a `exportRoomAsUSDZ()` para procesamiento
- Retorna resultado al callback de React

#### Método privado `handleScanSuccess()`

```swift
private func handleScanSuccess(_ capturedRoom: CapturedRoom) {
  let surfaceCount = capturedRoom.surfaces.count
  let wallCount = capturedRoom.surfaces.filter { $0.category == .wall }.count
  let doorCount = capturedRoom.surfaces.filter { $0.category == .door }.count
  let windowCount = capturedRoom.surfaces.filter { $0.category == .window }.count

  let roomInfo: [String: Any] = [
    "surfaces": surfaceCount,
    "walls": wallCount,
    "doors": doorCount,
    "windows": windowCount,
    "dimensions": [
      "length": capturedRoom.dimensions.x,
      "width": capturedRoom.dimensions.y,
      "height": capturedRoom.dimensions.z
    ]
  ]

  sendEvent(withName: "onScanComplete", body: roomInfo)
}
```

**Análisis de superficies:**
- Itera sobre todas las superficies detectadas
- Filtra por categoría: wall, door, window
- Extrae dimensiones de la habitación (en metros)
- Emite evento `onScanComplete` con datos estructurados

#### Método privado `exportRoomAsUSDZ()`

```swift
private func exportRoomAsUSDZ(
  _ capturedRoom: CapturedRoom,
  callback: @escaping RCTResponseSenderBlock
) {
  let fileManager = FileManager.default
  let tempDir = fileManager.temporaryDirectory
  let fileName = "scanned_room_\(Date().timeIntervalSince1970).usdz"
  let fileURL = tempDir.appendingPathComponent(fileName)

  do {
    try capturedRoom.export(to: fileURL)

    let fileSize = try fileManager.attributesOfItem(
      atPath: fileURL.path
    )[.size] as? Int ?? 0

    callback([[
      "success": true,
      "path": fileURL.path,
      "fileName": fileName,
      "fileSize": fileSize,
      "surfaces": capturedRoom.surfaces.count
    ]])

    print("RoomPlan: Exported to \(fileURL.path)")
  } catch {
    callback([["error": "Export failed: \(error.localizedDescription)"]])
    print("RoomPlan: Export error - \(error.localizedDescription)")
  }
}
```

**Proceso de exportación:**

1. **Ubicación:** Archivo temporal del sistema (`/tmp/`)
2. **Nombre:** Usa timestamp para evitar colisiones
3. **Formato:** USDZ (Universal Scene Description - formato nativo iOS)
4. **Información retornada:**
   - `success: true/false`
   - `path:` ruta completa del archivo
   - `fileName:` nombre del archivo (ej: `scanned_room_1638987654.usdz`)
   - `fileSize:` tamaño en bytes
   - `surfaces:` cantidad de superficies escaneadas

**Formato USDZ:** Estándar de Pixar compatible con ARKit, puede abrirse en:
- Xcode (vista previa)
- Finder (vista 3D)
- Apps compatibles con USDZ
- Three.js (con loader USDZ)

---

### 2. useRoomPlan Hook - Mejorado

**Archivo:** `src/hooks/useRoomPlan.ts`

**Interfaces de tipos:**

```typescript
export interface RoomData {
  surfaces: number;
  walls: number;
  doors: number;
  windows: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface ExportResult {
  success: boolean;
  path?: string;
  fileName?: string;
  fileSize?: number;
  surfaces?: number;
  error?: string;
}
```

**State management:**

```typescript
const [isScanning, setIsScanning] = useState(false);
const [roomData, setRoomData] = useState<RoomData | null>(null);
const [error, setError] = useState<string | null>(null);
const [isExporting, setIsExporting] = useState(false);
```

**Event listeners:**

```typescript
const startSub = emitter.addListener('onScanStart', () => {
  setIsScanning(true);
  setError(null);
  setRoomData(null);
});

const completeSub = emitter.addListener('onScanComplete', (event: any) => {
  setIsScanning(false);
  setRoomData(event as RoomData);
  setError(null);
});

const errorSub = emitter.addListener('onScanError', (event: any) => {
  setIsScanning(false);
  setError(event?.error || 'Unknown error');
});
```

**Método `exportScan()`:**

```typescript
const exportScan = useCallback((onComplete?: (result: ExportResult) => void) => {
  try {
    setIsExporting(true);
    RoomPlanModule.exportScan((result: ExportResult[]) => {
      setIsExporting(false);
      if (result && result[0]) {
        const exportResult = result[0];
        if (exportResult.success) {
          setError(null);
        } else {
          setError(exportResult.error || 'Export failed');
        }
        onComplete?.(exportResult);
      }
    });
  } catch (err) {
    setIsExporting(false);
    setError('Failed to export');
  }
}, []);
```

**Retorna:**
```typescript
{
  isScanning: boolean,
  roomData: RoomData | null,
  error: string | null,
  isExporting: boolean,
  startScanning: () => void,
  stopScanning: () => void,
  exportScan: (callback?: Function) => void
}
```

---

### 3. RoomPlanTestScreen - UI Mejorada

**Archivo:** `src/screens/RoomPlanTestScreen.tsx`

**Features:**

- **Header oscuro** con título y subtítulo
- **Status Card** que muestra estado actual del escaneo
- **Botones de control:**
  - Iniciar/Detener Escaneo
  - Exportar USDZ (habilitado solo después de completar escaneo)
- **Data Card** - Muestra información del escaneo:
  - Cantidad de superficies detectadas
  - Desglose: paredes, puertas, ventanas
  - Dimensiones calculadas en metros
- **Error Card** - Muestra mensajes de error si ocurren
- **Info Card** - Muestra último archivo exportado
- **Help Card** - Instrucciones paso a paso para el usuario

**Design language:**
- Colores de tarjeta: Blanco fondo, azul/verde/rojo según contexto
- Iconos emoji para visual feedback
- Responsive: funciona en diferentes tamaños de pantalla
- Dark mode friendly: usa colores contrastados

**Ejemplo de flujo del usuario:**

```
1. Usuario ve: "Estado: ⏸ Inactivo"
   ↓
2. Tap "Iniciar Escaneo"
   ↓
3. Ves: "Estado: 🔴 Escaneando..."
   ↓
4. (Escanea habitación durante 30-60 segundos)
   ↓
5. Tap "Detener Escaneo"
   ↓
6. Ves: "Estado: ✅ Completado"
   ↓
7. Ves datos: "Superficies: 8, Paredes: 4, Puertas: 2, Ventanas: 2"
   ↓
8. Tap "📤 Exportar USDZ"
   ↓
9. Ves: "Exportando..." (con loading spinner)
   ↓
10. Ves: "✅ Éxito - Archivo guardado: scanned_room_1234567890.usdz"
    ↓
11. Tap "📁 Último Archivo" para ver información
```

---

## Flujo de Datos Completo

### Arquitectura de Eventos

```
RoomPlanModule.swift (Native)
    ↓
RCTEventEmitter
    ↓ (emite eventos)
    ├─ onScanStart
    ├─ onScanProgress (TODO)
    ├─ onScanComplete → { surfaces, walls, doors, windows, dimensions }
    └─ onScanError → { error: string }
        ↓
        NativeEventEmitter (React)
            ↓
        useRoomPlan Hook
            ↓ (actualiza state)
            ├─ isScanning
            ├─ roomData
            ├─ error
            └─ isExporting
                ↓
                RoomPlanTestScreen
                    ↓
                    Renders UI con datos
```

### Flujo de Exportación

```
RoomPlanTestScreen
  ↓
handleExport()
  ↓
useRoomPlan.exportScan((result) => {...})
  ↓
RoomPlanModule.exportScan(callback)
  ↓
RoomPlanModule.swift
  ├─ session.stop()
  ├─ capturedRoom.export(to: fileURL) → *.usdz
  ├─ calcula fileSize
  ├─ callback([{success, path, fileName, fileSize, surfaces}])
  ↓
useRoomPlan Hook
  ├─ setIsExporting(false)
  ├─ setError(null) si success
  ├─ onComplete(result)
  ↓
RoomPlanTestScreen
  ├─ setLastExport(result.fileName)
  ├─ Alert.alert con éxito/error
  ↓
UI actualiza automáticamente
```

---

## Próximas Tareas (Paso 7)

### Crear RoomPlanView ViewManager

Para mostrar la vista nativa de RoomPlan en React, necesitamos:

1. **ViewManager en Swift:**
   ```swift
   class RoomPlanViewManager: RCTViewManager {
     override func view() -> UIView! {
       return RoomCaptureView(frame: .zero)
     }
   }
   ```

2. **Bridge en Objective-C:**
   ```objective-c
   @interface RCT_EXTERN_MODULE(RoomPlanViewManager, RCTViewManager)
   @end
   ```

3. **Componente React:**
   ```typescript
   export const RoomPlanView = requireNativeComponent('RoomPlanView');
   ```

4. **Uso en pantalla:**
   ```tsx
   {isScanning && <RoomPlanView style={{ flex: 1 }} />}
   ```

---

## Checklist de Paso 6

✅ **RoomPlanModule.swift:**
- [x] Método `stopScanning()` con resultado
- [x] Método `exportScan()` con callback
- [x] Método privado `handleScanSuccess()`
- [x] Método privado `exportRoomAsUSDZ()`
- [x] Análisis de superficies (wall, door, window)
- [x] Exportación a USDZ

✅ **useRoomPlan Hook:**
- [x] Interfaces de tipos (RoomData, ExportResult)
- [x] State management (isScanning, roomData, error, isExporting)
- [x] Event listeners para los 4 eventos
- [x] Método exportScan con callback
- [x] Manejo de errores

✅ **RoomPlanTestScreen:**
- [x] Header con título/subtítulo
- [x] Status Card con estado
- [x] Botones de control Start/Stop
- [x] Botón Export habilitado solo después de escaneo
- [x] Data Card con desglose de superficies
- [x] Display de dimensiones
- [x] Error Card
- [x] Info Card para último archivo
- [x] Help Card con instrucciones

---

## Próximo Paso

**[Paso 7: Crear RoomPlanView ViewManager](./PASO_7_ROOMPLAN_VIEW.md)**

- Exponer RoomCaptureView nativa a React
- Mostrar vista AR en pantalla durante escaneo
- Preview de superficies detectadas

**Tiempo estimado para Paso 7:** 45 minutos

---

**Última actualización:** 2025-12-08
**Estado:** ✅ COMPLETO

Los cambios de Paso 6 están listos para commit y testing.
