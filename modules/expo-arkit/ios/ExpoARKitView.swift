import UIKit
import SceneKit
import ARKit
import ExpoModulesCore

class ExpoARKitView: ExpoView {
  private var sceneView: ARSCNView!
  private var isInitialized = false

  // Track detected planes count for React Native events
  private var detectedPlanesCount: Int = 0

  // Event emitters
  let onARInitialized = EventDispatcher()
  let onARError = EventDispatcher()
  let onModelLoaded = EventDispatcher()
  let onPlaneDetected = EventDispatcher()
  let onPlaneUpdated = EventDispatcher()
  let onPlaneRemoved = EventDispatcher()
  let onPlaneSelected = EventDispatcher()
  let onMeshAdded = EventDispatcher()
  let onMeshUpdated = EventDispatcher()
  let onMeshRemoved = EventDispatcher()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    setupARView()
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  private func setupARView() {
    // Initialize ARSCNView with SceneKit
    sceneView = ARSCNView(frame: self.bounds)
    sceneView.autoresizingMask = [.flexibleWidth, .flexibleHeight]

    // Set delegates
    sceneView.delegate = self
    sceneView.session.delegate = self

    // Enable default lighting
    sceneView.autoenablesDefaultLighting = true
    sceneView.automaticallyUpdatesLighting = true

    // Configure AR session
    let config = ARWorldTrackingConfiguration()
    config.planeDetection = [.horizontal, .vertical]
    config.environmentTexturing = .automatic

    // Check if device supports AR
    if ARWorldTrackingConfiguration.isSupported {
      sceneView.session.run(config)

      addSubview(sceneView)
      isInitialized = true

      // Notify React Native after a short delay to ensure handlers are registered
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
        self?.onARInitialized([
          "success": true,
          "message": "AR session started successfully"
        ])
      }
    } else {
      // Device doesn't support AR
      DispatchQueue.main.async { [weak self] in
        self?.onARError([
          "error": "ARKit not supported on this device"
        ])
      }
    }
  }

  // Method to add a simple test object (red cube)
  func addTestObject() {
    guard isInitialized else {
      onARError(["error": "AR not initialized"])
      return
    }

    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      guard let currentFrame = self.sceneView.session.currentFrame else { return }

      // Create a box geometry
      let box = SCNBox(width: 0.1, height: 0.1, length: 0.1, chamferRadius: 0)

      // Create material
      let material = SCNMaterial()
      material.diffuse.contents = UIColor.red
      box.materials = [material]

      // Create node
      let boxNode = SCNNode(geometry: box)

      // Position it 0.5 meters in front of the camera
      var translation = matrix_identity_float4x4
      translation.columns.3.z = -0.5
      let transform = simd_mul(currentFrame.camera.transform, translation)
      boxNode.simdTransform = transform

      // Add to scene
      self.sceneView.scene.rootNode.addChildNode(boxNode)
    }
  }

  // Method to load USDZ model
  func loadModel(path: String, scale: Float, position: [Double]) {
    guard isInitialized else {
      onARError(["error": "AR not initialized"])
      return
    }

    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }

      // Convert file:// URL if needed
      var modelPath = path
      if modelPath.hasPrefix("file://") {
        modelPath = String(modelPath.dropFirst(7))
      }

      // Check if file exists
      guard FileManager.default.fileExists(atPath: modelPath) else {
        self.onARError(["error": "Model file not found at path: \(modelPath)"])
        return
      }

      // Load the USDZ file
      let url = URL(fileURLWithPath: modelPath)
      guard let scene = try? SCNScene(url: url, options: nil) else {
        self.onARError(["error": "Failed to load USDZ model from: \(modelPath)"])
        return
      }

      // Create a node from the scene
      let modelNode = SCNNode()
      for childNode in scene.rootNode.childNodes {
        modelNode.addChildNode(childNode)
      }

      // Apply scale
      modelNode.scale = SCNVector3(scale, scale, scale)

      // Get current camera position if available
      if let currentFrame = self.sceneView.session.currentFrame {
        // Parse position array (default to [0, 0, -1])
        let x = position.count > 0 ? Float(position[0]) : 0
        let y = position.count > 1 ? Float(position[1]) : 0
        let z = position.count > 2 ? Float(position[2]) : -1

        // Create translation matrix
        var translation = matrix_identity_float4x4
        translation.columns.3.x = x
        translation.columns.3.y = y
        translation.columns.3.z = z

        // Apply camera transform + translation
        let transform = simd_mul(currentFrame.camera.transform, translation)
        modelNode.simdTransform = transform
      } else {
        // Fallback position if no camera frame available
        let x = position.count > 0 ? Float(position[0]) : 0
        let y = position.count > 1 ? Float(position[1]) : 0
        let z = position.count > 2 ? Float(position[2]) : -1
        modelNode.position = SCNVector3(x, y, z)
      }

      // Add to scene
      self.sceneView.scene.rootNode.addChildNode(modelNode)

      // Notify success
      self.onModelLoaded([
        "success": true,
        "message": "Model loaded successfully",
        "path": path
      ])
    }
  }

  // Cleanup
  deinit {
    sceneView?.session.pause()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    sceneView?.frame = bounds
  }

  // Helper method to convert ARPlaneAnchor to dictionary (simplified to avoid serialization issues)
  private func planeAnchorToDictionary(_ planeAnchor: ARPlaneAnchor) -> [String: Any] {
    let alignment: String
    switch planeAnchor.alignment {
    case .horizontal:
      alignment = "horizontal"
    case .vertical:
      alignment = "vertical"
    default:
      alignment = "unknown"
    }

    let classification: String
    if #available(iOS 12.0, *) {
      switch planeAnchor.classification {
      case .wall:
        classification = "wall"
      case .floor:
        classification = "floor"
      case .ceiling:
        classification = "ceiling"
      case .table:
        classification = "table"
      case .seat:
        classification = "seat"
      case .door:
        classification = "door"
      case .window:
        classification = "window"
      default:
        classification = "unknown"
      }
    } else {
      classification = "unknown"
    }

    return [
      "id": planeAnchor.identifier.uuidString,
      "type": classification,
      "alignment": alignment,
      "width": Double(planeAnchor.planeExtent.width),
      "height": Double(planeAnchor.planeExtent.height),
      "centerX": Double(planeAnchor.center.x),
      "centerY": Double(planeAnchor.center.y),
      "centerZ": Double(planeAnchor.center.z)
    ]
  }
}

// MARK: - ARSCNViewDelegate
// Based on Apple's official TrackingAndVisualizingPlanes sample
extension ExpoARKitView: ARSCNViewDelegate {
  func renderer(_ renderer: SCNSceneRenderer, didAdd node: SCNNode, for anchor: ARAnchor) {
    // Place content only for anchors found by plane detection.
    guard let planeAnchor = anchor as? ARPlaneAnchor else { return }

    // Create a custom object to visualize the plane geometry and extent.
    let plane = Plane(anchor: planeAnchor, in: sceneView)

    // Add the visualization to the ARKit-managed node so that it tracks
    // changes in the plane anchor as plane estimation continues.
    node.addChildNode(plane)

    // Update count and notify React Native (on main thread, already running on main)
    detectedPlanesCount += 1

    // Notify React Native - simplified to prevent serialization issues
    onPlaneDetected([
      "plane": planeAnchorToDictionary(planeAnchor),
      "totalPlanes": detectedPlanesCount
    ])
  }

  func renderer(_ renderer: SCNSceneRenderer, didUpdate node: SCNNode, for anchor: ARAnchor) {
    // Update only anchors and nodes set up by `renderer(_:didAdd:for:)`.
    guard let planeAnchor = anchor as? ARPlaneAnchor,
          let plane = node.childNodes.first as? Plane
    else { return }

    // Update plane visualization using the Plane class method
    plane.update(anchor: planeAnchor)

    // CRITICAL: Do NOT send events to React Native on every update
    // This method is called at high frequency (up to 60 fps) and causes serialization issues
    // Only send updates when user explicitly requests plane info or on significant changes
  }

  func renderer(_ renderer: SCNSceneRenderer, didRemove node: SCNNode, for anchor: ARAnchor) {
    guard let planeAnchor = anchor as? ARPlaneAnchor else { return }

    // Update count
    detectedPlanesCount -= 1

    // Notify React Native
    onPlaneRemoved([
      "planeId": planeAnchor.identifier.uuidString,
      "totalPlanes": detectedPlanesCount
    ])
  }
}

// MARK: - ARSessionDelegate
extension ExpoARKitView: ARSessionDelegate {
  func session(_ session: ARSession, didFailWithError error: Error) {
    DispatchQueue.main.async { [weak self] in
      self?.onARError([
        "error": error.localizedDescription
      ])
    }
  }
}
