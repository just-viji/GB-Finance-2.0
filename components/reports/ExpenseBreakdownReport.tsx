import React, { useState, useMemo } from 'react';
import { Transaction } from '../../types';
import CategoryExpenseChart from './CategoryExpenseChart';
import EmptyState from '../EmptyState';
import { calculateTotalAmount, getMonthDateRange } from '../../utils/transactionUtils';

interface ExpenseBreakdownReportProps {
  transactions: Transaction[];
  onBack: () => void;
}

const ExpenseBreakdownReport: React.FC<ExpenseBreakdownReportProps> = ({ transactions, onBack }) => {
    const [filters, setFilters] = useState({ startDate: getMonthDateRange().startDate, endDate: getMonthDateRange().endDate });
    const [itemSearchTerm, setItemSearchTerm] = useState('');

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const filteredTransactions = useMemo(() => {
        const expenseTransactions = transactions.filter(t => t.type === 'expense');
        return expenseTransactions.filter(t => {
            const transactionDate = new Date(t.date);
            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            const endDate = filters.endDate ? new Date(filters.endDate) : null;
            if(startDate) startDate.setHours(0,0,0,0);
            if(endDate) endDate.setHours(23,59,59,999);
            return (!startDate || transactionDate >= startDate) && (!endDate || transactionDate <= endDate);
        });
    }, [transactions, filters]);

    const totalExpenses = useMemo(() => {
        return filteredTransactions.reduce((total, t) => total + calculateTotalAmount(t.items), 0);
    }, [filteredTransactions]);

    const searchedItemTotal = useMemo(() => {
        if (!itemSearchTerm.trim()) {
            return null;
        }
        const lowercasedSearch = itemSearchTerm.toLowerCase();
        let total = 0;
        filteredTransactions.forEach(t => {
            t.items.forEach(item => {
                if (item.description.toLowerCase().includes(lowercasedSearch)) {
                    total += item.quantity * item.unitPrice;
                }
            });
        });
        return total;
    }, [filteredTransactions, itemSearchTerm]);

    const topItems = useMemo(() => {
        const itemTotals: { [key: string]: number } = {};
        filteredTransactions.forEach(t => {
            t.items.forEach(item => {
                const total = item.quantity * item.unitPrice;
                itemTotals[item.description] = (itemTotals[item.description] || 0) + total;
            });
        });

        return Object.entries(itemTotals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [filteredTransactions]);

    const formatCurrency = (value: number) => value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

    return (
        <div className="space-y-6">
            <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-brand-secondary hover:text-brand-dark">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Back to Reports
            </button>
            <h2 className="text-2xl font-bold text-brand-dark">Expense Breakdown</h2>

            <div className="bg-white p-4 rounded-xl shadow-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="filter-startdate" className="text-xs font-medium text-gray-500">Start Date</label>
                        <input id="filter-startdate" type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="mt-1 block w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"/>
                    </div>
                    <div>
                        <label htmlFor="filter-enddate" className="text-xs font-medium text-gray-500">End Date</label>
                        <input id="filter-enddate" type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="mt-1 block w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"/>
                    </div>
                </div>
            </div>

            {filteredTransactions.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-semibold mb-4 text-brand-dark">Top Items by Expense</h3>
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search for item total..."
                                value={itemSearchTerm}
                                onChange={e => setItemSearchTerm(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
                            />
                            {searchedItemTotal !== null && (
                                <p className="mt-2 text-sm text-brand-secondary">
                                    Total for items matching <span className="font-semibold text-brand-dark">"{itemSearchTerm}"</span>: 
                                    <span className="font-bold text-brand-dark ml-2">{formatCurrency(searchedItemTotal)}</span>
                                </p>
                            )}
                        </div>
                        <ul className="space-y-2">
                            {topItems.map(item => (
                                <li key={item.name} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-md">
                                    <span className="font-medium text-brand-dark truncate pr-4">{item.name}</span>
                                    <span className="font-semibold text-red-500 flex-shrink-0">{formatCurrency(item.value)}</span>
                                </li>
                            ))}
                        </ul>
                         <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between font-bold text-brand-dark">
                            <span>Total Period Expenses</span>
                            <span>{formatCurrency(totalExpenses)}</span>
                        </div>
                    </div>
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-semibold text-brand-dark">Expenses by Category</h3>
                        <p className="text-sm text-brand-secondary mb-4">Total: <span className="font-bold">{formatCurrency(totalExpenses)}</span></p>
                        <div className="h-80">
                            <CategoryExpenseChart transactions={filteredTransactions} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <EmptyState 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        title="No Expense Data"
                        message="No expenses were found for the selected date range."
                    />
                </div>
            )}
        </div>
    );
};
export default ExpenseBreakdownReport;