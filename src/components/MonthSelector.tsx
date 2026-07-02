import { Pressable, StyleSheet, Text, View } from 'react-native';

import { monthLabel } from '@/lib/format';

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
      <Pressable onPress={prev} hitSlop={12} style={styles.arrowButton}>
        <Text style={styles.arrow}>‹</Text>
      </Pressable>
      <Text style={styles.label}>{monthLabel(year, month)}</Text>
      <Pressable onPress={next} hitSlop={12} style={styles.arrowButton}>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  arrowButton: { paddingHorizontal: 16, paddingVertical: 4 },
  arrow: { fontSize: 28, color: '#208AEF', fontWeight: '600' },
  label: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
});
