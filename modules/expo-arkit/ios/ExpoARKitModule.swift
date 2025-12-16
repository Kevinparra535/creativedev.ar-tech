import ExpoModulesCore
import ARKit
import SceneKit

public class ExpoARKitModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoARKit")

    // Module-level async function to add test object
    AsyncFunction("addTestObject") { (viewTag: Int) -> Void in
      DispatchQueue.main.async { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ExpoARKitView.self) else {
          print("Error: Could not find ARKit view with tag \(viewTag)")
          return
        }
        view.addTestObject()
      }
    }

    // Module-level async function to load USDZ model
    AsyncFunction("loadModel") { (viewTag: Int, path: String, scale: Double, position: [Double]) -> Void in
      DispatchQueue.main.async { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ExpoARKitView.self) else {
          print("Error: Could not find ARKit view with tag \(viewTag)")
          return
        }
        view.loadModel(path: path, scale: Float(scale), position: position)
      }
    }

    // Module-level async function to prepare model for tap placement
    AsyncFunction("placeModelOnTap") { (viewTag: Int, path: String, scale: Double) -> Void in
      DispatchQueue.main.async { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ExpoARKitView.self) else {
          print("Error: Could not find ARKit view with tag \(viewTag)")
          return
        }
        view.prepareModelForTapPlacement(path: path, scale: Float(scale))
      }
    }

    // Placement preview (reticle + confirm)
    AsyncFunction("startPlacementPreview") { (viewTag: Int, path: String, scale: Double) -> Void in
      DispatchQueue.main.async { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ExpoARKitView.self) else {
          print("Error: Could not find ARKit view with tag \(viewTag)")
          return
        }
        view.startPlacementPreview(path: path, scale: Float(scale))
      }
    }

    AsyncFunction("stopPlacementPreview") { (viewTag: Int) -> Void in
      DispatchQueue.main.async { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ExpoARKitView.self) else {
          print("Error: Could not find ARKit view with tag \(viewTag)")
          return
        }
        view.stopPlacementPreview()
      }
    }

    AsyncFunction("confirmPlacement") { (viewTag: Int) -> Void in
      DispatchQueue.main.async { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ExpoARKitView.self) else {
          print("Error: Could not find ARKit view with tag \(viewTag)")
          return
        }
        view.confirmPlacement()
      }
    }

    // Module-level async function to remove all anchors
    AsyncFunction("removeAllAnchors") { (viewTag: Int) -> Void in
      DispatchQueue.main.async { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ExpoARKitView.self) else {
          print("Error: Could not find ARKit view with tag \(viewTag)")
          return
        }
        view.removeAllAnchors()
      }
    }

    // Module-level async function to undo last model
    AsyncFunction("undoLastModel") { (viewTag: Int) -> Void in
      DispatchQueue.main.async { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ExpoARKitView.self) else {
          print("Error: Could not find ARKit view with tag \(viewTag)")
          return
        }
        view.undoLastModel()
      }
    }

    // Module-level async function to set plane visibility
    AsyncFunction("setPlaneVisibility") { (viewTag: Int, visible: Bool) -> Void in
      DispatchQueue.main.async { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ExpoARKitView.self) else {
          print("Error: Could not find ARKit view with tag \(viewTag)")
          return
        }
        view.setPlaneVisibility(visible)
      }
    }

    // Module-level async function to get model dimensions
    AsyncFunction("getModelDimensions") { (viewTag: Int, modelId: String) -> [String: Any] in
      var result: [String: Any] = [:]

      DispatchQueue.main.sync { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ExpoARKitView.self) else {
          result = ["error": "Could not find ARKit view with tag \(viewTag)", "success": false]
          return
        }
        result = view.getModelDimensions(for: modelId)
      }

      return result
    }

    // Module-level async function to get all loaded model IDs
    AsyncFunction("getAllModelIds") { (viewTag: Int) -> [String: Any] in
      var result: [String: Any] = [:]

      DispatchQueue.main.sync { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ExpoARKitView.self) else {
          result = ["error": "Could not find ARKit view with tag \(viewTag)", "success": false]
          return
        }
        result = view.getAllModelIds()
      }

      return result
    }

    // Module-level async function to update model transformation
    AsyncFunction("updateModelTransform") { (viewTag: Int, modelId: String, scale: [Double]?, rotation: [Double]?, position: [Double]?) -> [String: Any] in
      var result: [String: Any] = [:]

      DispatchQueue.main.sync { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ExpoARKitView.self) else {
          result = ["error": "Could not find ARKit view with tag \(viewTag)", "success": false]
          return
        }
        result = view.updateModelTransform(modelId: modelId, scale: scale, rotation: rotation, position: position)
      }

      return result
    }

    // Module-level async function to set model scale
    AsyncFunction("setModelScale") { (viewTag: Int, modelId: String, scale: [Double]) -> [String: Any] in
      var result: [String: Any] = [:]

      DispatchQueue.main.sync { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ExpoARKitView.self) else {
          result = ["error": "Could not find ARKit view with tag \(viewTag)", "success": false]
          return
        }
        result = view.setModelScale(modelId: modelId, scale: scale)
      }

      return result
    }

    // Module-level async function to set model rotation
    AsyncFunction("setModelRotation") { (viewTag: Int, modelId: String, rotation: [Double]) -> [String: Any] in
      var result: [String: Any] = [:]

      DispatchQueue.main.sync { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ExpoARKitView.self) else {
          result = ["error": "Could not find ARKit view with tag \(viewTag)", "success": false]
          return
        }
        result = view.setModelRotation(modelId: modelId, rotation: rotation)
      }

      return result
    }

    // Module-level async function to set model position
    AsyncFunction("setModelPosition") { (viewTag: Int, modelId: String, position: [Double]) -> [String: Any] in
      var result: [String: Any] = [:]

      DispatchQueue.main.sync { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ExpoARKitView.self) else {
          result = ["error": "Could not find ARKit view with tag \(viewTag)", "success": false]
          return
        }
        result = view.setModelPosition(modelId: modelId, position: position)
      }

      return result
    }

    // Module-level async function to get model transformation
    AsyncFunction("getModelTransform") { (viewTag: Int, modelId: String) -> [String: Any] in
      var result: [String: Any] = [:]

      DispatchQueue.main.sync { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ExpoARKitView.self) else {
          result = ["error": "Could not find ARKit view with tag \(viewTag)", "success": false]
          return
        }
        result = view.getModelTransform(modelId: modelId)
      }

      return result
    }

    // Module-level async function to load model for preview (SceneKit)
    AsyncFunction("loadModelForPreview") { (viewTag: Int, path: String) -> Void in
      DispatchQueue.main.async { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: SceneKitPreviewView.self) else {
          print("Error: Could not find SceneKitPreviewView with tag \(viewTag)")
          return
        }
        view.loadModelForPreview(path: path)
      }
    }

    // Module-level async function to deselect wall in preview
    AsyncFunction("deselectWall") { (viewTag: Int) -> Void in
      DispatchQueue.main.async { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: SceneKitPreviewView.self) else {
          print("Error: Could not find SceneKitPreviewView with tag \(viewTag)")
          return
        }
        view.deselectWall()
      }
    }

    // Module-level async function to get selected wall data
    AsyncFunction("getSelectedWallData") { (viewTag: Int) -> [String: Any]? in
      var result: [String: Any]? = nil

      DispatchQueue.main.sync { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: SceneKitPreviewView.self) else {
          print("Error: Could not find SceneKitPreviewView with tag \(viewTag)")
          return
        }
        result = view.getSelectedWallData()?.toDictionary()
      }

      return result
    }

    // MARK: - ARWallScanningView Functions

    // Module-level async function to start wall scanning
    AsyncFunction("startWallScanning") { (viewTag: Int) -> Void in
      DispatchQueue.main.async { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ARWallScanningView.self) else {
          print("Error: Could not find ARWallScanningView with tag \(viewTag)")
          return
        }
        view.startWallScanning()
      }
    }

    // Module-level async function to stop wall scanning
    AsyncFunction("stopWallScanning") { (viewTag: Int) -> Void in
      DispatchQueue.main.async { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ARWallScanningView.self) else {
          print("Error: Could not find ARWallScanningView with tag \(viewTag)")
          return
        }
        view.stopWallScanning()
      }
    }

    // Module-level async function to deselect wall in scanning view
    AsyncFunction("deselectRealWall") { (viewTag: Int) -> Void in
      DispatchQueue.main.async { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ARWallScanningView.self) else {
          print("Error: Could not find ARWallScanningView with tag \(viewTag)")
          return
        }
        view.deselectWall()
      }
    }

    // Module-level async function to get selected real wall data
    AsyncFunction("getSelectedRealWallData") { (viewTag: Int) -> [String: Any]? in
      var result: [String: Any]? = nil

      DispatchQueue.main.sync { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ARWallScanningView.self) else {
          print("Error: Could not find ARWallScanningView with tag \(viewTag)")
          return
        }
        result = view.getSelectedWallData()?.toDictionary()
      }

      return result
    }

    // MARK: - Wall Alignment Functions

    // Module-level async function to calculate wall alignment
    AsyncFunction("calculateAlignment") { (virtualWallData: [String: Any], realWallData: [String: Any]) -> [String: Any] in
      // Parse virtual wall data
      guard let virtualNormal = virtualWallData["normal"] as? [Double],
            virtualNormal.count >= 3,
            let virtualCenter = virtualWallData["center"] as? [Double],
            virtualCenter.count >= 3,
            let virtualDimensions = virtualWallData["dimensions"] as? [Double],
            virtualDimensions.count >= 2 else {
        return [
          "error": "Invalid virtual wall data format",
          "success": false
        ]
      }

      // Parse real wall data
      guard let realNormal = realWallData["normal"] as? [Double],
            realNormal.count >= 3,
            let realCenter = realWallData["center"] as? [Double],
            realCenter.count >= 3,
            let realDimensions = realWallData["dimensions"] as? [Double],
            realDimensions.count >= 2 else {
        return [
          "error": "Invalid real wall data format",
          "success": false
        ]
      }

      // Create WallSelectionData from virtual wall
      let virtualWall = WallSelectionData(
        id: virtualWallData["id"] as? String ?? UUID().uuidString,
        normal: simd_float3(Float(virtualNormal[0]), Float(virtualNormal[1]), Float(virtualNormal[2])),
        center: simd_float3(Float(virtualCenter[0]), Float(virtualCenter[1]), Float(virtualCenter[2])),
        width: Float(virtualDimensions[0]),
        height: Float(virtualDimensions[1]),
        transformMatrix: matrix_identity_float4x4
      )

      // Create RealWallData from real wall
      let anchorId = realWallData["anchorId"] as? String ?? UUID().uuidString
      let realWall = RealWallData(
        id: realWallData["id"] as? String ?? UUID().uuidString,
        normal: simd_float3(Float(realNormal[0]), Float(realNormal[1]), Float(realNormal[2])),
        center: simd_float3(Float(realCenter[0]), Float(realCenter[1]), Float(realCenter[2])),
        width: Float(realDimensions[0]),
        height: Float(realDimensions[1]),
        anchorIdentifier: UUID(uuidString: anchorId) ?? UUID()
      )

      // Calculate alignment
      let alignment = WallAlignmentEngine.calculateAlignment(
        virtualWall: virtualWall,
        realWall: realWall
      )

      // Convert to dictionary and return
      var result = alignment.toDictionary()
      result["success"] = true

      return result
    }

    // Module-level async function to apply alignment transform to a model
    AsyncFunction("applyAlignmentTransform") { (viewTag: Int, modelId: String, transformMatrix: [[Double]]) -> [String: Any] in
      var result: [String: Any] = [:]

      // Validate transform matrix dimensions
      guard transformMatrix.count == 4,
            transformMatrix.allSatisfy({ $0.count == 4 }) else {
        return [
          "error": "Transform matrix must be 4x4",
          "success": false
        ]
      }

      // Convert [[Double]] to simd_float4x4
      let matrix = simd_float4x4(
        simd_float4(Float(transformMatrix[0][0]), Float(transformMatrix[0][1]), Float(transformMatrix[0][2]), Float(transformMatrix[0][3])),
        simd_float4(Float(transformMatrix[1][0]), Float(transformMatrix[1][1]), Float(transformMatrix[1][2]), Float(transformMatrix[1][3])),
        simd_float4(Float(transformMatrix[2][0]), Float(transformMatrix[2][1]), Float(transformMatrix[2][2]), Float(transformMatrix[2][3])),
        simd_float4(Float(transformMatrix[3][0]), Float(transformMatrix[3][1]), Float(transformMatrix[3][2]), Float(transformMatrix[3][3]))
      )

      DispatchQueue.main.sync { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ExpoARKitView.self) else {
          result = [
            "error": "Could not find ARKit view with tag \(viewTag)",
            "success": false
          ]
          return
        }
        result = view.applyAlignmentTransform(modelId: modelId, transform: matrix)
      }

      return result
    }

    // Module-level async function to toggle alignment debug overlay
    AsyncFunction("setAlignmentDebug") { (viewTag: Int, modelId: String, enabled: Bool, virtualNormal: [Double], realNormal: [Double]) -> [String: Any] in
      var result: [String: Any] = [:]

      DispatchQueue.main.sync { [weak self] in
        guard let view = self?.appContext?.findView(withTag: viewTag, ofType: ExpoARKitView.self) else {
          result = [
            "error": "Could not find ARKit view with tag \(viewTag)",
            "success": false
          ]
          return
        }

        result = view.setAlignmentDebug(modelId: modelId, enabled: enabled, virtualNormal: virtualNormal, realNormal: realNormal)
      }

      return result
    }

    // ViewManager definition for ARKit
    View(ExpoARKitView.self) {
      // Events
      Events(
        "onARInitialized",
        "onARError",
        "onModelLoaded",
        "onModelPlaced",
        "onPlacementPreviewUpdated",
        "onPlaneDetected",
        "onPlaneUpdated",
        "onPlaneRemoved",
        "onPlaneSelected",
        "onMeshAdded",
        "onMeshUpdated",
        "onMeshRemoved"
      )
    }

    // ViewManager definition for SceneKit Preview
    View(SceneKitPreviewView.self) {
      Events(
        "onPreviewModelLoaded",
        "onPreviewWallSelected",
        "onPreviewWallDeselected",
        "onPreviewLoadError",
        "onPreviewTapFeedback"
      )
    }

    // ViewManager definition for AR Wall Scanning
    View(ARWallScanningView.self) {
      Events(
        "onARSessionStarted",
        "onVerticalPlaneDetected",
        "onRealWallSelected",
        "onRealWallDeselected",
        "onRealWallUpdated",
        "onTrackingStateChanged",
        "onARError"
      )
    }
  }
}
