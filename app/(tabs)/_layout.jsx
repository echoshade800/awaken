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
      <BlurView intensity={60} tint="light" style={styles.tabBarContainer}>
          <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('alarm')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, state.index === 0 && styles.iconWrapperActive]}>
              <Sun size={22} color={state.index === 0 ? '#FCD34D' : 'rgba(100, 116, 139, 0.5)'} strokeWidth={state.index === 0 ? 2.5 : 2} />
            </View>
            <Text style={[styles.tabLabel, state.index === 0 && styles.tabLabelActive]}>Wake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('index')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, state.index === 1 && styles.iconWrapperActive]}>
              <Home size={22} color={state.index === 1 ? '#1E293B' : 'rgba(100, 116, 139, 0.5)'} strokeWidth={state.index === 1 ? 2.5 : 2} />
            </View>
            <Text style={[styles.tabLabel, state.index === 1 && styles.tabLabelActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('sleep')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, state.index === 2 && styles.iconWrapperActive]}>
              <Moon size={22} color={state.index === 2 ? '#93C5FD' : 'rgba(100, 116, 139, 0.5)'} strokeWidth={state.index === 2 ? 2.5 : 2} />
            </View>
            <Text style={[styles.tabLabel, state.index === 2 && styles.tabLabelActive]}>Sleep</Text>
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
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 64,
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
    color: 'rgba(100, 116, 139, 0.7)',
    marginTop: 2,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: '#1E293B',
    fontWeight: '700',
  },
});
