import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Sun, Home, Moon } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';

function CustomTabBar({ state, descriptors, navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const colorAnim = useRef(new Animated.Value(state.index)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: 20,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        delay: 20,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: state.index,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [state.index]);

  const getThemeConfig = (index) => {
    switch (index) {
      case 0: // Wake - warm light
        return {
          blurTint: 'light',
          blurIntensity: 80,
          backgroundColor: 'rgba(255, 255, 255, 0.65)',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          shadowColor: 'rgba(0, 0, 0, 0.08)',
          inactiveIconColor: 'rgba(100, 116, 139, 0.6)',
          inactiveLabelColor: 'rgba(100, 116, 139, 0.7)',
          activeIconColor: '#FFB366',
          activeLabelColor: '#FF8C42',
        };
      case 1: // Home - cool medium
        return {
          blurTint: 'light',
          blurIntensity: 70,
          backgroundColor: 'rgba(200, 220, 255, 0.3)',
          borderColor: 'rgba(255, 255, 255, 0.25)',
          shadowColor: 'rgba(0, 0, 0, 0.12)',
          inactiveIconColor: 'rgba(100, 116, 139, 0.6)',
          inactiveLabelColor: 'rgba(100, 116, 139, 0.7)',
          activeIconColor: '#7DBBFF',
          activeLabelColor: '#5A9FE6',
        };
      case 2: // Sleep - dark night
        return {
          blurTint: 'dark',
          blurIntensity: 90,
          backgroundColor: 'rgba(20, 20, 30, 0.7)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          shadowColor: 'rgba(0, 0, 0, 0.3)',
          inactiveIconColor: 'rgba(200, 200, 220, 0.5)',
          inactiveLabelColor: 'rgba(200, 200, 220, 0.6)',
          activeIconColor: '#A78BFA',
          activeLabelColor: '#C4B5FD',
        };
      default:
        return getThemeConfig(1);
    }
  };

  const currentTheme = getThemeConfig(state.index);

  return (
    <Animated.View
      style={[
        styles.tabBarWrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <BlurView
        intensity={currentTheme.blurIntensity}
        tint={currentTheme.blurTint}
        style={[
          styles.tabBarContainer,
          {
            backgroundColor: currentTheme.backgroundColor,
            borderColor: currentTheme.borderColor,
            shadowColor: currentTheme.shadowColor,
          }
        ]}
      >
          <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('alarm')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, state.index === 0 && styles.iconWrapperActive]}>
              <Sun
                size={22}
                color={state.index === 0 ? currentTheme.activeIconColor : currentTheme.inactiveIconColor}
                strokeWidth={state.index === 0 ? 2.5 : 2}
              />
            </View>
            <Text style={[
              styles.tabLabel,
              { color: state.index === 0 ? currentTheme.activeLabelColor : currentTheme.inactiveLabelColor },
              state.index === 0 && styles.tabLabelActive
            ]}>Wake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('index')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, state.index === 1 && styles.iconWrapperActive]}>
              <Home
                size={22}
                color={state.index === 1 ? currentTheme.activeIconColor : currentTheme.inactiveIconColor}
                strokeWidth={state.index === 1 ? 2.5 : 2}
              />
            </View>
            <Text style={[
              styles.tabLabel,
              { color: state.index === 1 ? currentTheme.activeLabelColor : currentTheme.inactiveLabelColor },
              state.index === 1 && styles.tabLabelActive
            ]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('sleep')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, state.index === 2 && styles.iconWrapperActive]}>
              <Moon
                size={22}
                color={state.index === 2 ? currentTheme.activeIconColor : currentTheme.inactiveIconColor}
                strokeWidth={state.index === 2 ? 2.5 : 2}
              />
            </View>
            <Text style={[
              styles.tabLabel,
              { color: state.index === 2 ? currentTheme.activeLabelColor : currentTheme.inactiveLabelColor },
              state.index === 2 && styles.tabLabelActive
            ]}>Sleep</Text>
          </TouchableOpacity>
          </View>
      </BlurView>
    </Animated.View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="alarm" />
      <Tabs.Screen name="index" />
      <Tabs.Screen name="sleep" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarContainer: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'relative',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 72,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  iconWrapper: {
    marginBottom: 4,
  },
  iconWrapperActive: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    fontWeight: '700',
  },
});
