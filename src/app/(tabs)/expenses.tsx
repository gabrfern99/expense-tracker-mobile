import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import { getErrorMessage } from '@/lib/errors';
import { ExpenseListItem } from '@/components/ExpenseListItem';
import { MonthSelector } from '@/components/MonthSelector';
import { useExpenseStore } from '@/store/expenseStore';
import { colors, font, radius, shadow, spacing } from '@/theme';

export default function ExpensesScreen() {
  const router = useRouter();
  const expenses = useExpenseStore((s) => s.expenses);
  const year = useExpenseStore((s) => s.year);
  const month = useExpenseStore((s) => s.month);
  const setPeriod = useExpenseStore((s) => s.setPeriod);
  const loadExpenses = useExpenseStore((s) => s.loadExpenses);
  const ensureCategories = useExpenseStore((s) => s.ensureCategories);
  const syncPeriod = useExpenseStore((s) => s.syncPeriod);
  const categoryById = useExpenseStore((s) => s.categoryById);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await syncPeriod();
      await Promise.all([ensureCategories(), loadExpenses()]);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [syncPeriod, ensureCategories, loadExpenses]);

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
      <View style={styles.header}>
        <MonthSelector year={year} month={month} onChange={changePeriod} />
      </View>

      {loading && expenses.length === 0 ? (
        <ActivityIndicator style={styles.spinner} size="large" color={colors.primary} />
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.primaryBtn} onPress={refresh}>
            <Text style={styles.primaryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : expenses.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons name="receipt-outline" size={56} color={colors.textFaint} />
          <Text style={styles.emptyTitle}>No expenses this month</Text>
          <Text style={styles.emptySub}>Tap + to add your first one.</Text>
          <Pressable style={styles.primaryBtn} onPress={() => router.push('/expense/new')}>
            <Text style={styles.primaryBtnText}>Add expense</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const cat = categoryById(item.category_id);
            return (
              <ExpenseListItem
                expense={item}
                categoryName={cat?.name ?? 'Uncategorized'}
                categoryColor={cat?.color ?? colors.textFaint}
                onPress={() => router.push(`/expense/${item.id}`)}
              />
            );
          }}
        />
      )}

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.9 }]}
        onPress={() => router.push('/expense/new')}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  spinner: { marginTop: spacing.xxl },

  listContent: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadow.card,
  },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 68 },

  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  emptyTitle: { fontSize: font.h3, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  emptySub: { fontSize: font.sm, color: colors.textMuted, marginBottom: spacing.md },
  error: { color: colors.danger, fontSize: font.sm, textAlign: 'center' },

  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: font.body },

  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
