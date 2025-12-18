import UIKit
import SceneKit
import ExpoModulesCore

private struct SimpleWallSelectionData {
  let id: String
  let normal: simd_float3
  let center: simd_float3
  let width: Float
  let height: Float
  let transformMatrix: simd_float4x4

  func toDictionary() -> [String: Any] {
    let normalArr: [Float] = [normal.x, normal.y, normal.z]
    let centerArr: [Float] = [center.x, center.y, center.z]
    let dimensionsArr: [Float] = [width, height]

    let c0 = transformMatrix.columns.0
    let c1 = transformMatrix.columns.1
    let c2 = transformMatrix.columns.2
    let c3 = transformMatrix.columns.3

    let transformArr: [[Double]] = [
      [Double(c0.x), Double(c0.y), Double(c0.z), Double(c0.w)],
      [Double(c1.x), Double(c1.y), Double(c1.z), Double(c1.w)],
      [Double(c2.x), Double(c2.y), Double(c2.z), Double(c2.w)],
      [Double(c3.x), Double(c3.y), Double(c3.z), Double(c3.w)]
    ]

    var dict: [String: Any] = [:]
    dict["wallId"] = id
    dict["normal"] = normalArr
    dict["center"] = centerArr
    dict["dimensions"] = dimensionsArr
    dict["transform"] = transformArr
    dict["space"] = "model"
    return dict
  }
}

// Minimal, non-AR model preview view (no wall selection, no gestures, no controls)
class SimpleModelPreviewView: ExpoView {
  private var sceneView: SCNView!
  private var cameraNode: SCNNode!
  private var modelNode: SCNNode?

  private var selectedWallNode: SCNNode?
  private var selectedWallData: SimpleWallSelectionData?

  private var selectionOverlay: SCNNode?
  private var scannedWallIds = Set<String>()
  private var scannedWallOverlays: [String: SCNNode] = [:]

  let onSimpleModelLoaded = EventDispatcher()
  let onSimpleLoadError = EventDispatcher()
  let onSimpleWallSelected = EventDispatcher()
  let onSimpleWallDeselected = EventDispatcher()
  let onSimpleTapFeedback = EventDispatcher()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    setupSceneView()
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  private func setupSceneView() {
    sceneView = SCNView(frame: bounds)
    sceneView.autoresizingMask = [.flexibleWidth, .flexibleHeight]

    let scene = SCNScene()
    sceneView.scene = scene

    sceneView.autoenablesDefaultLighting = true
    sceneView.antialiasingMode = .multisampling4X
    sceneView.allowsCameraControl = true

    // Let the React Native container provide the gray background.
    sceneView.backgroundColor = .clear

    setupCamera()

    let tap = UITapGestureRecognizer(target: self, action: #selector(handleTapForWallSelection(_:)))
    tap.cancelsTouchesInView = false
    sceneView.addGestureRecognizer(tap)

    addSubview(sceneView)
  }

  private func setupCamera() {
    cameraNode = SCNNode()
    let camera = SCNCamera()
    camera.fieldOfView = 60
    camera.zNear = 0.001
    camera.zFar = 1000
    camera.usesOrthographicProjection = true
    camera.orthographicScale = 1.0
    cameraNode.camera = camera

    // Default position; will be adjusted when a model is loaded.
    cameraNode.position = SCNVector3(3, 3, 3)

    sceneView.scene?.rootNode.addChildNode(cameraNode)
  }

  func loadModel(path: String) {
    let url = URL(fileURLWithPath: path)

    do {
      let scene = try SCNScene(url: url, options: nil)

      // Remove previous model
      modelNode?.removeFromParentNode()
      modelNode = nil

      clearScannedWalls()
      deselectWall()
      onSimpleTapFeedback(["success": true, "message": ""]) 

      // Wrap imported content into a single node hierarchy so we can re-center reliably.
      // rootNode: attached to the scene
      // contentNode: contains imported geometry, translated so its bounds center becomes (0,0,0)
      let rootNode = SCNNode()
      let contentNode = SCNNode()

      for child in scene.rootNode.childNodes {
        contentNode.addChildNode(child.clone())
      }
      rootNode.addChildNode(contentNode)

      recenterContentNode(contentNode)

      sceneView.scene?.rootNode.addChildNode(rootNode)
      modelNode = rootNode

      setIsometricCamera(for: rootNode)

      onSimpleModelLoaded(["success": true, "path": path])
    } catch {
      onSimpleLoadError(["error": "LOAD_FAILED", "message": String(describing: error), "path": path])
    }
  }

  func markWallScanned(wallId: String) {
    guard let modelRoot = modelNode else { return }
    let targetId = wallId

    if selectedWallData?.id == targetId {
      selectionOverlay?.removeFromParentNode()
      selectionOverlay = nil
    }

    // Mark in state
    scannedWallIds.insert(targetId)

    // Remove any previous scanned overlay for this wall
    if let existing = scannedWallOverlays[targetId] {
      existing.removeFromParentNode()
      scannedWallOverlays[targetId] = nil
    }

    // Find node by name and apply persistent green overlay
    if let node = modelRoot.childNode(withName: targetId, recursively: true) {
      let overlay = makeOverlayNode(for: node, color: UIColor.systemGreen)
      node.parent?.addChildNode(overlay)
      scannedWallOverlays[targetId] = overlay
    }
  }

  private func clearScannedWalls() {
    scannedWallIds.removeAll()
    for (_, overlay) in scannedWallOverlays {
      overlay.removeFromParentNode()
    }
    scannedWallOverlays.removeAll()
  }

  func deselectWall() {
    let hadSelection = selectedWallNode != nil

    selectionOverlay?.removeFromParentNode()
    selectionOverlay = nil

    selectedWallNode = nil
    selectedWallData = nil

    if hadSelection {
      onSimpleWallDeselected(["deselected": true])
    }
  }

  private func recenterContentNode(_ node: SCNNode) {
    let (minVec, maxVec) = node.boundingBox

    // If bounds are invalid/empty, skip.
    if minVec.x.isInfinite || maxVec.x.isInfinite { return }

    let center = SCNVector3(
      (minVec.x + maxVec.x) / 2,
      (minVec.y + maxVec.y) / 2,
      (minVec.z + maxVec.z) / 2
    )

    // Translate content so the center of its bounds becomes the origin.
    node.position = SCNVector3(-center.x, -center.y, -center.z)
  }

  @objc private func handleTapForWallSelection(_ gesture: UITapGestureRecognizer) {
    guard gesture.state == .ended else { return }
    guard let modelRoot = modelNode else {
      onSimpleTapFeedback(["success": false, "message": "Primero carga un modelo."])
      return
    }

    let location = gesture.location(in: sceneView)
    let hitResults = sceneView.hitTest(location, options: [
      SCNHitTestOption.searchMode: SCNHitTestSearchMode.all.rawValue,
      SCNHitTestOption.ignoreHiddenNodes: true
    ])

    var hitModelSurface = false

    for hit in hitResults {
      if hit.node == selectionOverlay { continue }
      if scannedWallOverlays.values.contains(where: { $0 == hit.node }) { continue }
      guard isNodePartOfModel(hit.node, modelRoot: modelRoot) else { continue }
      hitModelSurface = true

      if let wallData = extractWallData(from: hit, modelRoot: modelRoot) {
        selectWall(hit: hit, wallData: wallData)
        return
      }
    }

    if hitModelSurface {
      onSimpleTapFeedback([
        "success": false,
        "message": "No se detectó una pared válida. Intenta tocar una superficie vertical más grande (no piso/techo)."
      ])
    } else {
      onSimpleTapFeedback([
        "success": false,
        "message": "No se detectó el modelo en ese punto. Acerca/rota y vuelve a tocar una pared."
      ])
    }

    if selectedWallNode != nil {
      deselectWall()
    }
  }

  private func isNodePartOfModel(_ node: SCNNode, modelRoot: SCNNode) -> Bool {
    var current: SCNNode? = node
    while let currentNode = current {
      if currentNode == modelRoot {
        return true
      }
      current = currentNode.parent
    }
    return false
  }

  private func extractWallData(from hit: SCNHitTestResult, modelRoot: SCNNode) -> SimpleWallSelectionData? {
    // Prefer world normal; filter out horizontal-ish surfaces.
    let n = hit.worldNormal
    let absY = abs(n.y)
    if absY > 0.45 { return nil }

    // Compute approximate dimensions from the hit node bounds.
    let (width, height) = calculateWallDimensions(from: hit.node.boundingBox, normal: n)
    if width < 0.2 || height < 0.2 { return nil }

    let centerLocal = SCNVector3(
      (hit.node.boundingBox.min.x + hit.node.boundingBox.max.x) / 2,
      (hit.node.boundingBox.min.y + hit.node.boundingBox.max.y) / 2,
      (hit.node.boundingBox.min.z + hit.node.boundingBox.max.z) / 2
    )
    let centerWorld = hit.node.convertPosition(centerLocal, to: nil)

    let transform = simd_float4x4(hit.node.worldTransform)

    let id: String
    if let existing = hit.node.name, !existing.isEmpty {
      id = existing
    } else {
      let generated = UUID().uuidString
      hit.node.name = generated
      id = generated
    }

    return SimpleWallSelectionData(
      id: id,
      normal: simd_float3(n.x, n.y, n.z),
      center: simd_float3(centerWorld.x, centerWorld.y, centerWorld.z),
      width: width,
      height: height,
      transformMatrix: transform
    )
  }

  private func calculateWallDimensions(from boundingBox: (min: SCNVector3, max: SCNVector3), normal: SCNVector3) -> (Float, Float) {
    let size = SCNVector3(
      boundingBox.max.x - boundingBox.min.x,
      boundingBox.max.y - boundingBox.min.y,
      boundingBox.max.z - boundingBox.min.z
    )

    let absNormal = SCNVector3(abs(normal.x), abs(normal.y), abs(normal.z))

    // Pick plane axes based on dominant normal component.
    if absNormal.x > absNormal.y && absNormal.x > absNormal.z {
      return (Float(size.z), Float(size.y))
    } else if absNormal.z > absNormal.x && absNormal.z > absNormal.y {
      return (Float(size.x), Float(size.y))
    } else {
      return (Float(size.x), Float(size.z))
    }
  }

  private func selectWall(hit: SCNHitTestResult, wallData: SimpleWallSelectionData) {
    deselectWall()

    selectedWallNode = hit.node
    selectedWallData = wallData

    highlightWallSelected(hit: hit, wallId: wallData.id)
    onSimpleTapFeedback(["success": true, "message": "Pared seleccionada"]) 
    onSimpleWallSelected(wallData.toDictionary())
  }

  private func highlightWallSelected(hit: SCNHitTestResult, wallId: String) {
    guard selectedWallNode != nil else { return }

    // If it's already marked as scanned, keep it green and don't override.
    if scannedWallIds.contains(wallId) {
      return
    }

    let overlayNode = makeOverlayNode(for: hit.node, color: UIColor.systemYellow)
    selectionOverlay = overlayNode
    hit.node.parent?.addChildNode(overlayNode)
  }

  private func makeOverlayNode(for node: SCNNode, color: UIColor) -> SCNNode {
    guard let geometry = node.geometry else {
      return SCNNode()
    }

    let overlayGeometry = geometry.copy() as! SCNGeometry
    let material = SCNMaterial()
    material.diffuse.contents = color.withAlphaComponent(0.20)
    material.emission.contents = color.withAlphaComponent(0.60)
    material.isDoubleSided = true
    overlayGeometry.materials = [material]

    let overlayNode = SCNNode(geometry: overlayGeometry)
    overlayNode.transform = node.transform
    overlayNode.position = node.position
    overlayNode.rotation = node.rotation
    overlayNode.scale = node.scale
    overlayNode.renderingOrder = 999
    return overlayNode
  }

  private func setIsometricCamera(for node: SCNNode) {
    let (center, radius) = node.boundingSphere
    let safeRadius = max(radius, 0.05)

    // Center returned by boundingSphere is in the node's local space.
    // Convert it into the parent's coordinate space so camera positioning is robust.
    let target = node.convertPosition(center, to: node.parent)

    // Isometric-ish: diagonal, above the model.
    let distance = safeRadius * 2.2
    cameraNode.position = SCNVector3(target.x + distance, target.y + distance, target.z + distance)
    cameraNode.look(at: target)

    // Orthographic scale should roughly match the model footprint.
    cameraNode.camera?.usesOrthographicProjection = true
    cameraNode.camera?.orthographicScale = Double(safeRadius * 1.6)
    cameraNode.camera?.zFar = Double(distance * 20.0)
  }
}
