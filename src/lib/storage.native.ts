import AsyncStorage from '@react-native-async-storage/async-storage';

import { CompletionRecord, Habit, MAX_HABIT_NAME_LENGTH, todayISO } from './types';

const KEY_HABITS = 'habits.v1';
const KEY_COMPLETIONS = 'completions.v1';

export async function loadHabits(): Promise<Habit[]> {
  const raw = await AsyncStorage.getItem(KEY_HABITS);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Habit[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveHabits(habits: Habit[]): Promise<void> {
  await AsyncStorage.setItem(KEY_HABITS, JSON.stringify(habits));
}

export async function loadCompletions(): Promise<CompletionRecord[]> {
  const raw = await AsyncStorage.getItem(KEY_COMPLETIONS);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CompletionRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveCompletions(records: CompletionRecord[]): Promise<void> {
  await AsyncStorage.setItem(KEY_COMPLETIONS, JSON.stringify(records));
}

export async function addHabit(name: string): Promise<Habit | null> {
  const trimmed = name.trim().slice(0, MAX_HABIT_NAME_LENGTH);
  if (!trimmed) return null;
  const habits = await loadHabits();
  const habit: Habit = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: trimmed,
    createdAt: Date.now(),
  };
  await saveHabits([habit, ...habits]);
  return habit;
}

export async function toggleCompletion(habitId: string, dateISO: string = todayISO()): Promise<boolean> {
  const records = await loadCompletions();
  const existing = records.findIndex((r) => r.habitId === habitId && r.date === dateISO);
  if (existing >= 0) {
    const next = records.slice();
    next.splice(existing, 1);
    await saveCompletions(next);
    return false;
  }
  await saveCompletions([...records, { habitId, date: dateISO }]);
  return true;
}

export async function deleteHabit(id: string): Promise<void> {
  const habits = await loadHabits();
  await saveHabits(habits.filter((h) => h.id !== id));
  const records = await loadCompletions();
  await saveCompletions(records.filter((r) => r.habitId !== id));
}
