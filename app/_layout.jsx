import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import useStore from '../lib/store';

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const initialize = useStore((state) => state.initialize);
  const hasOnboarded = useStore((state) => state.hasOnboarded);

  useEffect(() => {
    const startOnboarding = async () => {
      try {
        console.log('[Root] Starting initialization...');

        // Initialize store
        await initialize();
        console.log('[Root] Store initialized');

        // Mark as ready first
        setIsReady(true);

        // Signal that we want to navigate
        setShouldNavigate(true);
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

  // Navigate after layout is mounted
  useEffect(() => {
    if (isReady && shouldNavigate) {
      // Check if user has completed onboarding
      if (hasOnboarded) {
        console.log('[Root] User has completed onboarding, redirecting to main app...');
        const timer = setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
        return () => clearTimeout(timer);
      } else {
        console.log('[Root] First time user, redirecting to onboarding...');
        const timer = setTimeout(() => {
          router.replace('/onboarding/welcome');
        }, 100);
        return () => clearTimeout(timer);
      }
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
