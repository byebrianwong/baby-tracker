import { Icon, type IconName, Sheet, SheetOption } from '@/components';
import { type AccentName, useTheme } from '@/theme';

/** The activities that live off the fast-log path. */
export type MoreKind = 'medication' | 'temperature' | 'solids' | 'tummy_time' | 'bath' | 'note';

const OPTIONS: { kind: MoreKind; label: string; icon: IconName; accent: AccentName }[] = [
  { kind: 'medication', label: 'Medication', icon: 'health', accent: 'health' },
  { kind: 'temperature', label: 'Temperature', icon: 'health', accent: 'health' },
  { kind: 'solids', label: 'Solids', icon: 'solids', accent: 'solids' },
  { kind: 'tummy_time', label: 'Tummy time', icon: 'baby', accent: 'growth' },
  { kind: 'bath', label: 'Bath', icon: 'diaper', accent: 'diaper' },
  { kind: 'note', label: 'Note', icon: 'note', accent: 'sleep' },
];

export type MoreSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (kind: MoreKind) => void;
};

/**
 * The secondary log menu. Everything here is deliberately one level below the
 * four quick-log buttons: adding these to the thumb row would shrink the
 * targets that matter (spec: no feature slows the core-log path).
 */
export function MoreSheet({ visible, onClose, onSelect }: MoreSheetProps) {
  const theme = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title="Log something else">
      {OPTIONS.map((o) => (
        <SheetOption
          key={o.kind}
          label={o.label}
          category={o.accent}
          iconLeft={<Icon name={o.icon} color={theme.color.accent[o.accent]} />}
          onPress={() => {
            onSelect(o.kind);
            onClose();
          }}
        />
      ))}
    </Sheet>
  );
}
