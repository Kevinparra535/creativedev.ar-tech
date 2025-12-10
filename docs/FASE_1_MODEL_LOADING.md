# FASE 1: MODEL LOADING & ALIGNMENT

**Estado:** ⏳ PENDIENTE  
**Rama:** `feature/model-loading` (por crear)  
**Última actualización:** 2025-12-09  
**Dependencias:** Fase 0 completada ✅

---

## 🎯 Objetivo de Fase 1

Implementar el sistema de carga y alineación de modelos 3D para que arquitectos puedan:

1. ⏳ Cargar modelos 3D de diseños (USDZ/glTF)
2. ⏳ Visualizar modelos en preview
3. ⏳ Alinear modelos con escaneos de RoomPlan
4. ⏳ Ajustar transformaciones (escala, rotación, posición)
5. ⏳ Guardar configuraciones de alineación

---

## 📋 Tareas Desglosadas

### Tarea 1: Model Upload System (Semana 1)

**Objetivo:** Permitir a usuarios seleccionar y cargar archivos 3D desde su dispositivo.

#### Subtareas

- [ ] **1.1 Instalar dependencias**


  ```bash
  npx expo install expo-document-picker expo-file-system
  ```

- [ ] **1.2 Crear ModelLibraryScreen**
  - Archivo: `src/ui/screens/ModelLibraryScreen.tsx`
  - Lista de modelos cargados
  - Botón "Agregar modelo"
  - Cards con preview/nombre de cada modelo
  - Opciones: Ver, Editar, Eliminar

- [ ] **1.3 Crear ModelPicker component**
  - Archivo: `src/ui/components/ModelPicker.tsx`
  - Integrar `expo-document-picker`
  - Filtrar por extensiones: `.usdz`, `.glb`, `.gltf`
  - Validar tamaño de archivo (< 50MB recomendado)
  - Copiar archivo a directorio de la app

- [ ] **1.4 Crear useModelStorage hook**
  - Archivo: `src/ui/ar/hooks/useModelStorage.ts`
  - Funciones: `saveModel()`, `loadModels()`, `deleteModel()`
  - Usar `expo-file-system` para persistencia
  - Metadata: `{ id, name, path, format, size, uploadDate }`

- [ ] **1.5 Validación de modelos**
  - Verificar formato válido
  - Verificar integridad del archivo
  - Extraer dimensiones (si es posible)
  - Error handling con mensajes claros

**Entregable:** Usuario puede seleccionar archivos 3D y verlos en lista.

---

### Tarea 2: Model Viewer Component (Semana 1-2)

**Objetivo:** Renderizar modelos 3D en una vista previa interactiva.

#### Subtareas

- [ ] **2.1 Crear ModelViewer component**
  - Archivo: `src/ui/ar/components/ModelViewer.tsx`
  - Usar `@react-three/fiber` con `expo-gl`
  - Props: `modelPath`, `scale`, `rotation`, `position`
  - Canvas con cámara perspective

- [ ] **2.2 Implementar USDZ loader**
  - Investigar: SceneKit bridge vs conversión a glTF
  - Opción A: Módulo nativo Swift para USDZ → Three.js
  - Opción B: Pre-convertir USDZ a glTF en server/local
  - Cargar geometría y texturas

- [ ] **2.3 Implementar glTF loader**
  - Usar `GLTFLoader` de Three.js
  - Parsear `.glb` y `.gltf`
  - Manejar texturas embebidas y externas

- [ ] **2.4 Controles de cámara**
  - Orbit controls (rotate around model)
  - Pinch to zoom
  - Pan con 2 dedos
  - Reset camera button

- [ ] **2.5 Iluminación básica**
  - Ambient light (0.6 intensity)
  - Directional light (0.8 intensity)
  - Opcional: Environment map para reflections

**Entregable:** Modelo 3D renderizado con controles de navegación funcionales.

---

### Tarea 3: Alignment System (Semana 2-3)

**Objetivo:** Alinear modelo 3D con escaneo de RoomPlan.

#### Subtareas

- [ ] **3.1 Crear AlignmentScreen**
  - Archivo: `src/ui/screens/AlignmentScreen.tsx`
  - Split view: Escaneo RoomPlan | Modelo 3D
  - Modo toggle: Side-by-side | Overlay
  - Navegación desde RoomPlanTestScreen

- [ ] **3.2 Cargar escaneo USDZ de RoomPlan**
  - Leer archivo USDZ exportado por `expo-roomplan`
  - Renderizar geometría del escaneo (paredes, piso, objetos)
  - Color semitransparente para diferenciar

- [ ] **3.3 Sistema de transformación manual**
  - **Scale controls:**
    - Sliders X, Y, Z (0.1x - 10x)
    - Lock uniform scale checkbox
  - **Rotation controls:**
    - Sliders Yaw, Pitch, Roll (-180° a 180°)
    - Snap to 15° intervals option
  - **Position controls:**
    - Sliders X, Y, Z offset
    - Joystick 2D para X-Z plane
  - Reset button para cada transformación

- [ ] **3.4 Visualización de alineación**
  - Overlay mode: Modelo superpuesto a escaneo
  - Wireframe toggle para ver ambos meshes
  - Grid helper para referencia de escala
  - Axes helper para orientación

- [ ] **3.5 Matching automático (opcional)**
  - Algoritmo básico: Comparar bounding boxes
  - Auto-scale basado en dimensiones de habitación
  - Sugerencias de posición inicial
  - Usuario puede aceptar o ajustar manualmente

- [ ] **3.6 Guardar configuración de alineación**
  - Metadata: `{ modelId, scanId, scale, rotation, position, timestamp }`
  - Usar AsyncStorage o JSON local
  - Asociar modelo + escaneo como "proyecto"

**Entregable:** Usuario puede alinear modelo 3D con escaneo y guardar configuración.

---

### Tarea 4: Integration & Polish (Semana 3)

**Objetivo:** Integrar todas las piezas y pulir la experiencia.

#### Subtareas

- [ ] **4.1 Flujo completo de navegación**
  - HomeScreen → ModelLibraryScreen → Seleccionar modelo
  - ModelLibraryScreen → RoomPlanTestScreen → Seleccionar escaneo
  - RoomPlanTestScreen → AlignmentScreen → Alinear
  - Guardar "proyecto" con modelo + escaneo + transformación

- [ ] **4.2 Crear ProjectsScreen (opcional)**
  - Lista de proyectos guardados
  - Preview: Thumbnail de modelo + nombre de escaneo
  - Opciones: Editar alineación, Ver en AR (Fase 2), Eliminar

- [ ] **4.3 Estados de carga y errores**
  - Loading spinner al cargar modelos pesados
  - Error handling: Archivo corrupto, formato no soportado
  - Mensajes de usuario amigables
  - Fallback UI para casos edge

- [ ] **4.4 Optimización de performance**
  - Lazy loading de modelos
  - LOD (Level of Detail) para modelos complejos
  - Cache de geometría parseada
  - Liberar memoria al desmontar componentes

- [ ] **4.5 Testing en dispositivo real**
  - Probar con modelos de diferentes tamaños
  - Validar performance en iPhone 14 Pro Max
  - Verificar persistencia de datos
  - Testear flujo completo end-to-end

**Entregable:** Sistema completo de carga y alineación funcionando de punta a punta.

---

## 🛠 Stack Técnico

### Nuevas Dependencias

```json
{
  "expo-document-picker": "^12.0.2",
  "expo-file-system": "^18.0.11",
  "@react-three/fiber": "^8.17.10",
  "three": "^0.166.0"
}
```

### Estructura de Archivos

```
src/ui/
├── screens/
│   ├── ModelLibraryScreen.tsx      # Lista de modelos cargados
│   ├── AlignmentScreen.tsx         # Alineación modelo + escaneo
│   └── ProjectsScreen.tsx          # Proyectos guardados (opcional)
│
├── components/
│   ├── ModelPicker.tsx             # File picker para 3D files
│   └── ModelCard.tsx               # Card con info de modelo
│
├── ar/
│   ├── components/
│   │   ├── ModelViewer.tsx         # Renderizado 3D con Three.js
│   │   ├── TransformControls.tsx   # Sliders de transformación
│   │   └── AlignmentOverlay.tsx    # Vista overlay de alineación
│   │
│   ├── hooks/
│   │   ├── useModelStorage.ts      # CRUD de modelos
│   │   ├── useModelLoader.ts       # Cargar/parsear 3D files
│   │   └── useAlignment.ts         # State de transformación
│   │
│   └── utils/
│       ├── modelParsers.ts         # USDZ/glTF parsers
│       └── alignmentHelpers.ts     # Cálculos de matching
│
└── navigation/
    └── TabNavigator.tsx            # Agregar tab ModelLibrary
```

---

## 📊 Métricas Esperadas

| Métrica | Objetivo |
|---------|----------|
| **Archivos Nuevos** | ~15 archivos TypeScript/TSX |
| **Líneas de Código** | ~2000-2500 líneas |
| **Dependencias Agregadas** | 2 (expo-document-picker, expo-file-system) |
| **Complejidad** | Media-Alta |
| **Tiempo de Desarrollo** | 2-3 semanas |
| **Performance Target** | < 3s para cargar modelo de 10MB |

---

## 🚨 Decisiones Técnicas Críticas

### 1. Formato de Modelos 3D


**Opción A: USDZ primario**

- ✅ Nativo de iOS, integración directa con RoomPlan
- ✅ Mejor performance en iOS
- ❌ Requiere bridge nativo Swift o conversión
- ❌ No cross-platform


**Opción B: glTF primario**

- ✅ Standard web, Three.js nativo
- ✅ Cross-platform (iOS, Android, Web)
- ✅ Más fácil de implementar
- ❌ Requiere conversión desde USDZ de RoomPlan para overlay

**Decisión recomendada:** Soportar ambos, priorizar **glTF** para desarrollo rápido, agregar USDZ después si es necesario.

---


### 2. Almacenamiento de Modelos

**Opción A: Local file system**

- ✅ Funciona offline
- ✅ No requiere backend

- ❌ Limitado a un dispositivo
- ❌ Sin backup automático

**Opción B: Cloud storage**

- ✅ Compartir entre dispositivos
- ✅ Backup automático
- ❌ Requiere internet
- ❌ Costos de infraestructura

**Decisión recomendada:** **Local** para POC (Fase 1), migrar a cloud en Fase 3-4.


---

### 3. Alineación Automática vs Manual

**Opción A: Solo manual**


- ✅ Control total del usuario
- ✅ Más simple de implementar
- ❌ Puede ser tedioso

**Opción B: Automática + manual override**

- ✅ UX más rápido
- ✅ Usuario ajusta si no es perfecto
- ❌ Algoritmo de matching complejo

**Decisión recomendada:** **Manual** primero (Fase 1), agregar auto-matching en Fase 3 si hay tiempo.

---

## 🎓 Lecciones de Fase 0 Aplicadas

1. **Priorizar librerías oficiales:** Usar `expo-document-picker` en vez de custom native module
2. **Simplicidad sobre control:** Empezar con glTF (más simple) antes que USDZ
3. **Iterar rápido:** MVP funcional antes de optimizaciones prematuras
4. **Testing en real device:** Probar con modelos reales desde día 1

---

## 🔗 Flujo de Usuario Esperado

```
1. Usuario abre ModelLibraryScreen
2. Tap "Agregar Modelo" → ModelPicker
3. Selecciona archivo .glb desde Files app
4. Modelo se carga y aparece en lista
5. Tap en modelo → ModelViewer preview
6. Tap "Alinear con escaneo"
7. Selecciona escaneo de RoomPlanTestScreen
8. AlignmentScreen muestra escaneo + modelo
9. Ajusta scale/rotation/position con sliders
10. Tap "Guardar alineación"
11. Proyecto guardado (listo para Fase 2: AR visualization)
```

---

## ✅ Criterios de Éxito

- [ ] Usuario puede cargar archivos glTF/GLB desde Files app
- [ ] Modelos se renderizan correctamente en ModelViewer
- [ ] Controles de cámara (orbit, zoom, pan) funcionan fluidos
- [ ] Usuario puede ajustar transformaciones con sliders
- [ ] Modelo se superpone visualmente al escaneo en AlignmentScreen
- [ ] Configuración de alineación se guarda y persiste
- [ ] Performance: < 3s para cargar modelo de 10MB
- [ ] Cero crashes al cargar modelos válidos

- [ ] Error handling claro para formatos no soportados

---

## 🚀 Próximos Pasos (Post Fase 1)


**Fase 2: AR Visualization**

- Renderizar modelo alineado en AR con ARKit
- Occlusion usando depth buffer
- 6DOF tracking continuo
- Navegación dentro del modelo

**Fase 3: Professional Features**

- Cambio de materiales en tiempo real

- Sistema de mediciones
- Screenshots y video capture
- Comparación de variantes de diseño

---


## 📚 Recursos de Referencia

### Three.js & React Three Fiber


- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- [Three.js GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)
- [Three.js OrbitControls](https://threejs.org/docs/#examples/en/controls/OrbitControls)

### Expo APIs

- [expo-document-picker](https://docs.expo.dev/versions/latest/sdk/document-picker/)
- [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [expo-gl](https://docs.expo.dev/versions/latest/sdk/gl-view/)

### USDZ Resources

- [Apple USDZ Tools](https://developer.apple.com/augmented-reality/tools/)
- [USDZ Converter](https://developer.apple.com/augmented-reality/quick-look/)

---

**Documento:** FASE_1_MODEL_LOADING.md  
**Versión:** 1.0  
**Última actualización:** 2025-12-09  
**Estado:** Fase 1 - Documentación completa ✅  
**Próximo:** Crear branch y comenzar implementación
