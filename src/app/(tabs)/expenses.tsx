import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { getErrorMessage } from '@/lib/errors';
import { ExpenseListItem } from '@/components/ExpenseListItem';
import { MonthSelector } from '@/components/MonthSelector';
import { useExpenseStore } from '@/store/expenseStore';

export default function ExpensesScreen() {
  const router = useRouter();
  const expenses = useExpenseStore((s) => s.expenses);
  const year = useExpenseStore((s) => s.year);
  const month = useExpenseStore((s) => s.month);
  const setPeriod = useExpenseStore((s) => s.setPeriod);
  const loadExpenses = useExpenseStore((s) => s.loadExpenses);
  const ensureCategories = useExpenseStore((s) => s.ensureCategories);
  const categoryById = useExpenseStore((s) => s.categoryById);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await Promise.all([ensureCategories(), loadExpenses()]);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [ensureCategories, loadExpenses]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const changePeriod = async (y: number, m: number) => {
    setPeriod(y, m);
    await refresh();
  };

  return (
    <View style={styles.container}>
      <MonthSelector year={year} month={month} onChange={changePeriod} />

      {loading && expenses.length === 0 ? (
        <ActivityIndicator style={styles.spinner} size="large" />
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.retry} onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(e) => String(e.id)}
          renderItem={({ item }) => {
            const cat = categoryById(item.category_id);
            return (
              <ExpenseListItem
                expense={item}
                categoryName={cat?.name ?? 'Uncategorized'}
                categoryColor={cat?.color ?? '#9AA0A6'}
                onPress={() => router.push(`/expense/${item.id}`)}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text style={styles.empty}>No expenses this month.</Text>
              <Pressable style={styles.retry} onPress={() => router.push('/expense/new')}>
                <Text style={styles.retryText}>Add your first expense</Text>
              </Pressable>
            </View>
          }
          contentContainerStyle={expenses.length === 0 ? styles.emptyContainer : undefined}
        />
      )}

      <Pressable style={styles.fab} onPress={() => router.push('/expense/new')}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  spinner: { marginTop: 48 },
  centerBox: { alignItems: 'center', gap: 12, padding: 24 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  empty: { color: '#667085', fontSize: 16 },
  error: { color: '#D92D20', fontSize: 15, textAlign: 'center' },
  retry: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#208AEF', borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  fabText: { color: '#fff', fontSize: 30, lineHeight: 32, fontWeight: '400' },
});
