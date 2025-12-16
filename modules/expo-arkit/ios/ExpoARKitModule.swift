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

    // ViewManager definition for ARKit
    View(ExpoARKitView.self) {
      // Events
      Events(
        "onARInitialized",
        "onARError",
        "onModelLoaded",
        "onModelPlaced",
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
        "onPreviewLoadError"
      )
    }

    // ViewManager definition for AR Wall Scanning
    View(ARWallScanningView.self) {
      Events(
        "onARSessionStarted",
        "onVerticalPlaneDetected",
        "onRealWallSelected",
        "onRealWallDeselected",
        "onARError"
      )
    }
  }
}
