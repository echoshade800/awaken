import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Sun, Home, Moon } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useEffect } from 'react';

function CustomTabBar({ state, descriptors, navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
      <BlurView intensity={80} tint="dark" style={styles.tabBarContainer}>
        <LinearGradient
          colors={['rgba(24, 24, 28, 0.95)', 'rgba(16, 16, 20, 0.98)']}
          style={styles.gradientOverlay}
        >
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => navigation.navigate('alarm')}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, state.index === 0 && styles.iconContainerActive]}>
                <Sun
                  size={24}
                  color={state.index === 0 ? '#FFD700' : 'rgba(255, 255, 255, 0.5)'}
                  strokeWidth={state.index === 0 ? 2.5 : 2}
                />
              </View>
              <Text style={[styles.tabLabel, state.index === 0 && styles.tabLabelActive]}>Wake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => navigation.navigate('index')}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, state.index === 1 && styles.iconContainerActive]}>
                <Home
                  size={24}
                  color={state.index === 1 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)'}
                  strokeWidth={state.index === 1 ? 2.5 : 2}
                />
              </View>
              <Text style={[styles.tabLabel, state.index === 1 && styles.tabLabelActive]}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => navigation.navigate('sleep')}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, state.index === 2 && styles.iconContainerActive]}>
                <Moon
                  size={24}
                  color={state.index === 2 ? '#A78BFA' : 'rgba(255, 255, 255, 0.5)'}
                  strokeWidth={state.index === 2 ? 2.5 : 2}
                />
              </View>
              <Text style={[styles.tabLabel, state.index === 2 && styles.tabLabelActive]}>Sleep</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
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
    backgroundColor: 'rgba(18, 18, 22, 0.3)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 16,
  },
  gradientOverlay: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    minHeight: 56,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 6,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  iconContainerActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '700',
  },
});
