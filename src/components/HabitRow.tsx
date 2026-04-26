import { useMemo, useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Swipeable as SwipeableType } from 'react-native-gesture-handler';

import { CompletionRecord, Habit, lastNDays, todayISO } from '@/lib/types';

const Swipeable: typeof SwipeableType | null =
  Platform.OS === 'web'
    ? null
    : // eslint-disable-next-line @typescript-eslint/no-require-imports -- conditional require keeps gesture-handler out of web bundle
      (require('react-native-gesture-handler').Swipeable as typeof SwipeableType);

type Props = {
  habit: Habit;
  index: number;
  completions: CompletionRecord[];
  onToggleToday: (habitId: string) => void;
  onDelete: (habitId: string) => void;
};

export function HabitRow({ habit, index, completions, onToggleToday, onDelete }: Props) {
  const days = useMemo(() => lastNDays(7), []);
  const today = todayISO();
  const completedSet = useMemo(() => {
    const set = new Set<string>();
    for (const c of completions) {
      if (c.habitId === habit.id) set.add(c.date);
    }
    return set;
  }, [completions, habit.id]);
  const swipeRef = useRef<SwipeableType | null>(null);

  const renderRightActions = () => (
    <Pressable
      testID={`habit-row-${index}-delete-button`}
      accessibilityLabel={`Delete ${habit.name}`}
      style={({ pressed }) => [styles.deleteAction, pressed && styles.deleteActionPressed]}
      onPress={() => {
        swipeRef.current?.close();
        onDelete(habit.id);
      }}
    >
      <Text style={styles.deleteText}>Delete</Text>
    </Pressable>
  );

  const rowContent = (
    <Pressable
      testID={`habit-row-${index}`}
      accessibilityLabel={`Toggle ${habit.name} for today`}
      style={({ pressed }) => [styles.rowInner, pressed && styles.rowPressed]}
      onPress={() => onToggleToday(habit.id)}
    >
      <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
        {habit.name}
      </Text>
      <View style={styles.grid}>
        {days.map((d) => {
          const done = completedSet.has(d);
          const isToday = d === today;
          const cellTestId = isToday ? `habit-row-${index}-today-cell` : undefined;
          return (
            <View
              key={d}
              testID={cellTestId}
              style={[
                styles.cell,
                done && styles.cellDone,
                isToday && styles.cellToday,
                done && isToday && styles.cellTodayDone,
              ]}
            />
          );
        })}
      </View>
      {Platform.OS === 'web' ? (
        <Pressable
          testID={`habit-row-${index}-delete-button`}
          accessibilityLabel={`Delete ${habit.name}`}
          style={({ pressed }) => [styles.inlineDelete, pressed && styles.inlineDeletePressed]}
          onPress={(e) => {
            e.stopPropagation();
            onDelete(habit.id);
          }}
        >
          <Text style={styles.inlineDeleteText}>Delete</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );

  if (Platform.OS === 'web' || !Swipeable) {
    return <View style={styles.rowOuter}>{rowContent}</View>;
  }

  return (
    <View style={styles.rowOuter}>
      <Swipeable
        ref={(r) => {
          swipeRef.current = r;
        }}
        renderRightActions={renderRightActions}
        overshootRight={false}
        rightThreshold={40}
      >
        {rowContent}
      </Swipeable>
    </View>
  );
}

const CELL_SIZE = 22;
const styles = StyleSheet.create({
  rowOuter: {
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 56,
    backgroundColor: '#ffffff',
  },
  rowPressed: {
    backgroundColor: '#f3f4f6',
  },
  name: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginRight: 8,
  },
  grid: {
    flexDirection: 'row',
    gap: 4,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  cellDone: {
    backgroundColor: '#10b981',
  },
  cellToday: {
    borderWidth: 2,
    borderColor: '#0a7ea4',
  },
  cellTodayDone: {
    backgroundColor: '#10b981',
  },
  deleteAction: {
    backgroundColor: '#b91c1c',
    justifyContent: 'center',
    alignItems: 'center',
    width: 88,
    height: '100%',
  },
  deleteActionPressed: {
    opacity: 0.85,
  },
  deleteText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  inlineDelete: {
    marginLeft: 12,
    minHeight: 44,
    minWidth: 64,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#b91c1c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineDeletePressed: {
    opacity: 0.85,
  },
  inlineDeleteText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});
