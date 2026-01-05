
import { Transaction } from '../types';
import { calculateTotalAmount } from './transactionUtils';

const parseDate = (dateString: string): Date | null => {
    // Handles YYYY-MM-DD
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return null;
    }
    // Set to noon to avoid timezone boundary issues
    date.setHours(12, 0, 0, 0);
    return date;
}

export const getTransactionSummary = (transactions: Transaction[], startDateStr: string, endDateStr: string) => {
    const startDate = parseDate(startDateStr);
    const endDate = parseDate(endDateStr);

    if (!startDate || !endDate) {
        return { error: "Invalid date format provided. Please use YYYY-MM-DD." };
    }
    
    // Ensure end date is inclusive
    endDate.setHours(23, 59, 59, 999);

    const filtered = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= startDate && tDate <= endDate;
    });

    const summary = filtered.reduce((acc, t) => {
        const total = calculateTotalAmount(t.items);
        if (t.type === 'income') {
            acc.totalIncome += total;
        } else {
            acc.totalExpenses += total;
        }
        return acc;
    }, { totalIncome: 0, totalExpenses: 0 });
    
    const netSavings = summary.totalIncome - summary.totalExpenses;

    return { ...summary, netSavings, transactionCount: filtered.length };
};


export const getTopExpenseCategories = (transactions: Transaction[], startDateStr: string, endDateStr: string, limit: number) => {
    const startDate = parseDate(startDateStr);
    const endDate = parseDate(endDateStr);

    if (!startDate || !endDate) {
        return { error: "Invalid date format provided. Please use YYYY-MM-DD." };
    }
    
    // Ensure end date is inclusive
    endDate.setHours(23, 59, 59, 999);
    
    const categoryTotals: { [key: string]: number } = {};

    transactions.forEach(t => {
        if (t.type === 'expense') {
            const tDate = new Date(t.date);
            if (tDate >= startDate && tDate <= endDate) {
                const total = calculateTotalAmount(t.items);
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + total;
            }
        }
    });

    const sortedCategories = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([category, total]) => ({ category, total }));

    return sortedCategories;
};
