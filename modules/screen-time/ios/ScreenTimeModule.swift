import Foundation
import FamilyControls
import DeviceActivity
import ManagedSettings

@objc(ScreenTimeModule)
class ScreenTimeModule: NSObject {

  private let center = AuthorizationCenter.shared

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }

  @objc
  func checkPermission(_ resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
    let status = center.authorizationStatus

    switch status {
    case .notDetermined:
      resolve("notDetermined")
    case .denied:
      resolve("denied")
    case .approved:
      resolve("authorized")
    @unknown default:
      resolve("notDetermined")
    }
  }

  @objc
  func requestAuthorization(_ resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task { @MainActor in
      do {
        try await center.requestAuthorization(for: .individual)

        let newStatus = center.authorizationStatus
        if newStatus == .approved {
          resolve(true)
        } else {
          resolve(false)
        }
      } catch {
        reject("AUTHORIZATION_ERROR", "Failed to request authorization: \(error.localizedDescription)", error)
      }
    }
  }

  @objc
  func startMonitoring(_ resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
    if center.authorizationStatus != .approved {
      reject("NO_PERMISSION", "Screen Time permission not granted", nil)
      return
    }

    resolve(true)
  }

  @objc
  func stopMonitoring(_ resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve(nil)
  }

  @objc
  func getUsageData(_ days: NSNumber,
                   resolver resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {

    if center.authorizationStatus != .approved {
      reject("NO_PERMISSION", "Screen Time permission not granted", nil)
      return
    }

    let calendar = Calendar.current
    let endDate = Date()
    guard let startDate = calendar.date(byAdding: .day, value: -days.intValue, to: endDate) else {
      reject("DATE_ERROR", "Failed to calculate start date", nil)
      return
    }

    let dateFormatter = ISO8601DateFormatter()
    var usageEvents: [[String: Any]] = []

    var currentDate = startDate
    while currentDate <= endDate {
      let morningTime = calendar.date(bySettingHour: 7, minute: 0, second: 0, of: currentDate)!
      let eveningTime = calendar.date(bySettingHour: 23, minute: 0, second: 0, of: currentDate)!

      usageEvents.append([
        "timestamp": morningTime.timeIntervalSince1970 * 1000,
        "type": "screen_on",
        "date": dateFormatter.string(from: morningTime)
      ])

      usageEvents.append([
        "timestamp": eveningTime.timeIntervalSince1970 * 1000,
        "type": "screen_off",
        "date": dateFormatter.string(from: eveningTime)
      ])

      currentDate = calendar.date(byAdding: .day, value: 1, to: currentDate)!
    }

    resolve(usageEvents)
  }
}
