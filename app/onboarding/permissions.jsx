import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef } from 'react';
import { Bell, Clock, Activity, Smartphone, Check, X } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import useStore from '@/lib/store';
import { requestScreenTimePermission } from '@/lib/usageTracking';

export default function PermissionsScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [permissions, setPermissions] = useState({
    notifications: false,
    alarms: false,
    activity: false,
    screenTime: false,
  });
  const [showDeniedModal, setShowDeniedModal] = useState(false);
  const [allGranted, setAllGranted] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    checkPermissions();
  }, []);

  useEffect(() => {
    const granted = permissions.notifications && permissions.alarms && permissions.screenTime;
    setAllGranted(granted);
  }, [permissions]);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissions((prev) => ({
      ...prev,
      notifications: status === 'granted',
      alarms: Platform.OS === 'web' ? true : status === 'granted',
      activity: true,
      screenTime: false,
    }));
  };

  const requestNotificationPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      setPermissions((prev) => ({
        ...prev,
        notifications: true,
        alarms: Platform.OS === 'web' ? true : true,
      }));
    } else {
      setShowDeniedModal(true);
    }
  };

  const requestActivityPermission = async () => {
    if (Platform.OS === 'web') {
      setPermissions((prev) => ({ ...prev, activity: true }));
      return;
    }
    setPermissions((prev) => ({ ...prev, activity: true }));
  };

  const handleScreenTimePermission = async () => {
    const granted = await requestScreenTimePermission();
    setPermissions((prev) => ({ ...prev, screenTime: granted }));
  };

  const enableUsageTracking = useStore((state) => state.enableUsageTracking);

  const handleContinue = async () => {
    if (!allGranted) {
      setShowDeniedModal(true);
      return;
    }

    if (permissions.screenTime) {
      await enableUsageTracking();
    }

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      router.push('/onboarding/energy-type');
    });
  };

  const PermissionCard = ({ icon: Icon, title, description, granted, onRequest }) => (
    <View style={styles.permissionCard}>
      <View style={styles.permissionIcon}>
        <Icon size={24} color={granted ? '#4CAF50' : '#FFB88C'} />
      </View>
      <View style={styles.permissionContent}>
        <Text style={styles.permissionTitle}>{title}</Text>
        <Text style={styles.permissionDescription}>{description}</Text>
      </View>
      <TouchableOpacity
        style={[styles.checkButton, granted && styles.checkButtonGranted]}
        onPress={granted ? null : onRequest}
        activeOpacity={granted ? 1 : 0.7}
      >
        {granted ? (
          <Check size={20} color="#FFF" />
        ) : (
          <Text style={styles.checkButtonText}>Allow</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3D5A80', '#5A7BA5', '#7A9BC4', '#FFB88C', '#E8F4FF', '#F0F8FF', '#FAFCFF']}
        locations={[0, 0.25, 0.4, 0.5, 0.65, 0.82, 1]}
        style={styles.background}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.glassCard}>
          <Text style={styles.title}>Help Monster understand your rhythm</Text>
          <Text style={styles.subtitle}>
            To calculate your personalized sleep need and circadian rhythm, Monster analyzes your usage patterns.{'\n\n'}
            🔒 Privacy-safe: Only timestamps are analyzed{Platform.OS === 'web' ? '\n📊 Web Demo: Sample data will be generated for demonstration' : ''}
          </Text>

          <View style={styles.permissionsContainer}>
            <PermissionCard
              icon={Bell}
              title="Notifications"
              description="For AI tips & wake-up reminders"
              granted={permissions.notifications}
              onRequest={requestNotificationPermission}
            />

            <PermissionCard
              icon={Clock}
              title="Alarm Access"
              description="To schedule smart alarms"
              granted={permissions.alarms}
              onRequest={requestNotificationPermission}
            />

            <PermissionCard
              icon={Activity}
              title="Activity Tracking"
              description="Detect active vs rest periods"
              granted={permissions.activity}
              onRequest={requestActivityPermission}
            />

            <PermissionCard
              icon={Smartphone}
              title={Platform.OS === 'web' ? 'Screen Time Data (Demo)' : 'Screen Time Data'}
              description={Platform.OS === 'web' ? 'Generate sample data to demonstrate sleep analysis' : 'Analyze device usage for personalized sleep insights'}
              granted={permissions.screenTime}
              onRequest={handleScreenTimePermission}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, !allGranted && styles.buttonDisabled]}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={allGranted ? ['#FFD89C', '#FFE4B5', '#FFF5E6'] : ['#E0E0E0', '#F0F0F0', '#F5F5F5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={[styles.buttonText, !allGranted && styles.buttonTextDisabled]}>
              Continue
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showDeniedModal}
        onRequestClose={() => setShowDeniedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Can't track your rhythm without permission 💫</Text>
            <Text style={styles.modalDescription}>
              Please grant the required permissions to continue. You can change these later in your device settings.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowDeniedModal(false);
                requestNotificationPermission();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButtonSecondary}
              onPress={() => setShowDeniedModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  glassCard: {
    marginTop: 20,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#FFB88C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4A5F8F',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7C99',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  permissionsContainer: {
    gap: 16,
  },
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 184, 140, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5F8F',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 13,
    color: '#6B7C99',
    lineHeight: 18,
  },
  checkButton: {
    backgroundColor: '#FFB88C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  checkButtonGranted: {
    backgroundColor: '#4CAF50',
  },
  checkButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  button: {
    marginTop: 24,
    borderRadius: 20,
    shadowColor: '#FFB88C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#4A5F8F',
  },
  buttonTextDisabled: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: 360,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A5F8F',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 15,
    color: '#6B7C99',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#FFB88C',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  modalButtonSecondary: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7C99',
  },
});
