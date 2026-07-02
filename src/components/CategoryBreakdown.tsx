import { StyleSheet, Text, View } from 'react-native';

import { formatMoney } from '@/lib/format';
import { ExpenseSummary } from '@/types';

export function CategoryBreakdown({ summary }: { summary: ExpenseSummary }) {
  const total = Number(summary.total);

  return (
    <View style={styles.container}>
      {summary.by_category.map((row) => {
        const value = Number(row.total);
        const pct = total > 0 ? Math.round((value / total) * 100) : 0;
        return (
          <View key={row.category_id} style={styles.item}>
            <View style={styles.labelRow}>
              <View style={[styles.dot, { backgroundColor: row.color }]} />
              <Text style={styles.name}>{row.category}</Text>
              <Text style={styles.value}>{formatMoney(row.total)}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct}%`, backgroundColor: row.color }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  item: { gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { flex: 1, fontSize: 15, color: '#1a1a1a' },
  value: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  track: { height: 8, borderRadius: 4, backgroundColor: '#f0f1f3', overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
});
