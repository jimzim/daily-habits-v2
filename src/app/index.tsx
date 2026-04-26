import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddHabitRow } from '@/components/AddHabitRow';
import { HabitList } from '@/components/HabitList';
import { PlatformInfoCard } from '@/components/PlatformInfoCard';
import {
  addHabit as storageAddHabit,
  deleteHabit as storageDeleteHabit,
  loadCompletions,
  loadHabits,
  toggleCompletion as storageToggleCompletion,
} from '@/lib/storage';
import { CompletionRecord, Habit } from '@/lib/types';

export default function Index() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<CompletionRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [h, c] = await Promise.all([loadHabits(), loadCompletions()]);
      if (cancelled) return;
      setHabits(h);
      setCompletions(c);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAdd = useCallback(async (name: string) => {
    const habit = await storageAddHabit(name);
    if (!habit) return;
    setHabits((prev) => [habit, ...prev]);
  }, []);

  const handleToggleToday = useCallback(async (habitId: string) => {
    await storageToggleCompletion(habitId);
    const next = await loadCompletions();
    setCompletions(next);
  }, []);

  const handleDelete = useCallback(async (habitId: string) => {
    await storageDeleteHabit(habitId);
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    setCompletions((prev) => prev.filter((c) => c.habitId !== habitId));
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Habits</Text>
        <Text style={styles.subtitle}>Build streaks one day at a time</Text>
      </View>
      <AddHabitRow onAdd={handleAdd} />
      <View style={styles.listContainer}>
        <HabitList
          habits={habits}
          completions={completions}
          onToggleToday={handleToggleToday}
          onDelete={handleDelete}
        />
      </View>
      <PlatformInfoCard habitCount={habits.length} />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  listContainer: {
    flex: 1,
  },
});
