import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { monthLabel } from '@/lib/format';
import { colors, font, radius, spacing } from '@/theme';

interface Props {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

export function MonthSelector({ year, month, onChange }: Props) {
  const prev = () => (month === 1 ? onChange(year - 1, 12) : onChange(year, month - 1));
  const next = () => (month === 12 ? onChange(year + 1, 1) : onChange(year, month + 1));

  return (
    <View style={styles.row}>
      <Pressable onPress={prev} hitSlop={10} style={styles.btn}>
        <Ionicons name="chevron-back" size={20} color={colors.primary} />
      </Pressable>
      <Text style={styles.label}>{monthLabel(year, month)}</Text>
      <Pressable onPress={next} hitSlop={10} style={styles.btn}>
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: font.h3, fontWeight: '700', color: colors.text },
});
