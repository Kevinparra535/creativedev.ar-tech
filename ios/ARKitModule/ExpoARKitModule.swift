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

      // Methods exposed to JS
      AsyncFunction("addTestObject") { (view: ExpoARKitView) in
        view.addTestObject()
      }
    }
  }
}
