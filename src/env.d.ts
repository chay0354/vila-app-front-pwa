declare module 'react-native-config' {
  export interface NativeConfig {
    API_BASE_URL?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}

declare module 'react-native-push-notification' {
  interface PushNotificationOptions {
    channelId?: string;
    title?: string;
    message?: string;
    playSound?: boolean;
    soundName?: string;
    importance?: string;
    priority?: string;
    vibrate?: boolean;
    vibration?: number;
    userInfo?: any;
  }

  interface PushNotificationConfig {
    onRegister?: (token: any) => void;
    onNotification?: (notification: any) => void;
    onAction?: (notification: any) => void;
    onRegistrationError?: (err: any) => void;
    permissions?: {
      alert?: boolean;
      badge?: boolean;
      sound?: boolean;
    };
    popInitialNotification?: boolean;
    requestPermissions?: boolean;
  }

  interface PushNotification {
    configure: (config: PushNotificationConfig) => void;
    localNotification: (options: PushNotificationOptions) => void;
    createChannel?: (channel: any, callback?: (created: boolean) => void) => void;
  }

  const PushNotification: PushNotification;
  export default PushNotification;
}

