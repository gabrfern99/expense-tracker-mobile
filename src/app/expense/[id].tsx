import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { getCategoryBudgetStatus } from '@/db/budgets';
import * as expensesApi from '@/db/expenses';
import { createRecurring, materializeRecurring } from '@/db/recurring';
import { getErrorMessage } from '@/lib/errors';
import { CategoryPicker } from '@/components/CategoryPicker';
import {
  formatDateDisplay,
  formatMoney,
  fromISODate,
  normalizeAmountInput,
  toAmountInput,
  toISODate,
  todayISO,
} from '@/lib/format';
import { useExpenseStore } from '@/store/expenseStore';
import { colors, font, radius, spacing } from '@/theme';

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
  const [repeat, setRepeat] = useState(false);

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
        setAmount(toAmountInput(e.amount));
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
      const d = fromISODate(date);
      if (isNew && repeat) {
        // Create a recurring rule and generate this month's occurrence.
        await createRecurring({
          category_id: categoryId,
          amount: normalized,
          description: description.trim() || null,
          day_of_month: d.getDate(),
          start_date: date,
        });
        await materializeRecurring(d.getFullYear(), d.getMonth() + 1);
      } else if (isNew) {
        await expensesApi.createExpense(input);
      } else {
        await expensesApi.updateExpense(Number(id), input);
      }
      router.back();

      // Non-blocking budget alert for the expense's month.
      const catName = categories.find((c) => c.id === categoryId)?.name ?? 'this category';
      getCategoryBudgetStatus(d.getFullYear(), d.getMonth() + 1, categoryId)
        .then((status) => {
          if (!status) return;
          if (status.over) {
            Alert.alert(
              'Over budget',
              `You've spent ${formatMoney(status.spent)} of your ${formatMoney(status.limit)} ${catName} budget this month.`,
            );
          } else if (status.pct >= 80) {
            Alert.alert(
              'Budget alert',
              `You're at ${status.pct}% of your ${catName} budget this month.`,
            );
          }
        })
        .catch(() => {});
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
      <View style={styles.amountRow}>
        <Text style={styles.amountPrefix}>R$</Text>
        <TextInput
          style={styles.amountInput}
          keyboardType="decimal-pad"
          placeholder="0,00"
          placeholderTextColor={colors.textFaint}
          value={amount}
          onChangeText={setAmount}
          editable={!saving}
        />
      </View>

      <Text style={styles.label}>Category</Text>
      <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Groceries"
        placeholderTextColor={colors.textFaint}
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

      {isNew && (
        <View style={styles.repeatRow}>
          <View style={styles.repeatText}>
            <Text style={styles.repeatTitle}>Repeat monthly</Text>
            <Text style={styles.repeatSub}>Auto-add this expense every month</Text>
          </View>
          <Switch
            value={repeat}
            onValueChange={setRepeat}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor="#fff"
          />
        </View>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  container: { padding: spacing.lg, gap: spacing.xs, backgroundColor: colors.bg, flexGrow: 1 },
  label: { fontSize: font.sm, fontWeight: '600', color: colors.textMuted, marginTop: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: font.body,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  amountPrefix: { fontSize: font.body, fontWeight: '700', color: colors.textMuted, marginRight: spacing.sm },
  amountInput: { flex: 1, paddingVertical: 14, fontSize: font.h3, fontWeight: '600', color: colors.text },
  dateText: { fontSize: font.body, color: colors.text },
  repeatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  repeatText: { flex: 1 },
  repeatTitle: { fontSize: font.body, fontWeight: '600', color: colors.text },
  repeatSub: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: font.body, fontWeight: '700' },
  deleteButton: { paddingVertical: 14, alignItems: 'center', marginTop: spacing.xs },
  deleteText: { color: colors.danger, fontSize: font.body, fontWeight: '600' },
  error: { color: colors.danger, fontSize: font.sm },
});
