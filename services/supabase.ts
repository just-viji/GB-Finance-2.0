import { Transaction } from '../types';
import { INITIAL_CATEGORIES } from '../constants';

const TRANSACTIONS_KEY = 'gb-finance-transactions';
const CATEGORIES_KEY = 'gb-finance-categories';

// Seed initial data for new users
const seedInitialData = () => {
    const sampleTransactions: Omit<Transaction, 'id'>[] = [
        { type: 'sale', description: 'Web design for Cool Startup', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), category: 'Sale', paymentMethod: 'Online', items: [{id: '1a', description: 'Design & Development', quantity: 1, unitPrice: 250000}] },
        { type: 'expense', description: 'Figma Subscription', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), category: 'Software', paymentMethod: 'Online', items: [{id: '2a', description: 'Monthly Pro Plan', quantity: 1, unitPrice: 1200}] },
        { type: 'sale', description: 'Logo design for Local Cafe', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), category: 'Sale', paymentMethod: 'Cash', items: [{id: '3a', description: 'Logo Package', quantity: 1, unitPrice: 60000}] },
        { type: 'expense', description: 'New office chair', date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), category: 'Hardware', paymentMethod: 'Online', items: [{id: '4a', description: 'Ergonomic Chair', quantity: 1, unitPrice: 25000}] },
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
