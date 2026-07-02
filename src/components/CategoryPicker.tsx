import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

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
    borderColor: '#d0d5dd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectedText: { fontSize: 16, color: '#1a1a1a' },
  placeholder: { fontSize: 16, color: '#9AA0A6' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  optionText: { flex: 1, fontSize: 16, color: '#1a1a1a' },
  check: { color: '#208AEF', fontSize: 16, fontWeight: '700' },
  dot: { width: 14, height: 14, borderRadius: 7 },
});
