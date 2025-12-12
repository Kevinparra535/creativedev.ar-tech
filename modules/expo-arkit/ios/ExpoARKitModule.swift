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

    // ViewManager definition
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
  }
}
