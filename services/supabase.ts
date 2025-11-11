import { Transaction } from '../types';
import { INITIAL_CATEGORIES } from '../constants';

const TRANSACTIONS_KEY = 'gb-finance-transactions';
const CATEGORIES_KEY = 'gb-finance-categories';
const SYNC_URL_KEY = 'gb-finance-sync-url';


// Seed initial data for new users
const seedInitialData = () => {
    const sampleTransactions: Omit<Transaction, 'id'>[] = [
        { type: 'sale', description: 'Room booking - Deluxe Suite', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), category: 'Sale', paymentMethod: 'Online', items: [{id: '1a', description: 'Room Charge', quantity: 2, unitPrice: 8500}] },
        { type: 'expense', description: 'Guest toiletries order', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), category: 'Guest Supplies (Toiletries, etc.)', paymentMethod: 'Online', items: [{id: '2a', description: 'Shampoo, Soap, etc.', quantity: 1, unitPrice: 15000}] },
        { type: 'sale', description: 'Restaurant Dinner - Table 5', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), category: 'Sale', paymentMethod: 'Cash', items: [{id: '3a', description: 'Food & Drinks', quantity: 1, unitPrice: 4500}] },
        { type: 'expense', description: 'Monthly electricity bill', date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), category: 'Utilities (Electricity, Water)', paymentMethod: 'Online', items: [{id: '4a', description: 'Electricity Bill', quantity: 1, unitPrice: 75000}] },
    ];
    
    const transactionsWithIds: Transaction[] = sampleTransactions.map((t, index) => ({
        ...t,
        id: `${new Date().getTime()}-${index}`,
        items: t.items.map((item, itemIndex) => ({...item, id: `${new Date().getTime()}-${index}-${itemIndex}`}))
    }));

    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactionsWithIds));
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(INITIAL_CATEGORIES.sort()));

    return { transactions: transactionsWithIds, categories: INITIAL_CATEGORIES.sort() };
}

export const loadData = (): { transactions: Transaction[], categories: string[], isNewUser: boolean } => {
    const transactionsStr = localStorage.getItem(TRANSACTIONS_KEY);
    const categoriesStr = localStorage.getItem(CATEGORIES_KEY);

    if (!transactionsStr || !categoriesStr) {
        const { transactions, categories } = seedInitialData();
        return { transactions, categories, isNewUser: true };
    }

    try {
        const transactions: Transaction[] = JSON.parse(transactionsStr);
        const categories: string[] = JSON.parse(categoriesStr);
        return { transactions: transactions.map(t => ({...t, date: new Date(t.date).toISOString()})), categories, isNewUser: false };
    } catch (e) {
        console.error("Failed to parse data from localStorage", e);
        // Clear corrupted data and re-seed
        const { transactions, categories } = seedInitialData();
        return { transactions, categories, isNewUser: true };
    }
};

export const saveTransactions = (transactions: Transaction[]) => {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
};

export const saveCategories = (categories: string[]) => {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
};

export const clearAllData = () => {
    localStorage.removeItem(TRANSACTIONS_KEY);
    localStorage.removeItem(CATEGORIES_KEY);
    localStorage.removeItem(SYNC_URL_KEY);
};

export const saveSyncUrl = (url: string) => {
    localStorage.setItem(SYNC_URL_KEY, url);
};

export const loadSyncUrl = (): string | null => {
    return localStorage.getItem(SYNC_URL_KEY);
};