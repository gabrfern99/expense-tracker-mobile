import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, spacing } from '@/theme';
import { Category } from '@/types';

interface Props {
  categories: Category[];
  value: number | null;
  onChange: (id: number) => void;
}

export function CategoryPicker({ categories, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = categories.find((c) => c.id === value);

  return (
    <>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        {selected ? (
          <View style={styles.selectedRow}>
            <View style={[styles.dot, { backgroundColor: selected.color }]} />
            <Text style={styles.selectedText}>{selected.name}</Text>
          </View>
        ) : (
          <Text style={styles.placeholder}>Select a category</Text>
        )}
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Category</Text>
            <FlatList
              data={categories}
              keyExtractor={(c) => String(c.id)}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                >
                  <View style={[styles.dot, { backgroundColor: item.color }]} />
                  <Text style={styles.optionText}>{item.name}</Text>
                  {item.id === value ? <Text style={styles.check}>✓</Text> : null}
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    backgroundColor: colors.surface,
  },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  selectedText: { fontSize: font.body, color: colors.text },
  placeholder: { fontSize: font.body, color: colors.textFaint },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '70%',
  },
  sheetTitle: {
    fontSize: font.h3,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
  },
  optionText: { flex: 1, fontSize: font.body, color: colors.text },
  check: { color: colors.primary, fontSize: font.body, fontWeight: '700' },
  dot: { width: 14, height: 14, borderRadius: 7 },
});
