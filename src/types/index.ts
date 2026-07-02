// Shared TS types mirroring backend Pydantic schemas.
// NOTE: `amount`/`total` are strings over the wire (backend serializes Decimal
// as a fixed 2-dp string to avoid JS float rounding — see plan.md §6).

export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface Category {
  id: number;
  user_id: number | null; // null => default/system category
  name: string;
  color: string;
}

export interface Expense {
  id: number;
  user_id: number;
  category_id: number;
  amount: string;
  description: string | null;
  date: string; // YYYY-MM-DD
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AccessToken {
  access_token: string;
  token_type: string;
}

export interface CategoryBreakdown {
  category_id: number;
  category: string;
  color: string;
  total: string;
}

export interface ExpenseSummary {
  year: number;
  month: number;
  total: string;
  by_category: CategoryBreakdown[];
}

export interface RecurringItem {
  id: number;
  category_id: number;
  category: string; // category name
  color: string;
  amount: string;
  description: string | null;
  day_of_month: number;
  start_date: string; // YYYY-MM-DD
}

export interface BudgetStatus {
  category_id: number;
  category: string;
  color: string;
  limit: string; // monthly limit
  spent: string; // spent in the selected month
  pct: number; // spent / limit, rounded (can exceed 100)
  over: boolean;
}
