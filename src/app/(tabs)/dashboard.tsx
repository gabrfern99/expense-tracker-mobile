import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';

import { getErrorMessage } from '@/lib/errors';
import { DonutChart } from '@/components/DonutChart';
import { MonthSelector } from '@/components/MonthSelector';
import { formatMoney } from '@/lib/format';
import { useExpenseStore } from '@/store/expenseStore';
import { colors, font, radius, shadow, spacing } from '@/theme';

export default function DashboardScreen() {
  const summary = useExpenseStore((s) => s.summary);
  const year = useExpenseStore((s) => s.year);
  const month = useExpenseStore((s) => s.month);
  const setPeriod = useExpenseStore((s) => s.setPeriod);
  const loadSummary = useExpenseStore((s) => s.loadSummary);
  const syncPeriod = useExpenseStore((s) => s.syncPeriod);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await syncPeriod();
      await loadSummary();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [syncPeriod, loadSummary]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const changePeriod = async (y: number, m: number) => {
    setPeriod(y, m);
    await refresh();
  };

  const total = Number(summary?.total ?? '0');
  const rows = summary?.by_category ?? [];
  const hasData = total > 0 && rows.length > 0;
  const segments = rows.map((r) => ({ key: r.category_id, value: Number(r.total), color: r.color }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <MonthSelector year={year} month={month} onChange={changePeriod} />

      <View style={styles.chartCard}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <>
            <DonutChart segments={segments} size={230} strokeWidth={26}>
              <Text style={styles.centerLabel}>Total spent</Text>
              <Text style={styles.centerValue}>{formatMoney(total)}</Text>
            </DonutChart>
            {!hasData && <Text style={styles.emptyHint}>No spending this month yet</Text>}
          </>
        )}
      </View>

      {hasData && (
        <View style={styles.legendCard}>
          <Text style={styles.sectionTitle}>By category</Text>
          {rows.map((r) => {
            const value = Number(r.total);
            const pct = total > 0 ? Math.round((value / total) * 100) : 0;
            return (
              <Pressable
                key={r.category_id}
                style={({ pressed }) => [styles.legendRow, pressed && styles.legendPressed]}
                onPress={() =>
                  router.push(
                    `/category/${r.category_id}?year=${year}&month=${month}` as Href,
                  )
                }
              >
                <View style={[styles.dot, { backgroundColor: r.color }]} />
                <Text style={styles.legendName} numberOfLines={1}>
                  {r.category}
                </Text>
                <View style={[styles.pct, { backgroundColor: `${r.color}22` }]}>
                  <Text style={[styles.pctText, { color: r.color }]}>{pct}%</Text>
                </View>
                <Text style={styles.legendAmount}>{formatMoney(r.total)}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },

  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadow.card,
  },
  loadingBox: { height: 230, alignItems: 'center', justifyContent: 'center' },
  centerLabel: { color: colors.textMuted, fontSize: font.sm, marginBottom: 2 },
  centerValue: { color: colors.text, fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  emptyHint: { color: colors.textFaint, fontSize: font.sm, marginTop: spacing.lg },
  error: { color: colors.danger, fontSize: font.sm, textAlign: 'center', paddingVertical: spacing.xl },

  legendCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadow.card,
  },
  sectionTitle: {
    fontSize: font.h3,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  legendPressed: { opacity: 0.55 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legendName: { flex: 1, fontSize: font.body, color: colors.text, fontWeight: '500' },
  pct: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  pctText: { fontSize: font.xs, fontWeight: '700' },
  legendAmount: { fontSize: font.body, fontWeight: '700', color: colors.text, minWidth: 72, textAlign: 'right' },
});
