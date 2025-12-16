# POC AR Interior Alignment — Spec v0.2

## North Star del POC

**Alineación 1:1 repetible:** un arquitecto puede escanear una pared real y alinear un interior virtual (USDZ) para que encaje en el espacio con estabilidad, estilo iOS nativo, en iPhone con LiDAR.

## Hipótesis a validar

1. Con una pared real + una pared virtual, se puede calcular una transformación suficientemente estable para interiores (no solo “poner un objeto”).
2. Con coaching estilo Apple (scan → quality gates → place), el usuario logra alineación en <2 min sin frustración.
3. ARKit en LiDAR mantiene tracking estable para caminar alrededor sin drift evidente en una demo.

---

# Flujo end-to-end con estados nativos

## Estado A — Preview (SceneKit)

**Objetivo:** elegir referencia “pared virtual” dentro del modelo.

- UI: orbit/zoom, selector de pared (tap highlight), “Set as Reference Wall”.
- Output: `VirtualReferenceWall` (plano o segmento + normal + up) en coordenadas del modelo.

**Quality gate:** no dejas avanzar si no hay pared seleccionada.

## Estado B — Scan (ARKit)

**Objetivo:** encontrar una “pared real” con tracking estable.

- Config: `ARWorldTrackingConfiguration`
  - `planeDetection`: `.vertical` (y opcional `.horizontal` si ayudas placement)
  - `sceneReconstruction`: `.mesh` (si el device lo soporta) para robustez
- UI: coaching overlay tipo Apple:
  - “Move iPhone slowly”
  - “Find a wall”
  - Indicador de tracking: normal/limited + reason

**Quality gate:** habilitas “Lock Wall” solo cuando:

- hay `ARPlaneAnchor` vertical con área mínima (ej. > 0.8m²)
- tracking == `.normal` por X segundos (ej. 1–2s)
- (opcional) estabilidad del plano: cambio de transform bajo un umbral durante 0.5s

## Estado C — Lock + Align

**Objetivo:** “congelar” la pared real como referencia y calcular transformación.

- El usuario toca “Lock this wall” o tap en la pared.
- Capturas `RealReferenceWall`:
  - transform del `ARPlaneAnchor` (posición + orientación)
  - normal del plano
  - (opcional) extensión/centro del anchor para punto de referencia

## Estado D — Place (tap-to-place)

**Objetivo:** colocar el modelo con una transformación inicial y luego aplicar alineación.

- Usuario toca un punto del plano horizontal (si lo usas) o directamente “Place at wall”.
- Calculas la transformación final y la aplicas al root node del USDZ.

## Estado E — Validate (walkaround)

**Objetivo:** probar estabilidad, coherencia de escala y ausencia de saltos.

- UI: toggle “Show alignment aids”
  - líneas guía, bounding box, ejes, outline de pared virtual
- Botón “Reset alignment” y “Re-scan wall” sin crash.

---

# Contrato del motor de alineación

## Entradas

- `virtualWall`: plano/segmento en model space
  - `p_v`: punto en plano (Vector3)
  - `n_v`: normal del plano (Vector3, normalizada)
  - `up_v`: (Vector3, normalmente +Y del modelo)
- `realWall`: plano detectado en world space (ARKit)
  - `T_w`: transform del anchor (4x4)
  - `n_w`: normal del plano en world
  - `up_w`: world up (ARKit: +Y)

## Salida

- `T_modelToWorld`: matriz 4x4 que transformará el modelo para que:
  - la normal de la pared virtual coincida con la normal de la pared real (rotación)
  - el modelo quede ubicado en el punto correcto (traslación)
  - (opcional) ajuste de yaw únicamente para mantener “upright” estable

## Regla práctica recomendada (interiores)

Para evitar rotaciones raras (roll/pitch), alinear solo yaw alrededor de `up_w`:

1. Proyectar `n_v` y `n_w` al plano horizontal (y=0)
2. Calcular el ángulo entre esas proyecciones
3. Rotar el modelo en yaw para que la pared mire en la dirección correcta
4. Trasladar el modelo para que el punto de referencia de la pared virtual caiga sobre el centro de la pared real (o el hit-test point)

---

# Criterios de éxito (medibles)

## Alineación

- Error lateral (desplazamiento) perceptible < ~5–10 cm a 2–3 m de distancia.
- Error angular < ~2–3° (paredes no “cruzadas” a simple vista).

## Estabilidad

- En walkaround de 30–60s:
  - sin “saltos” grandes del modelo
  - drift tolerable (pequeño) pero no rompe la ilusión

## UX nativo iOS

- Nunca hay un tap que “no hace nada”:
  - si no hay plano: mensaje “Find a wall / Improve lighting”
  - si tracking limited: reason explícito
- Siempre hay CTA claro: Scan → Lock → Place → Validate.

## Robustez

- Cambiar entre estados no crashea:
  - preview → scan → align → reset → scan again
- Manejo seguro de sesión AR (pause/resume) y de assets (USDZ load).

---

# Riesgos y mitigaciones

1) Plano vertical inestable / cambia con el tiempo


- Mitigación: “Lock wall” solo con estabilidad mínima + tracking normal.
- Mitigación 2: una vez locked, usas esa transform congelada.


2) Ambigüedad con una sola pared

- Mitigación: UI para “flip” (invertir normal) si el modelo queda al revés.
- Futuro: segunda referencia (esquina o punto).


3) Escala del USDZ


- Mitigación: verificación automática: medir bounding box y mostrar escala estimada; si es absurda, warn.

4) Experiencia “no Apple”

- Mitigación: replicar patrón: coaching overlay + quality gates + feedback continuo.

---

# Recomendación mínima para v0.3

- Overlay de depuración (toggle): ejes del mundo, normal pared real (flecha), normal pared virtual (flecha), error angular en grados.
- Registro de sesión (solo local): tracking timeline, tiempo para detectar pared, número de resets.
- Botón “Flip orientation” por si el normal queda invertido.
