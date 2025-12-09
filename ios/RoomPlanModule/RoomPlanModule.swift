import Foundation
import React
import RoomPlan
import UIKit

@objc(RoomPlanModule)
class RoomPlanModule: RCTEventEmitter {

  // MARK: - Setup

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  override func supportedEvents() -> [String]! {
    return ["onScanStart", "onScanProgress", "onScanComplete", "onScanError"]
  }

  // MARK: - Properties

  private var captureSession: RoomCaptureSession?
  private var captureView: RoomCaptureView?
  private var isScanning: Bool = false

  // MARK: - Methods

  @objc
  func startScanning() {
    DispatchQueue.main.async {
      self.initializeRoomCapture()
    }
  }

  @objc
  func stopScanning() {
    DispatchQueue.main.async {
      guard let session = self.captureSession else {
        self.sendEvent(withName: "onScanError", body: ["error": "No active session"])
        return
      }

      session.stop { result in
        switch result {
        case .success(let capturedRoom):
          self.handleScanSuccess(capturedRoom)
        case .failure(let error):
          self.sendEvent(
            withName: "onScanError",
            body: ["error": "Scan failed: \(error.localizedDescription)"]
          )
        }
      }

      self.isScanning = false
    }
  }

  @objc
  func exportScan(_ callback: @escaping RCTResponseSenderBlock) {
    guard let session = self.captureSession else {
      callback([["error": "No active session"]])
      return
    }

    session.stop { result in
      switch result {
      case .success(let capturedRoom):
        self.exportRoomAsUSDZ(capturedRoom, callback: callback)
      case .failure(let error):
        callback([["error": error.localizedDescription]])
      }
    }
  }

  // MARK: - Private Methods

  private func initializeRoomCapture() {
    // Verificar que el device soporta RoomPlan
    guard RoomCaptureSession.isSupported else {
      sendEvent(
        withName: "onScanError",
        body: ["error": "RoomPlan not supported on this device"]
      )
      return
    }

    // Crear sesión de captura
    let session = RoomCaptureSession()
    self.captureSession = session
    self.isScanning = true

    // Crear vista de captura (necesaria para el proceso)
    let captureView = RoomCaptureView(frame: .zero)
    self.captureView = captureView

    // Configurar sesión
    var configuration = RoomCaptureSession.Configuration()

    // Iniciar captura
    session.run(configuration: configuration)

    sendEvent(withName: "onScanStart", body: ["status": "scanning"])
    print("RoomPlan: Scan started successfully")
  }

  private func handleScanSuccess(_ capturedRoom: CapturedRoom) {
    let surfaceCount = capturedRoom.surfaces.count
    let wallCount = capturedRoom.surfaces.filter { $0.category == .wall }.count
    let doorCount = capturedRoom.surfaces.filter { $0.category == .door }.count
    let windowCount = capturedRoom.surfaces.filter { $0.category == .window }.count

    let roomInfo: [String: Any] = [
      "surfaces": surfaceCount,
      "walls": wallCount,
      "doors": doorCount,
      "windows": windowCount,
      "dimensions": [
        "length": capturedRoom.dimensions.x,
        "width": capturedRoom.dimensions.y,
        "height": capturedRoom.dimensions.z
      ]
    ]

    sendEvent(withName: "onScanComplete", body: roomInfo)
    print("RoomPlan: Scan completed - \(surfaceCount) surfaces detected")
  }

  private func exportRoomAsUSDZ(
    _ capturedRoom: CapturedRoom,
    callback: @escaping RCTResponseSenderBlock
  ) {
    let fileManager = FileManager.default
    let tempDir = fileManager.temporaryDirectory
    let fileName = "scanned_room_\(Date().timeIntervalSince1970).usdz"
    let fileURL = tempDir.appendingPathComponent(fileName)

    do {
      try capturedRoom.export(to: fileURL)

      let fileSize = try fileManager.attributesOfItem(atPath: fileURL.path)[.size] as? Int ?? 0

      callback([[
        "success": true,
        "path": fileURL.path,
        "fileName": fileName,
        "fileSize": fileSize,
        "surfaces": capturedRoom.surfaces.count
      ]])

      print("RoomPlan: Exported to \(fileURL.path)")
    } catch {
      callback([["error": "Export failed: \(error.localizedDescription)"]])
      print("RoomPlan: Export error - \(error.localizedDescription)")
    }
  }
}
