import ExpoModulesCore
import ARKit
import RealityKit

public class ExpoARKitModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoARKit")

    // ViewManager definition
    View(ExpoARKitView.self) {
      // Events
      Events("onARInitialized", "onARError")

      // Props/Methods that can be called on the view
      AsyncFunction("addTestObject") { (view: ExpoARKitView) -> Void in
        DispatchQueue.main.async {
          view.addTestObject()
        }
      }
    }
  }
}
