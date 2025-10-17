import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function SleepScreen() {
  return (
    <LinearGradient colors={['#FFF7E8', '#E6F4FF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Ionicons name="moon" size={80} color="#9EC9FF" />
            <Text style={styles.title}>Sleep Insights</Text>
            <Text style={styles.subtitle}>Coming soon</Text>
          </View>
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingTop: 20 },
  scrollContent: {
    flexGrow: 1,
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  title: { fontSize: 28, fontWeight: '600', color: '#1C1C1E', marginTop: 24, marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#8E8E93', marginBottom: 16 },
  bottomSpacer: {
    height: 100,
  },
});
