# Screen Time / Usage Tracking Setup for iOS

This app requests Screen Time permissions to calculate personalized sleep analytics. Since Expo doesn't natively support Screen Time API, you need to create a native module.

## iOS Setup (Screen Time API)

### Prerequisites
- iOS 15.0+
- Xcode 13+
- Expo development build (not Expo Go)

### Step 1: Create Native Module

Create `ios/ScreenTimeModule.swift`:

```swift
import Foundation
import FamilyControls
import DeviceActivity

@objc(ScreenTimeModule)
class ScreenTimeModule: NSObject {

  private let center = AuthorizationCenter.shared

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
      resolve("unknown")
    }
  }

  @objc
  func requestAuthorization(_ resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task {
      do {
        try await center.requestAuthorization(for: .individual)
        resolve(true)
      } catch {
        reject("ERROR", "Failed to request authorization", error)
      }
    }
  }

  @objc
  func startMonitoring(_ resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
    // Implement device activity monitoring
    resolve(true)
  }

  @objc
  func getUsageData(_ days: NSNumber,
                   resolver resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
    // Query screen time data for the last N days
    // Return array of { timestamp, type, date } objects
    resolve([])
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
```

### Step 2: Create Bridge Header

Create `ios/ScreenTimeModule.m`:

```objc
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(ScreenTimeModule, NSObject)

RCT_EXTERN_METHOD(checkPermission:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(requestAuthorization:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(startMonitoring:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getUsageData:(nonnull NSNumber *)days
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
```

### Step 3: Update Info.plist

Add these keys to `ios/YourApp/Info.plist`:

```xml
<key>NSFamilyControlsUsageDescription</key>
<string>Monster needs Screen Time access to calculate your personalized sleep need and circadian rhythm based on device usage patterns.</string>
```

### Step 4: Enable Family Controls Capability

In Xcode:
1. Select your project target
2. Go to "Signing & Capabilities"
3. Click "+ Capability"
4. Add "Family Controls"

### Step 5: Update app.json

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSFamilyControlsUsageDescription": "Monster needs Screen Time access to calculate your personalized sleep need and circadian rhythm based on device usage patterns."
      },
      "entitlements": {
        "com.apple.developer.family-controls": true
      }
    }
  }
}
```

### Step 6: Build Development Client

```bash
npx expo prebuild
npx expo run:ios
```

## Android Setup (UsageStatsManager)

### Step 1: Create Native Module

Create `android/app/src/main/java/com/yourapp/ScreenTimeModule.kt`:

```kotlin
package com.yourapp

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.*
import java.util.*

class ScreenTimeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "ScreenTimeModule"

    @ReactMethod
    fun checkUsageStatsPermission(promise: Promise) {
        try {
            val appOps = reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                reactApplicationContext.packageName
            )
            promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
        } catch (e: Exception) {
            promise.reject("ERROR", e)
        }
    }

    @ReactMethod
    fun requestUsageStatsPermission(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e)
        }
    }

    @ReactMethod
    fun getUsageEvents(days: Int, promise: Promise) {
        try {
            val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_MANAGER_SERVICE) as UsageStatsManager

            val endTime = System.currentTimeMillis()
            val startTime = endTime - (days * 24 * 60 * 60 * 1000L)

            val events = usageStatsManager.queryEvents(startTime, endTime)
            val eventList = mutableListOf<WritableMap>()

            val event = UsageEvents.Event()
            while (events.hasNextEvent()) {
                events.getNextEvent(event)

                if (event.eventType == UsageEvents.Event.SCREEN_INTERACTIVE ||
                    event.eventType == UsageEvents.Event.SCREEN_NON_INTERACTIVE) {

                    val eventMap = Arguments.createMap()
                    eventMap.putDouble("timestamp", event.timeStamp.toDouble())
                    eventMap.putString("type", if (event.eventType == UsageEvents.Event.SCREEN_INTERACTIVE) "screen_on" else "screen_off")
                    eventMap.putString("date", Date(event.timeStamp).toString())

                    eventList.add(eventMap)
                }
            }

            val resultArray = Arguments.createArray()
            eventList.forEach { resultArray.pushMap(it) }

            promise.resolve(resultArray)
        } catch (e: Exception) {
            promise.reject("ERROR", e)
        }
    }
}
```

### Step 2: Register Module

Update `android/app/src/main/java/com/yourapp/MainApplication.kt`:

```kotlin
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext

class ScreenTimePackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(ScreenTimeModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext) = emptyList<ViewManager<*, *>>()
}

// In MainApplication.kt, add to packages:
override fun getPackages(): List<ReactPackage> {
    return PackageList(this).packages.apply {
        add(ScreenTimePackage())
    }
}
```

### Step 3: Update AndroidManifest.xml

```xml
<uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" />
```

## Fallback Behavior

If native modules are not available or permissions are denied:
- App will automatically generate 30 days of sample data
- All sleep analytics will work with demo data
- User will see a badge indicating "Using sample data for demonstration"

## Testing

1. **Web**: Always uses demo data
2. **iOS Simulator**: Family Controls not available, uses demo data
3. **iOS Device**: Requests real Screen Time permission
4. **Android Emulator**: May not support UsageStats, uses demo data
5. **Android Device**: Requests real Usage Stats permission
