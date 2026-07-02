import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDateDisplay, formatMoney } from '@/lib/format';
import { Expense } from '@/types';

interface Props {
  expense: Expense;
  categoryName: string;
  categoryColor: string;
  onPress: () => void;
}

export function ExpenseListItem({ expense, categoryName, categoryColor, onPress }: Props) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.dot, { backgroundColor: categoryColor }]} />
      <View style={styles.middle}>
        <Text style={styles.title} numberOfLines={1}>
          {expense.description || categoryName}
        </Text>
        <Text style={styles.sub}>
          {categoryName} · {formatDateDisplay(expense.date)}
        </Text>
      </View>
      <Text style={styles.amount}>{formatMoney(expense.amount)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e4e7ec',
    backgroundColor: '#fff',
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  middle: { flex: 1 },
  title: { fontSize: 16, fontWeight: '500', color: '#1a1a1a' },
  sub: { fontSize: 13, color: '#667085', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
});
