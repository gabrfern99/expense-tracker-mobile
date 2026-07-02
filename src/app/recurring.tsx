import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import { deleteRecurring, listRecurring } from '@/db/recurring';
import { getErrorMessage } from '@/lib/errors';
import { formatMoney } from '@/lib/format';
import { colors, font, radius, shadow, spacing } from '@/theme';
import { RecurringItem } from '@/types';

export default function RecurringScreen() {
  const [items, setItems] = useState<RecurringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listRecurring());
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const onStop = (item: RecurringItem) => {
    Alert.alert(
      'Stop recurring',
      `Stop auto-adding "${item.description || item.category}"? Past entries are kept; future ones won't be created.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            await deleteRecurring(item.id);
            await refresh();
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="repeat" size={56} color={colors.textFaint} />
        <Text style={styles.emptyTitle}>No recurring expenses</Text>
        <Text style={styles.emptySub}>
          When adding an expense, turn on "Repeat monthly" to have it post automatically each month.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(i) => String(i.id)}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <View style={styles.info}>
            <Text style={styles.title}>{item.description || item.category}</Text>
            <Text style={styles.sub}>
              {item.category} · every month on day {Math.min(item.day_of_month, 28)}
            </Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.amount}>{formatMoney(item.amount)}</Text>
            <Pressable onPress={() => onStop(item)} hitSlop={8}>
              <Text style={styles.stop}>Stop</Text>
            </Pressable>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    backgroundColor: colors.bg,
  },
  emptyTitle: { fontSize: font.h3, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  emptySub: { fontSize: font.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  error: { color: colors.danger, fontSize: font.sm, textAlign: 'center' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  info: { flex: 1 },
  title: { fontSize: font.body, fontWeight: '600', color: colors.text },
  sub: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: font.body, fontWeight: '700', color: colors.text },
  stop: { fontSize: font.xs, fontWeight: '700', color: colors.danger },
});
