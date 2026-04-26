import { FlatList, StyleSheet, Text, View } from 'react-native';

import { CompletionRecord, Habit } from '@/lib/types';

import { HabitRow } from './HabitRow';

type Props = {
  habits: Habit[];
  completions: CompletionRecord[];
  onToggleToday: (habitId: string) => void;
  onDelete: (habitId: string) => void;
};

export function HabitList({ habits, completions, onToggleToday, onDelete }: Props) {
  if (habits.length === 0) {
    return (
      <View style={styles.empty} testID="empty-state">
        <Text style={styles.emptyText}>No habits yet — add one above</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={habits}
      keyExtractor={(h) => h.id}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      renderItem={({ item, index }) => (
        <HabitRow
          habit={item}
          index={index}
          completions={completions}
          onToggleToday={onToggleToday}
          onDelete={onDelete}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
    textAlign: 'center',
  },
});
