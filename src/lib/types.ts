export type Habit = {
  id: string;
  name: string;
  createdAt: number;
};

export type CompletionRecord = {
  habitId: string;
  date: string;
};

export const MAX_HABIT_NAME_LENGTH = 50;

export function todayISO(): string {
  return toISODate(new Date());
}

export function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function lastNDays(n: number): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(toISODate(d));
  }
  return out;
}
