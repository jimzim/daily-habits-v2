import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, Text } from 'react-native';

import { MAX_HABIT_NAME_LENGTH } from '@/lib/types';

type Props = {
  onAdd: (name: string) => void;
};

export function AddHabitRow({ onAdd }: Props) {
  const [value, setValue] = useState('');
  const trimmed = value.trim();
  const canAdd = trimmed.length > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd(trimmed);
    setValue('');
  };

  return (
    <View style={styles.row}>
      <TextInput
        testID="add-habit-input"
        style={styles.input}
        placeholder="New habit"
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={setValue}
        maxLength={MAX_HABIT_NAME_LENGTH}
        returnKeyType="done"
        onSubmitEditing={handleAdd}
        autoCorrect={false}
      />
      <Pressable
        testID="add-habit-button"
        accessibilityLabel="Add habit"
        accessibilityState={{ disabled: !canAdd }}
        disabled={!canAdd}
        onPress={handleAdd}
        style={({ pressed }) => [
          styles.button,
          !canAdd && styles.buttonDisabled,
          pressed && canAdd && styles.buttonPressed,
        ]}
      >
        <Text style={styles.buttonText}>Add</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  button: {
    minWidth: 72,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#0a7ea4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
