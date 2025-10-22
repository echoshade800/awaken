import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function SmartAlarmRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/onboarding/health-permission');
  }, []);

  return null;
}
