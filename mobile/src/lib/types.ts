// Shapes returned by the Flask API (GET /api/state) — identical to the web app's state

export type TxType = 'income' | 'expense' | 'transfer';
export type WalletType = 'Bank' | 'E-Wallet' | 'Tunai';
export type CategoryType = 'expense' | 'income';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  initialBalance: number;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
}

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  date: string; // YYYY-MM-DD
  walletId: string;
  toWalletId: string;
  categoryId: string;
  note: string;
  tag: string;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline: string;
}

export interface FinanceState {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Record<string, Record<string, number>>; // month -> categoryId -> limit
  goals: Goal[];
}

export interface User {
  id: string;
  username: string;
}
