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

    // ViewManager definition
    View(ExpoARKitView.self) {
      // Events
      Events(
        "onARInitialized",
        "onARError",
        "onModelLoaded",
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
