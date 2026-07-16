import { TimeStepper } from '@/components';
import { Text, useTheme, View } from '@/theme';

export type TimeAdjustProps = {
  label: string;
  value: Date;
  onChange: (value: Date) => void;
};

/**
 * Labelled fast time editing (quick "N min ago" offsets + fine stepping). The
 * shared entry point other logging surfaces use for backdating. Built on the
 * P0-4 TimeStepper primitive.
 */
export function TimeAdjust({ label, value, onChange }: TimeAdjustProps) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.space.sm }}>
      <Text variant="caption" color="inkSoft">
        {label}
      </Text>
      <TimeStepper value={value} onChange={onChange} />
    </View>
  );
}
