# Implementación ARKit - Integración Nativa

## Resumen
Este documento describe la implementación de ARKit nativo en el proyecto usando Expo Modules y RealityKit.

## Arquitectura

### Módulos Nativos iOS

#### 1. ExpoARKitModule.swift
**Ubicación:** `modules/expo-arkit/ios/ExpoARKitModule.swift`

Módulo principal que define la interfaz entre React Native y el código nativo:
- Define el nombre del módulo: `ExpoARKit`
- Expone la vista `ExpoARKitView`
- Declara eventos: `onARInitialized`, `onARError`
- Expone método asíncrono `addTestObject(viewTag:)` a nivel de módulo

**Arquitectura del método:**

```swift
AsyncFunction("addTestObject") { (viewTag: Int) -> Void in
  DispatchQueue.main.async { [weak self] in
    guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ExpoARKitView.self) else {
      print("Error: Could not find ARKit view with tag \(viewTag)")
      return
    }
    view.addTestObject()
  }
}
```

**Nota:** El método usa `findView(withTag:ofType:)` para localizar la vista nativa correspondiente y ejecutar el método en ella.

#### 2. ExpoARKitView.swift
**Ubicación:** `modules/expo-arkit/ios/ExpoARKitView.swift`

Vista nativa que gestiona la sesión AR:

**Características:**
- Hereda de `ExpoView` (Expo Modules Core)
- Usa `ARView` de RealityKit
- Configuración AR:
  - Detección de planos horizontales y verticales
  - Texturizado automático del entorno
  - Iluminación ajustada (intensityExponent: 1.5)

**Métodos:**
- `setupARView()`: Inicializa la sesión AR
- `addTestObject()`: Agrega un cubo rojo de prueba a 0.5m frente a la cámara

**Eventos:**
- `onARInitialized`: Se emite cuando AR se inicializa correctamente
- `onARError`: Se emite si hay errores (ej: dispositivo no compatible)

### Componentes React Native

#### 1. ARKitView.tsx
**Ubicación:** `modules/expo-arkit/src/ARKitView.tsx`

Componente wrapper del módulo nativo:

```typescript
interface ARKitViewProps extends ViewProps {
  onARInitialized?: (event: { nativeEvent: { success: boolean; message: string } }) => void;
  onARError?: (event: { nativeEvent: { error: string } }) => void;
}

interface ARKitViewRef {
  addTestObject: () => void;
}
```

**Implementación:**

- Usa `useImperativeHandle` para exponer métodos al componente padre
- Obtiene el `viewTag` con `findNodeHandle()`
- Llama al módulo nativo pasando el viewTag: `ExpoARKitModule.addTestObject(viewId)`

**Uso:**

```tsx
const arViewRef = useRef<ARKitViewRef>(null);

<ARKitView
  ref={arViewRef}
  style={styles.container}
  onARInitialized={handleInit}
  onARError={handleError}
/>

// Agregar objeto
arViewRef.current?.addTestObject();
```

#### 2. ARTestScreen.tsx

**Ubicación:** `src/ui/screens/ARTestScreen.tsx`

Pantalla de prueba con:

- Vista AR a pantalla completa
- Indicador de estado (Initializing/Ready/Error)
- Botón "Add Red Cube" para agregar objetos
- Caja de información con instrucciones

## Configuración

### Package.json del módulo

`modules/expo-arkit/package.json`:

- Módulo Expo local
- Configurado con expo-module.config.json

### Podspec

`modules/expo-arkit/ios/ExpoARKit.podspec`:

- Plataforma: iOS 17.0+
- Dependencia: ExpoModulesCore
- Source files: `**/*.{h,m,swift}`
- Frameworks: ARKit, RealityKit

### Navegación

Configurado en `src/ui/navigation/AppNavigator.tsx`:

- Ruta: `ARTest`
- Componente: `ARTestScreen`
- Configurado como pantalla inicial para testing

## Pruebas

### Requisitos

- Dispositivo iOS 17.0+ con LiDAR (iPhone 12 Pro o superior)
- ARKit no funciona en simulador (requiere hardware real)

### Ejecutar

```bash
cd ios && pod install
npx expo run:ios
```

### Funcionalidad Actual

1. ✅ Inicialización de sesión AR con RealityKit
2. ✅ Detección de planos horizontales y verticales
3. ✅ Agregar objetos 3D (cubo rojo de prueba a 0.5m)
4. ✅ Eventos de estado (inicialización/errores)
5. ✅ Comunicación bidireccional React Native ↔ Swift
6. ✅ Sistema de referencias imperativas (ref) funcional
7. ✅ Exportación de modelos USDZ con Share Sheet nativo de iOS
8. ✅ Gestión de archivos USDZ con explorador integrado

### Funcionalidad de Exportación

#### Compartir Modelos USDZ

La aplicación ahora incluye un sistema completo de exportación y compartición de modelos USDZ:

**Características:**
- **Share Sheet Nativo**: Usa el Share Sheet de iOS para compartir archivos
- **UI Integrada**: Botón de exportación en cada archivo del Room Scan Picker
- **Múltiples Destinos**:
  - AirDrop
  - Messages
  - Mail
  - Guardar en Files
  - iCloud Drive
  - Cualquier app compatible con USDZ

**Implementación en ARTestScreen:**

```tsx
const handleExportRoomScan = async (fileUri: string, fileName: string) => {
  try {
    await Share.share({
      url: fileUri,
      title: 'Export Room Scan',
      message: `Sharing ${fileName}`
    });
  } catch (error) {
    Alert.alert('Export Error', `Failed to share file: ${errorMessage}`);
  }
};
```

**UI:**
- Botón con ícono ↗️ en cada item del file picker
- Color azul (#007AFF) siguiendo design system de iOS
- Ubicado en el lado derecho del item para fácil acceso

**Ver:** [src/ui/screens/ARTestScreen.tsx:326-337](../../src/ui/screens/ARTestScreen.tsx#L326-L337)

### Próximos Pasos (Fase 1)

- [ ] Cargar modelos USDZ personalizados
- [ ] Auto-alineación de modelos con planos detectados
- [ ] Gestión de anclajes (anchors)
- [ ] Interacción con objetos (tap, drag)
- [ ] Persistencia de escena AR
- [x] ✅ Exportación y compartición de modelos USDZ

## Troubleshooting

### Error: "ARKit not supported"

- Verificar que el dispositivo tenga iOS 17.0+
- ARKit no funciona en simulador

### Error: Camera permission

- Verificar que `NSCameraUsageDescription` esté en Info.plist
- Ya configurado en `app.json`

### Error: "addTestObject is not a function"

**Causa:** El método no está correctamente expuesto a nivel de módulo

**Solución:**

- Verificar que `addTestObject` esté definido como `AsyncFunction` a nivel del módulo (no dentro del ViewManager)
- El método debe recibir el `viewTag` y usar `appContext?.findView()` para encontrar la vista
- Reconstruir: `cd ios && pod install && npx expo run:ios`

### Error de compilación

```bash
cd ios
pod deintegrate
pod install
```

## Referencias

- [ARKit Documentation](https://developer.apple.com/documentation/arkit)
- [RealityKit Documentation](https://developer.apple.com/documentation/realitykit)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)
