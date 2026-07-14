import { type IconName } from '@/components';
import { type AccentName } from '@/theme';

/** Category accent + icon for each event type, so the timeline reads at a glance. */
export function eventVisuals(type: string): { accent: AccentName; icon: IconName } {
  switch (type) {
    case 'breast':
    case 'bottle':
    case 'solids':
      return { accent: type === 'solids' ? 'solids' : 'feed', icon: type === 'solids' ? 'solids' : 'feed' };
    case 'sleep':
      return { accent: 'sleep', icon: 'sleep' };
    case 'diaper':
      return { accent: 'diaper', icon: 'diaper' };
    case 'pump':
      return { accent: 'pump', icon: 'pump' };
    case 'medication':
    case 'temperature':
    case 'symptom':
      return { accent: 'health', icon: 'health' };
    case 'growth':
    case 'milestone':
      return { accent: 'growth', icon: 'growth' };
    default:
      return { accent: 'feed', icon: 'note' };
  }
}
