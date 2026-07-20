import { useState } from 'react';

import { Pebble, Sheet } from '@/components';
import { Field } from '@/features/auth/Field';
import { useTheme, View } from '@/theme';

export type NoteSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
};

/** A free-text note on the timeline — the catch-all for everything else. */
export function NoteSheet({ visible, onClose, onSave }: NoteSheetProps) {
  const theme = useTheme();
  const [note, setNote] = useState('');

  const save = () => {
    if (!note.trim()) return;
    onSave(note.trim());
    setNote('');
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Add a note">
      <View style={{ gap: theme.space.lg }}>
        <Field
          label="Note"
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
          style={{ minHeight: theme.size.pebblePrimary, paddingTop: theme.space.md }}
          placeholder="Fussy after the 2pm feed"
        />
        <Pebble label="Save note" onPress={save} disabled={!note.trim()} />
      </View>
    </Sheet>
  );
}
