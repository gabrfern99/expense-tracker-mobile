// Expense/category cache + current month filter (zustand).
// Loading/error state is kept locally in screens; this store holds data + the
// shared period so the list and dashboard stay in sync.
import { create } from 'zustand';

import * as categoriesApi from '@/db/categories';
import * as expensesApi from '@/db/expenses';
import { materializeRecurring } from '@/db/recurring';
import { currentPeriod } from '@/lib/format';
import { Category, Expense, ExpenseSummary } from '@/types';

interface ExpenseState {
  categories: Category[];
  expenses: Expense[];
  summary: ExpenseSummary | null;
  year: number;
  month: number;

  loadCategories: () => Promise<void>;
  ensureCategories: () => Promise<void>;
  syncPeriod: () => Promise<void>;
  setPeriod: (year: number, month: number) => void;
  loadExpenses: () => Promise<void>;
  loadSummary: () => Promise<void>;
  removeExpense: (id: number) => Promise<void>;
  categoryById: (id: number) => Category | undefined;
  reset: () => void;
}

export const useExpenseStore = create<ExpenseState>()((set, get) => ({
  categories: [],
  expenses: [],
  summary: null,
  ...currentPeriod(),

  async loadCategories() {
    set({ categories: await categoriesApi.listCategories() });
  },

  async ensureCategories() {
    if (get().categories.length === 0) {
      await get().loadCategories();
    }
  },

  setPeriod(year, month) {
    set({ year, month });
  },

  // Generate any due recurring occurrences up to the current period.
  async syncPeriod() {
    const { year, month } = get();
    await materializeRecurring(year, month);
  },

  async loadExpenses() {
    const { year, month } = get();
    set({ expenses: await expensesApi.listExpenses(year, month) });
  },

  async loadSummary() {
    const { year, month } = get();
    set({ summary: await expensesApi.getSummary(year, month) });
  },

  async removeExpense(id) {
    await expensesApi.deleteExpense(id);
    set({ expenses: get().expenses.filter((e) => e.id !== id) });
  },

  categoryById(id) {
    return get().categories.find((c) => c.id === id);
  },

  reset() {
    set({ categories: [], expenses: [], summary: null, ...currentPeriod() });
  },
}));
