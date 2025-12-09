import Foundation
import React
import UIKit

@objc(RoomPlanViewManager)
class RoomPlanViewManager: RCTViewManager {

  override func view() -> UIView! {
    if #available(iOS 16.0, *) {
      return RoomCaptureView(frame: .zero)
    } else {
      // Fallback para iOS < 16
      let fallbackView = UIView(frame: .zero)
      fallbackView.backgroundColor = .gray
      return fallbackView
    }
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  @objc
  @available(iOS 16.0, *)
  func startCapture() {
    guard let view = self.view else { return }

    let session = RoomCaptureSession()

    var configuration = RoomCaptureSession.Configuration()
    session.run(configuration: configuration)
  }

  @objc
  func stopCapture() {
    self.captureSession?.stop()
    self.captureSession = nil
  }
}
