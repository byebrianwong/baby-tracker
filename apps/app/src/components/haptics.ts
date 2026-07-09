import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { Platform } from 'react-native';

export type HapticKind = 'light' | 'medium' | 'success' | 'selection';

/**
 * Soft confirmation feedback for primary actions. No-op on web. Fire-and-forget
 * so it never blocks the log path or throws on unsupported devices.
 */
export function useHaptic(): (kind?: HapticKind) => void {
  return useCallback((kind: HapticKind = 'light') => {
    if (Platform.OS === 'web') return;
    const run = async () => {
      switch (kind) {
        case 'success':
          return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        case 'selection':
          return Haptics.selectionAsync();
        case 'medium':
          return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        default:
          return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    };
    void run().catch(() => {});
  }, []);
}
