# ARKit: ARWorldTrackingConfiguration (Guía práctica)

**Objetivo:** Tener a mano qué es `ARWorldTrackingConfiguration`, qué habilita, y cómo usarlo consistentemente en este proyecto.

---

## Qué es

`ARWorldTrackingConfiguration` es la configuración de ARKit para experiencias AR “completas” con tracking de **6DOF** (rotación + traslación). Es lo que permite que un objeto virtual se mantenga estable en el mundo real mientras el usuario camina y mueve el iPhone.

---

## Qué habilita (bloques principales)

### 1) Tracking del mundo (6DOF)

- Mantiene la posición y orientación del dispositivo respecto al entorno.
- Es la base para anchors estables.

### 2) Detección de superficies (planos)

- `planeDetection`: permite detectar planos **horizontales** y/o **verticales**.
- ARKit agrega resultados como `ARPlaneAnchor`.

Uso típico en este repo:

- Tap-to-place en **horizontales** (ARTestScreen / flujo general).
- “Reference wall scanning” en **verticales** (Wall Anchor System).
- Wall Anchor System: el paso de alineación no requiere tap al piso (auto-load + auto-align).

### 3) Raycasting (tap → punto 3D)

- Permite obtener posiciones 3D del mundo desde un toque.
- Recomendación práctica: intentar primero contra planos existentes, y si aún no hay, permitir estimados (mejor UX de primer placement).

### 4) Texturizado/iluminación del entorno

- `environmentTexturing`: ayuda a reflejos/iluminación más realista.
- `wantsHDREnvironmentTextures`: mejora calidad (coste performance/memoria).

### 5) Scene Reconstruction (si el hardware lo soporta)

- `sceneReconstruction` + `supportsSceneReconstruction(...)`.
- Útil para mesh del entorno / oclusión / spatial mapping.

### 6) Reconocimiento de imágenes y objetos

- `detectionImages`, `maximumNumberOfTrackedImages`, `automaticImageScaleEstimationEnabled`.
- `detectionObjects` (objetos 3D “reference objects”).

### 7) Cámara

- `isAutoFocusEnabled`.

### 8) Multiusuario (colaboración)

- `isCollaborationEnabled`.

### 9) Reanudar estado previo

- `initialWorldMap`: intentar reanudar una sesión previa.

---

## Config recomendada para este proyecto (POC)

### Caso A: AR general + tap-to-place + walls

- `planeDetection = [.horizontal, .vertical]`
- `environmentTexturing = .automatic`
- `isAutoFocusEnabled = true` (default recomendado)
- `sceneReconstruction = .mesh` **solo si** el device lo soporta y lo necesitamos

Notas:

- **Para placement inicial** suele ser mejor permitir raycast a `.estimatedPlane` si aún no hay `existingPlaneGeometry`.
- Para “pared de referencia”, filtrar solo planos verticales en la vista de scanning.

---

## UX nativa recomendada (lo que siente el usuario)

Para parecerse al flujo “AR nativo”:

- Mostrar guía al usuario (coaching overlay) para que ARKit tenga suficiente información antes del tap.
- Mensajes tipo: “Apunta al suelo y mueve el dispositivo” → “Toca el suelo para colocar”.

En iOS esto se logra con `ARCoachingOverlayView` (iOS 13+).

---

## Ejemplo Swift (patrón)

> Este ejemplo es el patrón base. En este repo, la implementación vive dentro del módulo nativo (Expo module).

```swift
let config = ARWorldTrackingConfiguration()
config.planeDetection = [.horizontal, .vertical]
config.environmentTexturing = .automatic

// Opcional: scene reconstruction (si hay soporte)
if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
  config.sceneReconstruction = .mesh
}

sceneView.session.run(config)

if #available(iOS 13.0, *) {
  let overlay = ARCoachingOverlayView()
  overlay.session = sceneView.session
  overlay.goal = .horizontalPlane
  overlay.activatesAutomatically = true
  // constraints para ocupar toda la vista
}
```

---

## Buenas prácticas / pitfalls

- **Checks de soporte:** no asumas features avanzadas (mesh/people occlusion/etc.). Usa los `supports...` antes de habilitar.
- **Primer placement:** si requieres estrictamente `existingPlaneGeometry`, el usuario puede sentir que “no funciona”. Mejor fallback a `estimatedPlane`.
- **Threading:** callbacks/delegates pueden llegar fuera de main; cualquier mutación de UI/SceneKit debe hacerse en main.
- **Consistencia de espacios:** si calculas transforms usando datos del modelo, asegúrate de que la pared virtual se mida en el mismo espacio que el modelo al que le aplicarás la matriz (model-local vs preview-scaled vs world).

---

## Referencia

- Apple Docs: `ARWorldTrackingConfiguration`
