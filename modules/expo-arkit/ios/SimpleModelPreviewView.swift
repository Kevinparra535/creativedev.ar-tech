import UIKit
import SceneKit
import ExpoModulesCore

// Minimal, non-AR model preview view (no wall selection, no gestures, no controls)
class SimpleModelPreviewView: ExpoView {
  private var sceneView: SCNView!
  private var cameraNode: SCNNode!
  private var modelNode: SCNNode?

  let onSimpleModelLoaded = EventDispatcher()
  let onSimpleLoadError = EventDispatcher()

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

    // Let the React Native container provide the gray background.
    sceneView.backgroundColor = .clear

    setupCamera()

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
