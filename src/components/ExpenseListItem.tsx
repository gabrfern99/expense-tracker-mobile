import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDateDisplay, formatMoney } from '@/lib/format';
import { colors, font, radius, spacing } from '@/theme';
import { Expense } from '@/types';

interface Props {
  expense: Expense;
  categoryName: string;
  categoryColor: string;
  onPress: () => void;
}

export function ExpenseListItem({ expense, categoryName, categoryColor, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${categoryColor}1A` }]}>
        <View style={[styles.dot, { backgroundColor: categoryColor }]} />
      </View>
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
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.primarySoft },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 14, height: 14, borderRadius: 7 },
  middle: { flex: 1 },
  title: { fontSize: font.body, fontWeight: '600', color: colors.text },
  sub: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  amount: { fontSize: font.body, fontWeight: '700', color: colors.text },
});
