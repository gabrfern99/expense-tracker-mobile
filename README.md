# Expense Tracker — Mobile (offline)

React Native + Expo (SDK 57), TypeScript, Expo Router. **Fully offline, single-user.**
All data is stored on the device in SQLite (`expo-sqlite`) — no backend, no
network, no account. Android is the primary target.

## Setup

```bash
cd mobile
npm install
npm start          # Expo dev server; press 'a' to open on an Android emulator/device
```

No environment variables are required.

## How it works

- **Storage:** a local SQLite database (`expenses.db`) created on first launch,
  seeded with default categories. Money is stored as integer cents for exact sums.
- **No auth:** the app opens straight to the Dashboard.
- **No internet:** everything runs on-device; airplane mode is fine.

## Structure

```
src/
  app/                     Expo Router routes
    _layout.tsx            initializes the DB, then renders the app
    index.tsx              redirects to /dashboard
    (tabs)/dashboard.tsx, expenses.tsx, settings.tsx
    expense/[id].tsx       add/edit form ([id]="new" to create)
  db/
    database.ts            open + schema + seed (SQLite)
    categories.ts          category queries
    expenses.ts            expense CRUD + monthly summary (GROUP BY)
    defaults.ts            default categories
  components/              MonthSelector, ExpenseListItem, CategoryPicker, CategoryBreakdown
  store/expenseStore.ts    zustand: cache + current month filter
  lib/                     format.ts (money/date), errors.ts
  types/index.ts           shared types
```

## Note on the `backend/` folder

This app no longer uses the FastAPI backend — it's fully self-contained. The
`../backend` project is retained for reference/history but is not required to run
the app. It can be deleted if you don't need the server version.

## Building a standalone APK (for real installation)

Running via `npm start` uses Expo Go (development only). To produce an installable
`.apk`/`.aab` (e.g. to sideload or publish to the Play Store), use a build:

```bash
npx expo run:android           # local debug build (needs Android SDK)
# or EAS: npx eas build -p android --profile preview
```
