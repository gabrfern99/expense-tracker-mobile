import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { clearAllExpenses } from '@/db/expenses';
import { getErrorMessage } from '@/lib/errors';
import { useExpenseStore } from '@/store/expenseStore';

export default function SettingsScreen() {
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
        <Text style={styles.title}>Offline mode</Text>
        <Text style={styles.body}>
          All your data is stored privately on this device. No account or internet connection is
          required.
        </Text>
      </View>

      <Pressable
        style={[styles.dangerBtn, busy && styles.disabled]}
        onPress={onClear}
        disabled={busy}
      >
        <Text style={styles.dangerText}>Clear all expenses</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 20, backgroundColor: '#fff' },
  card: { backgroundColor: '#f5f7fa', borderRadius: 12, padding: 16, gap: 8 },
  title: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  body: { fontSize: 14, color: '#667085', lineHeight: 20 },
  dangerBtn: {
    borderWidth: 1,
    borderColor: '#D92D20',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  dangerText: { color: '#D92D20', fontSize: 16, fontWeight: '600' },
});
