const { withInfoPlist, withEntitlementsPlist } = require('@expo/config-plugins');

const withScreenTime = (config) => {
  // Add Info.plist entry
  config = withInfoPlist(config, (config) => {
    config.modResults.NSFamilyControlsUsageDescription =
      "Monster needs Screen Time access to calculate your personalized sleep need and circadian rhythm based on device usage patterns.";
    return config;
  });

  // Add entitlements
  config = withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.developer.family-controls'] = true;
    return config;
  });

  return config;
};

module.exports = withScreenTime;
