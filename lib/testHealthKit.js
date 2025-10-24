// Test script to verify HealthKit integration
import { Platform, NativeModules } from 'react-native';

async function testHealthKitImport() {
  console.log('Testing HealthKit import method...');
  
  if (Platform.OS !== 'ios') {
    console.log('❌ Not iOS platform');
    return;
  }

  try {
    // Use the specified import method
    const healthModule = require('react-native-health');
    const BrokenHealthKit = healthModule.default;
    const HealthKitPermissions = healthModule.HealthKitPermissions;
    
    console.log('✅ BrokenHealthKit imported:', !!BrokenHealthKit);
    console.log('✅ HealthKitPermissions imported:', !!HealthKitPermissions);
    
    // Get AppleHealthKit from NativeModules
    const AppleHealthKit = NativeModules.AppleHealthKit;
    console.log('✅ AppleHealthKit from NativeModules:', !!AppleHealthKit);

    // Only set Constants if AppleHealthKit is available
    if (AppleHealthKit && BrokenHealthKit.Constants) {
      AppleHealthKit.Constants = BrokenHealthKit.Constants;
      console.log('✅ Constants assigned successfully');
      console.log('✅ Steps permission constant:', AppleHealthKit.Constants?.Permissions?.Steps);
    } else {
      console.log('❌ Could not assign Constants');
    }

    // Test permission constants
    if (AppleHealthKit && AppleHealthKit.Constants && AppleHealthKit.Constants.Permissions) {
      console.log('Available permissions:');
      console.log('- Steps:', AppleHealthKit.Constants.Permissions.Steps);
      console.log('- SleepAnalysis:', AppleHealthKit.Constants.Permissions.SleepAnalysis);
      console.log('- StepCount:', AppleHealthKit.Constants.Permissions.StepCount);
    }

    // Test availability check
    if (AppleHealthKit && AppleHealthKit.isAvailable) {
      AppleHealthKit.isAvailable((err, available) => {
        if (err) {
          console.log('❌ Error checking availability:', err);
        } else {
          console.log('✅ HealthKit available:', available);
        }
      });
    }

  } catch (error) {
    console.log('❌ Error testing HealthKit import:', error);
  }
}

export { testHealthKitImport };
