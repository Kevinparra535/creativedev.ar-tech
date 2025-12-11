# Tap-to-Place Implementation Plan

**Objetivo:** Implementar sistema de anclaje espacial para modelos USDZ usando tap gestures y ARAnchors

**Fecha Inicio:** 2025-12-11
**Duración Estimada:** 3-5 días
**Prioridad:** ALTA (Crítico para visión del POC)

---

## 📋 Resumen Ejecutivo

Este documento detalla la implementación del sistema tap-to-place que permite:
- Usuario toca la pantalla en un plano detectado
- Modelo USDZ se ancla al mundo real en ese punto
- Modelo permanece fijo mientras usuario camina
- Base para futuro "reemplazo de realidad"

---

## 🎯 Fases de Implementación

### Fase 1: Tap Gesture Detection (Swift Backend)
### Fase 2: Hit-Testing contra Planos
### Fase 3: Anchor Management
### Fase 4: React Native Bridge
### Fase 5: UI y UX
### Fase 6: Testing y Refinamiento

---

## 📝 Tareas Detalladas

### **FASE 1: Tap Gesture Detection (Backend Swift)**

#### ✅ Tarea 1.1: Agregar UITapGestureRecognizer a ARSCNView
**Archivo:** `modules/expo-arkit/ios/ExpoARKitView.swift`
**Descripción:** Detectar cuando usuario toca la pantalla AR

**Pasos:**
```swift
// En setupARView(), después de configurar sceneView
let tapGesture = UITapGestureRecognizer(
    target: self,
    action: #selector(handleTap(_:))
)
sceneView.addGestureRecognizer(tapGesture)
```

**Criterio de Aceptación:**
- [ ] Gesture recognizer agregado a sceneView
- [ ] No interfiere con gestures existentes de SceneKit
- [ ] Función handleTap creada (vacía por ahora)

**Tiempo Estimado:** 30 minutos

---

#### ✅ Tarea 1.2: Implementar función handleTap básica
**Archivo:** `modules/expo-arkit/ios/ExpoARKitView.swift`
**Descripción:** Handler que procesa el tap del usuario

**Pasos:**
```swift
@objc private func handleTap(_ sender: UITapGestureRecognizer) {
    guard isInitialized else { return }

    // Obtener punto 2D donde tocó el usuario
    let touchLocation = sender.location(in: sceneView)

    // TODO: Hacer hit-test (Fase 2)
    print("Tap detected at: \(touchLocation)")
}
```

**Criterio de Aceptación:**
- [ ] Función handleTap se ejecuta al tocar pantalla
- [ ] Console log muestra coordenadas del tap
- [ ] Funciona solo si AR está inicializado

**Tiempo Estimado:** 30 minutos

---

### **FASE 2: Hit-Testing contra Planos**

#### ✅ Tarea 2.1: Implementar hit-test contra planos existentes
**Archivo:** `modules/expo-arkit/ios/ExpoARKitView.swift`
**Descripción:** Convertir punto 2D (pantalla) a 3D (mundo real)

**Pasos:**
```swift
@objc private func handleTap(_ sender: UITapGestureRecognizer) {
    guard isInitialized else { return }

    let touchLocation = sender.location(in: sceneView)

    // Hit-test contra planos detectados
    let hitTestResults = sceneView.hitTest(
        touchLocation,
        types: .existingPlane
    )

    guard let firstHit = hitTestResults.first else {
        // No se encontró plano en ese punto
        onARError(["error": "No plane detected at tap location"])
        return
    }

    // TODO: Crear anchor (Fase 3)
    print("Hit plane at: \(firstHit.worldTransform)")
}
```

**Criterio de Aceptación:**
- [ ] Hit-test detecta planos correctamente
- [ ] Retorna worldTransform del punto de intersección
- [ ] Emite error si no hay plano en tap location
- [ ] Console log muestra matriz de transformación

**Tiempo Estimado:** 1 hora

---

#### ✅ Tarea 2.2: Validar tipo de plano antes de anclar
**Archivo:** `modules/expo-arkit/ios/ExpoARKitView.swift`
**Descripción:** Opcional: solo permitir anclar en ciertos tipos de planos

**Pasos:**
```swift
guard let firstHit = hitTestResults.first,
      let planeAnchor = firstHit.anchor as? ARPlaneAnchor else {
    onARError(["error": "No valid plane found"])
    return
}

// Opcional: filtrar por tipo de plano
if #available(iOS 12.0, *) {
    // Solo permitir en pisos (opcional para arquitectura)
    guard planeAnchor.classification == .floor else {
        onARError(["error": "Please tap on the floor"])
        return
    }
}
```

**Criterio de Aceptación:**
- [ ] Valida que hit sea contra ARPlaneAnchor
- [ ] (Opcional) Filtra por clasificación de plano
- [ ] Emite error descriptivo si plano no válido

**Tiempo Estimado:** 30 minutos

---

### **FASE 3: Anchor Management**

#### ✅ Tarea 3.1: Crear sistema de gestión de anchors
**Archivo:** `modules/expo-arkit/ios/ExpoARKitView.swift`
**Descripción:** Estructura de datos para rastrear anchors ↔ modelos

**Pasos:**
```swift
// En la clase ExpoARKitView, agregar propiedades:
private var modelAnchors: [UUID: ARAnchor] = [:]
private var anchoredNodes: [UUID: SCNNode] = [:]
private var currentModelNode: SCNNode? // Modelo cargado actualmente
```

**Criterio de Aceptación:**
- [ ] Diccionarios creados para mapear anchors ↔ nodos
- [ ] currentModelNode rastrea modelo activo
- [ ] No hay memory leaks (usar weak references si es necesario)

**Tiempo Estimado:** 30 minutos

---

#### ✅ Tarea 3.2: Crear y agregar ARAnchor en punto de tap
**Archivo:** `modules/expo-arkit/ios/ExpoARKitView.swift`
**Descripción:** Crear anchor en worldTransform del hit-test

**Pasos:**
```swift
// En handleTap, después de validar hit
let anchor = ARAnchor(transform: firstHit.worldTransform)
sceneView.session.add(anchor)

// Guardar referencia
modelAnchors[anchor.identifier] = anchor

print("Anchor created: \(anchor.identifier)")
```

**Criterio de Aceptación:**
- [ ] ARAnchor creado con transform correcto
- [ ] Anchor agregado a ARSession
- [ ] UUID del anchor guardado en diccionario
- [ ] Console log confirma creación

**Tiempo Estimado:** 30 minutos

---

#### ✅ Tarea 3.3: Modificar loadModel() para soportar anclaje opcional
**Archivo:** `modules/expo-arkit/ios/ExpoARKitView.swift`
**Descripción:** loadModel debe soportar dos modos: frente a cámara (actual) y anclado

**Pasos:**
```swift
// Agregar parámetro opcional
func loadModel(
    path: String,
    scale: Float,
    position: [Double],
    anchorToLastTap: Bool = false  // NUEVO
) {
    // ... código de carga existente ...

    if anchorToLastTap, let lastAnchor = modelAnchors.values.last {
        // Modo anclado: usar transform del anchor
        modelNode.simdTransform = lastAnchor.transform
        anchoredNodes[lastAnchor.identifier] = modelNode
    } else {
        // Modo actual: relativo a cámara
        // ... código existente ...
    }

    // Guardar referencia al modelo actual
    currentModelNode = modelNode

    // ... resto del código ...
}
```

**Criterio de Aceptación:**
- [ ] Parámetro anchorToLastTap agregado
- [ ] Modo anclado usa transform del último anchor
- [ ] Modo normal (default) funciona como antes
- [ ] Backward compatibility preservada

**Tiempo Estimado:** 1 hora

---

#### ✅ Tarea 3.4: Implementar actualización de anchors
**Archivo:** `modules/expo-arkit/ios/ExpoARKitView.swift`
**Descripción:** Actualizar posición de modelos cuando ARKit refina anchors

**Pasos:**
```swift
// Extender ARSessionDelegate (ya implementado parcialmente)
extension ExpoARKitView: ARSessionDelegate {
    func session(_ session: ARSession, didUpdate anchors: [ARAnchor]) {
        for anchor in anchors {
            // Si tenemos un nodo asociado a este anchor
            if let node = anchoredNodes[anchor.identifier] {
                // Actualizar transform del nodo
                node.simdTransform = anchor.transform
            }
        }
    }
}
```

**Criterio de Aceptación:**
- [ ] Delegate method implementado
- [ ] Nodos anclados se actualizan con nuevo transform
- [ ] No causa jitter visual (movimientos suaves)

**Tiempo Estimado:** 45 minutos

---

#### ✅ Tarea 3.5: Implementar función para limpiar anchors antiguos
**Archivo:** `modules/expo-arkit/ios/ExpoARKitView.swift`
**Descripción:** Función para remover anchors y modelos previos

**Pasos:**
```swift
func removeAllAnchors() {
    // Remover todos los nodos anclados de la escena
    for (_, node) in anchoredNodes {
        node.removeFromParentNode()
    }

    // Remover anchors de la sesión
    for (_, anchor) in modelAnchors {
        sceneView.session.remove(anchor: anchor)
    }

    // Limpiar diccionarios
    anchoredNodes.removeAll()
    modelAnchors.removeAll()
    currentModelNode = nil
}
```

**Criterio de Aceptación:**
- [ ] Remueve todos los nodos de la escena
- [ ] Remueve anchors de ARSession
- [ ] Limpia diccionarios internos
- [ ] No causa crashes

**Tiempo Estimado:** 30 minutos

---

### **FASE 4: React Native Bridge**

#### ✅ Tarea 4.1: Exponer método placeModelOnTap() a React Native
**Archivo:** `modules/expo-arkit/ios/ExpoARKitModule.swift`
**Descripción:** Nuevo método para colocar modelo en próximo tap

**Pasos:**
```swift
// En ModuleDefinition
AsyncFunction("placeModelOnTap") { (viewTag: Int, path: String, scale: Double) -> Void in
    DispatchQueue.main.async { [weak self] in
        guard let view = self?.appContext?.findView(
            withTag: viewTag,
            ofType: ExpoARKitView.self
        ) else {
            print("Error: Could not find ARKit view")
            return
        }

        // Cargar modelo y esperar tap
        view.prepareModelForTapPlacement(
            path: path,
            scale: Float(scale)
        )
    }
}
```

**Criterio de Aceptación:**
- [ ] AsyncFunction declarado en module
- [ ] Llama a nueva función prepareModelForTapPlacement
- [ ] Maneja errores correctamente

**Tiempo Estimado:** 30 minutos

---

#### ✅ Tarea 4.2: Implementar prepareModelForTapPlacement en Swift
**Archivo:** `modules/expo-arkit/ios/ExpoARKitView.swift`
**Descripción:** Pre-carga modelo y espera tap para anclarlo

**Pasos:**
```swift
private var pendingModelPath: String?
private var pendingModelScale: Float = 1.0

func prepareModelForTapPlacement(path: String, scale: Float) {
    pendingModelPath = path
    pendingModelScale = scale

    // Notificar a React Native que estamos esperando tap
    onARError(["error": "Tap on a surface to place the model"])
}

// Modificar handleTap para usar modelo pendiente
@objc private func handleTap(_ sender: UITapGestureRecognizer) {
    // ... hit-test code ...

    if let modelPath = pendingModelPath {
        // Cargar y anclar modelo
        loadModel(
            path: modelPath,
            scale: pendingModelScale,
            position: [],
            anchorToLastTap: true
        )

        // Limpiar estado
        pendingModelPath = nil
        pendingModelScale = 1.0
    }
}
```

**Criterio de Aceptación:**
- [ ] Modelo se pre-carga (o guarda path)
- [ ] Tap trigger coloca modelo anclado
- [ ] Estado se limpia después de colocar
- [ ] Evento enviado a React Native

**Tiempo Estimado:** 1 hora

---

#### ✅ Tarea 4.3: Exponer método removeAllAnchors() a React Native
**Archivo:** `modules/expo-arkit/ios/ExpoARKitModule.swift`
**Descripción:** Permitir limpiar escena desde React Native

**Pasos:**
```swift
AsyncFunction("removeAllAnchors") { (viewTag: Int) -> Void in
    DispatchQueue.main.async { [weak self] in
        guard let view = self?.appContext?.findView(
            withTag: viewTag,
            ofType: ExpoARKitView.self
        ) else { return }

        view.removeAllAnchors()
    }
}
```

**Criterio de Aceptación:**
- [ ] Función expuesta a React Native
- [ ] Llama a removeAllAnchors correctamente
- [ ] No causa crashes

**Tiempo Estimado:** 15 minutos

---

#### ✅ Tarea 4.4: Crear evento onModelPlaced
**Archivo:** `modules/expo-arkit/ios/ExpoARKitView.swift` y `ExpoARKitModule.swift`
**Descripción:** Notificar a React Native cuando modelo se ancla

**Pasos:**
```swift
// ExpoARKitView.swift - agregar event dispatcher
let onModelPlaced = EventDispatcher()

// En handleTap, después de anclar modelo:
onModelPlaced([
    "success": true,
    "anchorId": anchor.identifier.uuidString,
    "position": [
        "x": Double(anchor.transform.columns.3.x),
        "y": Double(anchor.transform.columns.3.y),
        "z": Double(anchor.transform.columns.3.z)
    ]
])

// ExpoARKitModule.swift - registrar evento
Events(
    // ... eventos existentes ...
    "onModelPlaced"
)
```

**Criterio de Aceptación:**
- [ ] Evento onModelPlaced definido
- [ ] Emite datos del anchor (ID, posición)
- [ ] React Native puede recibir evento

**Tiempo Estimado:** 30 minutos

---

#### ✅ Tarea 4.5: Actualizar tipos TypeScript
**Archivo:** `modules/expo-arkit/src/ARKitView.tsx` o `src/ui/ar/components/ARKitView.tsx`
**Descripción:** Agregar tipos para nuevos métodos y eventos

**Pasos:**
```typescript
// Agregar a ARKitViewProps
export interface ARKitViewProps extends ViewProps {
    // ... props existentes ...
    onModelPlaced?: (event: {
        nativeEvent: {
            success: boolean;
            anchorId: string;
            position: { x: number; y: number; z: number };
        };
    }) => void;
}

// Agregar a ARKitViewRef
export interface ARKitViewRef {
    // ... métodos existentes ...
    placeModelOnTap: (path: string, scale?: number) => void;
    removeAllAnchors: () => void;
}
```

**Criterio de Aceptación:**
- [ ] Tipos TypeScript correctos
- [ ] Autocomplete funciona en editor
- [ ] No hay errores de tipo

**Tiempo Estimado:** 30 minutos

---

#### ✅ Tarea 4.6: Implementar métodos imperativos en ARKitView
**Archivo:** `src/ui/ar/components/ARKitView.tsx`
**Descripción:** Exponer placeModelOnTap y removeAllAnchors a React

**Pasos:**
```typescript
useImperativeHandle(ref, () => ({
    // ... métodos existentes ...

    placeModelOnTap: (path: string, scale: number = 1) => {
        const viewTag = findNodeHandle(nativeRef.current);
        if (viewTag) {
            ExpoARKitModule.placeModelOnTap(viewTag, path, scale);
        }
    },

    removeAllAnchors: () => {
        const viewTag = findNodeHandle(nativeRef.current);
        if (viewTag) {
            ExpoARKitModule.removeAllAnchors(viewTag);
        }
    }
}));
```

**Criterio de Aceptación:**
- [ ] Métodos disponibles vía ref
- [ ] Pasan viewTag correctamente
- [ ] TypeScript no muestra errores

**Tiempo Estimado:** 30 minutos

---

### **FASE 5: UI y UX**

#### ✅ Tarea 5.1: Actualizar ARTestScreen con modo tap-to-place
**Archivo:** `src/ui/screens/ARTestScreen.tsx`
**Descripción:** UI para activar modo tap-to-place

**Pasos:**
```typescript
const [placementMode, setPlacementMode] = useState<'camera' | 'tap'>('camera');

const handleLoadModelTapMode = async () => {
    // ... código de file picker existente ...

    if (placementMode === 'tap') {
        // Modo tap-to-place
        arViewRef.current.placeModelOnTap(file.uri, 1);
        setStatusMessage('Tap on a surface to place the model');
    } else {
        // Modo frente a cámara (existente)
        arViewRef.current.loadModel(file.uri, 1, [0, 0, -1]);
    }
};
```

**Criterio de Aceptación:**
- [ ] Toggle para cambiar entre modos
- [ ] Modo tap muestra instrucción clara
- [ ] Modo camera funciona como antes

**Tiempo Estimado:** 1 hora

---

#### ✅ Tarea 5.2: Agregar botón "Clear Models"
**Archivo:** `src/ui/screens/ARTestScreen.tsx`
**Descripción:** Botón para limpiar todos los modelos anclados

**Pasos:**
```typescript
const handleClearModels = () => {
    if (arViewRef.current) {
        arViewRef.current.removeAllAnchors();
        Alert.alert('Models Cleared', 'All anchored models removed');
        setPlaneCount(0); // Reset counter
    }
};

// En JSX:
<TouchableOpacity
    style={[styles.button, styles.buttonDanger]}
    onPress={handleClearModels}
    disabled={!isARReady}
>
    <Text style={styles.buttonText}>Clear All Models</Text>
</TouchableOpacity>
```

**Criterio de Aceptación:**
- [ ] Botón visible y funcional
- [ ] Llama a removeAllAnchors
- [ ] Muestra confirmación al usuario

**Tiempo Estimado:** 30 minutos

---

#### ✅ Tarea 5.3: Implementar handler onModelPlaced
**Archivo:** `src/ui/screens/ARTestScreen.tsx`
**Descripción:** Mostrar feedback cuando modelo se ancla

**Pasos:**
```typescript
const handleModelPlaced = (event: {
    nativeEvent: {
        success: boolean;
        anchorId: string;
        position: { x: number; y: number; z: number };
    }
}) => {
    const { success, anchorId, position } = event.nativeEvent;

    if (success) {
        setStatusMessage(
            `Model placed at (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`
        );
        Alert.alert('Success', 'Model anchored to surface!');
    }
};

// En ARKitView component:
<ARKitView
    // ... props existentes ...
    onModelPlaced={handleModelPlaced}
/>
```

**Criterio de Aceptación:**
- [ ] Evento recibido correctamente
- [ ] Status message actualizado
- [ ] Alert muestra confirmación

**Tiempo Estimado:** 30 minutos

---

#### ✅ Tarea 5.4: Agregar indicador visual de "tap mode activo"
**Archivo:** `src/ui/screens/ARTestScreen.tsx`
**Descripción:** UI que indica que app está esperando tap

**Pasos:**
```typescript
const [waitingForTap, setWaitingForTap] = useState(false);

// Actualizar cuando se activa tap mode
const handleLoadModelTapMode = async () => {
    // ... código existente ...

    if (placementMode === 'tap') {
        setWaitingForTap(true);
        arViewRef.current.placeModelOnTap(file.uri, 1);
    }
};

// Limpiar cuando modelo se coloca
const handleModelPlaced = (event) => {
    setWaitingForTap(false);
    // ... resto del código ...
};

// En JSX, agregar overlay:
{waitingForTap && (
    <View style={styles.tapIndicator}>
        <Text style={styles.tapIndicatorText}>
            👆 Tap on a surface to place the model
        </Text>
    </View>
)}
```

**Criterio de Aceptación:**
- [ ] Indicador aparece cuando esperando tap
- [ ] Desaparece cuando modelo se coloca
- [ ] Estilo claro y visible

**Tiempo Estimado:** 45 minutos

---

### **FASE 6: Testing y Refinamiento**

#### ✅ Tarea 6.1: Testing básico en dispositivo
**Requisitos:** iPhone con LiDAR, iOS 16+
**Descripción:** Validar funcionalidad básica

**Casos de Prueba:**
- [ ] Detecta tap en plano horizontal (piso)
- [ ] Detecta tap en plano vertical (pared)
- [ ] Modelo se ancla correctamente
- [ ] Modelo permanece fijo al caminar
- [ ] Múltiples modelos pueden anclarse
- [ ] Clear models funciona correctamente
- [ ] No hay crashes

**Tiempo Estimado:** 2 horas

---

#### ✅ Tarea 6.2: Testing de edge cases
**Descripción:** Validar comportamientos límite

**Casos de Prueba:**
- [ ] Tap en punto sin plano (debe mostrar error)
- [ ] Tap rápido múltiple (no debe duplicar modelos)
- [ ] Cargar modelo sin detectar planos primero
- [ ] Cambiar de modo camera → tap → camera
- [ ] Tracking loss y recovery (modelo debe mantenerse)
- [ ] Reiniciar AR session (anchors deben limpiarse)

**Tiempo Estimado:** 2 horas

---

#### ✅ Tarea 6.3: Optimización de performance
**Descripción:** Verificar que no hay impacto significativo en FPS

**Métricas:**
- [ ] FPS se mantiene >30 con 1 modelo anclado
- [ ] FPS se mantiene >30 con 5 modelos anclados
- [ ] No hay memory leaks (usar Instruments)
- [ ] Hit-test response time <50ms

**Tiempo Estimado:** 1 hora

---

#### ✅ Tarea 6.4: Refinamiento de UX
**Descripción:** Mejoras basadas en testing

**Posibles Mejoras:**
- [ ] Haptic feedback al colocar modelo
- [ ] Animación al anclar modelo (fade in)
- [ ] Preview del modelo antes de anclar (opcional)
- [ ] Indicador visual en el punto de tap
- [ ] Mejores mensajes de error

**Tiempo Estimado:** 2 horas

---

#### ✅ Tarea 6.5: Actualizar documentación
**Archivos:**
- `docs/CURRENT_STATE.md`
- `docs/ARKIT_IMPLEMENTATION.md`
- `README.md`

**Contenido:**
- [ ] Documentar tap-to-place feature
- [ ] Actualizar porcentaje de progreso (de 32% a ~40%)
- [ ] Agregar screenshots/GIFs de tap-to-place
- [ ] Documentar API de nuevos métodos
- [ ] Actualizar roadmap

**Tiempo Estimado:** 1 hora

---

## 📊 Resumen de Tiempo Estimado

| Fase | Tareas | Tiempo Total |
|------|--------|--------------|
| Fase 1: Tap Gesture | 2 tareas | 1 hora |
| Fase 2: Hit-Testing | 2 tareas | 1.5 horas |
| Fase 3: Anchor Management | 5 tareas | 3.5 horas |
| Fase 4: React Native Bridge | 6 tareas | 3.5 horas |
| Fase 5: UI y UX | 4 tareas | 3 horas |
| Fase 6: Testing | 5 tareas | 8 horas |
| **TOTAL** | **24 tareas** | **~20 horas** |

**Duración calendario:** 3-5 días (dependiendo de dedicación diaria)

---

## ✅ Criterios de Éxito del Feature

Al finalizar esta implementación, deberías poder:

1. ✅ Cargar un modelo USDZ desde file picker
2. ✅ Tocar un plano detectado (piso, pared, mesa)
3. ✅ Ver el modelo aparecer anclado en ese punto
4. ✅ Caminar alrededor del modelo (permanece fijo)
5. ✅ Colocar múltiples modelos en diferentes puntos
6. ✅ Limpiar todos los modelos con un botón
7. ✅ Recibir feedback visual claro en cada paso

---

## 🎯 Impacto en Visión del POC

```
ANTES (32%)                    DESPUÉS (40%)
═══════════════                ════════════════

Modelo flota                   Modelo anclado
frente a cámara               precisamente en
                              espacio real

❌ No se alinea                ✅ Alineación perfecta
❌ Se mueve al caminar         ✅ Permanece fijo
❌ No es realista              ✅ Más inmersivo
```

Este feature es **el building block crítico** para después implementar:
- Alineación automática de modelos arquitectónicos grandes
- Occlusion rendering (reemplazo de realidad)
- Navegación inmersiva dentro del diseño

---

## 📝 Notas Adicionales

### Debugging Tips
- Usar `print()` statements en Swift para rastrear hit-tests
- Verificar `anchor.transform` values en console
- Usar Xcode View Debugger para ver jerarquía de SCNNodes

### Posibles Problemas
- **Hit-test no detecta planos:** Asegurarse que hay suficientes planos detectados antes de tap
- **Modelo aparece en lugar incorrecto:** Verificar que `worldTransform` se aplica correctamente
- **Modelo se mueve:** Verificar que `didUpdate anchors` está funcionando

### Optimizaciones Futuras
- Caching de modelos USDZ cargados
- Serialización de anchors para persistencia entre sesiones
- Múltiples anchors por modelo (para modelos grandes)

---

**Última actualización:** 2025-12-11
**Autor:** Claude Code + Kevin Parra
**Estado:** READY TO IMPLEMENT
