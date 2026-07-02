import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { clearAllExpenses } from '@/db/expenses';
import { getErrorMessage } from '@/lib/errors';
import { useExpenseStore } from '@/store/expenseStore';
import { colors, font, radius, shadow, spacing } from '@/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const loadExpenses = useExpenseStore((s) => s.loadExpenses);
  const loadSummary = useExpenseStore((s) => s.loadSummary);
  const [busy, setBusy] = useState(false);

  const onClear = () => {
    Alert.alert(
      'Clear all expenses',
      'This permanently deletes every expense stored on this device. Categories are kept. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete all',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await clearAllExpenses();
              await Promise.all([loadExpenses(), loadSummary()]);
            } catch (e) {
              Alert.alert('Error', getErrorMessage(e));
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="cloud-offline-outline" size={22} color={colors.primary} />
        </View>
        <Text style={styles.title}>Offline & private</Text>
        <Text style={styles.body}>
          All your data is stored on this device. No account or internet connection is required.
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
        onPress={() => router.push('/recurring')}
      >
        <Ionicons name="repeat" size={20} color={colors.primary} />
        <Text style={styles.linkText}>Recurring expenses</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.dangerBtn, (busy || pressed) && styles.pressed]}
        onPress={onClear}
        disabled={busy}
      >
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
        <Text style={styles.dangerText}>Clear all expenses</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, gap: spacing.lg, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
    ...shadow.card,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: { fontSize: font.h3, fontWeight: '700', color: colors.text },
  body: { fontSize: font.sm, color: colors.textMuted, lineHeight: 20 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...shadow.card,
  },
  linkText: { flex: 1, fontSize: font.body, fontWeight: '600', color: colors.text },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
  },
  pressed: { opacity: 0.7 },
  dangerText: { color: colors.danger, fontSize: font.body, fontWeight: '700' },
});
