import { Transaction } from '../types';

const TRANSACTIONS_KEY = 'gb-finance-transactions';
const CATEGORIES_KEY = 'gb-finance-categories';

const DEFAULT_CATEGORIES = [
  'Groceries',
  'Utilities',
  'Rent',
  'Transportation',
  'Entertainment',
  'Office Supplies',
  'Salary',
  'Sale', // Special category for sales
];

export const getStoredTransactions = (): Transaction[] => {
  try {
    const stored = localStorage.getItem(TRANSACTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error parsing transactions from localStorage", error);
    return [];
  }
};

export const setStoredTransactions = (transactions: Transaction[]): void => {
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error("Error saving transactions to localStorage", error);
  }
};

export const getStoredCategories = (): string[] => {
  try {
    const stored = localStorage.getItem(CATEGORIES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
        return parsed;
      }
    }
    // If nothing stored or data is invalid, set and return defaults
    setStoredCategories(DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  } catch (error) {
    console.error("Error parsing categories from localStorage", error);
    setStoredCategories(DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  }
};

export const setStoredCategories = (categories: string[]): void => {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error("Error saving categories to localStorage", error);
  }
};

export const clearAllData = (): void => {
    localStorage.removeItem(TRANSACTIONS_KEY);
    localStorage.removeItem(CATEGORIES_KEY);
}
