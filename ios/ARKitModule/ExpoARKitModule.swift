import ExpoModulesCore
import ARKit
import RealityKit

public class ExpoARKitModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoARKit")

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

    // Module methods that operate on views
    AsyncFunction("addTestObject") { (viewTag: Int) in
      DispatchQueue.main.async {
        guard let view = self.appContext?.findView(withTag: viewTag, ofType: ExpoARKitView.self) else {
          return
        }
        view.addTestObject()
      }
    }

    AsyncFunction("loadModel") { (viewTag: Int, path: String, scale: Float, position: [Float]) in
      DispatchQueue.main.async {
        guard let view = self.appContext?.findView(withTag: viewTag, ofType: ExpoARKitView.self) else {
          return
        }
        view.loadModel(path: path, scale: scale, position: position)
      }
    }
  }
}
