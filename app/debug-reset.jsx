import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

export default function DebugResetScreen() {
  const router = useRouter();

  const handleReset = async () => {
    try {
      await AsyncStorage.clear();
      console.log('[Debug] AsyncStorage cleared');
      alert('Storage cleared! Reloading app...');
      router.replace('/');
    } catch (error) {
      console.error('[Debug] Failed to clear storage:', error);
      alert('Failed to clear storage: ' + error.message);
    }
  };

  const handleViewStorage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      console.log('[Debug] Current storage:', items);
      alert('Check console for storage contents');
    } catch (error) {
      console.error('[Debug] Failed to view storage:', error);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFE4B5', '#E8F4FF', '#FAFCFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      />

      <View style={styles.content}>
        <Text style={styles.title}>Debug Tools</Text>
        <Text style={styles.subtitle}>Reset app state for testing</Text>

        <TouchableOpacity style={styles.button} onPress={handleReset}>
          <Text style={styles.buttonText}>Clear All Storage</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleViewStorage}>
          <Text style={styles.buttonText}>View Storage (Console)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4A5F8F',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7C99',
    marginBottom: 48,
  },
  button: {
    backgroundColor: '#FFB88C',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#FFB88C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: '#6BA8D0',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
