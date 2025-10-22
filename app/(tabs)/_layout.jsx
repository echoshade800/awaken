import { Tabs, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Sun, Home, Moon } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import useStore from '@/lib/store';
import HealthPermissionBlocker from '@/components/HealthPermissionBlocker';

function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.tabBarWrapper}>
      <BlurView intensity={50} tint="dark" style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
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
  const router = useRouter();
  const hasHealthPermission = useStore((state) => state.hasHealthPermission);
  const healthPermissionChecked = useStore((state) => state.healthPermissionChecked);
  const requestHealthPermission = useStore((state) => state.requestHealthPermission);
  const [checkingPermission, setCheckingPermission] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      if (!healthPermissionChecked) {
        return;
      }

      if (!hasHealthPermission) {
        setCheckingPermission(false);
      } else {
        setCheckingPermission(false);
      }
    };

    checkPermission();
  }, [hasHealthPermission, healthPermissionChecked]);

  const handleOpenSettings = () => {
    console.log('Opening settings...');
  };

  const handleExit = () => {
    router.replace('/onboarding/welcome');
  };

  if (!healthPermissionChecked || checkingPermission) {
    return null;
  }

  if (!hasHealthPermission) {
    return (
      <HealthPermissionBlocker
        onOpenSettings={handleOpenSettings}
        onExit={handleExit}
      />
    );
  }

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
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
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
    minHeight: 40,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
    height: 48,
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 3,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
