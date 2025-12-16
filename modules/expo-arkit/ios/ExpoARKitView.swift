import UIKit
import SceneKit
import ARKit
import ExpoModulesCore

class ExpoARKitView: ExpoView {
  private var sceneView: ARSCNView!
  private var isInitialized = false

  private var coachingOverlay: ARCoachingOverlayView?

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

  // Deterministic tracking of the most recently created placement anchor.
  // Dictionary iteration order is not stable; relying on `.values.last` can attach models to the wrong anchor.
  private var lastPlacementAnchorId: UUID?

  // Placement preview (reticle + confirm)
  private var placementPreviewActive: Bool = false
  private var placementPreviewDisplayLink: CADisplayLink?
  private var placementReticleNode: SCNNode?
  private var placementPreviewLastValidTransform: simd_float4x4?
  private var placementPreviewIsValid: Bool = false
  private var placementPreviewLastEventAt: CFTimeInterval = 0

  // Selected model for manipulation
  private var selectedNode: SCNNode?

  // Plane visualization control
  private var planesVisible: Bool = true

  // Alignment debug overlay
  private var alignmentDebugEnabled: Bool = false
  private var alignmentDebugModelId: UUID?
  private var alignmentDebugVirtualNormalModelSpace: simd_float3?
  private var alignmentDebugRealNormalWorldSpace: simd_float3?
  private var alignmentDebugRootNode: SCNNode?

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
  let onPlacementPreviewUpdated = EventDispatcher()

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

      // Native AR guidance overlay ("apunta al suelo", move device, etc.)
      if #available(iOS 13.0, *) {
        let overlay = ARCoachingOverlayView()
        overlay.session = sceneView.session
        overlay.goal = .horizontalPlane
        overlay.activatesAutomatically = true
        overlay.translatesAutoresizingMaskIntoConstraints = false
        addSubview(overlay)
        NSLayoutConstraint.activate([
          overlay.topAnchor.constraint(equalTo: topAnchor),
          overlay.bottomAnchor.constraint(equalTo: bottomAnchor),
          overlay.leadingAnchor.constraint(equalTo: leadingAnchor),
          overlay.trailingAnchor.constraint(equalTo: trailingAnchor)
        ])
        coachingOverlay = overlay
      }

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

      if anchorToLastTap, let lastId = self.lastPlacementAnchorId, let lastAnchor = self.modelAnchors[lastId] {
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

      // Notify success with model ID
      self.onModelLoaded([
        "success": true,
        "message": "Model loaded successfully",
        "path": path,
        "modelId": modelAnchor?.identifier.uuidString ?? ""
      ])
    }
  }

  // MARK: - Tap Gesture Handler
  @objc private func handleTap(_ sender: UITapGestureRecognizer) {
    guard isInitialized else { return }

    // When placement preview mode is active, we don't want taps to place models.
    // (The UX is reticle + explicit confirm button.)
    if placementPreviewActive {
      return
    }

    // Only handle taps when a model is actually pending placement.
    // This prevents accidental taps from creating random anchors and destabilizing subsequent operations.
    guard pendingModelPath != nil else {
      return
    }

    // Get the 2D point where the user tapped
    let touchLocation = sender.location(in: sceneView)

    // Use modern raycast API (iOS 13+) instead of deprecated hitTest
    if #available(iOS 13.0, *) {
      let maxPlacementDistanceMeters: Float = 3.0

      func distanceFromCamera(to transform: simd_float4x4) -> Float? {
        guard let frame = sceneView.session.currentFrame else { return nil }
        let cameraPos = simd_float3(
          frame.camera.transform.columns.3.x,
          frame.camera.transform.columns.3.y,
          frame.camera.transform.columns.3.z
        )
        let hitPos = simd_float3(transform.columns.3.x, transform.columns.3.y, transform.columns.3.z)
        return simd_length(hitPos - cameraPos)
      }

      func isAcceptablePlaneAnchor(_ anchor: ARAnchor?) -> Bool {
        guard let planeAnchor = anchor as? ARPlaneAnchor else {
          // Estimated plane (no anchor). Accept only if we still have no detected planes.
          return detectedPlanesCount == 0
        }

        // Prefer floor / none only (reject tables, seats, etc.)
        if #available(iOS 12.0, *) {
          switch planeAnchor.classification {
          case .floor, .none:
            return true
          @unknown default:
            return false
          }
        }

        return true
      }

      func bestRaycastResult(allowing target: ARRaycastQuery.Target) -> ARRaycastResult? {
        guard let query = sceneView.raycastQuery(from: touchLocation, allowing: target, alignment: .horizontal) else {
          return nil
        }

        let results = sceneView.session.raycast(query)
        for result in results {
          guard isAcceptablePlaneAnchor(result.anchor) else { continue }
          if let d = distanceFromCamera(to: result.worldTransform), d > maxPlacementDistanceMeters {
            continue
          }
          return result
        }
        return nil
      }

      // Prefer real plane geometry. Only allow estimated plane when we still haven't detected any planes.
      let existing = bestRaycastResult(allowing: .existingPlaneGeometry)
      let estimated = (detectedPlanesCount == 0) ? bestRaycastResult(allowing: .estimatedPlane) : nil

      guard let best = existing ?? estimated else {
        onARError(["error": "No se encontró un piso estable cerca. Mueve el dispositivo para detectar el piso y toca más cerca."])
        return
      }

      let planeAnchor = best.anchor as? ARPlaneAnchor
      if #available(iOS 12.0, *), let planeAnchor {
        print("Plane classification: \(planeAnchor.classification)")
      }

      // Create and add ARAnchor at the raycast location
      let anchor = ARAnchor(transform: best.worldTransform)
      sceneView.session.add(anchor: anchor)

      // Save reference to the anchor
      modelAnchors[anchor.identifier] = anchor
      lastPlacementAnchorId = anchor.identifier

      print("Anchor created: \(anchor.identifier)")
      print("Raycast hit plane at: \(best.worldTransform)")
      if let planeAnchor {
        print("Plane anchor ID: \(planeAnchor.identifier)")
      } else {
        print("Raycast hit estimated plane (no anchor)")
      }

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
          "modelId": anchor.identifier.uuidString,
          "anchorId": anchor.identifier.uuidString,
          "position": [
            "x": Double(anchor.transform.columns.3.x),
            "y": Double(anchor.transform.columns.3.y),
            "z": Double(anchor.transform.columns.3.z)
          ],
          "path": modelPath
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
      lastPlacementAnchorId = anchor.identifier

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
          "modelId": anchor.identifier.uuidString,
          "anchorId": anchor.identifier.uuidString,
          "position": [
            "x": Double(anchor.transform.columns.3.x),
            "y": Double(anchor.transform.columns.3.y),
            "z": Double(anchor.transform.columns.3.z)
          ],
          "path": modelPath
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

  // MARK: - Placement Preview (Reticle + Confirm)
  func startPlacementPreview(path: String, scale: Float) {
    pendingModelPath = path
    pendingModelScale = scale

    placementPreviewActive = true
    placementPreviewIsValid = false
    placementPreviewLastValidTransform = nil
    placementPreviewLastEventAt = 0

    ensurePlacementReticleNode()
    placementReticleNode?.isHidden = true

    startPlacementPreviewDisplayLink()
  }

  func stopPlacementPreview() {
    placementPreviewActive = false
    placementPreviewIsValid = false
    placementPreviewLastValidTransform = nil
    placementReticleNode?.isHidden = true
    stopPlacementPreviewDisplayLink()

    // Let RN disable the confirm button.
    onPlacementPreviewUpdated([
      "valid": false
    ])
  }

  func confirmPlacement() {
    guard placementPreviewActive else {
      onARError(["error": "Placement preview no está activo"]) 
      return
    }
    guard placementPreviewIsValid, let transform = placementPreviewLastValidTransform else {
      onARError(["error": "No hay una superficie válida para colocar. Mueve el dispositivo y apunta al piso."])
      return
    }
    guard let modelPath = pendingModelPath else {
      onARError(["error": "No hay modelo pendiente para colocar"]) 
      return
    }

    let anchor = ARAnchor(transform: transform)
    sceneView.session.add(anchor: anchor)
    modelAnchors[anchor.identifier] = anchor
    lastPlacementAnchorId = anchor.identifier

    loadModel(
      path: modelPath,
      scale: pendingModelScale,
      position: [],
      anchorToLastTap: true
    )

    onModelPlaced([
      "success": true,
      "modelId": anchor.identifier.uuidString,
      "anchorId": anchor.identifier.uuidString,
      "position": [
        "x": Double(anchor.transform.columns.3.x),
        "y": Double(anchor.transform.columns.3.y),
        "z": Double(anchor.transform.columns.3.z)
      ],
      "path": modelPath
    ])

    pendingModelPath = nil
    pendingModelScale = 1.0
    stopPlacementPreview()
  }

  private func ensurePlacementReticleNode() {
    if placementReticleNode != nil { return }

    let ring = SCNTorus(ringRadius: 0.065, pipeRadius: 0.0025)
    let material = SCNMaterial()
    material.diffuse.contents = UIColor.systemYellow
    material.emission.contents = UIColor.systemYellow.withAlphaComponent(0.35)
    material.lightingModel = .physicallyBased
    ring.materials = [material]

    let node = SCNNode(geometry: ring)
    node.eulerAngles.x = -.pi / 2
    node.isHidden = true

    placementReticleNode = node
    sceneView.scene.rootNode.addChildNode(node)
  }

  private func startPlacementPreviewDisplayLink() {
    if placementPreviewDisplayLink != nil { return }
    let link = CADisplayLink(target: self, selector: #selector(tickPlacementPreview))
    if #available(iOS 15.0, *) {
      link.preferredFrameRateRange = CAFrameRateRange(minimum: 15, maximum: 30, preferred: 30)
    } else {
      link.preferredFramesPerSecond = 30
    }
    link.add(to: .main, forMode: .common)
    placementPreviewDisplayLink = link
  }

  private func stopPlacementPreviewDisplayLink() {
    placementPreviewDisplayLink?.invalidate()
    placementPreviewDisplayLink = nil
  }

  @objc private func tickPlacementPreview() {
    guard placementPreviewActive else { return }
    guard isInitialized else { return }
    guard #available(iOS 13.0, *) else { return }

    let centerPoint = CGPoint(x: sceneView.bounds.midX, y: sceneView.bounds.midY)

    func raycastFirst(allowing: ARRaycastQuery.Target) -> ARRaycastResult? {
      guard let query = sceneView.raycastQuery(from: centerPoint, allowing: allowing, alignment: .horizontal) else {
        return nil
      }
      return sceneView.session.raycast(query).first
    }

    let resultExisting = raycastFirst(allowing: .existingPlaneGeometry)
    let resultEstimated = resultExisting == nil ? raycastFirst(allowing: .estimatedPlane) : nil
    let hit = resultExisting ?? resultEstimated
    let isEstimated = (resultExisting == nil)

    guard let hit else {
      updatePlacementPreview(valid: false, transform: nil, distance: nil, isEstimated: nil)
      return
    }

    var distanceValue: Float? = nil
    if let frame = sceneView.session.currentFrame {
      let cameraPos = simd_make_float3(frame.camera.transform.columns.3)
      let hitPos = simd_make_float3(hit.worldTransform.columns.3)
      distanceValue = simd_length(hitPos - cameraPos)

      // Distance gate to prevent placing very far away
      if let distanceValue, distanceValue > 3.0 {
        updatePlacementPreview(valid: false, transform: nil, distance: distanceValue, isEstimated: isEstimated)
        return
      }
    }

    updatePlacementPreview(valid: true, transform: hit.worldTransform, distance: distanceValue, isEstimated: isEstimated)
  }

  private func updatePlacementPreview(valid: Bool, transform: simd_float4x4?, distance: Float?, isEstimated: Bool?) {
    let didChangeValid = (valid != placementPreviewIsValid)
    placementPreviewIsValid = valid

    if valid, var t = transform {
      // Small lift to avoid z-fighting
      t.columns.3.y += 0.001
      placementPreviewLastValidTransform = t
      placementReticleNode?.simdTransform = t
      placementReticleNode?.isHidden = false
    } else {
      placementPreviewLastValidTransform = nil
      placementReticleNode?.isHidden = true
    }

    // Throttle events to RN
    let now = CACurrentMediaTime()
    if !didChangeValid && (now - placementPreviewLastEventAt) < 0.25 {
      return
    }
    placementPreviewLastEventAt = now

    var payload: [String: Any] = [
      "valid": valid
    ]

    if let distance {
      payload["distance"] = Double(distance)
    }
    if let isEstimated {
      payload["isEstimated"] = isEstimated
    }
    if valid, let t = transform {
      payload["position"] = [
        "x": Double(t.columns.3.x),
        "y": Double(t.columns.3.y),
        "z": Double(t.columns.3.z)
      ]
    }

    onPlacementPreviewUpdated(payload)
  }

  // MARK: - Anchor Management
  func removeAllAnchors() {
    stopPlacementPreview()

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
    lastPlacementAnchorId = nil

    removeAlignmentDebugOverlay()
    alignmentDebugEnabled = false
    alignmentDebugModelId = nil
    alignmentDebugVirtualNormalModelSpace = nil
    alignmentDebugRealNormalWorldSpace = nil

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

  // MARK: - Bounding Box & Model Dimensions

  /// Extract bounding box dimensions from a SceneKit node
  /// Returns min, max, center, and size in world space (accounting for transforms)
  private func getBoundingBox(for node: SCNNode) -> (min: SCNVector3, max: SCNVector3, center: SCNVector3, size: SCNVector3) {
    // Get the local bounding box
    let (localMin, localMax) = node.boundingBox

    // Convert to world space to account for scale/rotation/position
    let worldMin = node.convertPosition(localMin, to: nil)
    let worldMax = node.convertPosition(localMax, to: nil)

    // Calculate actual dimensions in world space
    let width = abs(worldMax.x - worldMin.x)
    let height = abs(worldMax.y - worldMin.y)
    let depth = abs(worldMax.z - worldMin.z)
    let size = SCNVector3(width, height, depth)

    // Calculate center point
    let centerX = (worldMin.x + worldMax.x) / 2
    let centerY = (worldMin.y + worldMax.y) / 2
    let centerZ = (worldMin.z + worldMax.z) / 2
    let center = SCNVector3(centerX, centerY, centerZ)

    return (worldMin, worldMax, center, size)
  }

  /// Get model dimensions and metadata for a given model ID (UUID)
  /// Returns dictionary with dimensions, center, volume, and position
  func getModelDimensions(for modelId: String) -> [String: Any] {
    // Find the node by UUID
    guard let uuid = UUID(uuidString: modelId),
          let node = anchoredNodes[uuid] else {
      return [
        "error": "Model not found with ID: \(modelId)",
        "success": false
      ]
    }

    // Get bounding box information
    let bbox = getBoundingBox(for: node)

    // Calculate volume (in cubic meters if model is real-world scale)
    let volume = bbox.size.x * bbox.size.y * bbox.size.z

    // Get world position
    let worldPosition = node.worldPosition

    let result: [String: Any] = [
      "success": true,
      "modelId": modelId,
      "dimensions": [
        "width": Double(bbox.size.x),
        "height": Double(bbox.size.y),
        "depth": Double(bbox.size.z)
      ],
      "center": [
        "x": Double(bbox.center.x),
        "y": Double(bbox.center.y),
        "z": Double(bbox.center.z)
      ],
      "position": [
        "x": Double(worldPosition.x),
        "y": Double(worldPosition.y),
        "z": Double(worldPosition.z)
      ],
      "volume": Double(volume),
      "scale": [
        "x": Double(node.scale.x),
        "y": Double(node.scale.y),
        "z": Double(node.scale.z)
      ]
    ]

    print("📏 Model Dimensions for \(modelId):")
    print("   Size: \(bbox.size.x)m x \(bbox.size.y)m x \(bbox.size.z)m")
    print("   Volume: \(volume) m³")
    print("   Center: (\(bbox.center.x), \(bbox.center.y), \(bbox.center.z))")

    return result
  }

  /// Get list of all loaded model IDs
  func getAllModelIds() -> [String: Any] {
    let modelIds = anchoredNodes.keys.map { $0.uuidString }

    return [
      "success": true,
      "modelIds": modelIds,
      "count": modelIds.count
    ]
  }

  // MARK: - Model Transformation Methods

  /// Update model transformation (scale, rotation, position)
  func updateModelTransform(modelId: String, scale: [Double]?, rotation: [Double]?, position: [Double]?) -> [String: Any] {
    guard let uuid = UUID(uuidString: modelId),
          let node = anchoredNodes[uuid] else {
      return [
        "error": "Model not found with ID: \(modelId)",
        "success": false
      ]
    }

    // Update scale if provided
    if let scaleValues = scale, scaleValues.count >= 3 {
      node.scale = SCNVector3(
        Float(scaleValues[0]),
        Float(scaleValues[1]),
        Float(scaleValues[2])
      )
      print("Updated scale for model \(modelId): (\(scaleValues[0]), \(scaleValues[1]), \(scaleValues[2]))")
    }

    // Update rotation (euler angles in radians) if provided
    if let rotationValues = rotation, rotationValues.count >= 3 {
      node.eulerAngles = SCNVector3(
        Float(rotationValues[0]),
        Float(rotationValues[1]),
        Float(rotationValues[2])
      )
      print("Updated rotation for model \(modelId): (\(rotationValues[0]), \(rotationValues[1]), \(rotationValues[2]))")
    }

    // Update position if provided
    if let positionValues = position, positionValues.count >= 3 {
      node.position = SCNVector3(
        Float(positionValues[0]),
        Float(positionValues[1]),
        Float(positionValues[2])
      )
      print("Updated position for model \(modelId): (\(positionValues[0]), \(positionValues[1]), \(positionValues[2]))")
    }

    return [
      "success": true,
      "modelId": modelId,
      "message": "Model transform updated successfully"
    ]
  }

  /// Set model scale
  func setModelScale(modelId: String, scale: [Double]) -> [String: Any] {
    guard let uuid = UUID(uuidString: modelId),
          let node = anchoredNodes[uuid] else {
      return [
        "error": "Model not found with ID: \(modelId)",
        "success": false
      ]
    }

    guard scale.count >= 3 else {
      return [
        "error": "Scale must be an array of 3 values [x, y, z]",
        "success": false
      ]
    }

    node.scale = SCNVector3(
      Float(scale[0]),
      Float(scale[1]),
      Float(scale[2])
    )

    print("Set scale for model \(modelId): (\(scale[0]), \(scale[1]), \(scale[2]))")

    return [
      "success": true,
      "modelId": modelId,
      "scale": scale
    ]
  }

  /// Set model rotation (euler angles in radians)
  func setModelRotation(modelId: String, rotation: [Double]) -> [String: Any] {
    guard let uuid = UUID(uuidString: modelId),
          let node = anchoredNodes[uuid] else {
      return [
        "error": "Model not found with ID: \(modelId)",
        "success": false
      ]
    }

    guard rotation.count >= 3 else {
      return [
        "error": "Rotation must be an array of 3 values [x, y, z] in radians",
        "success": false
      ]
    }

    node.eulerAngles = SCNVector3(
      Float(rotation[0]),
      Float(rotation[1]),
      Float(rotation[2])
    )

    print("Set rotation for model \(modelId): (\(rotation[0]), \(rotation[1]), \(rotation[2]))")

    return [
      "success": true,
      "modelId": modelId,
      "rotation": rotation
    ]
  }

  /// Set model position
  func setModelPosition(modelId: String, position: [Double]) -> [String: Any] {
    guard let uuid = UUID(uuidString: modelId),
          let node = anchoredNodes[uuid] else {
      return [
        "error": "Model not found with ID: \(modelId)",
        "success": false
      ]
    }

    guard position.count >= 3 else {
      return [
        "error": "Position must be an array of 3 values [x, y, z]",
        "success": false
      ]
    }

    node.position = SCNVector3(
      Float(position[0]),
      Float(position[1]),
      Float(position[2])
    )

    print("Set position for model \(modelId): (\(position[0]), \(position[1]), \(position[2]))")

    return [
      "success": true,
      "modelId": modelId,
      "position": position
    ]
  }

  /// Get model transformation (scale, rotation, position)
  func getModelTransform(modelId: String) -> [String: Any] {
    guard let uuid = UUID(uuidString: modelId),
          let node = anchoredNodes[uuid] else {
      return [
        "error": "Model not found with ID: \(modelId)",
        "success": false
      ]
    }

    let worldPosition = node.worldPosition

    return [
      "success": true,
      "modelId": modelId,
      "scale": [
        "x": Double(node.scale.x),
        "y": Double(node.scale.y),
        "z": Double(node.scale.z)
      ],
      "rotation": [
        "x": Double(node.eulerAngles.x),
        "y": Double(node.eulerAngles.y),
        "z": Double(node.eulerAngles.z)
      ],
      "position": [
        "x": Double(worldPosition.x),
        "y": Double(worldPosition.y),
        "z": Double(worldPosition.z)
      ]
    ]
  }

  // MARK: - Wall Alignment

  /// Apply alignment transformation to a model
  /// This is used by the wall alignment system to transform a model
  /// based on virtual-to-real wall correspondence
  func applyAlignmentTransform(modelId: String, transform: simd_float4x4) -> [String: Any] {
    guard let uuid = UUID(uuidString: modelId),
          let node = anchoredNodes[uuid] else {
      print("❌ Model not found: \(modelId)")
      return [
        "error": "Model not found with ID: \(modelId)",
        "success": false
      ]
    }

    // Apply transformation with smooth animation
    SCNTransaction.begin()
    SCNTransaction.animationDuration = 0.5

    node.simdTransform = transform

    SCNTransaction.commit()

    updateAlignmentDebugOverlayIfNeeded()

    print("✅ Alignment transform applied to model \(modelId)")

    return [
      "success": true,
      "modelId": modelId,
      "message": "Alignment transform applied successfully"
    ]
  }

  func setAlignmentDebug(modelId: String, enabled: Bool, virtualNormal: [Double], realNormal: [Double]) -> [String: Any] {
    guard let uuid = UUID(uuidString: modelId) else {
      return [
        "success": false,
        "error": "Invalid modelId"
      ]
    }

    alignmentDebugEnabled = enabled
    alignmentDebugModelId = uuid

    if virtualNormal.count >= 3 {
      alignmentDebugVirtualNormalModelSpace = simd_float3(
        Float(virtualNormal[0]),
        Float(virtualNormal[1]),
        Float(virtualNormal[2])
      )
    }

    if realNormal.count >= 3 {
      alignmentDebugRealNormalWorldSpace = simd_float3(
        Float(realNormal[0]),
        Float(realNormal[1]),
        Float(realNormal[2])
      )
    }

    if !enabled {
      removeAlignmentDebugOverlay()
      return ["success": true]
    }

    let angleDegrees = updateAlignmentDebugOverlayIfNeeded()
    return [
      "success": true,
      "angleDegrees": angleDegrees as Any
    ]
  }

  @discardableResult
  private func updateAlignmentDebugOverlayIfNeeded() -> Double? {
    guard alignmentDebugEnabled,
          let modelId = alignmentDebugModelId,
          let modelNode = anchoredNodes[modelId],
          let virtualNormalModel = alignmentDebugVirtualNormalModelSpace,
          let realNormalWorld = alignmentDebugRealNormalWorldSpace else {
      return nil
    }

    let modelWorldPos = modelNode.presentation.worldPosition
    let modelWorldTransform = modelNode.presentation.simdWorldTransform

    let virtualWorld4 = modelWorldTransform * simd_float4(virtualNormalModel, 0)
    let virtualNormalWorld = simd_normalize(simd_float3(virtualWorld4.x, virtualWorld4.y, virtualWorld4.z))
    let realNormalWorldNorm = simd_normalize(realNormalWorld)

    let angleDegrees = computeYawAngleDegrees(a: virtualNormalWorld, b: realNormalWorldNorm)

    let root = alignmentDebugRootNode ?? {
      let node = SCNNode()
      node.name = "alignment_debug_root"
      sceneView.scene.rootNode.addChildNode(node)
      alignmentDebugRootNode = node
      return node
    }()

    root.position = modelWorldPos

    // Clear existing
    root.childNodes.forEach { $0.removeFromParentNode() }

    // World axes
    root.addChildNode(makeArrowNode(direction: simd_float3(1, 0, 0), length: 0.2, color: .systemRed, name: "axis_x"))
    root.addChildNode(makeArrowNode(direction: simd_float3(0, 1, 0), length: 0.2, color: .systemGreen, name: "axis_y"))
    root.addChildNode(makeArrowNode(direction: simd_float3(0, 0, 1), length: 0.2, color: .systemBlue, name: "axis_z"))

    // Normals
    root.addChildNode(makeArrowNode(direction: virtualNormalWorld, length: 0.25, color: .systemTeal, name: "virtual_normal"))
    root.addChildNode(makeArrowNode(direction: realNormalWorldNorm, length: 0.25, color: .systemYellow, name: "real_normal"))

    return angleDegrees
  }

  private func removeAlignmentDebugOverlay() {
    alignmentDebugRootNode?.removeFromParentNode()
    alignmentDebugRootNode = nil
  }

  private func computeYawAngleDegrees(a: simd_float3, b: simd_float3) -> Double? {
    let a2 = simd_float3(a.x, 0, a.z)
    let b2 = simd_float3(b.x, 0, b.z)
    if simd_length(a2) < 1e-5 || simd_length(b2) < 1e-5 {
      return nil
    }
    let an = simd_normalize(a2)
    let bn = simd_normalize(b2)
    let dot = max(-1.0, min(1.0, Double(simd_dot(an, bn))))
    let angle = acos(dot)
    return angle * 180.0 / Double.pi
  }

  private func makeArrowNode(direction: simd_float3, length: Float, color: UIColor, name: String) -> SCNNode {
    let dir = simd_length(direction) > 0 ? simd_normalize(direction) : simd_float3(0, 1, 0)

    let shaftLength = max(0.001, length * 0.8)
    let headLength = max(0.001, length * 0.2)
    let shaftRadius: CGFloat = 0.004
    let headRadius: CGFloat = 0.01

    let shaft = SCNCylinder(radius: shaftRadius, height: CGFloat(shaftLength))
    let shaftMat = SCNMaterial()
    shaftMat.diffuse.contents = color
    shaft.materials = [shaftMat]
    let shaftNode = SCNNode(geometry: shaft)
    shaftNode.position = SCNVector3(0, shaftLength / 2, 0)

    let head = SCNCone(topRadius: 0, bottomRadius: headRadius, height: CGFloat(headLength))
    let headMat = SCNMaterial()
    headMat.diffuse.contents = color
    head.materials = [headMat]
    let headNode = SCNNode(geometry: head)
    headNode.position = SCNVector3(0, shaftLength + headLength / 2, 0)

    let arrow = SCNNode()
    arrow.name = name
    arrow.addChildNode(shaftNode)
    arrow.addChildNode(headNode)

    // Default arrow points +Y; rotate to match direction
    let from = simd_float3(0, 1, 0)
    let to = dir
    let axis = simd_cross(from, to)
    let axisLen = simd_length(axis)
    let dot = simd_dot(from, to)

    if axisLen < 1e-5 {
      if dot < 0 {
        arrow.simdOrientation = simd_quatf(angle: .pi, axis: simd_float3(1, 0, 0))
      }
    } else {
      let angle = acos(max(-1.0, min(1.0, dot)))
      arrow.simdOrientation = simd_quatf(angle: angle, axis: simd_normalize(axis))
    }

    return arrow
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
    stopPlacementPreviewDisplayLink()
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
