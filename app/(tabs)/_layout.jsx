import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Sun, Home, Moon } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';

function CustomTabBar({ state, descriptors, navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

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
      <BlurView intensity={25} tint="dark" style={styles.tabBarContainer}>
        <LinearGradient
          colors={['rgba(16, 16, 21, 0.9)', 'rgba(12, 13, 18, 0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('alarm')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, state.index === 0 && styles.iconWrapperActive]}>
              <Sun size={24} color={state.index === 0 ? '#FCD34D' : 'rgba(255, 255, 255, 0.5)'} strokeWidth={state.index === 0 ? 2.5 : 2} />
            </View>
            <Text style={[styles.tabLabel, state.index === 0 && styles.tabLabelActive]}>Wake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('index')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, state.index === 1 && styles.iconWrapperActive]}>
              <Home size={24} color={state.index === 1 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)'} strokeWidth={state.index === 1 ? 2.5 : 2} />
            </View>
            <Text style={[styles.tabLabel, state.index === 1 && styles.tabLabelActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('sleep')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, state.index === 2 && styles.iconWrapperActive]}>
              <Moon size={24} color={state.index === 2 ? '#93C5FD' : 'rgba(255, 255, 255, 0.5)'} strokeWidth={state.index === 2 ? 2.5 : 2} />
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
    backgroundColor: 'rgba(18, 18, 24, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 14,
    width: '100%',
  },
  gradient: {
    borderRadius: 28,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'relative',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 80,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  iconWrapper: {
    marginBottom: 2,
  },
  iconWrapperActive: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  tabLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 6,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
