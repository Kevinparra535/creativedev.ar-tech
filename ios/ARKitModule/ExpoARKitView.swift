import UIKit
import RealityKit
import ARKit
import ExpoModulesCore

class ExpoARKitView: ExpoView {
  private var arView: ARView!
  private var isInitialized = false

  // Event emitters
  let onARInitialized = EventDispatcher()
  let onARError = EventDispatcher()
  let onModelLoaded = EventDispatcher()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    setupARView()
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  private func setupARView() {
    // Initialize ARView with RealityKit
    arView = ARView(frame: self.bounds)
    arView.autoresizingMask = [.flexibleWidth, .flexibleHeight]

    // Configure AR session
    let config = ARWorldTrackingConfiguration()
    config.planeDetection = [.horizontal, .vertical]
    config.environmentTexturing = .automatic

    // Check if device supports AR
    if ARWorldTrackingConfiguration.isSupported {
      arView.session.run(config)

      // Add basic lighting
      arView.environment.lighting.intensityExponent = 1.5

      addSubview(arView)
      isInitialized = true

      // Notify React Native
      onARInitialized([
        "success": true,
        "message": "AR session started successfully"
      ])
    } else {
      // Device doesn't support AR
      onARError([
        "error": "ARKit not supported on this device"
      ])
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

  // Cleanup
  deinit {
    arView?.session.pause()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    arView?.frame = bounds
  }
}
