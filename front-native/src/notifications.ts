/**
 * Cross-platform notification utility
 * Supports both React Native (Notifee) and Web (Web Push API)
 */

import { Platform, Alert } from 'react-native';

// Import Notifee for native platforms
let notifee: any = null;
let AndroidImportance: any = null;

if (Platform.OS !== 'web') {
  try {
    const notifeeModule = require('@notifee/react-native');
    notifee = notifeeModule.default || notifeeModule;
    AndroidImportance = notifeeModule.AndroidImportance;
    if (!notifee || typeof notifee.displayNotification !== 'function') {
      console.warn('Notifee module loaded but displayNotification not available');
      notifee = null;
    }
  } catch (e) {
    console.warn('Notifee not available, will use Alert fallback:', e);
    notifee = null;
  }
}

/**
 * Initialize notifications for the platform
 */
export const initializeNotifications = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    // Web: Request notification permission
    if ('Notification' in window && 'serviceWorker' in navigator) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Web notification permission granted');
          
          // Subscribe to push notifications if service worker is ready
          try {
            const registration = await navigator.serviceWorker.ready;
            // You can subscribe to push notifications here if you have a VAPID key
            // const subscription = await registration.pushManager.subscribe({
            //   userVisibleOnly: true,
            //   applicationServerKey: YOUR_VAPID_PUBLIC_KEY
            // });
            console.log('Service worker ready for push notifications');
          } catch (error) {
            console.warn('Error setting up push subscription:', error);
          }
        } else {
          console.warn('Web notification permission denied');
        }
      } catch (error) {
        console.warn('Error requesting web notification permission:', error);
      }
    } else {
      console.warn('Web notifications not supported in this browser');
    }
  } else {
    // Native: Initialize Notifee
    if (!notifee) {
      console.warn('Notifee not available - notifications will use Alert fallback');
      return;
    }

    try {
      // Request permissions
      if (Platform.OS === 'android' && notifee.requestPermission) {
        await notifee.requestPermission();
      }

      // Create a channel for Android
      if (Platform.OS === 'android' && notifee.createChannel && AndroidImportance) {
        await notifee.createChannel({
          id: 'default',
          name: 'התראות מערכת',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
        });
      }

      console.log('Native notifications initialized successfully');
    } catch (error) {
      console.warn('Error initializing native notifications:', error);
    }
  }
};

/**
 * Show a notification
 */
export const showNotification = async (title: string, message: string): Promise<void> => {
  if (Platform.OS === 'web') {
    // Web: Use Web Notifications API
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, {
            body: message,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: 'notification',
            vibrate: [200, 100, 200],
            requireInteraction: false,
          });
          return;
        } catch (error) {
          console.warn('Error showing web notification via service worker:', error);
          // Fallback to direct Notification API
        }
      }

      // Fallback: Direct notification (if permission granted)
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body: message,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: 'notification',
          });
          return;
        } catch (error) {
          console.warn('Error showing direct web notification:', error);
        }
      } else if (Notification.permission === 'default') {
        // Request permission first
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, {
            body: message,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
          });
          return;
        }
      }
    }
    
    // Fallback to alert for web
    Alert.alert(title, message, [{ text: 'OK' }]);
  } else {
    // Native: Use Notifee
    if (!notifee || typeof notifee.displayNotification !== 'function') {
      // Fallback to Alert if Notifee is not available
      Alert.alert(title, message, [{ text: 'OK' }]);
      return;
    }

    try {
      await notifee.displayNotification({
        title,
        body: message,
        android: {
          channelId: 'default',
          importance: AndroidImportance?.HIGH || 4,
          sound: 'default',
          vibrationPattern: [300, 500],
        },
      });
    } catch (error) {
      console.warn('Error showing native notification, using Alert fallback:', error);
      // Fallback to alert if notification fails
      Alert.alert(title, message, [{ text: 'OK' }]);
    }
  }
};

/**
 * Check if notifications are supported
 */
export const isNotificationSupported = (): boolean => {
  if (Platform.OS === 'web') {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }
  return notifee !== null;
};

/**
 * Get notification permission status
 */
export const getNotificationPermission = async (): Promise<NotificationPermission | 'unknown'> => {
  if (Platform.OS === 'web') {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'unknown';
  }
  // For native, we assume permission is handled by the platform
  return 'granted';
};


