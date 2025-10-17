import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Sun, Home, Moon } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <BlurView intensity={40} tint="dark" style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate('alarm')}
        >
          <Sun size={24} color={state.index === 0 ? '#FFD700' : 'rgba(255, 255, 255, 0.6)'} />
          <Text style={[styles.tabLabel, state.index === 0 && styles.tabLabelActive]}>Alarm</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('index')}
        >
          <View style={styles.homeButtonInner}>
            <Home size={28} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <Text style={styles.homeLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate('sleep')}
        >
          <Moon size={24} color={state.index === 2 ? '#87CEEB' : 'rgba(255, 255, 255, 0.6)'} />
          <Text style={[styles.tabLabel, state.index === 2 && styles.tabLabelActive]}>Sleep</Text>
        </TouchableOpacity>
      </View>
    </BlurView>
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
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  homeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  homeButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  homeLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 6,
    fontWeight: '600',
  },
});
