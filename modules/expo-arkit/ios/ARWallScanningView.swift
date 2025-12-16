import UIKit
import ARKit
import SceneKit
import ExpoModulesCore

// MARK: - Real Wall Data Structure
struct RealWallData {
  let id: String
  let normal: simd_float3
  let center: simd_float3
  let width: Float
  let height: Float
  let anchorIdentifier: UUID
  
  func toDictionary() -> [String: Any] {
    return [
      "wallId": id,
      "normal": [normal.x, normal.y, normal.z],
      "center": [center.x, center.y, center.z],
      "dimensions": [width, height],
      "anchorId": anchorIdentifier.uuidString
    ]
  }
}

// MARK: - ARWallScanningView Class
class ARWallScanningView: ExpoView, ARSCNViewDelegate, ARSessionDelegate {
  private var sceneView: ARSCNView!
  private var detectedWallPlanes: [UUID: ARPlaneAnchor] = [:]
  private var planeNodes: [UUID: SCNNode] = [:]
  private var selectedRealWall: RealWallData?
  private var selectedPlaneNode: SCNNode?
  
  // Event dispatchers
  let onARSessionStarted = EventDispatcher()
  let onVerticalPlaneDetected = EventDispatcher()
  let onRealWallSelected = EventDispatcher()
  let onRealWallDeselected = EventDispatcher()
  let onARError = EventDispatcher()
  
  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    setupARView()
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  // MARK: - Setup
  
  private func setupARView() {
    // Initialize ARSCNView
    sceneView = ARSCNView(frame: self.bounds)
    sceneView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    
    // Set delegates
    sceneView.delegate = self
    sceneView.session.delegate = self
    
    // Better rendering
    sceneView.antialiasingMode = .multisampling4X
    
    // Enable default lighting
    sceneView.autoenablesDefaultLighting = true
    sceneView.automaticallyUpdatesLighting = true
    
    // Add tap gesture for wall selection
    let tapGesture = UITapGestureRecognizer(target: self, action: #selector(handleTapToSelectWall(_:)))
    sceneView.addGestureRecognizer(tapGesture)
    
    // Add to view hierarchy
    addSubview(sceneView)
    
    print("✅ ARWallScanningView initialized")
  }
  
  // MARK: - AR Session Management
  
  func startWallScanning() {
    print("📡 Starting wall scanning session...")
    
    // Configure AR session for vertical plane detection ONLY
    let config = ARWorldTrackingConfiguration()
    config.planeDetection = [.vertical]  // ONLY vertical planes!
    config.environmentTexturing = .automatic
    
    // Reset tracking and remove existing anchors
    sceneView.session.run(config, options: [.resetTracking, .removeExistingAnchors])
    
    // Clear state
    detectedWallPlanes.removeAll()
    planeNodes.removeAll()
    selectedRealWall = nil
    selectedPlaneNode = nil
    
    // Notify React Native
    onARSessionStarted([
      "started": true,
      "planeDetection": "vertical"
    ])
    
    print("✅ Wall scanning session started")
  }
  
  func stopWallScanning() {
    print("⏸ Stopping wall scanning session...")
    sceneView.session.pause()
  }
  
  // MARK: - Wall Selection
  
  @objc private func handleTapToSelectWall(_ gesture: UITapGestureRecognizer) {
    let location = gesture.location(in: sceneView)

    // Try raycast with query to find vertical planes
    if let query = sceneView.raycastQuery(from: location, allowing: .estimatedPlane, alignment: .vertical) {
      let results = sceneView.session.raycast(query)
      if let firstResult = results.first {
        // Get the plane anchor if it exists
        if let planeAnchor = firstResult.anchor as? ARPlaneAnchor {
          selectWall(from: planeAnchor)
          return
        }
      }
    }
    
    // Fallback: Check if tap hit any of our plane nodes
    let hitResults = sceneView.hitTest(location, options: nil)
    for hit in hitResults {
      // Find the plane anchor for this node
      for (anchorId, node) in planeNodes {
        if hit.node == node || hit.node.parent == node {
          if let planeAnchor = detectedWallPlanes[anchorId] {
            selectWall(from: planeAnchor)
            return
          }
        }
      }
    }
    
    // No plane hit - deselect current if any
    if selectedRealWall != nil {
      deselectWall()
    }
  }
  
  private func selectWall(from anchor: ARPlaneAnchor) {
    // Validate it's a vertical plane
    guard anchor.alignment == .vertical else {
      print("⚠️ Selected plane is not vertical")
      return
    }
    
    // Extract wall data
    guard let wallData = extractRealWallData(from: anchor) else {
      print("⚠️ Failed to extract wall data")
      return
    }
    
    // Deselect previous selection
    deselectWall()
    
    // Store new selection
    selectedRealWall = wallData
    
    // Highlight the selected plane
    if let node = planeNodes[anchor.identifier] {
      highlightSelectedPlane(node)
      selectedPlaneNode = node
    }
    
    // Notify React Native
    onRealWallSelected(wallData.toDictionary())
    
    print("✅ Real wall selected: \(wallData.id)")
    print("   Dimensions: \(wallData.width)m x \(wallData.height)m")
  }
  
  func deselectWall() {
    guard selectedRealWall != nil else { return }
    
    // Remove highlight
    if let node = selectedPlaneNode {
      unhighlightPlane(node)
    }
    
    // Clear selection
    selectedRealWall = nil
    selectedPlaneNode = nil
    
    // Notify React Native
    onRealWallDeselected(["deselected": true])
    
    print("ℹ️ Real wall deselected")
  }
  
  private func extractRealWallData(from anchor: ARPlaneAnchor) -> RealWallData? {
    // Get plane properties
    let extent = anchor.planeExtent
    let width = extent.width
    let height = extent.height
    
    // Validate minimum size (at least 0.5m²)
    let area = width * height
    guard area >= 0.5 else {
      print("⚠️ Plane too small: \(area)m²")
      return nil
    }
    
    // Get transform
    let transform = anchor.transform
    let center = simd_float3(transform.columns.3.x, transform.columns.3.y, transform.columns.3.z)
    
    // Get normal (perpendicular to the plane)
    // For ARPlaneAnchor, the normal is the Y-axis of the transform
    let normal = simd_normalize(simd_float3(transform.columns.1.x, transform.columns.1.y, transform.columns.1.z))
    
    return RealWallData(
      id: UUID().uuidString,
      normal: normal,
      center: center,
      width: width,
      height: height,
      anchorIdentifier: anchor.identifier
    )
  }
  
  func getSelectedWallData() -> RealWallData? {
    return selectedRealWall
  }
  
  // MARK: - Visual Feedback
  
  private func highlightSelectedPlane(_ node: SCNNode) {
    // Change material to bright green
    guard let geometry = node.geometry else { return }
    
    let material = SCNMaterial()
    material.diffuse.contents = UIColor.systemGreen.withAlphaComponent(0.5)
    material.emission.contents = UIColor.systemGreen.withAlphaComponent(0.3)
    material.isDoubleSided = true
    
    geometry.materials = [material]
  }
  
  private func unhighlightPlane(_ node: SCNNode) {
    // Reset to default plane material
    guard let geometry = node.geometry else { return }
    
    let material = SCNMaterial()
    material.diffuse.contents = UIColor.systemGreen.withAlphaComponent(0.2)
    material.isDoubleSided = true
    
    geometry.materials = [material]
  }
  
  // MARK: - ARSCNViewDelegate
  
  func renderer(_ renderer: SCNSceneRenderer, didAdd node: SCNNode, for anchor: ARAnchor) {
    // Only handle plane anchors
    guard let planeAnchor = anchor as? ARPlaneAnchor else { return }
    
    // Only process vertical planes
    guard planeAnchor.alignment == .vertical else { return }
    
    // Store the anchor
    detectedWallPlanes[planeAnchor.identifier] = planeAnchor
    
    // Create visualization node
    let planeNode = createPlaneNode(from: planeAnchor)
    node.addChildNode(planeNode)
    planeNodes[planeAnchor.identifier] = planeNode
    
    // Notify React Native
    DispatchQueue.main.async { [weak self] in
      self?.onVerticalPlaneDetected([
        "planeId": planeAnchor.identifier.uuidString,
        "width": planeAnchor.planeExtent.width,
        "height": planeAnchor.planeExtent.height,
        "area": planeAnchor.planeExtent.width * planeAnchor.planeExtent.height,
        "totalPlanes": self?.detectedWallPlanes.count ?? 0
      ])
    }
    
    print("🟢 Vertical plane detected: \(planeAnchor.planeExtent.width)m x \(planeAnchor.planeExtent.height)m")
  }
  
  func renderer(_ renderer: SCNSceneRenderer, didUpdate node: SCNNode, for anchor: ARAnchor) {
    guard let planeAnchor = anchor as? ARPlaneAnchor else { return }
    guard planeAnchor.alignment == .vertical else { return }
    
    // Update stored anchor
    detectedWallPlanes[planeAnchor.identifier] = planeAnchor
    
    // Update visualization
    if let planeNode = planeNodes[planeAnchor.identifier] {
      updatePlaneNode(planeNode, with: planeAnchor)
    }
    
    // If this is the selected wall, update its data
    if let selectedWall = selectedRealWall, selectedWall.anchorIdentifier == planeAnchor.identifier {
      if let updatedData = extractRealWallData(from: planeAnchor) {
        selectedRealWall = updatedData
      }
    }
  }
  
  func renderer(_ renderer: SCNSceneRenderer, didRemove node: SCNNode, for anchor: ARAnchor) {
    guard let planeAnchor = anchor as? ARPlaneAnchor else { return }
    
    // Remove from tracking
    detectedWallPlanes.removeValue(forKey: planeAnchor.identifier)
    planeNodes.removeValue(forKey: planeAnchor.identifier)
    
    // If removed plane was selected, deselect
    if let selectedWall = selectedRealWall, selectedWall.anchorIdentifier == planeAnchor.identifier {
      deselectWall()
    }
  }
  
  // MARK: - Plane Visualization
  
  private func createPlaneNode(from anchor: ARPlaneAnchor) -> SCNNode {
    let extent = anchor.planeExtent
    let plane = SCNPlane(width: CGFloat(extent.width), height: CGFloat(extent.height))
    
    // Semi-transparent green material
    let material = SCNMaterial()
    material.diffuse.contents = UIColor.systemGreen.withAlphaComponent(0.2)
    material.isDoubleSided = true
    
    plane.materials = [material]
    
    let planeNode = SCNNode(geometry: plane)
    
    // ARPlaneAnchor's transform already includes rotation
    // We just need to position it at the anchor's center
    planeNode.simdPosition = simd_float3(0, 0, 0)
    
    // Rotate to face the normal (plane is in XY, needs to be perpendicular)
    planeNode.eulerAngles.x = -.pi / 2
    
    return planeNode
  }
  
  private func updatePlaneNode(_ node: SCNNode, with anchor: ARPlaneAnchor) {
    guard let plane = node.geometry as? SCNPlane else { return }
    
    let extent = anchor.planeExtent
    plane.width = CGFloat(extent.width)
    plane.height = CGFloat(extent.height)
    
    // Update position to center
    node.simdPosition = simd_float3(0, 0, 0)
  }
  
  // MARK: - ARSessionDelegate
  
  func session(_ session: ARSession, didFailWithError error: Error) {
    print("❌ AR Session failed: \(error.localizedDescription)")
    
    onARError([
      "error": "session_failed",
      "message": error.localizedDescription
    ])
  }
  
  func sessionWasInterrupted(_ session: ARSession) {
    print("⚠️ AR Session was interrupted")
  }
  
  func sessionInterruptionEnded(_ session: ARSession) {
    print("✅ AR Session interruption ended")
    
    // Restart scanning
    startWallScanning()
  }
}
