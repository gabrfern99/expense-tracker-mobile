// Entry route: no auth, so go straight to the dashboard.
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/dashboard" />;
}
