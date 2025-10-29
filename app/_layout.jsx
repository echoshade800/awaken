import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import useStore from '../lib/store';
import { initializeNotificationHandler, registerNotificationCategories } from '../lib/alarmScheduler';
import { setupNotificationListeners, registerBackgroundTask } from '../lib/backgroundAlarmTask';
import { initializeAlarmService, checkAndResumeAlarmAudio } from '../lib/alarmService';

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const initialize = useStore((state) => state.initialize);

  useEffect(() => {
    const startOnboarding = async () => {
      try {
        console.log('[Root] Starting initialization...');

        // Initialize alarm service (must be first for audio session)
        await initializeAlarmService();
        console.log('[Root] Alarm service initialized');

        // Check and resume any active alarm audio
        await checkAndResumeAlarmAudio();
        console.log('[Root] Checked for active alarms');

        // Initialize notification system
        await initializeNotificationHandler();
        await registerNotificationCategories();
        setupNotificationListeners(router);
        await registerBackgroundTask();
        console.log('[Root] Notification system initialized');

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
      console.log('[Root] Redirecting to onboarding...');
      const timer = setTimeout(() => {
        router.replace('/onboarding/welcome');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isReady, shouldNavigate]);

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
