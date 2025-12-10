# FASE 1: AR IMMERSIVE VISUALIZATION

**Estado:** ⏳ EN PROGRESO  
**Rama:** `feature/arkit-integration`  
**Última actualización:** 2025-12-09  
**Dependencias:** Fase 0 completada ✅

---

## 🎯 Objetivo de Fase 1

Implementar visualización AR inmersiva para lograr la visión del POC:

1. ⏳ Cargar modelos 3D del arquitecto (USDZ nativo)
2. ⏳ Integrar ARKit para tracking y rendering
3. ⏳ Alinear modelo con escaneo de RoomPlan
4. ⏳ Renderizar modelo en AR con occlusion (reemplazo de realidad)
5. ⏳ Navegación 6DOF dentro del modelo

**Stack:** ARKit + RealityKit (nativo iOS) + React Native bridge

---

## 📋 Tareas Desglosadas

### Tarea 1: Model Upload System (3-4 días)

**Objetivo:** Permitir cargar modelos USDZ del arquitecto.

#### Subtareas

- [ ] **1.1 Instalar dependencias**
  ```bash
  npx expo install expo-document-picker expo-file-system
  ```

- [ ] **1.2 Crear ModelLibraryScreen**
  - Archivo: `src/ui/screens/ModelLibraryScreen.tsx`
  - Lista de modelos cargados (AsyncStorage para metadata)
  - Botón "Agregar modelo"
  - Cards con nombre, tamaño, fecha
  - Opciones: Ver preview, Usar en AR, Eliminar

- [ ] **1.3 Crear ModelPicker component**
  - Archivo: `src/ui/components/ModelPicker.tsx`
  - Integrar `expo-document-picker`
  - Filtrar por extensión: `.usdz` (prioridad), `.reality`
  - Validar tamaño (< 100MB recomendado)
  - Copiar a `${FileSystem.documentDirectory}models/`

- [ ] **1.4 Crear useModelStorage hook**
  - Archivo: `src/ui/ar/hooks/useModelStorage.ts`
  - `saveModel()`, `loadModels()`, `deleteModel()`
  - Metadata: `{ id, name, path, size, uploadDate, bounds? }`
  - AsyncStorage para índice de modelos

- [ ] **1.5 Preview nativo USDZ (iOS Quick Look)**
  - Usar Quick Look API de iOS para preview
  - Botón "Vista previa" abre AR Quick Look
  - No requiere Three.js, es nativo de iOS

**Entregable:** Usuario puede cargar y gestionar modelos USDZ.

---

### Tarea 2: ARKit Native Module (5-7 días)

**Objetivo:** Crear bridge React Native ↔ ARKit para renderizado AR.

#### Subtareas

- [ ] **2.1 Crear estructura de módulo nativo**
  ```
  ios/ARKitModule/
  ├── ARKitModule.swift          # AR session manager
  ├── ARKitBridge.m              # Objective-C bridge
  ├── ARKitView.swift            # UIView wrapper para ARView
  └── ARKitViewManager.swift     # ViewManager para React Native
  ```

- [ ] **2.2 Implementar ARKitModule.swift**
  - Métodos: `startARSession()`, `stopARSession()`, `loadModel()`
  - Configurar ARWorldTrackingConfiguration
  - Scene reconstruction + depth semantics
  - Event emitters: `onSessionStarted`, `onModelLoaded`, `onTrackingUpdate`

- [ ] **2.3 Implementar ARKitView (RealityKit)**
  ```swift
  import RealityKit
  import ARKit
  
  class ARKitView: UIView {
    var arView: ARView!
    var modelEntity: ModelEntity?
    
    func loadModel(path: String, alignment: Alignment) {
      modelEntity = try! ModelEntity.loadModel(named: path)
      modelEntity?.scale = alignment.scale
      modelEntity?.position = alignment.position
      
      let anchor = AnchorEntity(world: alignment.worldPosition)
      anchor.addChild(modelEntity!)
      arView.scene.addAnchor(anchor)
    }
  }
  ```

- [ ] **2.4 Configurar Occlusion (Scene Reconstruction)**
  ```swift
  let config = ARWorldTrackingConfiguration()
  config.sceneReconstruction = .mesh
  config.frameSemantics = [.sceneDepth, .smoothedSceneDepth]
  config.environmentTexturing = .automatic
  arView.session.run(config)
  ```

- [ ] **2.5 Crear componente React Native ARViewer**
  - Archivo: `src/ui/ar/components/ARViewer.tsx`
  - Wrapper de vista nativa
  - Props: `modelPath`, `alignment`, `onSessionStart`, `onError`
  - Usar `requireNativeComponent` pattern

**Entregable:** Módulo ARKit funcional, modelo se renderiza en AR con tracking.

---

### Tarea 3: Auto-Alignment System (3-4 días)

**Objetivo:** Alinear automáticamente modelo con escaneo de RoomPlan.

#### Subtareas

- [ ] **3.1 Extraer bounds del modelo USDZ**
  ```swift
  // Swift: Leer dimensiones del modelo
  let modelEntity = try! ModelEntity.loadModel(named: modelPath)
  let bounds = modelEntity.model!.mesh.bounds
  let modelSize = SIMD3<Float>(
    bounds.extents.x,
    bounds.extents.y, 
    bounds.extents.z
  )
  ```

- [ ] **3.2 Extraer bounds del escaneo RoomPlan**
  - Parsear USDZ de RoomPlan
  - Obtener dimensiones de la habitación
  - Calcular centro del espacio

- [ ] **3.3 Calcular transformación automática**
  ```swift
  func autoAlign(model: ModelBounds, scan: RoomBounds) -> Alignment {
    // Scale: ajustar modelo al tamaño de habitación
    let scaleX = scan.width / model.width
    let scaleY = scan.height / model.height
    let scaleZ = scan.depth / model.depth
    let uniformScale = min(scaleX, scaleY, scaleZ)
    
    // Position: centrar modelo en habitación
    let position = scan.center
    
    return Alignment(
      scale: SIMD3(uniformScale, uniformScale, uniformScale),
      position: position,
      rotation: SIMD3(0, 0, 0) // Sin rotación inicial
    )
  }
  ```

- [ ] **3.4 UI de ajuste manual (opcional)**
  - Sliders para scale, position, rotation
  - Preview de alineación en 2D/3D
  - Botón "Aplicar" para confirmar

- [ ] **3.5 Guardar configuración**
  ```typescript
  // AsyncStorage
  const project = {
    id: uuid(),
    modelPath: modelPath,
    scanPath: scanPath,
    alignment: { scale, position, rotation },
    createdAt: Date.now()
  };
  await AsyncStorage.setItem(`project_${id}`, JSON.stringify(project));
  ```

**Entregable:** Modelo auto-alineado con escaneo, listo para AR.

---

### Tarea 4: AR Immersive Experience (4-5 días)

**Objetivo:** Usuario camina dentro del modelo (visión del POC).

#### Subtareas

- [ ] **4.1 Crear ARImmersiveScreen**
  - Archivo: `src/ui/screens/ARImmersiveScreen.tsx`
  - Full-screen ARViewer
  - Controles mínimos (UI overlay transparente)
  - Botón salir, botón screenshot

- [ ] **4.2 Cargar modelo con alineación aplicada**
  ```typescript
  const project = await loadProject(projectId);
  ARKitModule.loadModel({
    path: project.modelPath,
    scale: project.alignment.scale,
    position: project.alignment.position,
    rotation: project.alignment.rotation
  });
  ```

- [ ] **4.3 Habilitar navegación 6DOF**
  - ARKit maneja tracking automáticamente
  - Usuario camina físicamente → cámara se mueve en AR
  - Usuario gira → vista rota en AR
  - Sin controles virtuales, todo es físico

- [ ] **4.4 Optimización de occlusion**
  - Renderizar solo modelo, NO espacio real
  - Usar depth map para occlusion precisa
  - Mesh reconstruction oculta realidad física

- [ ] **4.5 Testing del POC**
  - Probar en espacio real con LiDAR
  - Validar que usuario "entra" al modelo
  - Verificar occlusion funciona
  - Performance: mantener 60 FPS

**Entregable:** POC funcional - Usuario camina dentro del diseño 3D.

---

### Tarea 5: Polish & Integration (2-3 días)

**Objetivo:** Pulir experiencia y flujo completo.

#### Subtareas

- [ ] **5.1 Flujo completo de navegación**
  - HomeScreen → ModelLibraryScreen → Cargar modelo
  - Tap modelo → RoomPlanTestScreen → Escanear espacio
  - Automático: Auto-alignment
  - Tap "Ver en AR" → ARImmersiveScreen
  - Usuario explora diseño en AR

- [ ] **5.2 Estados de carga y errores**
  - Loading al cargar modelos pesados (> 20MB)
  - Error handling: Modelo corrupto, sin LiDAR, iOS < 16
  - Mensajes claros para usuario

- [ ] **5.3 Tutorial/Onboarding**
  - Primera vez: "Cómo usar AR inmersivo"
  - Tips: "Camina lentamente", "Apunta al suelo primero"
  - Skip button para usuarios avanzados

- [ ] **5.4 Gestión de proyectos**
  - Lista de proyectos guardados
  - Editar/Eliminar proyectos
  - Re-escanear espacio si cambió

**Entregable:** Flujo completo funcional, POC demo-ready.

---

## 🛠 Stack Técnico Final

### Dependencias NPM

```json
{
  "expo": "~54.0.27",
  "expo-roomplan": "^1.2.1",
  "expo-document-picker": "^12.0.2",
  "expo-file-system": "^18.0.11",
  "@react-native-async-storage/async-storage": "^2.1.0"
}
```

**Eliminados:**
- ❌ `@react-three/fiber` (no necesario)
- ❌ `three` (no necesario)

### iOS Frameworks Nativos

```swift
import ARKit           // AR tracking, world tracking
import RealityKit      // Renderizado moderno (recomendado)
import RoomPlan        // Escaneo LiDAR (vía expo-roomplan)
import QuickLook       // Preview USDZ (opcional)
```

### Estructura de Archivos

```
src/ui/
├── screens/
│   ├── ModelLibraryScreen.tsx      # Lista de modelos cargados
│   ├── ARImmersiveScreen.tsx       # AR viewer inmersivo
│   └── ProjectsScreen.tsx          # Proyectos guardados (opcional)
│
├── components/
│   ├── ModelPicker.tsx             # File picker para USDZ
│   └── ModelCard.tsx               # Card con info de modelo
│
├── ar/
│   ├── components/
│   │   └── ARKitView.tsx           # Native UIViewRepresentable wrapper
│   │
│   ├── hooks/
│   │   ├── useModelStorage.ts      # CRUD de modelos
│   │   ├── useAutoAlignment.ts     # Alineación automática
│   │   └── useARSession.ts         # ARKit session management
│   │
│   └── utils/
│       ├── modelHelpers.ts         # Cálculos de bounds, escala
│       └── alignmentHelpers.ts     # Algoritmo de matching
│
├── native/
│   └── ARKitModule/                # Native Swift module
│       ├── ARKitModule.swift       # RealityKit rendering
│       ├── ARKitBridge.m           # Objective-C bridge
│       └── AutoAlignmentEngine.swift # Alignment algorithm
│
└── navigation/
    └── TabNavigator.tsx            # Agregar tab ModelLibrary
```

---

## 📊 Métricas Esperadas

| Métrica | Objetivo |
|---------|----------|
| **Archivos Nuevos** | ~12 archivos (TypeScript + Swift) |
| **Líneas de Código** | ~1800-2000 líneas |
| **Dependencias Agregadas** | 2 (expo-document-picker, expo-file-system) |
| **Complejidad** | Alta (Native Swift + React Native bridge) |
| **Tiempo de Desarrollo** | 2-3 semanas |
| **Performance Target** | 60 FPS en AR, < 2s para cargar modelo 10MB |

---

## 🚨 Decisiones Técnicas Críticas

### 1. Formato de Modelos 3D

**Decisión: Solo USDZ** ✅

- ✅ Formato nativo de iOS ARKit/RealityKit
- ✅ RoomPlan exporta USDZ → mismo formato para modelos
- ✅ Cero conversión necesaria
- ✅ Mejor performance y compatibilidad
- ❌ Solo iOS (pero proyecto ya es iOS-only)

**Eliminado:**
- ❌ glTF/GLB (requiere Three.js, no necesario)
- ❌ FBX (herramienta de autor, no runtime)

---



### 2. Almacenamiento de Modelos

**Decisión: Local file system** ✅

- ✅ Funciona offline (crítico para AR)
- ✅ No requiere backend para POC
- ✅ Más simple y rápido de implementar
- ❌ Limitado a un dispositivo (aceptable para POC)
- ❌ Sin backup automático (mitigado con iCloud backup del sistema)

**Eliminado:**
- ❌ Cloud storage (complejidad innecesaria para POC, dejar para producción)

**Ubicación:** `FileSystem.documentDirectory + 'models/'`

---

### 3. Alineación Modelo-Escaneo

**Decisión: Automática** ✅

- ✅ Cumple visión del POC (experiencia fluida)
- ✅ Algoritmo bounds-based es factible
- ✅ No requiere UI manual compleja
- ❌ Puede no ser 100% preciso (aceptable para POC)

**Algoritmo:**
1. Obtener bounding box del modelo USDZ
2. Obtener bounding box del escaneo RoomPlan
3. Calcular scale factor (max dimension)
4. Centrar modelo en origen del escaneo
5. Aplicar transform a ARKit anchor

**Eliminado:**
- ❌ UI de alineación manual (complejidad innecesaria si algoritmo funciona bien)
- ❌ Sliders de transformación (puede agregarse después si es necesario)

---

## 🎓 Lecciones de Fase 0 Aplicadas

1. **Priorizar librerías oficiales:** Usar `expo-document-picker` en vez de custom native module
2. **Simplicidad sobre control:** USDZ nativo es más simple que Three.js + conversión
3. **Iterar rápido:** MVP funcional con auto-alignment antes de optimizaciones
4. **Testing en real device:** Probar con modelos reales desde día 1
5. **ARKit-first:** Aprovechar APIs nativas en vez de reinventar (RealityKit occlusion, world tracking)

---

## 🔗 Flujo de Usuario Esperado

```text
1. Usuario abre ModelLibraryScreen
2. Tap "Agregar Modelo" → DocumentPicker
3. Selecciona archivo .usdz desde Files app
4. Modelo se carga en biblioteca
5. Tap "Escanear Espacio" → RoomPlanTestScreen
6. Usuario escanea habitación con LiDAR
7. USDZ de escaneo se guarda automáticamente
8. Sistema ejecuta auto-alignment (bounds matching)
9. Proyecto creado con modelo + escaneo + alineación
10. Tap "Ver en AR" → ARImmersiveScreen
11. Usuario camina dentro del diseño 3D (visión del POC lograda ✅)
```

---

## ✅ Criterios de Éxito

- [ ] Usuario puede cargar archivos USDZ desde Files app
- [ ] Modelos se almacenan en `FileSystem.documentDirectory`
- [ ] Auto-alignment calcula scale/position/rotation automáticamente
- [ ] Bounds matching alinea modelo con escaneo en < 1s
- [ ] Configuración de proyecto se guarda en AsyncStorage
- [ ] Performance: < 2s para cargar modelo de 10MB
- [ ] Cero crashes al cargar modelos válidos USDZ
- [ ] Error handling claro para formatos no soportados
- [ ] ARKit session puede cargar modelo con transform aplicado

---

## 🚀 Próximos Pasos (Post Fase 1)

### Fase 2: AR Visualization (3-4 semanas)

- Integrar RealityKit para renderizado AR
- Aplicar occlusion con depth buffer (mesh reconstruction)
- Implementar 6DOF tracking continuo
- Testing: usuario camina dentro del modelo sin glitches

### Fase 3: Professional Features (2-3 semanas)

- Sistema de mediciones AR (distancia entre puntos)
- Screenshots y video capture
- Cambio de materiales PBR en tiempo real
- Comparación de variantes de diseño (A/B testing visual)

### Fase 4: Polish & Production (1-2 semanas)

- Optimización de performance (LOD, culling)
- Onboarding/tutorial AR
- Demo content profesional
- Testing extensivo en devices reales

---

## 📚 Recursos de Referencia

### ARKit & RealityKit (iOS)

- [ARKit Documentation](https://developer.apple.com/documentation/arkit)
- [RealityKit Documentation](https://developer.apple.com/documentation/realitykit)
- [RoomPlan API](https://developer.apple.com/documentation/roomplan)
- [USDZ File Format](https://developer.apple.com/augmented-reality/usdz/)

### Expo APIs

- [expo-document-picker](https://docs.expo.dev/versions/latest/sdk/document-picker/)
- [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [expo-roomplan](https://docs.expo.dev/versions/latest/sdk/roomplan/)

### React Native Native Modules

- [Creating Native Modules (iOS)](https://reactnative.dev/docs/native-modules-ios)
- [Swift/Objective-C Bridge Pattern](https://reactnative.dev/docs/native-modules-intro)

### Community Examples

- [React Native ARKit (outdated but useful)](https://github.com/react-native-ar/react-native-arkit)
- [Apple WWDC RoomPlan Sessions](https://developer.apple.com/videos/play/wwdc2022/10127/)

---

**Documento:** FASE_1_MODEL_LOADING.md  
**Versión:** 2.0 (ARKit-focused)  
**Última actualización:** 2025-12-09  
**Estado:** Fase 1 - Documentación completa (actualizada sin Three.js) ✅  
**Próximo:** Crear branch `feature/arkit-integration` y comenzar Tarea 1

