// Default categories. Seeded on first launch (v1) and reconciled on upgrade (v3)
// so existing installs gain newly-added defaults without duplicates.
// (Existing installs keep whatever colors were seeded originally.)
export const DEFAULT_CATEGORIES: { name: string; color: string }[] = [
  // Original set
  { name: 'Food', color: '#EF4444' },
  { name: 'Transport', color: '#3B82F6' },
  { name: 'Housing', color: '#22C55E' },
  { name: 'Health', color: '#F59E0B' },
  { name: 'Leisure', color: '#A855F7' },
  { name: 'Other', color: '#64748B' },
  // Added in v3
  { name: 'Subscriptions', color: '#EC4899' },
  { name: 'Shopping', color: '#14B8A6' },
  { name: 'Personal Care', color: '#F97316' },
  { name: 'Gifts & Donations', color: '#D946EF' },
  { name: 'Debt & Loans', color: '#0EA5E9' },
  { name: 'Pets', color: '#84CC16' },
  { name: 'Education', color: '#6366F1' },
  { name: 'Travel', color: '#06B6D4' },
];
