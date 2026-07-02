import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { getErrorMessage } from '@/lib/errors';
import { CategoryBreakdown } from '@/components/CategoryBreakdown';
import { MonthSelector } from '@/components/MonthSelector';
import { formatMoney } from '@/lib/format';
import { useExpenseStore } from '@/store/expenseStore';

export default function DashboardScreen() {
  const summary = useExpenseStore((s) => s.summary);
  const year = useExpenseStore((s) => s.year);
  const month = useExpenseStore((s) => s.month);
  const setPeriod = useExpenseStore((s) => s.setPeriod);
  const loadSummary = useExpenseStore((s) => s.loadSummary);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await loadSummary();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [loadSummary]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const changePeriod = async (y: number, m: number) => {
    setPeriod(y, m);
    await refresh();
  };

  const hasBreakdown = !!summary && summary.by_category.length > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <MonthSelector year={year} month={month} onChange={changePeriod} />

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total spent</Text>
        <Text style={styles.total}>{formatMoney(summary?.total ?? '0')}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.spinner} size="large" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hasBreakdown ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By category</Text>
          <CategoryBreakdown summary={summary} />
        </View>
      ) : (
        <Text style={styles.empty}>No expenses this month yet.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  totalCard: {
    backgroundColor: '#208AEF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginVertical: 12,
  },
  totalLabel: { color: '#dbeafe', fontSize: 14, marginBottom: 6 },
  total: { color: '#fff', fontSize: 40, fontWeight: '700' },
  spinner: { marginTop: 32 },
  section: { marginTop: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },
  error: { color: '#D92D20', fontSize: 15, textAlign: 'center', marginTop: 24 },
  empty: { color: '#667085', fontSize: 16, textAlign: 'center', marginTop: 24 },
});
