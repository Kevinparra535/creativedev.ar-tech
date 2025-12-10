import ExpoModulesCore
import ARKit
import RealityKit

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

    // ViewManager definition
    View(ExpoARKitView.self) {
      // Events
      Events("onARInitialized", "onARError")
    }
  }
}
