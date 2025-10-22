import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="sleep-routine" />
      <Stack.Screen name="permissions" />
      <Stack.Screen name="energy-type" />
      <Stack.Screen name="smart-alarm" />
      <Stack.Screen name="step-permission" />
      <Stack.Screen name="initializing" />
      <Stack.Screen name="loading" />
    </Stack>
  );
}
