import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Activity, Shield, Settings } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

export default function SleepEmptyState({ 
  type = 'no-data', // 'no-data', 'no-permission', 'insufficient-data'
  onRequestPermission,
  onOpenSettings
}) {
  const getEmptyStateContent = () => {
    switch (type) {
      case 'no-permission':
        return {
          icon: <Shield size={48} color="#9D7AFF" strokeWidth={2} />,
          title: 'Health Access Needed',
          subtitle: 'Enable Health access to track your sleep patterns automatically.',
          description: 'We\'ll use your step data to infer sleep patterns and improve your rhythm insights.',
          primaryAction: {
            text: 'Enable Health Access',
            onPress: onRequestPermission,
          },
          secondaryAction: {
            text: 'Open Settings',
            onPress: onOpenSettings,
          }
        };
      
      case 'insufficient-data':
        return {
          icon: <Activity size={48} color="#FFB88C" strokeWidth={2} />,
          title: 'Building Your Sleep Profile',
          subtitle: 'Not enough step data to infer your sleep patterns yet.',
          description: 'Keep tracking your activity for a few more days, and we\'ll automatically detect your sleep patterns.',
          primaryAction: {
            text: 'Sync HealthKit',
            onPress: onRequestPermission,
          },
          secondaryAction: null
        };
      
      default: // 'no-data'
        return {
          icon: <Activity size={48} color="#48E0C2" strokeWidth={2} />,
          title: 'No Sleep Data Yet',
          subtitle: 'Your sleep tracking journey starts here.',
          description: 'We\'ll automatically detect your sleep patterns from your activity data, or you can manually add sleep sessions.',
          primaryAction: {
            text: 'Sync HealthKit',
            onPress: onRequestPermission,
          },
          secondaryAction: null
        };
    }
  };

  const handleOpenSettings = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Error opening settings:', error);
    }
    onOpenSettings?.();
  };

  const content = getEmptyStateContent();

  return (
    <View style={styles.container}>
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            {content.icon}
          </View>
          
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.subtitle}>{content.subtitle}</Text>
          <Text style={styles.description}>{content.description}</Text>
          
          <View style={styles.actionContainer}>
            {content.primaryAction && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={content.primaryAction.onPress}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>
                  {content.primaryAction.text}
                </Text>
              </TouchableOpacity>
            )}
            
            {content.secondaryAction && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={content.secondaryAction.onPress || handleOpenSettings}
                activeOpacity={0.8}
              >
                <Settings size={16} color="#A0A0A0" />
                <Text style={styles.secondaryButtonText}>
                  {content.secondaryAction.text}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  blurContainer: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  actionContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#9D7AFF',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#9D7AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A0A0A0',
  },
});
