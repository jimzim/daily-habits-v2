import { CompletionRecord, Habit, MAX_HABIT_NAME_LENGTH, todayISO } from './types';

let habitsMem: Habit[] = [];
let completionsMem: CompletionRecord[] = [];

export async function loadHabits(): Promise<Habit[]> {
  return habitsMem.slice();
}

export async function saveHabits(habits: Habit[]): Promise<void> {
  habitsMem = habits.slice();
}

export async function loadCompletions(): Promise<CompletionRecord[]> {
  return completionsMem.slice();
}

export async function saveCompletions(records: CompletionRecord[]): Promise<void> {
  completionsMem = records.slice();
}

export async function addHabit(name: string): Promise<Habit | null> {
  const trimmed = name.trim().slice(0, MAX_HABIT_NAME_LENGTH);
  if (!trimmed) return null;
  const habit: Habit = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: trimmed,
    createdAt: Date.now(),
  };
  habitsMem = [habit, ...habitsMem];
  return habit;
}

export async function toggleCompletion(habitId: string, dateISO: string = todayISO()): Promise<boolean> {
  const idx = completionsMem.findIndex((r) => r.habitId === habitId && r.date === dateISO);
  if (idx >= 0) {
    completionsMem = [...completionsMem.slice(0, idx), ...completionsMem.slice(idx + 1)];
    return false;
  }
  completionsMem = [...completionsMem, { habitId, date: dateISO }];
  return true;
}

export async function deleteHabit(id: string): Promise<void> {
  habitsMem = habitsMem.filter((h) => h.id !== id);
  completionsMem = completionsMem.filter((r) => r.habitId !== id);
}
