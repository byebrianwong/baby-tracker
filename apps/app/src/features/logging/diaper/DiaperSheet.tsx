import { type DiaperContents } from '@baby-bean/core';

import { Icon, Sheet, SheetOption } from '@/components';
import { type AccentName, useTheme } from '@/theme';

const OPTIONS: { contents: DiaperContents; label: string; accent: AccentName }[] = [
  { contents: 'wet', label: 'Wet', accent: 'diaper' },
  { contents: 'dirty', label: 'Dirty', accent: 'solids' },
  { contents: 'mixed', label: 'Mixed', accent: 'feed' },
];

export type DiaperSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (contents: DiaperContents) => void;
};

/**
 * Two-tap diaper log: tap Diaper (opens this), tap the type. Wet / dirty / mixed
 * are the primary options; detail attributes stay off the fast path (P1-4).
 */
export function DiaperSheet({ visible, onClose, onSelect }: DiaperSheetProps) {
  const theme = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title="Log diaper">
      {OPTIONS.map((o) => (
        <SheetOption
          key={o.contents}
          label={o.label}
          category={o.accent}
          iconLeft={<Icon name="diaper" color={theme.color.accent[o.accent]} />}
          onPress={() => {
            onSelect(o.contents);
            onClose();
          }}
        />
      ))}
    </Sheet>
  );
}
