import UIKit
import SceneKit
import ExpoModulesCore
import simd

// MARK: - Wall Selection Data Structure
struct WallSelectionData {
  let id: String
  let normal: simd_float3           // Vector normal de la pared
  let center: simd_float3           // Centro de la pared en espacio mundial
  let width: Float                  // Ancho de la pared en metros
  let height: Float                 // Alto de la pared en metros
  let transformMatrix: simd_float4x4 // Matriz de transformación

  func toDictionary() -> [String: Any] {
    return [
      "wallId": id,
      "normal": [normal.x, normal.y, normal.z],
      "center": [center.x, center.y, center.z],
      "dimensions": [width, height],
      "transform": transformMatrix.toArray()
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

  // Initial camera setup
  private var initialCameraDistance: Float = 3.0
  private var cameraDistance: Float = 3.0
  private var cameraRotation: simd_float2 = simd_float2(0, 0) // x: horizontal, y: vertical

  // Pan gesture tracking
  private var lastPanLocation: CGPoint = .zero

  // Event dispatchers (siguiendo patrón existente)
  let onPreviewModelLoaded = EventDispatcher()
  let onPreviewWallSelected = EventDispatcher()
  let onPreviewWallDeselected = EventDispatcher()
  let onPreviewLoadError = EventDispatcher()

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

    // Background color
    sceneView.backgroundColor = UIColor.systemBackground

    // Allow user interaction
    sceneView.allowsCameraControl = false // We'll implement custom controls

    // Setup camera
    setupCamera()

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
    // Tap gesture for wall selection
    let tapGesture = UITapGestureRecognizer(target: self, action: #selector(handleTapForWallSelection(_:)))
    sceneView.addGestureRecognizer(tapGesture)

    // Pan gesture for camera rotation
    let panGesture = UIPanGestureRecognizer(target: self, action: #selector(handlePanForCameraRotation(_:)))
    sceneView.addGestureRecognizer(panGesture)

    // Pinch gesture for zoom
    let pinchGesture = UIPinchGestureRecognizer(target: self, action: #selector(handlePinchForZoom(_:)))
    sceneView.addGestureRecognizer(pinchGesture)
  }

  // MARK: - Model Loading

  func loadModelForPreview(path: String) {
    print("📦 Loading model for preview: \(path)")

    // Remove existing model if any
    modelNode?.removeFromParentNode()
    modelNode = nil
    deselectWall()

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
          let boundingBox = self.getBoundingBox(for: modelContainer)
          let dimensions = boundingBox.max - boundingBox.min

          print("✅ Model loaded successfully")
          print("   Dimensions: \(dimensions.x)m x \(dimensions.y)m x \(dimensions.z)m")

          // Notify React Native
          self.onPreviewModelLoaded([
            "success": true,
            "dimensions": [dimensions.x, dimensions.y, dimensions.z],
            "path": path
          ])
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

    let boundingBox = getBoundingBox(for: model)
    let size = boundingBox.max - boundingBox.min
    let center = (boundingBox.max + boundingBox.min) / 2

    // Calculate scale to fit in view (target max dimension: 2 meters)
    let maxDimension = max(size.x, max(size.y, size.z))
    let targetSize: Float = 2.0
    let scale = targetSize / maxDimension

    // Apply centering and scaling
    model.position = SCNVector3(-center.x, -center.y, -center.z)
    model.scale = SCNVector3(scale, scale, scale)

    print("   Scale applied: \(scale)x")
    print("   Centered at origin")
  }

  private func getBoundingBox(for node: SCNNode) -> (min: simd_float3, max: simd_float3) {
    let (min, max) = node.boundingBox
    let minWorld = node.convertPosition(min, to: nil)
    let maxWorld = node.convertPosition(max, to: nil)

    return (
      min: simd_float3(minWorld.x, minWorld.y, minWorld.z),
      max: simd_float3(maxWorld.x, maxWorld.y, maxWorld.z)
    )
  }

  // MARK: - Wall Selection

  @objc private func handleTapForWallSelection(_ gesture: UITapGestureRecognizer) {
    let location = gesture.location(in: sceneView)

    // Perform hit test
    let hitResults = sceneView.hitTest(location, options: [
      SCNHitTestOption.searchMode: SCNHitTestSearchMode.all.rawValue,
      SCNHitTestOption.ignoreHiddenNodes: true
    ])

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

      // Validate if this is a valid wall surface
      if let wallData = extractWallData(from: hit) {
        selectWall(hit: hit, wallData: wallData)
        return
      }
    }

    // No valid wall found - deselect current
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
    // Get local normal from hit
    let localNormal = hit.localNormal

    // Convert to world space
    let worldNormal = hit.node.convertVector(localNormal, to: nil)
    let normalVec = simd_normalize(simd_float3(worldNormal.x, worldNormal.y, worldNormal.z))

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

    // Get bounding box in world space
    let boundingBox = getBoundingBox(for: hit.node)
    let size = boundingBox.max - boundingBox.min
    let center = (boundingBox.max + boundingBox.min) / 2

    // Determine wall dimensions based on normal direction
    let (width, height) = calculateWallDimensions(size: size, normal: normalVec)

    // Validate minimum size (at least 0.5m²)
    let area = width * height
    guard area >= 0.5 else {
      print("⚠️  Surface too small to be a wall (\(area)m²)")
      return nil
    }

    // Validate aspect ratio (avoid very elongated surfaces)
    let aspectRatio = max(width, height) / min(width, height)
    guard aspectRatio <= 10.0 else {
      print("⚠️  Surface has extreme aspect ratio (\(aspectRatio):1)")
      return nil
    }

    // Get transform matrix
    let transform = hit.node.simdWorldTransform

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

    print("✅ Wall selected: \(wallData.id)")
  }

  func deselectWall() {
    // Remove highlight
    highlightOverlay?.removeFromParentNode()
    highlightOverlay = nil

    // Clear selection
    selectedWallNode = nil
    selectedWallData = nil

    // Notify React Native
    onPreviewWallDeselected(["deselected": true])

    print("ℹ️  Wall deselected")
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

  @objc private func handlePanForCameraRotation(_ gesture: UIPanGestureRecognizer) {
    let location = gesture.location(in: sceneView)

    switch gesture.state {
    case .began:
      lastPanLocation = location

    case .changed:
      let delta = CGPoint(
        x: location.x - lastPanLocation.x,
        y: location.y - lastPanLocation.y
      )
      lastPanLocation = location

      // Update camera rotation
      // Horizontal pan = rotate around Y axis
      // Vertical pan = rotate around X axis (pitch)
      let sensitivity: Float = 0.005
      cameraRotation.x += Float(delta.x) * sensitivity
      cameraRotation.y -= Float(delta.y) * sensitivity

      // Clamp vertical rotation to avoid flipping
      cameraRotation.y = max(-Float.pi / 2, min(Float.pi / 2, cameraRotation.y))

      updateCameraPosition()

    default:
      break
    }
  }

  @objc private func handlePinchForZoom(_ gesture: UIPinchGestureRecognizer) {
    switch gesture.state {
    case .changed:
      let scale = Float(gesture.scale)
      cameraDistance /= scale

      // Clamp distance
      cameraDistance = max(0.5, min(10.0, cameraDistance))

      updateCameraPosition()

      gesture.scale = 1.0

    default:
      break
    }
  }

  private func updateCameraPosition() {
    // Calculate camera position using spherical coordinates
    let x = cameraDistance * cos(cameraRotation.y) * sin(cameraRotation.x)
    let y = cameraDistance * sin(cameraRotation.y)
    let z = cameraDistance * cos(cameraRotation.y) * cos(cameraRotation.x)

    cameraNode.position = SCNVector3(x, y, z)
    cameraNode.look(at: SCNVector3(0, 0, 0))
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
