# Implementación ARKit - Integración Nativa

## Resumen
Este documento describe la implementación de ARKit nativo en el proyecto usando Expo Modules y RealityKit.

## Arquitectura

### Módulos Nativos iOS

#### 1. ExpoARKitModule.swift
**Ubicación:** `ios/ARKitModule/ExpoARKitModule.swift`

Módulo principal que define la interfaz entre React Native y el código nativo:
- Define el nombre del módulo: `ExpoARKit`
- Expone la vista `ExpoARKitView`
- Declara eventos: `onARInitialized`, `onARError`
- Expone método `addTestObject()` para agregar objetos 3D a la escena

#### 2. ExpoARKitView.swift
**Ubicación:** `ios/ARKitModule/ExpoARKitView.swift`

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
**Ubicación:** `src/ui/ar/components/ARKitView.tsx`

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

### Podfile
Agregado en `ios/Podfile`:
```ruby
pod 'ExpoARKit', :path => './ARKitModule'
```

### Podspec
`ios/ARKitModule/ExpoARKit.podspec`:
- Plataforma: iOS 17.0+
- Dependencia: ExpoModulesCore
- Source files: `**/*.{h,m,swift}`

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
1. ✅ Inicialización de sesión AR
2. ✅ Detección de planos
3. ✅ Agregar objetos 3D (cubo rojo de prueba)
4. ✅ Eventos de estado (inicialización/errores)

### Próximos Pasos (Fase 1)
- [ ] Cargar modelos USDZ personalizados
- [ ] Auto-alineación de modelos con planos detectados
- [ ] Gestión de anclajes (anchors)
- [ ] Interacción con objetos (tap, drag)
- [ ] Persistencia de escena AR

## Troubleshooting

### Error: "ARKit not supported"
- Verificar que el dispositivo tenga iOS 17.0+
- ARKit no funciona en simulador

### Error: Camera permission
- Verificar que `NSCameraUsageDescription` esté en Info.plist
- Ya configurado en `app.json`

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
