import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import { deleteBudget, getBudgetStatuses, setBudget } from '@/db/budgets';
import { MonthSelector } from '@/components/MonthSelector';
import { getErrorMessage } from '@/lib/errors';
import { formatMoney, normalizeAmountInput, toAmountInput } from '@/lib/format';
import { useExpenseStore } from '@/store/expenseStore';
import { colors, font, radius, shadow, spacing } from '@/theme';
import { BudgetStatus, Category } from '@/types';

function barColor(pct: number): string {
  if (pct >= 100) return colors.danger;
  if (pct >= 80) return '#F59E0B';
  return '#22C55E';
}

export default function BudgetsScreen() {
  const categories = useExpenseStore((s) => s.categories);
  const ensureCategories = useExpenseStore((s) => s.ensureCategories);
  const year = useExpenseStore((s) => s.year);
  const month = useExpenseStore((s) => s.month);
  const setPeriod = useExpenseStore((s) => s.setPeriod);
  const syncPeriod = useExpenseStore((s) => s.syncPeriod);

  const [statuses, setStatuses] = useState<Record<number, BudgetStatus>>({});
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await syncPeriod();
      await ensureCategories();
      const rows = await getBudgetStatuses(year, month);
      const map: Record<number, BudgetStatus> = {};
      rows.forEach((r) => (map[r.category_id] = r));
      setStatuses(map);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [syncPeriod, ensureCategories, year, month]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const openEditor = (cat: Category) => {
    setError(null);
    setEditing(cat);
    const existing = statuses[cat.id]?.limit;
    setAmount(existing ? toAmountInput(existing) : '');
  };

  const saveLimit = async () => {
    if (!editing) return;
    const normalized = normalizeAmountInput(amount);
    if (!normalized) {
      setError('Enter a valid amount greater than 0.');
      return;
    }
    await setBudget(editing.id, normalized);
    setEditing(null);
    await refresh();
  };

  const removeLimit = async () => {
    if (!editing) return;
    await deleteBudget(editing.id);
    setEditing(null);
    await refresh();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MonthSelector year={year} month={month} onChange={(y, m) => setPeriod(y, m)} />
      </View>

      {loading && Object.keys(statuses).length === 0 ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} size="large" color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.hint}>Set a monthly limit per category. You'll be warned as you approach it.</Text>
          {categories.map((cat) => {
            const st = statuses[cat.id];
            return (
              <Pressable
                key={cat.id}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                onPress={() => openEditor(cat)}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.dot, { backgroundColor: cat.color }]} />
                  <Text style={styles.catName}>{cat.name}</Text>
                  {st ? (
                    <Text style={styles.amounts}>
                      {formatMoney(st.spent)} / {formatMoney(st.limit)}
                    </Text>
                  ) : (
                    <View style={styles.setPill}>
                      <Ionicons name="add" size={14} color={colors.primary} />
                      <Text style={styles.setText}>Set limit</Text>
                    </View>
                  )}
                </View>

                {st && (
                  <>
                    <View style={styles.track}>
                      <View
                        style={[
                          styles.fill,
                          { width: `${Math.min(st.pct, 100)}%`, backgroundColor: barColor(st.pct) },
                        ]}
                      />
                    </View>
                    <View style={styles.cardBottom}>
                      <Text style={[styles.pct, { color: barColor(st.pct) }]}>{st.pct}% used</Text>
                      {st.over ? (
                        <Text style={styles.over}>Over by {formatMoney(String(Number(st.spent) - Number(st.limit)))}</Text>
                      ) : (
                        <Text style={styles.left}>{formatMoney(String(Number(st.limit) - Number(st.spent)))} left</Text>
                      )}
                    </View>
                  </>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <Pressable style={styles.backdrop} onPress={() => setEditing(null)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{editing?.name} budget</Text>
            <Text style={styles.sheetSub}>Monthly limit (R$)</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="0,00"
              placeholderTextColor={colors.textFaint}
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
            <Pressable style={styles.saveBtn} onPress={saveLimit}>
              <Text style={styles.saveText}>Save limit</Text>
            </Pressable>
            {editing && statuses[editing.id] && (
              <Pressable style={styles.removeBtn} onPress={removeLimit}>
                <Text style={styles.removeText}>Remove limit</Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  content: { padding: spacing.lg, gap: spacing.md },
  hint: { color: colors.textMuted, fontSize: font.sm, marginBottom: spacing.xs },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.card },
  pressed: { opacity: 0.7 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 12, height: 12, borderRadius: 6 },
  catName: { flex: 1, fontSize: font.body, fontWeight: '600', color: colors.text },
  amounts: { fontSize: font.sm, fontWeight: '700', color: colors.text },
  setPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  setText: { color: colors.primary, fontSize: font.xs, fontWeight: '700' },

  track: { height: 8, borderRadius: 4, backgroundColor: colors.bg, overflow: 'hidden', marginTop: spacing.md },
  fill: { height: 8, borderRadius: 4 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  pct: { fontSize: font.xs, fontWeight: '700' },
  left: { fontSize: font.xs, color: colors.textMuted },
  over: { fontSize: font.xs, color: colors.danger, fontWeight: '700' },

  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'center', padding: spacing.xl },
  sheet: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.sm },
  sheetTitle: { fontSize: font.h3, fontWeight: '700', color: colors.text },
  sheetSub: { fontSize: font.sm, color: colors.textMuted },
  error: { color: colors.danger, fontSize: font.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: font.h3,
    color: colors.text,
    marginTop: spacing.xs,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: font.body },
  removeBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  removeText: { color: colors.danger, fontWeight: '600', fontSize: font.sm },
});
