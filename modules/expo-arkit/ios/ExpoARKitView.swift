import UIKit
import SceneKit
import ARKit
import ExpoModulesCore

class ExpoARKitView: ExpoView {
  private var sceneView: ARSCNView!
  private var isInitialized = false

  // Track detected planes count for React Native events
  private var detectedPlanesCount: Int = 0

  // Anchor management for tap-to-place functionality
  private var modelAnchors: [UUID: ARAnchor] = [:]
  private var anchoredNodes: [UUID: SCNNode] = [:]
  private var currentModelNode: SCNNode?

  // Model history for undo functionality (keeps track in order)
  private var modelHistory: [(anchor: ARAnchor, node: SCNNode)] = []

  // Pending model for tap-to-place
  private var pendingModelPath: String?
  private var pendingModelScale: Float = 1.0

  // Selected model for manipulation
  private var selectedNode: SCNNode?

  // Plane visualization control
  private var planesVisible: Bool = true

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
  let onModelPlaced = EventDispatcher()

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

    // Add gesture recognizers
    let tapGesture = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
    sceneView.addGestureRecognizer(tapGesture)

    let longPressGesture = UILongPressGestureRecognizer(target: self, action: #selector(handleLongPress(_:)))
    longPressGesture.minimumPressDuration = 0.5
    sceneView.addGestureRecognizer(longPressGesture)

    let panGesture = UIPanGestureRecognizer(target: self, action: #selector(handlePan(_:)))
    sceneView.addGestureRecognizer(panGesture)

    let rotationGesture = UIRotationGestureRecognizer(target: self, action: #selector(handleRotation(_:)))
    sceneView.addGestureRecognizer(rotationGesture)

    let pinchGesture = UIPinchGestureRecognizer(target: self, action: #selector(handlePinch(_:)))
    sceneView.addGestureRecognizer(pinchGesture)

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
  func loadModel(path: String, scale: Float, position: [Double], anchorToLastTap: Bool = false) {
    guard isInitialized else {
      onARError(["error": "AR not initialized"])
      return
    }

    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }

      // Handle both file:// URLs and regular paths
      let fileURL: URL

      if path.hasPrefix("file://") {
        // It's already a file URL string
        guard let url = URL(string: path) else {
          self.onARError(["error": "Invalid file URL: \(path)"])
          return
        }
        fileURL = url
      } else if path.hasPrefix("/") {
        // It's an absolute path
        fileURL = URL(fileURLWithPath: path)
      } else {
        // Try as a file URL first, then as a path
        if let url = URL(string: path), url.scheme == "file" {
          fileURL = url
        } else {
          fileURL = URL(fileURLWithPath: path)
        }
      }

      // Attempt to access security-scoped resource (needed for DocumentPicker files)
      let shouldStopAccessing = fileURL.startAccessingSecurityScopedResource()

      defer {
        if shouldStopAccessing {
          fileURL.stopAccessingSecurityScopedResource()
        }
      }

      // Get the actual file path
      let modelPath = fileURL.path

      // Check if file exists
      guard FileManager.default.fileExists(atPath: modelPath) else {
        self.onARError(["error": "Model file not found at path: \(modelPath). Original path: \(path)"])
        print("❌ File not found - Path: \(modelPath), URL: \(fileURL), Original: \(path)")
        return
      }

      print("✅ Loading model from: \(modelPath)")

      // Load the USDZ file
      guard let scene = try? SCNScene(url: fileURL, options: nil) else {
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

      // Fix transparency issues: ensure all materials are opaque
      modelNode.enumerateChildNodes { (node, _) in
        if let geometry = node.geometry {
          for material in geometry.materials {
            // Ensure materials are opaque and lit properly
            material.transparencyMode = .default
            material.isDoubleSided = false

            // If the material has no diffuse color, set it to white
            if material.diffuse.contents == nil {
              material.diffuse.contents = UIColor.white
            }

            // Enable proper lighting
            material.lightingModel = .physicallyBased
          }
        }
      }

      // Position the model based on mode
      var modelAnchor: ARAnchor?

      if anchorToLastTap, let lastAnchor = Array(self.modelAnchors.values).last {
        // Anchored mode: use transform from the last created anchor
        modelNode.simdTransform = lastAnchor.transform
        self.anchoredNodes[lastAnchor.identifier] = modelNode
        modelAnchor = lastAnchor
        print("Model anchored to: \(lastAnchor.identifier)")
      } else {
        // Camera-relative mode: position relative to camera (existing behavior)
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

          // Create an anchor for this model too (for undo functionality)
          let anchor = ARAnchor(transform: transform)
          self.sceneView.session.add(anchor: anchor)
          self.modelAnchors[anchor.identifier] = anchor
          self.anchoredNodes[anchor.identifier] = modelNode
          modelAnchor = anchor
        } else {
          // Fallback position if no camera frame available
          let x = position.count > 0 ? Float(position[0]) : 0
          let y = position.count > 1 ? Float(position[1]) : 0
          let z = position.count > 2 ? Float(position[2]) : -1
          modelNode.position = SCNVector3(x, y, z)

          // Create anchor at this position
          var transform = matrix_identity_float4x4
          transform.columns.3 = simd_float4(x, y, z, 1)
          let anchor = ARAnchor(transform: transform)
          self.sceneView.session.add(anchor: anchor)
          self.modelAnchors[anchor.identifier] = anchor
          self.anchoredNodes[anchor.identifier] = modelNode
          modelAnchor = anchor
        }
      }

      // Save reference to current model
      self.currentModelNode = modelNode

      // Add to model history for undo (if we have an anchor)
      if let anchor = modelAnchor {
        self.modelHistory.append((anchor: anchor, node: modelNode))
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

  // MARK: - Tap Gesture Handler
  @objc private func handleTap(_ sender: UITapGestureRecognizer) {
    guard isInitialized else { return }

    // Get the 2D point where the user tapped
    let touchLocation = sender.location(in: sceneView)

    // Use modern raycast API (iOS 13+) instead of deprecated hitTest
    if #available(iOS 13.0, *) {
      // Create a raycast query for existing plane anchors
      guard let raycastQuery = sceneView.raycastQuery(from: touchLocation, allowing: .existingPlaneGeometry, alignment: .any) else {
        onARError(["error": "Unable to create raycast query"])
        return
      }

      // Perform the raycast
      let raycastResults = sceneView.session.raycast(raycastQuery)

      guard let firstResult = raycastResults.first,
            let planeAnchor = firstResult.anchor as? ARPlaneAnchor else {
        // No valid plane found
        onARError(["error": "No valid plane found at tap location"])
        return
      }

      // Optional: Filter by plane type (can be customized based on requirements)
      if #available(iOS 12.0, *) {
        // Log plane classification for debugging
        let classification = planeAnchor.classification
        print("Plane classification: \(classification)")

        // Currently accepting all plane types for flexibility
        // Uncomment below to restrict to floor only:
        // guard planeAnchor.classification == .floor else {
        //   onARError(["error": "Please tap on the floor"])
        //   return
        // }
      }

      // Create and add ARAnchor at the raycast location
      let anchor = ARAnchor(transform: firstResult.worldTransform)
      sceneView.session.add(anchor: anchor)

      // Save reference to the anchor
      modelAnchors[anchor.identifier] = anchor

      print("Anchor created: \(anchor.identifier)")
      print("Raycast hit plane at: \(firstResult.worldTransform)")
      print("Plane anchor ID: \(planeAnchor.identifier)")

      // If we have a pending model, load it anchored to this tap
      if let modelPath = pendingModelPath {
        loadModel(
          path: modelPath,
          scale: pendingModelScale,
          position: [],
          anchorToLastTap: true
        )

        // Emit event to React Native
        onModelPlaced([
          "success": true,
          "anchorId": anchor.identifier.uuidString,
          "position": [
            "x": Double(anchor.transform.columns.3.x),
            "y": Double(anchor.transform.columns.3.y),
            "z": Double(anchor.transform.columns.3.z)
          ]
        ])

        // Clear pending state
        pendingModelPath = nil
        pendingModelScale = 1.0
      }
    } else {
      // Fallback for iOS < 13 (deprecated API)
      let hitTestResults = sceneView.hitTest(touchLocation, types: .existingPlane)

      guard let firstHit = hitTestResults.first,
            firstHit.anchor is ARPlaneAnchor else {
        onARError(["error": "No valid plane found at tap location"])
        return
      }

      let anchor = ARAnchor(transform: firstHit.worldTransform)
      sceneView.session.add(anchor: anchor)
      modelAnchors[anchor.identifier] = anchor

      // If we have a pending model, load it anchored to this tap
      if let modelPath = pendingModelPath {
        loadModel(
          path: modelPath,
          scale: pendingModelScale,
          position: [],
          anchorToLastTap: true
        )

        // Emit event to React Native
        onModelPlaced([
          "success": true,
          "anchorId": anchor.identifier.uuidString,
          "position": [
            "x": Double(anchor.transform.columns.3.x),
            "y": Double(anchor.transform.columns.3.y),
            "z": Double(anchor.transform.columns.3.z)
          ]
        ])

        // Clear pending state
        pendingModelPath = nil
        pendingModelScale = 1.0
      }
    }
  }

  // MARK: - Tap-to-Place Model Preparation
  func prepareModelForTapPlacement(path: String, scale: Float) {
    pendingModelPath = path
    pendingModelScale = scale

    print("Prepared model for tap placement: \(path) at scale \(scale)")
    print("Waiting for user to tap on a surface...")
  }

  // MARK: - Anchor Management
  func removeAllAnchors() {
    // Remove all anchored nodes from the scene
    for (_, node) in anchoredNodes {
      node.removeFromParentNode()
    }

    // Remove anchors from the AR session
    for (_, anchor) in modelAnchors {
      sceneView.session.remove(anchor: anchor)
    }

    // Clear internal dictionaries
    anchoredNodes.removeAll()
    modelAnchors.removeAll()
    modelHistory.removeAll()
    currentModelNode = nil
    selectedNode = nil

    print("All anchors and models removed")
  }

  // MARK: - Undo Last Model
  func undoLastModel() {
    guard let lastModel = modelHistory.popLast() else {
      print("No models to undo")
      return
    }

    // Remove the node from the scene
    lastModel.node.removeFromParentNode()

    // Remove the anchor from session
    sceneView.session.remove(anchor: lastModel.anchor)

    // Remove from dictionaries
    anchoredNodes.removeValue(forKey: lastModel.anchor.identifier)
    modelAnchors.removeValue(forKey: lastModel.anchor.identifier)

    // Clear current model if it was the undone one
    if currentModelNode === lastModel.node {
      currentModelNode = nil
    }

    // Clear selection if it was the undone model
    if selectedNode === lastModel.node {
      selectedNode = nil
    }

    print("Undone last model: \(lastModel.anchor.identifier)")
  }

  // MARK: - Plane Visibility Control
  func setPlaneVisibility(_ visible: Bool) {
    planesVisible = visible

    // Update all existing plane visualizations
    sceneView.scene.rootNode.enumerateChildNodes { node, _ in
      if let plane = node.childNodes.first as? Plane {
        plane.isHidden = !visible
      }
    }

    print("Plane visibility set to: \(visible)")
  }

  // MARK: - Gesture Handlers

  @objc private func handleLongPress(_ sender: UILongPressGestureRecognizer) {
    guard sender.state == .began else { return }

    let location = sender.location(in: sceneView)

    // Perform hit test on the scene
    let hitResults = sceneView.hitTest(location, options: [:])

    // Find the first model node (exclude plane visualizations)
    for result in hitResults {
      let node = result.node

      // Check if this node or its parent is a model (not a plane visualization)
      var currentNode: SCNNode? = node
      while currentNode != nil {
        if anchoredNodes.values.contains(where: { $0 === currentNode }) {
          // Found a model node
          if selectedNode === currentNode {
            // Deselect
            deselectNode()
          } else {
            // Select this node
            selectNode(currentNode!)
          }
          return
        }
        currentNode = currentNode?.parent
      }
    }

    // If no model was hit, deselect
    deselectNode()
  }

  private func selectNode(_ node: SCNNode) {
    // Deselect previous node
    deselectNode()

    selectedNode = node

    // Add visual feedback (subtle outline or highlight)
    let outlineNode = SCNNode()
    outlineNode.name = "selection_outline"

    // Create a simple box outline based on the node's bounding box
    let (min, max) = node.boundingBox
    let size = SCNVector3(max.x - min.x, max.y - min.y, max.z - min.z)
    let center = SCNVector3((max.x + min.x) / 2, (max.y + min.y) / 2, (max.z + min.z) / 2)

    let box = SCNBox(width: CGFloat(size.x * 1.1), height: CGFloat(size.y * 1.1), length: CGFloat(size.z * 1.1), chamferRadius: 0)
    let material = SCNMaterial()
    material.diffuse.contents = UIColor.systemBlue.withAlphaComponent(0.3)
    material.fillMode = .lines
    box.materials = [material]

    outlineNode.geometry = box
    outlineNode.position = center

    node.addChildNode(outlineNode)

    print("Selected node")
  }

  private func deselectNode() {
    guard let selected = selectedNode else { return }

    // Remove outline
    selected.childNode(withName: "selection_outline", recursively: false)?.removeFromParentNode()

    selectedNode = nil
    print("Deselected node")
  }

  @objc private func handlePan(_ sender: UIPanGestureRecognizer) {
    guard let selected = selectedNode else { return }

    let location = sender.location(in: sceneView)

    switch sender.state {
    case .changed:
      // Perform raycast to find new position on plane
      if #available(iOS 13.0, *) {
        guard let raycastQuery = sceneView.raycastQuery(from: location, allowing: .existingPlaneGeometry, alignment: .any) else {
          return
        }

        let raycastResults = sceneView.session.raycast(raycastQuery)

        if let firstResult = raycastResults.first {
          // Update node position
          selected.simdWorldTransform = firstResult.worldTransform

          // Update anchor if this node has one
          for (anchorId, node) in anchoredNodes {
            if node === selected {
              if let anchor = modelAnchors[anchorId] {
                // Remove old anchor
                sceneView.session.remove(anchor: anchor)

                // Create new anchor at new position
                let newAnchor = ARAnchor(transform: firstResult.worldTransform)
                sceneView.session.add(anchor: newAnchor)

                // Update dictionaries
                modelAnchors.removeValue(forKey: anchorId)
                anchoredNodes.removeValue(forKey: anchorId)
                modelAnchors[newAnchor.identifier] = newAnchor
                anchoredNodes[newAnchor.identifier] = node

                // Update history
                if let index = modelHistory.firstIndex(where: { $0.anchor.identifier == anchorId }) {
                  modelHistory[index] = (anchor: newAnchor, node: node)
                }

                break
              }
            }
          }
        }
      }
    default:
      break
    }
  }

  @objc private func handleRotation(_ sender: UIRotationGestureRecognizer) {
    guard let selected = selectedNode else { return }

    switch sender.state {
    case .changed:
      // Rotate around Y axis
      selected.eulerAngles.y -= Float(sender.rotation)
      sender.rotation = 0
    default:
      break
    }
  }

  @objc private func handlePinch(_ sender: UIPinchGestureRecognizer) {
    guard let selected = selectedNode else { return }

    switch sender.state {
    case .changed:
      // Scale the node
      let pinchScale = Float(sender.scale)
      let currentScale = selected.scale
      selected.scale = SCNVector3(
        currentScale.x * pinchScale,
        currentScale.y * pinchScale,
        currentScale.z * pinchScale
      )
      sender.scale = 1.0
    default:
      break
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

    // Respect the current plane visibility setting
    plane.isHidden = !planesVisible

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

  func session(_ session: ARSession, didUpdate anchors: [ARAnchor]) {
    // Update positions of anchored models when ARKit refines anchor transforms
    for anchor in anchors {
      // If we have a node associated with this anchor
      if let node = anchoredNodes[anchor.identifier] {
        // Update the node's transform to match the refined anchor position
        node.simdTransform = anchor.transform
      }
    }
  }
}
