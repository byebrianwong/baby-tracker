import { formatClockTime, summarizeEvent } from '@baby-bean/core';
import { type EventRow } from '@baby-bean/db';
import { observer } from '@legendapp/state/react';
import { type ReactNode } from 'react';
import { FlatList, Pressable, View as RNView } from 'react-native';

import { Icon, TimelineRow } from '@/components';
import { useLogging, useTimeline } from '@/features/logging/data';
import { useUndo } from '@/features/logging/feedback/UndoController';
import { Text, useTheme, View } from '@/theme';

import { eventVisuals } from './visuals';

export type TimelineProps = { header?: ReactNode; onEventPress?: (event: EventRow) => void };

/** The day's events, newest first. Virtualized; tap opens the editor, swipe deletes. */
export const Timeline = observer(function Timeline({ header, onEventPress }: TimelineProps) {
  const theme = useTheme();
  const events = useTimeline();
  const { deleteEvent, undo } = useLogging();
  const { showUndo } = useUndo();

  return (
    <FlatList
      data={events}
      keyExtractor={(e) => e.id}
      ListHeaderComponent={header ? <>{header}</> : null}
      contentContainerStyle={{ padding: theme.space.lg, paddingBottom: theme.space.xxxl }}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => (
        <RNView style={{ height: theme.size.hairline, backgroundColor: theme.color.line }} />
      )}
      ListEmptyComponent={
        <View
          bg="surface"
          radius="lg"
          padding="xl"
          style={{ gap: theme.space.sm, borderWidth: theme.size.hairline, borderColor: theme.color.line }}
        >
          <Text variant="subtitle">No feeds yet today</Text>
          <Text variant="body" color="inkSoft">
            Tap Feed below to start. Everything you log is undoable and easy to fix later.
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const v = eventVisuals(item.type);
        return (
          <TimelineRow
            accent={v.accent}
            icon={v.icon}
            time={formatClockTime(new Date(item.started_at))}
            title={summarizeEvent(item)}
            onPress={onEventPress ? () => onEventPress(item) : undefined}
            renderRightActions={() => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete"
                onPress={() => {
                  deleteEvent(item.id);
                  showUndo('Deleted', () => undo(item.id));
                }}
                style={{
                  width: theme.size.pebblePrimary + theme.space.lg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: theme.space.xs,
                  backgroundColor: theme.color.accentSoft.health,
                }}
              >
                <Icon name="close" color={theme.color.accent.health} />
                <Text variant="caption" style={{ color: theme.color.accent.health }}>
                  Delete
                </Text>
              </Pressable>
            )}
          />
        );
      }}
    />
  );
});
