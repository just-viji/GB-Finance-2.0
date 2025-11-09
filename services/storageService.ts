import { Transaction } from '../types';
import {
    dbGetAllTransactions,
    dbAddTransaction,
    dbUpdateTransaction,
    dbDeleteTransaction,
    dbGetAllCategories,
    dbAddCategory,
    dbDeleteCategory,
    dbClearAllData,
    dbSeedDefaultCategories,
} from './dbService';

export const getInitialData = async () => {
    const transactions = await dbGetAllTransactions();
    let categories = await dbGetAllCategories();

    if (categories.length === 0) {
        categories = await dbSeedDefaultCategories();
    }

    return { transactions, categories };
};

export const addTransaction = async (transaction: Transaction) => {
    await dbAddTransaction(transaction);
};

export const updateTransaction = async (updatedTransaction: Transaction) => {
    await dbUpdateTransaction(updatedTransaction);
};

export const deleteTransaction = async (id: string) => {
    await dbDeleteTransaction(id);
};

export const addCategory = async (category: string): Promise<boolean> => {
    return await dbAddCategory(category);
};

export const deleteCategory = async (categoryToDelete: string) => {
    await dbDeleteCategory(categoryToDelete);
};

export const clearAllData = async (): Promise<void> => {
    await dbClearAllData();
}