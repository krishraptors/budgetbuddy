import { Category } from './types';
import React from 'react';

export const EXPENSE_CATEGORIES = [
  Category.HOUSING,
  Category.FOOD,
  Category.TRANSPORTATION,
  Category.ENTERTAINMENT,
  Category.UTILITIES,
  Category.HEALTH,
  Category.SHOPPING,
  Category.OTHER,
];

export const INCOME_CATEGORIES = [
  Category.SALARY,
  Category.INVESTMENT,
  Category.FREELANCE,
  Category.OTHER,
];

export const COLORS = {
  [Category.HOUSING]: '#3b82f6',
  [Category.FOOD]: '#10b981',
  [Category.TRANSPORTATION]: '#f59e0b',
  [Category.ENTERTAINMENT]: '#8b5cf6',
  [Category.UTILITIES]: '#ef4444',
  [Category.HEALTH]: '#ec4899',
  [Category.SHOPPING]: '#06b6d4',
  [Category.OTHER]: '#64748b',
  [Category.SALARY]: '#22c55e',
  [Category.INVESTMENT]: '#6366f1',
  [Category.FREELANCE]: '#d946ef',
};

export const INITIAL_TRANSACTIONS = [
  { id: '1', amount: 5000, type: 'INCOME', category: 'Salary', description: 'Monthly Salary', date: new Date().toISOString() },
  { id: '2', amount: 1200, type: 'EXPENSE', category: 'Housing', description: 'Rent Payment', date: new Date().toISOString() },
  { id: '3', amount: 300, type: 'EXPENSE', category: 'Food', description: 'Grocery Run', date: new Date().toISOString() },
];
