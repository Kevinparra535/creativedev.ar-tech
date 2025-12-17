# Wall Anchor System - Immersive View Implementation

**Documento:** Implementación de pantalla inmersiva final para Wall Anchor System
**Fecha:** 2025-12-17
**Estado:** Propuesta de implementación

---

## 📊 Estado Actual

### Flujo Existente del Wall Anchor System ✅

1. **ModelPreviewScreen** → Cliente carga modelo USDZ y selecciona pared virtual
2. **WallScanningScreen** → Cliente escanea pared física real (LiDAR)
3. **AlignmentViewScreen** → Sistema calcula alineación automática y muestra modelo alineado

### Gap Identificado ❌

**Falta: Pantalla 4 - Vista Inmersiva Final**

Después de que el modelo está alineado (paso 3), el cliente necesita:
- Ocultar el feed de cámara (Portal Mode)
- Ver solo el modelo 3D reemplazando la realidad
- Caminar dentro del diseño inmersivamente
- Experiencia clean sin botones de debug
- Toggle simple para alternar entre Portal Mode ON/OFF

---

## 🎯 Objetivo

Crear **ImmersiveViewScreen** como paso 4 del flujo Wall Anchor, integrando:

✅ **Portal Mode** (ocultar cámara)
✅ **Occlusion** (mesh reconstruction para profundidad)
✅ **Collision Detection** (avisos si toca objetos)
✅ **Haptic Feedback** (feedback táctil en colisiones)
✅ **UI minimalista** (solo toggle Portal + botón Done)

---

## 🏗️ Arquitectura Propuesta

### Navegación

```
ModelPreviewScreen 
    ↓
WallScanningScreen 
    ↓
AlignmentViewScreen 
    ↓ (Presiona "Continuar a Vista Inmersiva")
ImmersiveViewScreen ← NUEVA PANTALLA
    ↓ (Presiona "Finalizar")
HomeScreen / Success
```

### ImmersiveViewScreen - Características

**Props recibidas de navegación:**
```typescript
route.params = {
  modelPath: string;           // Ruta del modelo USDZ
  modelId: string;             // ID del modelo cargado
  alignment: AlignmentResult;  // Transformación aplicada
  virtualWall: WallData;
  realWall: RealWallData;
}
```

**Features integradas:**

1. **Portal Mode Toggle**
   - Botón flotante: 🌌 Portal ON / 📹 Normal AR
   - Oculta camera feed cuando activo
   - Muestra mesh de oclusión

2. **Collision Detection** (automático)
   - Physics bodies en modelos
   - ARSCNViewDelegate contactDidBegin
   - Haptic feedback en colisión
   - Alert visual si toca objeto

3. **Occlusion** (automático)
   - Scene reconstruction habilitado
   - Mesh classification activo
   - Occlusion material invisible

4. **UI Minimalista**
   - NO sliders de transform (ya está alineado)
   - NO FPS counter (no es testing screen)
   - NO botones de debug
   - SOLO: Toggle Portal + botón "Finalizar"

---

## 📝 Componentes a Crear

### 1. ImmersiveViewScreen.tsx

**Archivo nuevo:** `src/ui/screens/ImmersiveViewScreen.tsx`

**Responsabilidades:**
- Recibir modelo ya alineado de AlignmentViewScreen
- Renderizar ARKitView con modelo cargado
- Habilitar Portal Mode por defecto
- Mostrar UI minimalista
- Navegación a success/home screen

**Estado interno:**
```typescript
const [portalModeEnabled, setPortalModeEnabled] = useState(true);
const [collisionWarning, setCollisionWarning] = useState<string | null>(null);
const [showInstructions, setShowInstructions] = useState(true);
```

**UI Layout:**
```
┌─────────────────────────────────────┐
│   ARKitView (fullscreen)            │
│                                      │
│   [Portal Mode Toggle]  (top-left)  │
│                                      │
│   [Instructions Panel]   (bottom)   │
│   "Camina dentro del modelo..."     │
│                                      │
│   [Finalizar ✓]         (bottom)    │
└─────────────────────────────────────┘
```

### 2. ImmersiveOnboarding.tsx (opcional)

**Archivo nuevo:** `src/ui/ar/components/ImmersiveOnboarding.tsx`

**Responsabilidades:**
- Modal de primer uso (AsyncStorage)
- Explicar Portal Mode, collision detection
- 2-3 slides máximo (no 6 como ARTestScreen)
- UX orientada a cliente final

**Slides propuestos:**
1. "Bienvenido a tu diseño en AR"
2. "Portal Mode oculta la realidad"
3. "Camina libremente dentro del modelo"

### 3. Modificar AlignmentViewScreen.tsx

**Cambio:** Botón "Finalizar" debe navegar a ImmersiveViewScreen en lugar de ir a Home

**Antes:**
```typescript
const handleFinish = () => {
  navigation.navigate('Home'); // ❌
};
```

**Después:**
```typescript
const handleFinish = () => {
  if (!modelId || !alignment) return;
  
  navigation.navigate('ImmersiveView', {
    modelPath,
    modelId,
    alignment,
    virtualWall,
    realWall
  }); // ✅
};
```

### 4. Actualizar Navigation Types

**Archivo:** `src/ui/navigation/types.ts`

**Agregar:**
```typescript
export type RootStackParamList = {
  // ... existing screens
  AlignmentView: {
    modelPath: string;
    virtualWall: WallData;
    realWall: RealWallData;
  };
  ImmersiveView: {          // ← NUEVO
    modelPath: string;
    modelId: string;
    alignment: AlignmentResultResponse;
    virtualWall: WallData;
    realWall: RealWallData;
  };
};
```

### 5. Agregar a AppNavigator.tsx

**Archivo:** `src/ui/navigation/AppNavigator.tsx`

**Agregar:**
```typescript
import { ImmersiveViewScreen } from '@/ui/screens/ImmersiveViewScreen';

// En Stack.Navigator:
<Stack.Screen
  name='ImmersiveView'
  component={ImmersiveViewScreen}
  options={{ 
    title: 'Vista Inmersiva',
    headerShown: false // ← fullscreen AR
  }}
/>
```

---

## 🎨 Implementación Detallada: ImmersiveViewScreen

### Estado y Refs

```typescript
export const ImmersiveViewScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ImmersiveViewRouteProp>();
  const arViewRef = useRef<ARKitViewRef>(null);

  const { modelPath, modelId, alignment, virtualWall, realWall } = route.params;

  // State
  const [portalModeEnabled, setPortalModeEnabled] = useState(true);
  const [meshReconstructionEnabled, setMeshReconstructionEnabled] = useState(true);
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [arReady, setArReady] = useState(false);

  // Refs
  const collisionWarningTimeout = useRef<NodeJS.Timeout | null>(null);
};
```

### useEffect: Configuración Inicial

```typescript
// Enable features on mount
useEffect(() => {
  if (!arReady) return;

  const viewTag = arViewRef.current?.getViewTag?.();
  if (!viewTag) return;

  // Enable Portal Mode by default
  ExpoARKitModule.setPortalMode(viewTag, true);

  // Enable mesh reconstruction for occlusion
  ExpoARKitModule.setMeshReconstructionEnabled(viewTag, true);

  // Hide instructions after 5 seconds
  const timer = setTimeout(() => {
    setShowInstructions(false);
  }, 5000);

  return () => {
    clearTimeout(timer);
    // Clean up collision warnings
    if (collisionWarningTimeout.current) {
      clearTimeout(collisionWarningTimeout.current);
    }
  };
}, [arReady]);
```

### Handlers: Portal Mode Toggle

```typescript
const handleTogglePortalMode = async () => {
  const viewTag = arViewRef.current?.getViewTag?.();
  if (!viewTag) return;

  const nextPortalMode = !portalModeEnabled;
  setPortalModeEnabled(nextPortalMode);

  await ExpoARKitModule.setPortalMode(viewTag, nextPortalMode);

  // Show temporary feedback
  Alert.alert(
    nextPortalMode ? 'Portal Mode ON' : 'Portal Mode OFF',
    nextPortalMode 
      ? 'Cámara oculta. Verás solo el modelo 3D.'
      : 'Cámara visible. Verás realidad + modelo.',
    [{ text: 'OK' }]
  );
};
```

### Handlers: Collision Events

```typescript
const handleCollisionDetected = (event: { nativeEvent: CollisionDetectedEvent }) => {
  const { modelId: collidedModelId, contactPoint, force } = event.nativeEvent;

  // Clear previous warning timeout
  if (collisionWarningTimeout.current) {
    clearTimeout(collisionWarningTimeout.current);
  }

  // Show collision warning
  setCollisionWarning(`Objeto detectado (fuerza: ${force.toFixed(1)})`);

  // Auto-hide after 2 seconds
  collisionWarningTimeout.current = setTimeout(() => {
    setCollisionWarning(null);
  }, 2000);

  // Haptic feedback is handled natively
};
```

### Handlers: Finish

```typescript
const handleFinish = () => {
  Alert.alert(
    '¿Finalizar vista inmersiva?',
    'Se guardará la sesión y volverás al inicio.',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Finalizar',
        style: 'default',
        onPress: () => {
          // TODO: Save session metadata if needed
          navigation.popToTop(); // Return to Home
        }
      }
    ]
  );
};
```

### JSX Render

```tsx
return (
  <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
    {/* AR View (fullscreen) */}
    <View style={styles.arContainer}>
      <ARKitView
        ref={arViewRef}
        style={styles.arView}
        onARInitialized={handleARInitialized}
        onARError={handleARError}
        onCollisionDetected={handleCollisionDetected}
      />
    </View>

    {/* Portal Mode Toggle (top-left) */}
    <TouchableOpacity
      style={styles.portalToggle}
      onPress={handleTogglePortalMode}
    >
      <Text style={styles.portalToggleText}>
        {portalModeEnabled ? '🌌 Portal ON' : '📹 Normal AR'}
      </Text>
    </TouchableOpacity>

    {/* Collision Warning (center) */}
    {collisionWarning && (
      <View style={styles.collisionWarning}>
        <Text style={styles.collisionWarningText}>⚠️ {collisionWarning}</Text>
      </View>
    )}

    {/* Instructions Panel (bottom, auto-hide) */}
    {showInstructions && (
      <View style={styles.instructionsPanel}>
        <Text style={styles.instructionsTitle}>Vista Inmersiva Activada</Text>
        <Text style={styles.instructionsText}>
          Portal Mode está activo. Camina dentro del modelo para explorar el diseño.
          {'\n\n'}
          Toca el botón "Portal" para alternar entre vista inmersiva y AR normal.
        </Text>
      </View>
    )}

    {/* Finish Button (bottom) */}
    <View style={styles.buttonContainer}>
      <TouchableOpacity
        style={styles.finishButton}
        onPress={handleFinish}
      >
        <Text style={styles.finishButtonText}>Finalizar ✓</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);
```

---

## 🎯 Diferencias Clave: ImmersiveViewScreen vs ARTestScreen

| Aspecto | ARTestScreen | ImmersiveViewScreen |
|---------|--------------|---------------------|
| **Propósito** | Testing/debugging | Experiencia cliente final |
| **UI** | 20+ botones, sliders | 2 botones (Portal + Finish) |
| **Features visibles** | FPS, transforms, stats | Solo Portal Mode toggle |
| **Onboarding** | 6 slides técnicos | 3 slides simples |
| **Modelo** | Tap-to-place manual | Pre-alineado de AlignmentView |
| **Navegación** | Standalone testing | Parte de flujo Wall Anchor |
| **Collision UI** | Stats panel detallado | Warning simple temporal |
| **Haptics** | Toggle manual | Siempre activo |
| **Portal Mode** | Toggle con stats | Toggle clean |
| **Complejidad** | Alta (desarrollador) | Baja (usuario final) |

---

## 🚀 Plan de Implementación

### Paso 1: Crear ImmersiveViewScreen Base (1-2 horas)

- [ ] Crear archivo `ImmersiveViewScreen.tsx`
- [ ] Setup básico: navigation, route, refs, state
- [ ] Renderizar ARKitView fullscreen
- [ ] Recibir modelo pre-alineado de params

### Paso 2: Integrar Portal Mode (30 min)

- [ ] Toggle button UI
- [ ] Handler `handleTogglePortalMode`
- [ ] State `portalModeEnabled`
- [ ] Call `ExpoARKitModule.setPortalMode`

### Paso 3: Integrar Collision Detection (30 min)

- [ ] Handler `handleCollisionDetected`
- [ ] Warning UI (temporal, auto-hide)
- [ ] Haptic feedback (ya funciona nativo)

### Paso 4: Actualizar Navigation (15 min)

- [ ] Agregar `ImmersiveView` a `types.ts`
- [ ] Agregar screen a `AppNavigator.tsx`
- [ ] Modificar `AlignmentViewScreen` botón "Finalizar"

### Paso 5: UI Polish (30 min)

- [ ] Instructions panel con auto-hide
- [ ] Styles minimalistas
- [ ] Botón "Finalizar" con confirmación

### Paso 6: Testing (1 hora)

- [ ] Probar flujo completo: Preview → Scan → Align → Immersive
- [ ] Validar Portal Mode ON/OFF
- [ ] Validar collision warnings
- [ ] Validar navegación de regreso a Home

### Paso 7: Onboarding (opcional, 1 hora)

- [ ] Crear `ImmersiveOnboarding.tsx`
- [ ] 3 slides simples
- [ ] AsyncStorage persistence
- [ ] Integrar en ImmersiveViewScreen

---

## ✅ Criterios de Éxito

1. **Flujo completo funcional:**
   - Cliente puede completar: Preview → Scan → Align → Immersive → Finish

2. **Portal Mode efectivo:**
   - Camera feed se oculta correctamente
   - Modelo 3D visible con oclusión realista
   - Toggle funciona sin lag

3. **Collision detection responsivo:**
   - Warnings aparecen cuando toca objetos
   - Haptic feedback se siente en device
   - No interfiere con exploración

4. **UX clean:**
   - Solo 2 botones principales visibles
   - Instructions auto-hide después de 5s
   - No elementos de debug/testing

5. **Performance:**
   - 30+ FPS constante en Portal Mode
   - Mesh reconstruction no causa lag
   - Tracking estable al caminar

---

## 📚 Archivos a Modificar/Crear

### Nuevos (2 archivos)
1. `src/ui/screens/ImmersiveViewScreen.tsx` (~400 líneas)
2. `src/ui/ar/components/ImmersiveOnboarding.tsx` (~200 líneas, opcional)

### Modificados (3 archivos)
1. `src/ui/screens/AlignmentViewScreen.tsx` (~10 líneas - cambiar navegación)
2. `src/ui/navigation/types.ts` (~10 líneas - agregar ImmersiveView)
3. `src/ui/navigation/AppNavigator.tsx` (~10 líneas - agregar screen)

**Total estimado:** ~630 líneas de código nuevo
**Tiempo estimado:** 4-6 horas de desarrollo + 2 horas de testing

---

## 🎓 Notas de Implementación

### Reutilizar Features de ARTestScreen

**Portal Mode:**
```typescript
// Ya existe en ExpoARKitModule.ts
ExpoARKitModule.setPortalMode(viewTag, enabled);
ExpoARKitModule.getPortalModeState(viewTag);
```

**Collision Detection:**
```typescript
// Ya existe en ARKitView.tsx
onCollisionDetected={handleCollisionDetected}

// Event payload:
{
  modelId: string;
  contactPoint: [number, number, number];
  force: number;
}
```

**Mesh Reconstruction:**
```typescript
// Ya existe en ExpoARKitModule.ts
ExpoARKitModule.setMeshReconstructionEnabled(viewTag, enabled);
```

**Haptics:**
```typescript
// Ya funciona automáticamente en colisiones
// No requiere código adicional en React Native
```

### Simplificaciones vs ARTestScreen

**Remover:**
- ❌ FPS counter
- ❌ Transform sliders (position, rotation, scale)
- ❌ Mesh stats modal
- ❌ Quality settings selector
- ❌ Plane visibility toggle
- ❌ Add/Remove model buttons
- ❌ Undo/Redo system
- ❌ Bounding box toggle
- ❌ Debug logging UI

**Mantener:**
- ✅ Portal Mode toggle (simplificado)
- ✅ Collision warnings (simplificado)
- ✅ Haptic feedback (automático)
- ✅ Occlusion (automático)

---

## 📖 Documentación Relacionada

- [PLAN_AR_INMERSIVO.md](./PLAN_AR_INMERSIVO.md) - Visión completa del POC
- [WALL_ANCHOR_SYSTEM_PLAN.md](./WALL_ANCHOR_SYSTEM_PLAN.md) - Sistema de alineación
- [CURRENT_STATE.md](./CURRENT_STATE.md) - Estado actual del proyecto
- [POC_VISION_ALIGNMENT_ANALYSIS.md](./POC_VISION_ALIGNMENT_ANALYSIS.md) - Análisis de alineación

---

**Última actualización:** 2025-12-17
**Estado:** Propuesta de implementación
**Próximo paso:** Crear ImmersiveViewScreen.tsx base

