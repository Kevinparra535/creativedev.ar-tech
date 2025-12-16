import UIKit
import SceneKit
import ExpoModulesCore
import simd

// MARK: - Wall Selection Data Structure
public struct WallSelectionData {
  let id: String
  let normal: simd_float3           // Vector normal de la pared
  let center: simd_float3           // Centro de la pared en espacio del modelo (coordenadas locales del USDZ)
  let width: Float                  // Ancho de la pared en metros
  let height: Float                 // Alto de la pared en metros
  let transformMatrix: simd_float4x4 // Matriz de transformación

  public init(id: String, normal: simd_float3, center: simd_float3, width: Float, height: Float, transformMatrix: simd_float4x4) {
    self.id = id
    self.normal = normal
    self.center = center
    self.width = width
    self.height = height
    self.transformMatrix = transformMatrix
  }

  func toDictionary() -> [String: Any] {
    return [
      "wallId": id,
      "normal": [normal.x, normal.y, normal.z],
      "center": [center.x, center.y, center.z],
      "dimensions": [width, height],
      "transform": transformMatrix.toArray(),
      "space": "model"
    ]
  }
}

// MARK: - SceneKitPreviewView Class
class SceneKitPreviewView: ExpoView {
  private var sceneView: SCNView!
  private var cameraNode: SCNNode!
  private var modelNode: SCNNode?
  private var selectedWallNode: SCNNode?
  private var selectedWallData: WallSelectionData?
  private var highlightOverlay: SCNNode?
  private var gridRootNode: SCNNode?

  // Camera control state
  private var initialCameraDistance: Float = 3.0
  private var cameraDistance: Float = 3.0
  private var minCameraDistance: Float = 0.5
  private var maxCameraDistance: Float = 10.0
  
  // Orbit rotation (in radians)
  private var cameraOrbitY: Float = 0.0       // Horizontal rotation (azimuth)
  private var cameraOrbitX: Float = 0.6       // Vertical rotation (elevation, ~35° above horizon)
  private var minOrbitX: Float = -Float.pi/2 + 0.1  // Don't go straight down
  private var maxOrbitX: Float = Float.pi/2 - 0.1   // Don't go straight up
  
  // Camera pan offset (for two-finger pan)
  private var cameraPanOffset: SCNVector3 = SCNVector3(0, 0, 0)
  
  // Model rotation state (Apple Quick Look style - rotate model, not camera)
  private var modelRotationY: Float = 0.0  // Horizontal rotation of model
  private var modelRotationX: Float = 0.0  // Vertical tilt of model
  
  // Momentum/inertia for smooth gestures
  private var rotationVelocity: CGPoint = .zero
  private var momentumTimer: Timer?
  
  // Visual helpers
  private var showBoundingBox: Bool = false
  private var boundingBoxNode: SCNNode?
  private var showGrid: Bool = true

  // Event dispatchers (siguiendo patrón existente)
  let onPreviewModelLoaded = EventDispatcher()
  let onPreviewWallSelected = EventDispatcher()
  let onPreviewWallDeselected = EventDispatcher()
  let onPreviewLoadError = EventDispatcher()
  let onPreviewTapFeedback = EventDispatcher()
  let onPreviewCameraChanged = EventDispatcher()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    setupSceneView()
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  // MARK: - Setup

  private func setupSceneView() {
    // Initialize SCNView (no-AR view)
    sceneView = SCNView(frame: self.bounds)
    sceneView.autoresizingMask = [.flexibleWidth, .flexibleHeight]

    // Create scene
    let scene = SCNScene()
    sceneView.scene = scene

    // Enable default lighting
    sceneView.autoenablesDefaultLighting = true

    // Better rendering quality
    sceneView.antialiasingMode = .multisampling4X

    // Background color - Blender-style neutral gray
    sceneView.backgroundColor = UIColor(red: 0.24, green: 0.24, blue: 0.24, alpha: 1.0)

    // Allow user interaction
    sceneView.allowsCameraControl = false // We'll implement custom controls

    // Setup camera
    setupCamera()

    // Add floor grid
    setupGrid()

    // Add gesture recognizers
    setupGestureRecognizers()

    // Add to view hierarchy
    addSubview(sceneView)

    print("✅ SceneKitPreviewView initialized")
  }

  private func setupCamera() {
    // Create camera node
    cameraNode = SCNNode()
    cameraNode.camera = SCNCamera()
    cameraNode.camera?.zNear = 0.01
    cameraNode.camera?.zFar = 100

    // Position camera
    cameraNode.position = SCNVector3(0, 0, initialCameraDistance)
    cameraNode.look(at: SCNVector3(0, 0, 0))

    // Add to scene
    sceneView.scene?.rootNode.addChildNode(cameraNode)
    sceneView.pointOfView = cameraNode
  }

  private func setupGestureRecognizers() {
    // Single tap for wall selection
    let tapGesture = UITapGestureRecognizer(target: self, action: #selector(handleTapForWallSelection(_:)))
    sceneView.addGestureRecognizer(tapGesture)
    
    // Double tap for reset view
    let doubleTapGesture = UITapGestureRecognizer(target: self, action: #selector(handleDoubleTapForReset(_:)))
    doubleTapGesture.numberOfTapsRequired = 2
    sceneView.addGestureRecognizer(doubleTapGesture)
    
    // Single tap should wait for double tap to fail
    tapGesture.require(toFail: doubleTapGesture)

    // One-finger pan: Rotate MODEL horizontally (Apple Quick Look style)
    let rotateGesture = UIPanGestureRecognizer(target: self, action: #selector(handleModelRotation(_:)))
    rotateGesture.minimumNumberOfTouches = 1
    rotateGesture.maximumNumberOfTouches = 1
    sceneView.addGestureRecognizer(rotateGesture)
    
    // Two-finger pan: Pan camera position
    let panGesture = UIPanGestureRecognizer(target: self, action: #selector(handleCameraPan(_:)))
    panGesture.minimumNumberOfTouches = 2
    panGesture.maximumNumberOfTouches = 2
    sceneView.addGestureRecognizer(panGesture)
    
    // Two-finger rotation: Tilt/roll model (advanced gesture)
    let rotationGesture = UIRotationGestureRecognizer(target: self, action: #selector(handleModelTilt(_:)))
    sceneView.addGestureRecognizer(rotationGesture)
    
    // Allow simultaneous pan and rotation with 2 fingers
    panGesture.delegate = self
    rotationGesture.delegate = self

    // Prefer taps over accidental tiny pans
    rotateGesture.require(toFail: tapGesture)

    // Pinch gesture for zoom
    let pinchGesture = UIPinchGestureRecognizer(target: self, action: #selector(handlePinchZoom(_:)))
    sceneView.addGestureRecognizer(pinchGesture)
    
    // Allow simultaneous pinch and pan/rotation
    pinchGesture.delegate = self
  }

  private func setupGrid() {
    let grid = SCNNode()
    grid.name = "floorGrid"
    grid.opacity = 0.9

    // Minor grid (0.25m)
    let minor = makeGridLines(size: 10.0, step: 0.25, color: UIColor.systemGray.withAlphaComponent(0.25))
    // Major grid (1m)
    let major = makeGridLines(size: 10.0, step: 1.0, color: UIColor.systemGray.withAlphaComponent(0.55))

    grid.addChildNode(minor)
    grid.addChildNode(major)

    sceneView.scene?.rootNode.addChildNode(grid)
    gridRootNode = grid
    grid.isHidden = !showGrid
  }

  private func makeGridLines(size: Float, step: Float, color: UIColor) -> SCNNode {
    let half = size / 2
    var vertices: [SCNVector3] = []
    var indices: [UInt32] = []
    var index: UInt32 = 0

    var value: Float = -half
    while value <= half + 0.0001 {
      // Line parallel to X axis at Z=value
      vertices.append(SCNVector3(-half, 0, value))
      vertices.append(SCNVector3(half, 0, value))
      indices.append(index)
      indices.append(index + 1)
      index += 2

      // Line parallel to Z axis at X=value
      vertices.append(SCNVector3(value, 0, -half))
      vertices.append(SCNVector3(value, 0, half))
      indices.append(index)
      indices.append(index + 1)
      index += 2

      value += step
    }

    let source = SCNGeometrySource(vertices: vertices)
    let indexData = indices.withUnsafeBytes { Data($0) }
    let element = SCNGeometryElement(data: indexData, primitiveType: .line, primitiveCount: indices.count / 2, bytesPerIndex: MemoryLayout<UInt32>.size)
    let geometry = SCNGeometry(sources: [source], elements: [element])

    let material = SCNMaterial()
    material.diffuse.contents = color
    material.isDoubleSided = true
    geometry.materials = [material]

    let node = SCNNode(geometry: geometry)
    node.renderingOrder = -1
    return node
  }

  // MARK: - Model Loading

  func loadModelForPreview(path: String) {
    print("📦 Loading model for preview: \(path)")

    // Remove existing model if any
    modelNode?.removeFromParentNode()
    modelNode = nil
    deselectWall()
    onPreviewTapFeedback(["success": true, "message": ""])

    // Normalize the path - handle file:// URLs and percent encoding
    var normalizedPath = path
    if path.hasPrefix("file://") {
      normalizedPath = String(path.dropFirst(7))
    }

    // Decode percent encoding
    if let decodedPath = normalizedPath.removingPercentEncoding {
      normalizedPath = decodedPath
    }

    print("📦 Normalized path: \(normalizedPath)")

    // Validate file path
    guard normalizedPath.lowercased().hasSuffix(".usdz") || normalizedPath.lowercased().hasSuffix(".usd") else {
      print("❌ Invalid file format. Only USDZ/USD supported.")
      onPreviewLoadError([
        "error": "Invalid file format",
        "message": "Only USDZ or USD files are supported",
        "path": normalizedPath
      ])
      return
    }

    // Create file URL - try both methods
    var fileURL: URL

    // First try as direct file URL if path starts with /
    if normalizedPath.hasPrefix("/") {
      fileURL = URL(fileURLWithPath: normalizedPath)
    } else {
      // Try creating URL from string (handles file:// and other schemes)
      if let url = URL(string: path) {
        fileURL = url
      } else {
        fileURL = URL(fileURLWithPath: normalizedPath)
      }
    }

    print("📦 File URL: \(fileURL)")
    print("📦 URL scheme: \(fileURL.scheme ?? "none")")
    print("📦 URL path: \(fileURL.path)")

    // Check file exists
    let pathToCheck = fileURL.path
    let pathExists = FileManager.default.fileExists(atPath: pathToCheck)
    print("📦 File exists at path: \(pathExists)")

    guard pathExists else {
      print("❌ File not found at path: \(pathToCheck)")
      onPreviewLoadError([
        "error": "File not found",
        "message": "The specified file does not exist",
        "path": pathToCheck
      ])
      return
    }

    // Load the scene
    DispatchQueue.global(qos: .userInitiated).async { [weak self] in
      guard let self = self else { return }

      // Start accessing security-scoped resource (needed for files from Files app)
      let didStartAccessing = fileURL.startAccessingSecurityScopedResource()
      defer {
        if didStartAccessing {
          fileURL.stopAccessingSecurityScopedResource()
        }
      }

      do {
        let scene = try SCNScene(url: fileURL, options: nil)

        DispatchQueue.main.async {
          // Create container node for the model
          let modelContainer = SCNNode()

          // Add all child nodes from loaded scene
          for child in scene.rootNode.childNodes {
            modelContainer.addChildNode(child)
          }

          self.modelNode = modelContainer
          self.sceneView.scene?.rootNode.addChildNode(modelContainer)

          // Center and scale model
          self.centerAndScaleModel()

          // Get model info
          let boundingBox = self.getWorldBoundingBox(for: modelContainer)
          let dimensions = boundingBox.max - boundingBox.min

          print("✅ Model loaded successfully")
          print("   Dimensions: \(dimensions.x)m x \(dimensions.y)m x \(dimensions.z)m")

          // Reset camera to default position and fit model to view
          self.cameraOrbitY = 0.0
          self.cameraOrbitX = 0.6  // ~35° above horizon (Blender-style)
          self.cameraPanOffset = SCNVector3(0, 0, 0)
          
          // Calculate optimal camera distance for the scaled model
          let fov = self.cameraNode.camera?.fieldOfView ?? 60.0
          let fovRadians = Float(fov) * Float.pi / 180.0
          let maxDim = max(dimensions.x, max(dimensions.y, dimensions.z))
          let optimalDistance = (maxDim / 2.0) / tan(fovRadians / 2.0) * 1.3
          self.cameraDistance = max(self.minCameraDistance, min(self.maxCameraDistance, optimalDistance))
          
          self.updateCameraTransform()
          self.emitCameraState()
          
          print("📷 Camera positioned at distance: \(self.cameraDistance)m")

          // Notify React Native with a small delay to ensure component is mounted
          DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            self.onPreviewModelLoaded([
              "success": true,
              "dimensions": [dimensions.x, dimensions.y, dimensions.z],
              "path": path
            ])
          }
        }
      } catch {
        DispatchQueue.main.async {
          print("❌ Failed to load model: \(error.localizedDescription)")
          self.onPreviewLoadError([
            "error": "Load failed",
            "message": error.localizedDescription,
            "path": path
          ])
        }
      }
    }
  }

  private func centerAndScaleModel() {
    guard let model = modelNode else { return }

    let boundingBox = getWorldBoundingBox(for: model)
    let size = boundingBox.max - boundingBox.min
    let center = (boundingBox.max + boundingBox.min) / 2

    // Calculate scale to fit in view (target max dimension: 2 meters)
    let maxDimension = max(size.x, max(size.y, size.z))
    let targetSize: Float = 2.0
    let scale = targetSize / maxDimension

    // Apply centering and scaling
    model.position = SCNVector3(-center.x, -center.y, -center.z)
    model.scale = SCNVector3(scale, scale, scale)

    // Place grid at the model "floor" after centering/scaling
    let floorY = (boundingBox.min.y - center.y) * scale
    gridRootNode?.position = SCNVector3(0, floorY, 0)

    print("   Scale applied: \(scale)x")
    print("   Centered at origin")
  }

  private func getWorldBoundingBox(for node: SCNNode) -> (min: simd_float3, max: simd_float3) {
    let (minLocal, maxLocal) = node.boundingBox

    let corners = [
      SCNVector3(minLocal.x, minLocal.y, minLocal.z),
      SCNVector3(minLocal.x, minLocal.y, maxLocal.z),
      SCNVector3(minLocal.x, maxLocal.y, minLocal.z),
      SCNVector3(minLocal.x, maxLocal.y, maxLocal.z),
      SCNVector3(maxLocal.x, minLocal.y, minLocal.z),
      SCNVector3(maxLocal.x, minLocal.y, maxLocal.z),
      SCNVector3(maxLocal.x, maxLocal.y, minLocal.z),
      SCNVector3(maxLocal.x, maxLocal.y, maxLocal.z)
    ]

    var minWorld = simd_float3(Float.greatestFiniteMagnitude, Float.greatestFiniteMagnitude, Float.greatestFiniteMagnitude)
    var maxWorld = simd_float3(-Float.greatestFiniteMagnitude, -Float.greatestFiniteMagnitude, -Float.greatestFiniteMagnitude)

    for c in corners {
      let w = node.convertPosition(c, to: nil)
      let p = simd_float3(w.x, w.y, w.z)
      minWorld = simd_min(minWorld, p)
      maxWorld = simd_max(maxWorld, p)
    }

    return (min: minWorld, max: maxWorld)
  }

  private func getBoundingBoxInModelSpace(for node: SCNNode, modelRoot: SCNNode) -> (min: simd_float3, max: simd_float3) {
    let (minLocal, maxLocal) = node.boundingBox

    let corners = [
      SCNVector3(minLocal.x, minLocal.y, minLocal.z),
      SCNVector3(minLocal.x, minLocal.y, maxLocal.z),
      SCNVector3(minLocal.x, maxLocal.y, minLocal.z),
      SCNVector3(minLocal.x, maxLocal.y, maxLocal.z),
      SCNVector3(maxLocal.x, minLocal.y, minLocal.z),
      SCNVector3(maxLocal.x, minLocal.y, maxLocal.z),
      SCNVector3(maxLocal.x, maxLocal.y, minLocal.z),
      SCNVector3(maxLocal.x, maxLocal.y, maxLocal.z)
    ]

    var minModel = simd_float3(Float.greatestFiniteMagnitude, Float.greatestFiniteMagnitude, Float.greatestFiniteMagnitude)
    var maxModel = simd_float3(-Float.greatestFiniteMagnitude, -Float.greatestFiniteMagnitude, -Float.greatestFiniteMagnitude)

    for c in corners {
      let pInModel = node.convertPosition(c, to: modelRoot)
      let p = simd_float3(pInModel.x, pInModel.y, pInModel.z)
      minModel = simd_min(minModel, p)
      maxModel = simd_max(maxModel, p)
    }

    return (min: minModel, max: maxModel)
  }

  // MARK: - Wall Selection

  @objc private func handleTapForWallSelection(_ gesture: UITapGestureRecognizer) {
    let location = gesture.location(in: sceneView)

    // Perform hit test
    let hitResults = sceneView.hitTest(location, options: [
      SCNHitTestOption.searchMode: SCNHitTestSearchMode.all.rawValue,
      SCNHitTestOption.ignoreHiddenNodes: true
    ])

    var hitModelSurface = false

    // Find first valid wall hit
    for hit in hitResults {
      // Skip if this is the highlight overlay
      if hit.node == highlightOverlay {
        continue
      }

      // Skip if not part of model
      guard isNodePartOfModel(hit.node) else {
        continue
      }

      hitModelSurface = true

      // Validate if this is a valid wall surface
      if let wallData = extractWallData(from: hit) {
        selectWall(hit: hit, wallData: wallData)
        return
      }
    }

    // No valid wall found - provide feedback and deselect current
    if hitModelSurface {
      onPreviewTapFeedback([
        "success": false,
        "message": "No se detectó una pared válida. Intenta tocar una superficie vertical más grande (no piso/techo)."
      ])
    } else {
      onPreviewTapFeedback([
        "success": false,
        "message": "No se detectó el modelo en ese punto. Acerca/rota y vuelve a tocar una pared."
      ])
    }

    if selectedWallNode != nil {
      deselectWall()
    }
  }

  private func isNodePartOfModel(_ node: SCNNode) -> Bool {
    var current: SCNNode? = node
    while let currentNode = current {
      if currentNode == modelNode {
        return true
      }
      current = currentNode.parent
    }
    return false
  }

  private func extractWallData(from hit: SCNHitTestResult) -> WallSelectionData? {
    guard let modelRoot = modelNode else {
      return nil
    }

    // Try to get a stable normal (some USDZ assets may have missing normals)
    let localNormal = hit.localNormal
    var normalVec = simd_float3(Float(localNormal.x), Float(localNormal.y), Float(localNormal.z))

    if simd_length(normalVec) < 0.0001 || normalVec.x.isNaN || normalVec.y.isNaN || normalVec.z.isNaN {
      // Fallback: use node forward axis as an approximate normal
      let forwardLocal = simd_float4(0, 0, 1, 0)
      let forwardWorld4 = hit.node.simdWorldTransform * forwardLocal
      let forwardWorld = SCNVector3(forwardWorld4.x, forwardWorld4.y, forwardWorld4.z)
      let forwardInModel = modelRoot.convertVector(forwardWorld, from: nil)
      normalVec = simd_float3(Float(forwardInModel.x), Float(forwardInModel.y), Float(forwardInModel.z))
    } else {
      // Convert to model space (undo preview centering/scaling)
      let modelNormal = hit.node.convertVector(localNormal, to: modelRoot)
      normalVec = simd_float3(Float(modelNormal.x), Float(modelNormal.y), Float(modelNormal.z))
    }

    guard simd_length(normalVec) >= 0.0001 else {
      return nil
    }

    normalVec = simd_normalize(normalVec)

    // Validate that this is a vertical surface (wall, not floor/ceiling)
    guard isValidWallNormal(normalVec) else {
      print("⚠️  Surface is not a wall (too horizontal)")
      return nil
    }

    // Get geometry and calculate dimensions
    guard hit.node.geometry != nil else {
      print("⚠️  Node has no geometry")
      return nil
    }

    // Get bounding box in model space (undo preview centering/scaling)
    let boundingBox = getBoundingBoxInModelSpace(for: hit.node, modelRoot: modelRoot)
    let size = boundingBox.max - boundingBox.min
    let center = (boundingBox.max + boundingBox.min) / 2

    // Determine wall dimensions based on normal direction
    let (width, height) = calculateWallDimensions(size: size, normal: normalVec)

    // Validate minimum size (relaxed)
    let area = width * height
    guard area >= 0.05 else {
      print("⚠️  Surface too small to be a wall (\(area)m²)")
      return nil
    }

    // Validate aspect ratio (avoid very elongated surfaces)
    let aspectRatio = max(width, height) / max(0.001, min(width, height))
    guard aspectRatio <= 25.0 else {
      print("⚠️  Surface has extreme aspect ratio (\(aspectRatio):1)")
      return nil
    }

    // Keep transform matrix as identity (callers should treat center/normal as model-local)
    let transform = matrix_identity_float4x4

    // Create wall data
    let wallData = WallSelectionData(
      id: UUID().uuidString,
      normal: normalVec,
      center: center,
      width: width,
      height: height,
      transformMatrix: transform
    )

    print("✅ Valid wall detected:")
    print("   Normal: [\(normalVec.x), \(normalVec.y), \(normalVec.z)]")
    print("   Dimensions: \(width)m x \(height)m")
    print("   Area: \(area)m²")

    return wallData
  }

  private func isValidWallNormal(_ normal: simd_float3) -> Bool {
    // Check that normal is primarily horizontal (not pointing up/down)
    // A wall should have minimal Y component in its normal
    let horizontalComponent = sqrt(normal.x * normal.x + normal.z * normal.z)

    // Horizontal component should dominate (at least 70% of the normal)
    return horizontalComponent >= 0.7
  }

  private func calculateWallDimensions(size: simd_float3, normal: simd_float3) -> (width: Float, height: Float) {
    // Determine which axis the normal points along most strongly
    let absNormal = simd_abs(normal)

    if absNormal.x > absNormal.y && absNormal.x > absNormal.z {
      // Normal points along X axis -> wall is in YZ plane
      return (width: size.z, height: size.y)
    } else if absNormal.z > absNormal.x && absNormal.z > absNormal.y {
      // Normal points along Z axis -> wall is in XY plane
      return (width: size.x, height: size.y)
    } else {
      // Normal points along Y axis -> horizontal surface (floor/ceiling)
      // For walls, we still return XZ dimensions but this should be filtered out
      return (width: size.x, height: size.z)
    }
  }

  private func selectWall(hit: SCNHitTestResult, wallData: WallSelectionData) {
    // Remove previous selection
    deselectWall()

    // Store selection
    selectedWallNode = hit.node
    selectedWallData = wallData

    // Highlight the wall
    highlightWall(hit: hit)

    // Notify React Native
    onPreviewWallSelected(wallData.toDictionary())
    onPreviewTapFeedback(["success": true, "message": "Pared seleccionada" ])

    print("✅ Wall selected: \(wallData.id)")
  }

  func deselectWall() {
    // Only fire event if there was actually a selection
    let hadSelection = selectedWallNode != nil

    // Remove highlight
    highlightOverlay?.removeFromParentNode()
    highlightOverlay = nil

    // Clear selection
    selectedWallNode = nil
    selectedWallData = nil

    // Notify React Native only if there was a previous selection
    if hadSelection {
      onPreviewWallDeselected(["deselected": true])
      print("ℹ️  Wall deselected")
    }
  }

  private func highlightWall(hit: SCNHitTestResult) {
    guard let geometry = hit.node.geometry else { return }

    // Create a semi-transparent overlay with the same geometry
    let overlayGeometry = geometry.copy() as! SCNGeometry

    // Create highlight material (green semi-transparent)
    let material = SCNMaterial()
    material.diffuse.contents = UIColor.systemGreen.withAlphaComponent(0.3)
    material.emission.contents = UIColor.systemGreen.withAlphaComponent(0.2)
    material.isDoubleSided = true
    material.transparency = 0.5

    overlayGeometry.materials = [material]

    // Create overlay node
    let overlay = SCNNode(geometry: overlayGeometry)
    overlay.simdTransform = hit.node.simdWorldTransform

    // Add to scene (slightly offset to prevent z-fighting)
    let offset = hit.localNormal * 0.001 // 1mm offset
    overlay.position = overlay.position + offset

    sceneView.scene?.rootNode.addChildNode(overlay)
    highlightOverlay = overlay

    print("✅ Wall highlighted")
  }

  // MARK: - Camera Controls
  // MARK: - Advanced Gesture Handlers (Apple Quick Look Style)
  
  /// One-finger pan: Rotate MODEL around Y-axis (turntable style)
  @objc private func handleModelRotation(_ gesture: UIPanGestureRecognizer) {
    guard let model = modelNode else { return }
    
    let translation = gesture.translation(in: sceneView)
    let velocity = gesture.velocity(in: sceneView)
    
    switch gesture.state {
    case .changed:
      // Rotate model horizontally (turntable)
      let sensitivity: Float = 0.01
      modelRotationY += Float(translation.x) * sensitivity
      
      // Apply rotation to model
      model.eulerAngles.y = modelRotationY
      
      // Store velocity for momentum
      rotationVelocity = CGPoint(x: velocity.x * 0.001, y: velocity.y * 0.001)
      
      gesture.setTranslation(.zero, in: sceneView)
      
    case .ended, .cancelled:
      // Apply momentum/inertia if velocity is significant
      if abs(rotationVelocity.x) > 0.1 {
        startMomentumAnimation()
      }
      
    default:
      break
    }
  }
  
  /// Two-finger rotation: Tilt/roll model (advanced gesture)
  @objc private func handleModelTilt(_ gesture: UIRotationGestureRecognizer) {
    guard let model = modelNode else { return }
    
    switch gesture.state {
    case .changed:
      // Tilt model around X-axis based on rotation
      let tiltSensitivity: Float = 0.3
      modelRotationX += Float(gesture.rotation) * tiltSensitivity
      
      // Clamp tilt to reasonable range (-30° to +30°)
      let maxTilt: Float = Float.pi / 6  // 30 degrees
      modelRotationX = max(-maxTilt, min(maxTilt, modelRotationX))
      
      model.eulerAngles.x = modelRotationX
      
      gesture.rotation = 0
      
    default:
      break
    }
  }
  
  /// Two-finger pan: Translate camera position
  @objc private func handleCameraPan(_ gesture: UIPanGestureRecognizer) {
    let translation = gesture.translation(in: sceneView)
    
    switch gesture.state {
    case .changed:
      // Sensitivity scales with distance (pan faster when zoomed out)
      let sensitivity = cameraDistance * 0.0015
      
      // Get camera's right and up vectors
      let cameraTransform = cameraNode.simdTransform
      let right = simd_float3(cameraTransform.columns.0.x, cameraTransform.columns.0.y, cameraTransform.columns.0.z)
      let up = simd_float3(cameraTransform.columns.1.x, cameraTransform.columns.1.y, cameraTransform.columns.1.z)
      
      // Calculate offset in world space
      let offsetX = right * Float(-translation.x) * sensitivity
      let offsetY = up * Float(translation.y) * sensitivity
      
      let currentOffset = simd_float3(cameraPanOffset.x, cameraPanOffset.y, cameraPanOffset.z)
      let newOffset = currentOffset + offsetX + offsetY
      cameraPanOffset = SCNVector3(newOffset.x, newOffset.y, newOffset.z)
      
      updateCameraTransform()
      gesture.setTranslation(.zero, in: sceneView)
      
    default:
      break
    }
  }
  
  /// Pinch gesture: Zoom in/out (smooth and responsive)
  @objc private func handlePinchZoom(_ gesture: UIPinchGestureRecognizer) {
    switch gesture.state {
    case .began:
      // Stop any momentum animation when user interacts
      stopMomentumAnimation()
      
    case .changed:
      let scale = Float(gesture.scale)
      
      // Smoother zoom with dampening
      let zoomFactor = 1.0 + (scale - 1.0) * 0.5
      cameraDistance /= zoomFactor
      
      // Clamp to limits
      cameraDistance = max(minCameraDistance, min(maxCameraDistance, cameraDistance))
      
      updateCameraTransform()
      emitCameraState()
      gesture.scale = 1.0
      
    default:
      break
    }
  }
  
  /// Momentum animation for natural inertia after gesture ends
  private func startMomentumAnimation() {
    stopMomentumAnimation()
    
    momentumTimer = Timer.scheduledTimer(withTimeInterval: 1.0/60.0, repeats: true) { [weak self] _ in
      guard let self = self, let model = self.modelNode else { return }
      
      // Apply velocity to rotation
      self.modelRotationY += Float(self.rotationVelocity.x)
      model.eulerAngles.y = self.modelRotationY
      
      // Decay velocity (friction)
      self.rotationVelocity.x *= 0.95
      
      // Stop when velocity is negligible
      if abs(self.rotationVelocity.x) < 0.01 {
        self.stopMomentumAnimation()
      }
    }
  }
  
  private func stopMomentumAnimation() {
    momentumTimer?.invalidate()
    momentumTimer = nil
    rotationVelocity = .zero
  }
  
  /// Double-tap: Reset camera to default view
  @objc private func handleDoubleTapForReset(_ gesture: UITapGestureRecognizer) {
    resetCamera()
  }
  
  /// Update camera position and orientation based on orbit angles and distance
  private func updateCameraTransform() {
    // Calculate position using spherical coordinates (orbit)
    let x = cameraDistance * cos(cameraOrbitX) * sin(cameraOrbitY)
    let y = cameraDistance * sin(cameraOrbitX)
    let z = cameraDistance * cos(cameraOrbitX) * cos(cameraOrbitY)
    
    cameraNode.position = SCNVector3(x, y, z) + cameraPanOffset
    
    // Look at origin (with pan offset applied to both position and target)
    let target = SCNVector3(0, 0, 0) + cameraPanOffset
    cameraNode.look(at: target)
  }
  
  /// Emit camera state to React Native for UI feedback
  private func emitCameraState() {
    onPreviewCameraChanged([
      "distance": cameraDistance,
      "azimuth": cameraOrbitY * 180 / Float.pi, // degrees
      "elevation": cameraOrbitX * 180 / Float.pi, // degrees
      "minDistance": minCameraDistance,
      "maxDistance": maxCameraDistance
    ])
  }
  
  // MARK: - Public Camera API
  
  func resetCamera() {
    cameraDistance = initialCameraDistance
    cameraOrbitY = 0.0
    cameraOrbitX = 0.6  // ~35° above horizon (Blender-style)
    cameraPanOffset = SCNVector3(0, 0, 0)

    SCNTransaction.begin()
    SCNTransaction.animationDuration = 0.3
    updateCameraTransform()
    SCNTransaction.commit()

    emitCameraState()
    print("📷 Camera reset to default view")
  }
  
  func fitModelToView() {
    guard let model = modelNode else { return }

    let bbox = getWorldBoundingBox(for: model)
    let size = bbox.max - bbox.min
    let maxDim = max(size.x, max(size.y, size.z))

    // Calculate optimal distance (add 20% padding)
    let fov = cameraNode.camera?.fieldOfView ?? 60.0
    let fovRadians = Float(fov) * Float.pi / 180.0
    let optimalDistance = (maxDim / 2.0) / tan(fovRadians / 2.0) * 1.2

    cameraDistance = optimalDistance
    cameraPanOffset = SCNVector3(0, 0, 0)

    SCNTransaction.begin()
    SCNTransaction.animationDuration = 0.3
    updateCameraTransform()
    SCNTransaction.commit()

    emitCameraState()
    print("📷 Model fit to view (distance: \(optimalDistance)m)")
  }
  
  func toggleGrid() {
    showGrid.toggle()
    gridRootNode?.isHidden = !showGrid
    print("🎯 Grid: \(showGrid ? "visible" : "hidden")")
  }
  
  func toggleBoundingBox() {
    showBoundingBox.toggle()

    if showBoundingBox {
      showModelBoundingBox()
    } else {
      boundingBoxNode?.removeFromParentNode()
      boundingBoxNode = nil
    }
  }
  
  // MARK: - Preset Camera Views (Blender-style)
  
  func setCameraViewFront() {
    cameraOrbitY = 0.0  // Looking straight ahead
    cameraOrbitX = 0.0  // Level with horizon
    cameraPanOffset = SCNVector3(0, 0, 0)
    
    SCNTransaction.begin()
    SCNTransaction.animationDuration = 0.3
    updateCameraTransform()
    SCNTransaction.commit()
    
    emitCameraState()
    print("📷 Camera: Front view")
  }
  
  func setCameraViewRight() {
    cameraOrbitY = Float.pi / 2  // 90° right
    cameraOrbitX = 0.0  // Level with horizon
    cameraPanOffset = SCNVector3(0, 0, 0)
    
    SCNTransaction.begin()
    SCNTransaction.animationDuration = 0.3
    updateCameraTransform()
    SCNTransaction.commit()
    
    emitCameraState()
    print("📷 Camera: Right view")
  }
  
  func setCameraViewTop() {
    cameraOrbitY = 0.0
    cameraOrbitX = Float.pi / 2 - 0.1  // Almost straight down (avoid gimbal lock)
    cameraPanOffset = SCNVector3(0, 0, 0)
    
    SCNTransaction.begin()
    SCNTransaction.animationDuration = 0.3
    updateCameraTransform()
    SCNTransaction.commit()
    
    emitCameraState()
    print("📷 Camera: Top view")
  }
  
  func setCameraViewPerspective() {
    cameraOrbitY = Float.pi / 4  // 45° angle
    cameraOrbitX = 0.6  // ~35° above horizon (default perspective)
    cameraPanOffset = SCNVector3(0, 0, 0)
    
    SCNTransaction.begin()
    SCNTransaction.animationDuration = 0.3
    updateCameraTransform()
    SCNTransaction.commit()
    
    emitCameraState()
    print("📷 Camera: Perspective view")
  }
  
  private func showModelBoundingBox() {
    guard let model = modelNode else { return }

    // Remove existing bbox
    boundingBoxNode?.removeFromParentNode()

    let bbox = getWorldBoundingBox(for: model)
    let size = bbox.max - bbox.min
    let center = (bbox.max + bbox.min) / 2

    // Create wireframe box
    let boxGeometry = SCNBox(width: CGFloat(size.x), height: CGFloat(size.y), length: CGFloat(size.z), chamferRadius: 0)
    let material = SCNMaterial()
    material.diffuse.contents = UIColor.clear
    material.emission.contents = UIColor.systemBlue.withAlphaComponent(0.8)
    material.fillMode = .lines
    boxGeometry.materials = [material]

    let boxNode = SCNNode(geometry: boxGeometry)
    boxNode.position = SCNVector3(center.x, center.y, center.z)
    sceneView.scene?.rootNode.addChildNode(boxNode)

    boundingBoxNode = boxNode
    print("📦 Bounding box visible")
  }

  // MARK: - Public API

  func getSelectedWallData() -> WallSelectionData? {
    return selectedWallData
  }
}

// MARK: - Extensions

extension SCNVector3 {
  static func +(lhs: SCNVector3, rhs: SCNVector3) -> SCNVector3 {
    return SCNVector3(lhs.x + rhs.x, lhs.y + rhs.y, lhs.z + rhs.z)
  }

  static func -(lhs: SCNVector3, rhs: SCNVector3) -> SCNVector3 {
    return SCNVector3(lhs.x - rhs.x, lhs.y - rhs.y, lhs.z - rhs.z)
  }

  static func *(lhs: SCNVector3, rhs: Float) -> SCNVector3 {
    return SCNVector3(lhs.x * rhs, lhs.y * rhs, lhs.z * rhs)
  }
}

extension simd_float3 {
  static func +(lhs: simd_float3, rhs: simd_float3) -> simd_float3 {
    return simd_float3(lhs.x + rhs.x, lhs.y + rhs.y, lhs.z + rhs.z)
  }

  static func -(lhs: simd_float3, rhs: simd_float3) -> simd_float3 {
    return simd_float3(lhs.x - rhs.x, lhs.y - rhs.y, lhs.z - rhs.z)
  }

  static func /(lhs: simd_float3, rhs: Float) -> simd_float3 {
    return simd_float3(lhs.x / rhs, lhs.y / rhs, lhs.z / rhs)
  }
}
// MARK: - UIGestureRecognizerDelegate

extension SceneKitPreviewView: UIGestureRecognizerDelegate {
  // Allow simultaneous gesture recognition (pinch + pan, rotation + pan)
  func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer) -> Bool {
    // Allow pinch with pan
    if (gestureRecognizer is UIPinchGestureRecognizer && otherGestureRecognizer is UIPanGestureRecognizer) ||
       (gestureRecognizer is UIPanGestureRecognizer && otherGestureRecognizer is UIPinchGestureRecognizer) {
      return true
    }
    
    // Allow rotation with pan (both 2-finger gestures)
    if (gestureRecognizer is UIRotationGestureRecognizer && otherGestureRecognizer is UIPanGestureRecognizer) ||
       (gestureRecognizer is UIPanGestureRecognizer && otherGestureRecognizer is UIRotationGestureRecognizer) {
      // Only if both are 2-finger gestures
      if let pan = gestureRecognizer as? UIPanGestureRecognizer, pan.minimumNumberOfTouches == 2 {
        return true
      }
      if let pan = otherGestureRecognizer as? UIPanGestureRecognizer, pan.minimumNumberOfTouches == 2 {
        return true
      }
    }
    
    return false
  }
}
extension simd_float4x4 {
  func toArray() -> [[Double]] {
    return [
      [Double(self.columns.0.x), Double(self.columns.0.y), Double(self.columns.0.z), Double(self.columns.0.w)],
      [Double(self.columns.1.x), Double(self.columns.1.y), Double(self.columns.1.z), Double(self.columns.1.w)],
      [Double(self.columns.2.x), Double(self.columns.2.y), Double(self.columns.2.z), Double(self.columns.2.w)],
      [Double(self.columns.3.x), Double(self.columns.3.y), Double(self.columns.3.z), Double(self.columns.3.w)]
    ]
  }
}
