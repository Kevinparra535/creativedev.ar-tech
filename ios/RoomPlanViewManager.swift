import Foundation
import React
import RoomPlan
import UIKit

@available(iOS 13.0, *)
@objc(RoomPlanViewManager)
class RoomPlanViewManager: RCTViewManager {

  // Typed erasure for availability of RoomCaptureSession (iOS 16+)
  private var captureSession: Any?

  override func view() -> UIView! {
    if #available(iOS 16.0, *) {
      let captureView = RoomCaptureView(frame: .zero)
      return captureView
    } else {
      return UIView(frame: .zero)
    }
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  // iOS 16 availability guard for RoomPlan usage
  @objc
  func startCapture() {
    guard #available(iOS 16.0, *), let view = self.view as? RoomCaptureView else { return }

    let session = RoomCaptureSession()
    self.captureSession = session

    var configuration = RoomCaptureSession.Configuration()
    session.run(configuration: configuration)
  }

  // iOS 16 availability guard for RoomPlan usage
  @objc
  func stopCapture() {
    if #available(iOS 16.0, *) {
      (self.captureSession as? RoomCaptureSession)?.stop()
    }
    self.captureSession = nil
  }
}
