import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { listExpensesByCategory } from '@/db/expenses';
import { ExpenseListItem } from '@/components/ExpenseListItem';
import { getErrorMessage } from '@/lib/errors';
import { formatMoney, monthLabel } from '@/lib/format';
import { useExpenseStore } from '@/store/expenseStore';
import { colors, font, radius, shadow, spacing } from '@/theme';
import { Expense } from '@/types';

export default function CategoryDetailScreen() {
  const params = useLocalSearchParams<{ id: string; year: string; month: string }>();
  const categoryId = Number(params.id);
  const year = Number(params.year);
  const month = Number(params.month);

  const router = useRouter();
  const ensureCategories = useExpenseStore((s) => s.ensureCategories);
  const categoryById = useExpenseStore((s) => s.categoryById);
  const category = categoryById(categoryId);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        await ensureCategories();
        const rows = await listExpensesByCategory(year, month, categoryId);
        if (active) setExpenses(rows);
      } catch (e) {
        if (active) setError(getErrorMessage(e));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [ensureCategories, year, month, categoryId]);

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const color = category?.color ?? colors.textFaint;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: category?.name ?? 'Category' }} />

      <View style={styles.summaryCard}>
        <View style={[styles.badge, { backgroundColor: `${color}1A` }]}>
          <View style={[styles.dot, { backgroundColor: color }]} />
        </View>
        <Text style={styles.summaryLabel}>
          {category?.name ?? 'Category'} · {monthLabel(year, month)}
        </Text>
        <Text style={styles.summaryTotal}>{formatMoney(total)}</Text>
        <Text style={styles.summaryCount}>
          {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.spinner} size="large" color={colors.primary} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : expenses.length === 0 ? (
        <Text style={styles.empty}>No expenses in this category this month.</Text>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <ExpenseListItem
              expense={item}
              categoryName={category?.name ?? 'Uncategorized'}
              categoryColor={color}
              onPress={() => router.push(`/expense/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  summaryCard: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadow.card,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  dot: { width: 18, height: 18, borderRadius: 9 },
  summaryLabel: { fontSize: font.sm, color: colors.textMuted },
  summaryTotal: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginTop: spacing.xs,
  },
  summaryCount: { fontSize: font.xs, color: colors.textFaint, marginTop: 2 },
  spinner: { marginTop: spacing.xl },
  error: { color: colors.danger, textAlign: 'center', marginTop: spacing.xl },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  listContent: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadow.card,
  },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 68 },
});
