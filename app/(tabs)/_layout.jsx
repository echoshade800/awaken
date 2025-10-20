import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Sun, Home, Moon } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useEffect, useRef } from 'react';

function CustomTabBar({ state, descriptors, navigation }) {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const positions = [0, 1, 2];
    const targetPosition = positions[state.index];

    Animated.timing(translateX, {
      toValue: targetPosition,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [state.index]);

  const indicatorTranslateX = translateX.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, 115, 230],
  });

  return (
    <View style={styles.tabBarWrapper}>
      <BlurView intensity={50} tint="dark" style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          <Animated.View
            style={[
              styles.activeIndicator,
              {
                transform: [{ translateX: indicatorTranslateX }],
              },
            ]}
          />

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('alarm')}
          >
            <Sun size={22} color={state.index === 0 ? '#FFD700' : 'rgba(255, 255, 255, 0.6)'} />
            <Text style={[styles.tabLabel, state.index === 0 && styles.tabLabelActive]}>Wake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('index')}
          >
            <Home size={22} color={state.index === 1 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'} />
            <Text style={[styles.tabLabel, state.index === 1 && styles.tabLabelActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate('sleep')}
          >
            <Moon size={22} color={state.index === 2 ? '#87CEEB' : 'rgba(255, 255, 255, 0.6)'} />
            <Text style={[styles.tabLabel, state.index === 2 && styles.tabLabelActive]}>Sleep</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
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
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarContainer: {
    borderRadius: 50,
    overflow: 'hidden',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'relative',
    minHeight: 50,
  },
  activeIndicator: {
    position: 'absolute',
    width: 100,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    left: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 60,
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
