import { forwardRef } from 'react';
import { TextInput, type TextInputProps } from 'react-native';

import { FONT, Text, useTheme, View } from '@/theme';

export type FieldProps = TextInputProps & { label: string };

/** A themed labelled text input for the auth screens. */
export const Field = forwardRef<TextInput, FieldProps>(function Field({ label, style, ...rest }, ref) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.space.xs }}>
      <Text variant="caption" color="inkSoft">
        {label}
      </Text>
      <TextInput
        ref={ref}
        placeholderTextColor={theme.color.inkSoft}
        style={[
          {
            minHeight: theme.size.tapMin,
            paddingHorizontal: theme.space.lg,
            borderRadius: theme.radius.md,
            backgroundColor: theme.color.surfaceSunk,
            borderWidth: theme.size.hairline,
            borderColor: theme.color.line,
            color: theme.color.ink,
            fontFamily: FONT.bodyRegular,
            fontSize: theme.type.scale.bodyLarge,
          },
          style,
        ]}
        {...rest}
      />
    </View>
  );
});
