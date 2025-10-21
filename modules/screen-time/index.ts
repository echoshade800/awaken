import { NativeModules } from 'react-native';

const { ScreenTimeModule } = NativeModules;

export interface ScreenTimeEvent {
  timestamp: number;
  type: 'screen_on' | 'screen_off' | 'app_usage';
  date: string;
}

export interface ScreenTimeModuleInterface {
  checkPermission(): Promise<'authorized' | 'denied' | 'notDetermined'>;
  requestAuthorization(): Promise<boolean>;
  startMonitoring(): Promise<boolean>;
  stopMonitoring(): Promise<void>;
  getUsageData(days: number): Promise<ScreenTimeEvent[]>;
}

export default ScreenTimeModule as ScreenTimeModuleInterface;
