export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum Category {
  HOUSING = 'Housing',
  FOOD = 'Food',
  TRANSPORTATION = 'Transportation',
  ENTERTAINMENT = 'Entertainment',
  UTILITIES = 'Utilities',
  HEALTH = 'Health',
  SHOPPING = 'Shopping',
  SALARY = 'Salary',
  INVESTMENT = 'Investment',
  FREELANCE = 'Freelance',
  OTHER = 'Other',
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: Category | string;
  description: string;
  date: string; // ISO String
}

export interface Budget {
  category: Category | string;
  limit: number;
  spent: number;
}

export interface BudgetPlanParsed {
  month: string;
  budgets: { category: string; limit: number }[];
  incomeEstimate: number;
  savingsGoal: number;
  advice: string;
}

export interface ChartData {
  name: string;
  value: number;
  fill?: string;
}