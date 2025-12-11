import UIKit
import RealityKit
import ARKit
import ExpoModulesCore

class ExpoARKitView: ExpoView, ARSessionDelegate {
  private var arView: ARView!
  private var isInitialized = false

  // Plane detection data
  private var planeAnchors: [UUID: ARPlaneAnchor] = [:]
  private var planeEntities: [UUID: AnchorEntity] = [:]
  private var selectedPlaneId: UUID?

  // Mesh reconstruction data
  private var meshAnchors: [UUID: ARMeshAnchor] = [:]
  private var meshEntities: [UUID: AnchorEntity] = [:]
  private var isMeshVisualizationEnabled = true
  private var meshClassificationColors: [ARMeshClassification: UIColor] = [:]

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
    setupMeshClassificationColors()
    setupARView()
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  private func setupMeshClassificationColors() {
    meshClassificationColors = [
      .floor: UIColor(red: 0.2, green: 0.5, blue: 0.8, alpha: 0.5),
      .wall: UIColor(red: 0.8, green: 0.5, blue: 0.2, alpha: 0.5),
      .ceiling: UIColor(red: 0.6, green: 0.6, blue: 0.6, alpha: 0.5),
      .door: UIColor(red: 0.5, green: 0.8, blue: 0.5, alpha: 0.5),
      .window: UIColor(red: 0.8, green: 0.8, blue: 0.2, alpha: 0.5),
      .seat: UIColor(red: 0.8, green: 0.2, blue: 0.5, alpha: 0.5),
      .table: UIColor(red: 0.5, green: 0.3, blue: 0.8, alpha: 0.5),
      .none: UIColor(red: 0.5, green: 0.5, blue: 0.5, alpha: 0.3)
    ]
  }

  private func setupARView() {
    print("🔧 [ARKit] setupARView called")

    // Initialize ARView with RealityKit
    arView = ARView(frame: self.bounds)
    arView.autoresizingMask = [.flexibleWidth, .flexibleHeight]

    // Configure AR session
    let config = ARWorldTrackingConfiguration()
    config.planeDetection = [.horizontal, .vertical]
    config.environmentTexturing = .automatic

    // Enable Scene Reconstruction
    if ARWorldTrackingConfiguration.supportsSceneReconstruction(.meshWithClassification) {
      config.sceneReconstruction = .meshWithClassification
      print("✅ [ARKit] Scene reconstruction ENABLED: meshWithClassification")
    } else if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
      config.sceneReconstruction = .mesh
      print("✅ [ARKit] Scene reconstruction ENABLED: mesh only (no classification)")
    } else {
      print("⚠️ [ARKit] Scene reconstruction NOT supported on this device")
    }

    print("🔧 [ARKit] Configuration: planeDetection = \(config.planeDetection)")
    print("🔧 [ARKit] Configuration: sceneReconstruction = \(config.sceneReconstruction?.rawValue ?? 0)")

    // Check if device supports AR
    if ARWorldTrackingConfiguration.isSupported {
      print("✅ [ARKit] ARWorldTrackingConfiguration is supported")

      // Set session delegate
      arView.session.delegate = self
      print("✅ [ARKit] Session delegate set")

      arView.session.run(config)
      print("✅ [ARKit] Session started with config")

      // Add basic lighting
      arView.environment.lighting.intensityExponent = 1.5

      // Enable automatic occlusion for mesh geometry
      arView.environment.sceneUnderstanding.options.insert(.occlusion)
      print("✅ [ARKit] Automatic occlusion enabled")

      // Add tap gesture recognizer for plane selection
      let tapGesture = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
      arView.addGestureRecognizer(tapGesture)
      print("✅ [ARKit] Tap gesture recognizer added")

      addSubview(arView)
      isInitialized = true
      print("✅ [ARKit] ARView added to subview, initialization complete")

      // Notify React Native
      onARInitialized([
        "success": true,
        "message": "AR session started successfully"
      ])
    } else {
      print("❌ [ARKit] ARWorldTrackingConfiguration NOT supported on this device")
      // Device doesn't support AR
      onARError([
        "error": "ARKit not supported on this device"
      ])
    }
  }

  // MARK: - Plane Info Structure
  struct PlaneInfo {
    let id: UUID
    let type: ARPlaneAnchor.Classification
    let alignment: ARPlaneAnchor.Alignment
    let extent: SIMD3<Float>
    let center: SIMD3<Float>

    func toDictionary() -> [String: Any] {
      return [
        "id": id.uuidString,
        "type": classificationString(),
        "alignment": alignmentString(),
        "width": extent.x,
        "height": extent.z,
        "centerX": center.x,
        "centerY": center.y,
        "centerZ": center.z
      ]
    }

    func classificationString() -> String {
      switch type {
      case .wall:
        return "wall"
      case .floor:
        return "floor"
      case .ceiling:
        return "ceiling"
      case .table:
        return "table"
      case .seat:
        return "seat"
      case .door:
        return "door"
      case .window:
        return "window"
      default:
        return "unknown"
      }
    }

    func alignmentString() -> String {
      switch alignment {
      case .horizontal:
        return "horizontal"
      case .vertical:
        return "vertical"
      default:
        return "unknown"
      }
    }
  }

  // MARK: - Mesh Info Structure
  struct MeshInfo {
    let id: UUID
    let vertexCount: Int
    let faceCount: Int
    let classification: ARMeshClassification
    let center: SIMD3<Float>
    let extent: SIMD3<Float>

    func toDictionary() -> [String: Any] {
      return [
        "id": id.uuidString,
        "vertexCount": vertexCount,
        "faceCount": faceCount,
        "classification": classificationString(),
        "centerX": center.x,
        "centerY": center.y,
        "centerZ": center.z,
        "extentX": extent.x,
        "extentY": extent.y,
        "extentZ": extent.z
      ]
    }

    func classificationString() -> String {
      switch classification {
      case .wall:
        return "wall"
      case .floor:
        return "floor"
      case .ceiling:
        return "ceiling"
      case .door:
        return "door"
      case .window:
        return "window"
      case .seat:
        return "seat"
      case .table:
        return "table"
      case .none:
        return "none"
      @unknown default:
        return "unknown"
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

      // Create a simple mesh (box)
      let mesh = MeshResource.generateBox(size: 0.1)
      let material = SimpleMaterial(color: .red, isMetallic: false)
      let modelEntity = ModelEntity(mesh: mesh, materials: [material])

      // Position it 0.5 meters in front of the camera
      modelEntity.position = [0, 0, -0.5]

      // Create anchor
      let anchor = AnchorEntity(world: [0, 0, -0.5])
      anchor.addChild(modelEntity)

      // Add to scene
      self.arView.scene.addAnchor(anchor)
    }
  }

  // Method to load USDZ model from file path
  func loadModel(path: String, scale: Float = 1.0, position: [Float] = [0, 0, -1.0]) {
    guard isInitialized else {
      onARError(["error": "AR not initialized"])
      return
    }

    // Validate file exists
    let fileURL = URL(fileURLWithPath: path)
    guard FileManager.default.fileExists(atPath: path) else {
      onARError(["error": "Model file not found at path: \(path)"])
      return
    }

    // Load model asynchronously
    Task { @MainActor [weak self] in
      guard let self = self else { return }

      do {
        // Load the USDZ model
        let modelEntity = try await ModelEntity.load(contentsOf: fileURL)

        // Apply scale
        modelEntity.scale = [scale, scale, scale]

        // Apply position
        modelEntity.position = SIMD3(x: position[0], y: position[1], z: position[2])

        // Create anchor at specified position
        let anchorPosition = SIMD3(x: position[0], y: position[1], z: position[2])
        let anchor = AnchorEntity(world: anchorPosition)
        anchor.addChild(modelEntity)

        // Add to scene
        self.arView.scene.addAnchor(anchor)

        // Notify success
        self.onModelLoaded([
          "success": true,
          "message": "Model loaded successfully",
          "path": path
        ])
      } catch {
        // Handle loading errors
        self.onARError([
          "error": "Failed to load model: \(error.localizedDescription)"
        ])
      }
    }
  }

  // MARK: - ARSessionDelegate Methods
  func session(_ session: ARSession, didAdd anchors: [ARAnchor]) {
    print("📍 [ARKit] didAdd called with \(anchors.count) anchor(s)")
    for anchor in anchors {
      print("📍 [ARKit] Anchor type: \(type(of: anchor))")
      if let planeAnchor = anchor as? ARPlaneAnchor {
        print("✈️ [ARKit] PLANE DETECTED: \(planeAnchor.identifier)")
        print("   - Alignment: \(planeAnchor.alignment)")
        print("   - Extent: \(planeAnchor.extent)")
        print("   - Classification: \(planeAnchor.classification)")
        handlePlaneDetected(planeAnchor)
      } else if let meshAnchor = anchor as? ARMeshAnchor {
        print("🕸️ [ARKit] MESH DETECTED: \(meshAnchor.identifier)")
        print("   - Vertices: \(meshAnchor.geometry.vertices.count)")
        print("   - Faces: \(meshAnchor.geometry.faces.count)")
        handleMeshAdded(meshAnchor)
      } else {
        print("⚠️ [ARKit] Anchor is NOT a plane or mesh anchor")
      }
    }
  }

  func session(_ session: ARSession, didUpdate anchors: [ARAnchor]) {
    print("🔄 [ARKit] didUpdate called with \(anchors.count) anchor(s)")
    for anchor in anchors {
      if let planeAnchor = anchor as? ARPlaneAnchor {
        print("✈️ [ARKit] PLANE UPDATED: \(planeAnchor.identifier)")
        handlePlaneUpdated(planeAnchor)
      } else if let meshAnchor = anchor as? ARMeshAnchor {
        print("🕸️ [ARKit] MESH UPDATED: \(meshAnchor.identifier)")
        handleMeshUpdated(meshAnchor)
      }
    }
  }

  func session(_ session: ARSession, didRemove anchors: [ARAnchor]) {
    print("🗑️ [ARKit] didRemove called with \(anchors.count) anchor(s)")
    for anchor in anchors {
      if let planeAnchor = anchor as? ARPlaneAnchor {
        print("✈️ [ARKit] PLANE REMOVED: \(planeAnchor.identifier)")
        handlePlaneRemoved(planeAnchor)
      } else if let meshAnchor = anchor as? ARMeshAnchor {
        print("🕸️ [ARKit] MESH REMOVED: \(meshAnchor.identifier)")
        handleMeshRemoved(meshAnchor)
      }
    }
  }

  // Additional delegate methods for debugging
  func session(_ session: ARSession, didFailWithError error: Error) {
    print("❌ [ARKit] Session failed with error: \(error.localizedDescription)")
    onARError(["error": "AR session failed: \(error.localizedDescription)"])
  }

  func sessionWasInterrupted(_ session: ARSession) {
    print("⚠️ [ARKit] Session was interrupted")
  }

  func sessionInterruptionEnded(_ session: ARSession) {
    print("✅ [ARKit] Session interruption ended")
  }

  func session(_ session: ARSession, cameraDidChangeTrackingState camera: ARCamera) {
    print("📹 [ARKit] Camera tracking state: \(camera.trackingState)")
    switch camera.trackingState {
    case .notAvailable:
      print("   ❌ Tracking NOT available")
    case .limited(let reason):
      print("   ⚠️ Tracking LIMITED: \(reason)")
      switch reason {
      case .excessiveMotion:
        print("      - Excessive motion")
      case .insufficientFeatures:
        print("      - Insufficient features")
      case .initializing:
        print("      - Initializing")
      case .relocalizing:
        print("      - Relocalizing")
      @unknown default:
        print("      - Unknown reason")
      }
    case .normal:
      print("   ✅ Tracking NORMAL")
    }
  }

  // MARK: - Plane Detection Handlers
  private func handlePlaneDetected(_ planeAnchor: ARPlaneAnchor) {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }

      // Store plane anchor
      self.planeAnchors[planeAnchor.identifier] = planeAnchor

      // Create visualization
      let planeEntity = self.createPlaneVisualization(for: planeAnchor)

      // Create anchor and add to scene
      let anchorEntity = AnchorEntity(anchor: planeAnchor)
      anchorEntity.addChild(planeEntity)
      self.arView.scene.addAnchor(anchorEntity)

      // Store entity reference
      self.planeEntities[planeAnchor.identifier] = anchorEntity

      // Emit event
      let planeInfo = PlaneInfo(
        id: planeAnchor.identifier,
        type: planeAnchor.classification,
        alignment: planeAnchor.alignment,
        extent: planeAnchor.extent,
        center: planeAnchor.center
      )

      self.onPlaneDetected([
        "plane": planeInfo.toDictionary(),
        "totalPlanes": self.planeAnchors.count
      ])
    }
  }

  private func handlePlaneUpdated(_ planeAnchor: ARPlaneAnchor) {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }

      // Update stored anchor
      self.planeAnchors[planeAnchor.identifier] = planeAnchor

      // Remove old visualization
      if let existingEntity = self.planeEntities[planeAnchor.identifier] {
        self.arView.scene.removeAnchor(existingEntity)
      }

      // Create new visualization with updated geometry
      let planeEntity = self.createPlaneVisualization(for: planeAnchor)

      // Create new anchor and add to scene
      let anchorEntity = AnchorEntity(anchor: planeAnchor)
      anchorEntity.addChild(planeEntity)
      self.arView.scene.addAnchor(anchorEntity)

      // Update entity reference
      self.planeEntities[planeAnchor.identifier] = anchorEntity

      // Emit event
      let planeInfo = PlaneInfo(
        id: planeAnchor.identifier,
        type: planeAnchor.classification,
        alignment: planeAnchor.alignment,
        extent: planeAnchor.extent,
        center: planeAnchor.center
      )

      self.onPlaneUpdated([
        "plane": planeInfo.toDictionary(),
        "totalPlanes": self.planeAnchors.count
      ])
    }
  }

  private func handlePlaneRemoved(_ planeAnchor: ARPlaneAnchor) {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }

      // Remove from storage
      self.planeAnchors.removeValue(forKey: planeAnchor.identifier)

      // Remove visualization
      if let entity = self.planeEntities.removeValue(forKey: planeAnchor.identifier) {
        self.arView.scene.removeAnchor(entity)
      }

      // Clear selection if this was the selected plane
      if self.selectedPlaneId == planeAnchor.identifier {
        self.selectedPlaneId = nil
      }

      // Emit event
      self.onPlaneRemoved([
        "planeId": planeAnchor.identifier.uuidString,
        "totalPlanes": self.planeAnchors.count
      ])
    }
  }

  // MARK: - Mesh Reconstruction Handlers
  private func handleMeshAdded(_ meshAnchor: ARMeshAnchor) {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }

      // Store mesh anchor
      self.meshAnchors[meshAnchor.identifier] = meshAnchor

      // Create visualization if enabled
      if self.isMeshVisualizationEnabled {
        let meshEntity = self.createMeshVisualization(for: meshAnchor)
        let anchorEntity = AnchorEntity(anchor: meshAnchor)
        anchorEntity.addChild(meshEntity)
        self.arView.scene.addAnchor(anchorEntity)
        self.meshEntities[meshAnchor.identifier] = anchorEntity
      }

      // Emit event
      let meshInfo = self.createMeshInfo(from: meshAnchor)
      self.onMeshAdded([
        "mesh": meshInfo.toDictionary(),
        "totalMeshes": self.meshAnchors.count
      ])
    }
  }

  private func handleMeshUpdated(_ meshAnchor: ARMeshAnchor) {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }

      // Update storage
      self.meshAnchors[meshAnchor.identifier] = meshAnchor

      // Update visualization
      if self.isMeshVisualizationEnabled {
        // Remove old entity
        if let existingEntity = self.meshEntities[meshAnchor.identifier] {
          self.arView.scene.removeAnchor(existingEntity)
        }

        // Create new visualization
        let meshEntity = self.createMeshVisualization(for: meshAnchor)
        let anchorEntity = AnchorEntity(anchor: meshAnchor)
        anchorEntity.addChild(meshEntity)
        self.arView.scene.addAnchor(anchorEntity)
        self.meshEntities[meshAnchor.identifier] = anchorEntity
      }

      // Emit event
      let meshInfo = self.createMeshInfo(from: meshAnchor)
      self.onMeshUpdated([
        "mesh": meshInfo.toDictionary(),
        "totalMeshes": self.meshAnchors.count
      ])
    }
  }

  private func handleMeshRemoved(_ meshAnchor: ARMeshAnchor) {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }

      // Remove from storage
      self.meshAnchors.removeValue(forKey: meshAnchor.identifier)

      // Remove visualization
      if let entity = self.meshEntities.removeValue(forKey: meshAnchor.identifier) {
        self.arView.scene.removeAnchor(entity)
      }

      // Emit event
      self.onMeshRemoved([
        "meshId": meshAnchor.identifier.uuidString,
        "totalMeshes": self.meshAnchors.count
      ])
    }
  }

  // MARK: - Plane Visualization
  private func createPlaneVisualization(for planeAnchor: ARPlaneAnchor) -> Entity {
    let planeEntity = Entity()

    // Create mesh from plane geometry
    let planeMesh = createPlaneMesh(from: planeAnchor.geometry)

    // Create fill (semi-transparent base)
    let fillEntity = ModelEntity(mesh: planeMesh, materials: [createFillMaterial(for: planeAnchor)])
    fillEntity.position.y = -0.001 // Slightly below to avoid z-fighting

    // Create grid (wireframe)
    let gridEntity = ModelEntity(mesh: planeMesh, materials: [createGridMaterial(for: planeAnchor)])

    // Add both to plane entity
    planeEntity.addChild(fillEntity)
    planeEntity.addChild(gridEntity)

    return planeEntity
  }

  private func createPlaneMesh(from geometry: ARPlaneGeometry) -> MeshResource {
    var descriptor = MeshDescriptor(name: "plane")

    // Convert ARKit vertices to RealityKit format
    let vertices = geometry.vertices.map { vertex in
      SIMD3<Float>(vertex.x, 0, vertex.z)
    }

    // Convert texture coordinates (not used but required)
    let textureCoordinates = geometry.textureCoordinates.map { coord in
      SIMD2<Float>(coord.x, coord.y)
    }

    // Convert indices to UInt32
    let indices = geometry.triangleIndices.map { UInt32($0) }

    descriptor.positions = MeshBuffers.Positions(vertices)
    descriptor.textureCoordinates = MeshBuffers.TextureCoordinates(textureCoordinates)
    descriptor.primitives = .triangles(indices)

    return try! MeshResource.generate(from: [descriptor])
  }

  private func createGridMaterial(for planeAnchor: ARPlaneAnchor) -> Material {
    var material = UnlitMaterial()

    // Color based on alignment
    let color: UIColor
    if planeAnchor.alignment == .horizontal {
      // Blue for horizontal planes
      color = UIColor(red: 0.2, green: 0.6, blue: 1.0, alpha: 0.6)
    } else {
      // Orange for vertical planes
      color = UIColor(red: 1.0, green: 0.6, blue: 0.2, alpha: 0.6)
    }

    material.color = .init(tint: color)
    material.blending = .transparent(opacity: .init(floatLiteral: 0.6))

    return material
  }

  private func createFillMaterial(for planeAnchor: ARPlaneAnchor) -> Material {
    var material = UnlitMaterial()

    // Color based on alignment (more transparent than grid)
    let color: UIColor
    if planeAnchor.alignment == .horizontal {
      // Blue for horizontal planes
      color = UIColor(red: 0.2, green: 0.6, blue: 1.0, alpha: 0.2)
    } else {
      // Orange for vertical planes
      color = UIColor(red: 1.0, green: 0.6, blue: 0.2, alpha: 0.2)
    }

    material.color = .init(tint: color)
    material.blending = .transparent(opacity: .init(floatLiteral: 0.2))

    return material
  }

  // MARK: - Mesh Visualization
  private func createMeshVisualization(for meshAnchor: ARMeshAnchor) -> Entity {
    let meshEntity = Entity()

    // Create MeshResource from ARMeshGeometry
    guard let meshResource = createMeshResource(from: meshAnchor.geometry) else {
      print("⚠️ [ARKit] Failed to create mesh resource")
      return meshEntity
    }

    // Determine dominant classification
    let dominantClassification = getDominantClassification(from: meshAnchor)

    // Create material based on classification
    let material = createMeshMaterial(for: dominantClassification)

    // Create ModelEntity with the mesh
    let modelEntity = ModelEntity(mesh: meshResource, materials: [material])
    meshEntity.addChild(modelEntity)

    return meshEntity
  }

  private func createMeshResource(from geometry: ARMeshGeometry) -> MeshResource? {
    var descriptor = MeshDescriptor(name: "mesh")

    // Convert vertices from ARMeshGeometry
    let vertices = (0..<geometry.vertices.count).map { index -> SIMD3<Float> in
      let vertex = geometry.vertices[index]
      return SIMD3<Float>(vertex.x, vertex.y, vertex.z)
    }

    // Convert faces (triangles)
    let faceCount = geometry.faces.count
    var indices: [UInt32] = []
    indices.reserveCapacity(faceCount * 3)

    for faceIndex in 0..<faceCount {
      let face = geometry.faces[faceIndex]
      indices.append(UInt32(face[0]))
      indices.append(UInt32(face[1]))
      indices.append(UInt32(face[2]))
    }

    descriptor.positions = MeshBuffers.Positions(vertices)
    descriptor.primitives = .triangles(indices)

    do {
      return try MeshResource.generate(from: [descriptor])
    } catch {
      print("❌ [ARKit] Error generating mesh resource: \(error)")
      return nil
    }
  }

  private func getDominantClassification(from meshAnchor: ARMeshAnchor) -> ARMeshClassification {
    guard let classifications = meshAnchor.geometry.classifications else {
      return .none
    }

    // Count classifications
    var counts: [ARMeshClassification: Int] = [:]
    for i in 0..<classifications.count {
      let classification = classifications[i]
      counts[classification, default: 0] += 1
    }

    // Return the most common
    return counts.max(by: { $0.value < $1.value })?.key ?? .none
  }

  private func createMeshMaterial(for classification: ARMeshClassification) -> Material {
    var material = UnlitMaterial()

    // Color based on classification
    let color = meshClassificationColors[classification] ?? UIColor(white: 0.5, alpha: 0.3)

    material.color = .init(tint: color)
    material.blending = .transparent(opacity: .init(floatLiteral: Double(color.cgColor.alpha)))

    return material
  }

  // MARK: - Mesh Helpers
  private func createMeshInfo(from meshAnchor: ARMeshAnchor) -> MeshInfo {
    let geometry = meshAnchor.geometry

    // Calculate bounding box center and extent
    let positions = (0..<geometry.vertices.count).map { geometry.vertices[$0] }
    let minX = positions.map { $0.x }.min() ?? 0
    let maxX = positions.map { $0.x }.max() ?? 0
    let minY = positions.map { $0.y }.min() ?? 0
    let maxY = positions.map { $0.y }.max() ?? 0
    let minZ = positions.map { $0.z }.min() ?? 0
    let maxZ = positions.map { $0.z }.max() ?? 0

    let center = SIMD3<Float>(
      (minX + maxX) / 2,
      (minY + maxY) / 2,
      (minZ + maxZ) / 2
    )

    let extent = SIMD3<Float>(
      maxX - minX,
      maxY - minY,
      maxZ - minZ
    )

    let dominantClassification = getDominantClassification(from: meshAnchor)

    return MeshInfo(
      id: meshAnchor.identifier,
      vertexCount: geometry.vertices.count,
      faceCount: geometry.faces.count,
      classification: dominantClassification,
      center: center,
      extent: extent
    )
  }

  func setMeshVisualizationEnabled(_ enabled: Bool) {
    isMeshVisualizationEnabled = enabled

    if enabled {
      // Recreate visualizations
      for (id, meshAnchor) in meshAnchors {
        let meshEntity = createMeshVisualization(for: meshAnchor)
        let anchorEntity = AnchorEntity(anchor: meshAnchor)
        anchorEntity.addChild(meshEntity)
        arView.scene.addAnchor(anchorEntity)
        meshEntities[id] = anchorEntity
      }
    } else {
      // Remove visualizations (but keep occlusion)
      for entity in meshEntities.values {
        arView.scene.removeAnchor(entity)
      }
      meshEntities.removeAll()
    }
  }

  // MARK: - Plane Selection
  @objc private func handleTap(_ gesture: UITapGestureRecognizer) {
    let location = gesture.location(in: arView)

    // Perform raycast to find planes
    let results = arView.raycast(from: location, allowing: .existingPlaneGeometry, alignment: .any)

    if let firstResult = results.first,
       let planeAnchor = firstResult.anchor as? ARPlaneAnchor {
      // Plane was tapped
      handlePlaneSelected(planeAnchor)
    } else {
      // Empty space was tapped - deselect
      handlePlaneDeselected()
    }
  }

  private func handlePlaneSelected(_ planeAnchor: ARPlaneAnchor) {
    let previousId = selectedPlaneId
    let newId = planeAnchor.identifier

    // If same plane, deselect
    if previousId == newId {
      handlePlaneDeselected()
      return
    }

    // Update selection
    selectedPlaneId = newId
    updatePlaneSelectionVisuals(previousId: previousId, currentId: newId)

    // Emit event
    let planeInfo = PlaneInfo(
      id: planeAnchor.identifier,
      type: planeAnchor.classification,
      alignment: planeAnchor.alignment,
      extent: planeAnchor.extent,
      center: planeAnchor.center
    )

    DispatchQueue.main.async { [weak self] in
      self?.onPlaneSelected([
        "plane": planeInfo.toDictionary(),
        "selected": true
      ])
    }
  }

  private func handlePlaneDeselected() {
    guard let previousId = selectedPlaneId else { return }

    selectedPlaneId = nil
    updatePlaneSelectionVisuals(previousId: previousId, currentId: nil)

    DispatchQueue.main.async { [weak self] in
      self?.onPlaneSelected([
        "selected": false
      ])
    }
  }

  private func updatePlaneSelectionVisuals(previousId: UUID?, currentId: UUID?) {
    // Reset previous selection
    if let prevId = previousId,
       let prevAnchor = planeAnchors[prevId] {
      resetPlaneVisuals(planeId: prevId, planeAnchor: prevAnchor)
    }

    // Highlight new selection
    if let currId = currentId,
       let currAnchor = planeAnchors[currId] {
      highlightPlaneVisuals(planeId: currId, planeAnchor: currAnchor)
    }
  }

  private func highlightPlaneVisuals(planeId: UUID, planeAnchor: ARPlaneAnchor) {
    guard let anchorEntity = planeEntities[planeId] else { return }

    // Remove old visualization
    arView.scene.removeAnchor(anchorEntity)

    // Create highlighted visualization
    let planeEntity = Entity()
    let planeMesh = createPlaneMesh(from: planeAnchor.geometry)

    // Yellow highlight materials
    var fillMaterial = UnlitMaterial()
    fillMaterial.color = .init(tint: UIColor(red: 1.0, green: 1.0, blue: 0.0, alpha: 0.3))
    fillMaterial.blending = .transparent(opacity: .init(floatLiteral: 0.3))

    var gridMaterial = UnlitMaterial()
    gridMaterial.color = .init(tint: UIColor(red: 1.0, green: 1.0, blue: 0.0, alpha: 0.9))
    gridMaterial.blending = .transparent(opacity: .init(floatLiteral: 0.9))

    let fillEntity = ModelEntity(mesh: planeMesh, materials: [fillMaterial])
    fillEntity.position.y = -0.001

    let gridEntity = ModelEntity(mesh: planeMesh, materials: [gridMaterial])

    planeEntity.addChild(fillEntity)
    planeEntity.addChild(gridEntity)

    // Create new anchor and add to scene
    let newAnchorEntity = AnchorEntity(anchor: planeAnchor)
    newAnchorEntity.addChild(planeEntity)
    arView.scene.addAnchor(newAnchorEntity)

    // Update reference
    planeEntities[planeId] = newAnchorEntity
  }

  private func resetPlaneVisuals(planeId: UUID, planeAnchor: ARPlaneAnchor) {
    guard let anchorEntity = planeEntities[planeId] else { return }

    // Remove old visualization
    arView.scene.removeAnchor(anchorEntity)

    // Create normal visualization
    let planeEntity = createPlaneVisualization(for: planeAnchor)

    // Create new anchor and add to scene
    let newAnchorEntity = AnchorEntity(anchor: planeAnchor)
    newAnchorEntity.addChild(planeEntity)
    arView.scene.addAnchor(newAnchorEntity)

    // Update reference
    planeEntities[planeId] = newAnchorEntity
  }

  // Cleanup
  deinit {
    arView?.session.pause()
    // Clean up plane entities
    for entity in planeEntities.values {
      arView?.scene.removeAnchor(entity)
    }
    planeEntities.removeAll()
    planeAnchors.removeAll()

    // Clean up mesh entities
    for entity in meshEntities.values {
      arView?.scene.removeAnchor(entity)
    }
    meshEntities.removeAll()
    meshAnchors.removeAll()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    arView?.frame = bounds
  }
}
