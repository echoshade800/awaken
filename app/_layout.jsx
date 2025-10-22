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
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const initialize = useStore((state) => state.initialize);
  const hasOnboarded = useStore((state) => state.hasOnboarded);

  useEffect(() => {
    const startApp = async () => {
      try {
        console.log('[Root] Starting initialization...');

        // Initialize store
        await initialize();

        // Get the latest state after initialization
        const currentHasOnboarded = useStore.getState().hasOnboarded;
        console.log('[Root] Store initialized');
        console.log('[Root] hasOnboarded:', currentHasOnboarded);

        // Mark as ready first
        setIsReady(true);

        // Signal that we want to navigate
        setShouldNavigate(true);
      } catch (error) {
        console.error('[Root] Initialization error:', error);
        setIsReady(true);
        setShouldNavigate(true);
      }
    };

    // Add a safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      console.warn('[Root] Safety timeout triggered - forcing ready state');
      setIsReady(true);
      setShouldNavigate(true);
    }, 5000);

    startApp().finally(() => {
      clearTimeout(safetyTimeout);
    });
  }, []);

  // Navigate after layout is mounted
  useEffect(() => {
    if (isReady && shouldNavigate) {
      const destination = hasOnboarded ? '/(tabs)' : '/onboarding/welcome';
      console.log('[Root] Redirecting to:', destination);
      const timer = setTimeout(() => {
        router.replace(destination);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isReady, shouldNavigate, hasOnboarded]);

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
