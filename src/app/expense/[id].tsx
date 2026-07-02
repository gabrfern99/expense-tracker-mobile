import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import * as expensesApi from '@/db/expenses';
import { getErrorMessage } from '@/lib/errors';
import { CategoryPicker } from '@/components/CategoryPicker';
import {
  formatDateDisplay,
  fromISODate,
  normalizeAmountInput,
  toISODate,
  todayISO,
} from '@/lib/format';
import { useExpenseStore } from '@/store/expenseStore';

export default function ExpenseFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const router = useRouter();

  const categories = useExpenseStore((s) => s.categories);
  const ensureCategories = useExpenseStore((s) => s.ensureCategories);
  const removeExpense = useExpenseStore((s) => s.removeExpense);

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayISO());
  const [showDate, setShowDate] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    ensureCategories().catch(() => {});
  }, [ensureCategories]);

  useEffect(() => {
    if (isNew) return;
    let active = true;
    (async () => {
      try {
        const e = await expensesApi.getExpense(Number(id));
        if (!active) return;
        setAmount(e.amount);
        setCategoryId(e.category_id);
        setDescription(e.description ?? '');
        setDate(e.date);
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, isNew]);

  const onSave = async () => {
    setError(null);
    const normalized = normalizeAmountInput(amount);
    if (!normalized) {
      setError('Enter a valid amount greater than 0.');
      return;
    }
    if (!categoryId) {
      setError('Please choose a category.');
      return;
    }
    setSaving(true);
    try {
      const input = {
        amount: normalized,
        category_id: categoryId,
        description: description.trim() || null,
        date,
      };
      if (isNew) {
        await expensesApi.createExpense(input);
      } else {
        await expensesApi.updateExpense(Number(id), input);
      }
      router.back();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Delete expense', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeExpense(Number(id));
            router.back();
          } catch (err) {
            setError(getErrorMessage(err));
          }
        },
      },
    ]);
  };

  const onValueChange = (_event: DateTimePickerChangeEvent, selected: Date) => {
    // Android closes the dialog itself; keep it open on iOS (inline spinner).
    setShowDate(Platform.OS === 'ios');
    setDate(toISODate(selected));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Edit expense' }} />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: isNew ? 'Add expense' : 'Edit expense' }} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder="0.00"
        placeholderTextColor="#9AA0A6"
        value={amount}
        onChangeText={setAmount}
        editable={!saving}
      />

      <Text style={styles.label}>Category</Text>
      <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Groceries"
        placeholderTextColor="#9AA0A6"
        value={description}
        onChangeText={setDescription}
        editable={!saving}
      />

      <Text style={styles.label}>Date</Text>
      <Pressable style={styles.input} onPress={() => setShowDate(true)}>
        <Text style={styles.dateText}>{formatDateDisplay(date)}</Text>
      </Pressable>
      {showDate && (
        <DateTimePicker
          value={fromISODate(date)}
          mode="date"
          onValueChange={onValueChange}
          onDismiss={() => setShowDate(false)}
        />
      )}

      <Pressable
        style={[styles.button, saving && styles.disabled]}
        onPress={onSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{isNew ? 'Add expense' : 'Save changes'}</Text>
        )}
      </Pressable>

      {!isNew && (
        <Pressable style={styles.deleteButton} onPress={onDelete} disabled={saving}>
          <Text style={styles.deleteText}>Delete expense</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, gap: 8, backgroundColor: '#fff', flexGrow: 1 },
  label: { fontSize: 14, color: '#667085', marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
  },
  dateText: { fontSize: 16, color: '#1a1a1a' },
  button: {
    backgroundColor: '#208AEF',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deleteButton: { paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  deleteText: { color: '#D92D20', fontSize: 16, fontWeight: '600' },
  error: { color: '#D92D20', fontSize: 14 },
});
