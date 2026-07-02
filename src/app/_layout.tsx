// Root layout: initialize the local DB once, then render the app.
// No auth — this is a single-user, fully offline app.
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';

import { initDatabase } from '@/db/database';
import { materializeRecurring } from '@/db/recurring';
import { colors } from '@/theme';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        // Post any due recurring expenses up to the current month.
        const now = new Date();
        await materializeRecurring(now.getFullYear(), now.getMonth() + 1);
      } catch {
        // schema/materialize failures shouldn't hard-block the UI
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="expense/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="category/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="recurring" options={{ headerShown: true, title: 'Recurring' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
