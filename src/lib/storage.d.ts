import { CompletionRecord, Habit } from './types';

export declare function loadHabits(): Promise<Habit[]>;
export declare function saveHabits(habits: Habit[]): Promise<void>;
export declare function loadCompletions(): Promise<CompletionRecord[]>;
export declare function saveCompletions(records: CompletionRecord[]): Promise<void>;
export declare function addHabit(name: string): Promise<Habit | null>;
export declare function toggleCompletion(habitId: string, dateISO?: string): Promise<boolean>;
export declare function deleteHabit(id: string): Promise<void>;
