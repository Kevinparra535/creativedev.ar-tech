# ARKit: Configuration Objects (Guía práctica)

**Objetivo:** Tener un “mapa mental” de las configuraciones de ARKit y cómo elegirlas/ajustarlas para mejorar este POC.

Fuente: Apple Docs (Configuration Objects).

---

## Idea central

Las configuraciones definen **cómo ARKit corre una `ARSession`**.

- `ARWorldTrackingConfiguration` es la más completa para cámara trasera, pero cada feature extra consume energía/cómputo.
- Si una config más simple cubre tu caso, úsala: ganas performance, estabilidad y batería.

---

## Config base (ARConfiguration)

`ARConfiguration` es la base común. Conceptos clave:

- `frameSemantics`: habilita “subfeatures” que afectan cada frame (cuando el device lo soporta).
- `supportsFrameSemantics(_:)`: siempre chequear soporte antes de activar.

### Frame semantics (selección de features de frame)

Algunos ejemplos mencionados:

- `bodyDetection`: tracking 2D del cuerpo.
- `personSegmentation`: segmentación de personas (occlusion).
- `personSegmentationWithDepth`: occlusion basada en profundidad (cuando la gente está más cerca que el contenido virtual).

Recomendación (Apple):

- No actives people occlusion si no lo necesitas (impacta responsividad).

---

## Cambiar configuración “en caliente”

Puedes alternar features como:

- plane detection
- frame semantics
- environment texturing

…cambiando la configuración y llamando `session.run(config)` sobre la misma sesión.

ARKit intenta mantener estado (anchors y entendimiento del entorno) al cambiar, **pero**:

- Si alternas entre configs de **face tracking** y **world tracking**, la sesión no mantiene state.

Tip de Apple:

- Para eventos térmicos/low power, puedes degradar temporalmente a una config menos costosa (p.ej. `ARPositionalTrackingConfiguration`) si tu app puede funcionar en modo limitado.

---

## Calidad de video / captura (iOS 16+)

Apple menciona opciones para mejorar video/captura:

- 4K y HDR:
  - `recommendedVideoFormatFor4KResolution`
  - `videoFormat = ...`
  - `videoHDRAllowed = true`

- High-resolution still frames:
  - `recommendedVideoFormatForHighResolutionFrameCapturing`
  - `ARSession.captureHighResolutionFrame(completion:)`

- Captura custom:
  - `configurableCaptureDeviceForPrimaryCamera` (si el dispositivo lo soporta) para ajustar settings via AVFoundation.

---

## Catálogo de configuraciones (qué elegir)

### Spatial tracking (cámara trasera)

- `ARWorldTrackingConfiguration`: tracking completo 6DOF + features (planos, raycast, etc.).
- `ARGeoTrackingConfiguration`: tracking geográfico (GPS + mapas + brújula).
- `AROrientationTrackingConfiguration`: solo orientación (no traslación).
- `ARPositionalTrackingConfiguration`: solo posición (capacidad limitada vs world tracking).

### Body & face tracking

- `ARBodyTrackingConfiguration`: tracking de pose + puede detectar planos/imágenes (cámara trasera).
- `ARFaceTrackingConfiguration`: tracking facial (cámara frontal).

### Image recognition

- `ARImageTrackingConfiguration`: tracking de imágenes conocidas.

### Object detection / scanning

- `ARObjectScanningConfiguration`: reconoce objetos y captura data “high fidelity” sobre objetos específicos.

---

## Cómo aplica a ESTE POC (decisiones recomendadas)

### 1) Para “entrar a AR” (colocar modelo y moverse)

Usar:

- `ARWorldTrackingConfiguration`
  - `planeDetection`: horizontales (y verticales si lo necesitas)
  - `environmentTexturing`: automático

### 2) Para el Wall Anchor System

- Scanning de pared real: `ARWorldTrackingConfiguration` con `planeDetection = [.vertical]` (o vertical + raycast).
- Alineación: depende de datos consistentes entre:
  - pared virtual (espacio local del modelo)
  - pared real (espacio world AR)
  - transform aplicado al modelo

### 3) Para estabilidad y performance

- Activar features “caras” solo si realmente se usan:
  - scene reconstruction mesh
  - people occlusion
  - 4K/HDR

---

## Checklist práctico para mejorar el POC

- [ ] Elegir config mínima por pantalla (world tracking vs scanning vs alignment).
- [ ] Chequear soporte antes de activar `frameSemantics` y scene reconstruction.
- [ ] Si hay thermal/low power: degradar temporalmente la config.
- [ ] No activar people occlusion si no hay gente.
- [ ] Si el “tap to place” falla al inicio: permitir fallback a `estimatedPlane` y usar coaching overlay.
