import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import useStore from '@/lib/store';

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const initialize = useStore((state) => state.initialize);

  useEffect(() => {
    const startOnboarding = async () => {
      try {
        console.log('[Root] Starting initialization...');

        // Initialize store
        await initialize();
        console.log('[Root] Store initialized');

        // Mark as ready first
        setIsReady(true);

        // Navigate after a short delay to ensure layout is mounted
        console.log('[Root] Redirecting to onboarding...');
        setTimeout(() => {
          router.replace('/onboarding/welcome');
        }, 500);
      } catch (error) {
        console.error('[Root] Initialization error:', error);
        setIsReady(true);
      }
    };

    // Add a safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      console.warn('[Root] Safety timeout triggered - forcing ready state');
      setIsReady(true);
    }, 5000);

    startOnboarding().finally(() => {
      clearTimeout(safetyTimeout);
    });
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFCFF' }}>
        <ActivityIndicator size="large" color="#FFB88C" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
