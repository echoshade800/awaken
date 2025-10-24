#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🏥 Setting up HealthKit integration...\n');

// Check if we're in an Expo project
const appJsonPath = path.join(process.cwd(), 'app.json');
if (!fs.existsSync(appJsonPath)) {
  console.error('❌ app.json not found. Make sure you\'re in the root of your Expo project.');
  process.exit(1);
}

// Read current app.json
let appJson;
try {
  appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
} catch (error) {
  console.error('❌ Error reading app.json:', error.message);
  process.exit(1);
}

// Check and update iOS configuration
if (!appJson.expo.ios) {
  appJson.expo.ios = {};
}

if (!appJson.expo.ios.infoPlist) {
  appJson.expo.ios.infoPlist = {};
}

if (!appJson.expo.ios.entitlements) {
  appJson.expo.ios.entitlements = {};
}

// Add HealthKit permissions
appJson.expo.ios.infoPlist.NSHealthShareUsageDescription = 
  "We'll use your step data to infer sleep patterns and improve your rhythm insights.";
appJson.expo.ios.infoPlist.NSHealthUpdateUsageDescription = 
  "This app needs to access your health data to provide personalized sleep and energy tracking.";

// Add HealthKit entitlement
appJson.expo.ios.entitlements['com.apple.developer.healthkit'] = true;

// Add HealthKit capability requirement
if (!appJson.expo.ios.infoPlist.UIRequiredDeviceCapabilities) {
  appJson.expo.ios.infoPlist.UIRequiredDeviceCapabilities = [];
}
if (!appJson.expo.ios.infoPlist.UIRequiredDeviceCapabilities.includes('healthkit')) {
  appJson.expo.ios.infoPlist.UIRequiredDeviceCapabilities.push('healthkit');
}

// Write updated app.json
try {
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
  console.log('✅ Updated app.json with HealthKit configuration');
} catch (error) {
  console.error('❌ Error writing app.json:', error.message);
  process.exit(1);
}

// Check package.json for react-native-health
const packageJsonPath = path.join(process.cwd(), 'package.json');
let packageJson;
try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (error) {
  console.error('❌ Error reading package.json:', error.message);
  process.exit(1);
}

if (!packageJson.dependencies['react-native-health']) {
  console.log('⚠️  react-native-health not found in dependencies');
  console.log('📦 Please run: npm install react-native-health');
} else {
  console.log('✅ react-native-health is installed');
}

console.log('\n🎯 Next Steps:');
console.log('1. Run: npx expo prebuild');
console.log('2. Run: npx pod-install (for iOS)');
console.log('3. Build and test on a real iOS device');
console.log('\n📱 Note: HealthKit requires a physical iOS device - it won\'t work in the simulator');
console.log('🔐 Make sure your Apple Developer account has HealthKit enabled\n');

console.log('🏥 HealthKit setup complete!');
