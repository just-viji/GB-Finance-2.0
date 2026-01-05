
import React, { useState, useMemo } from 'react';
import { Transaction } from '../../types';
import CategoryExpenseChart from './CategoryExpenseChart';
import EmptyState from '../EmptyState';
import { calculateTotalAmount } from '../../utils/transactionUtils';

interface ExpenseBreakdownReportProps {
  transactions: Transaction[];
  onBack: () => void;
}

const ExpenseBreakdownReport: React.FC<ExpenseBreakdownReportProps> = ({ transactions, onBack }) => {
    const getMonthDateRange = () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const formatDate = (date: Date) => {
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        return {
            startDate: formatDate(firstDay),
            endDate: formatDate(lastDay)
        };
    };

    const [filters, setFilters] = useState({ startDate: getMonthDateRange().startDate, endDate: getMonthDateRange().endDate });
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleCategorySelect = (category: string) => {
      setSelectedCategory(prev => (prev === category ? null : category));
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

    const { topItems, selectedCategoryTotal } = useMemo(() => {
        const sourceTransactions = selectedCategory
            ? filteredTransactions.filter(t => t.category === selectedCategory)
            : filteredTransactions;

        const aggregatedItems: { [key: string]: { name: string; value: number } } = {};
        
        sourceTransactions.forEach(t => {
            t.items.forEach(item => {
                const description = item.description.trim();
                if (!description) return; 

                const total = item.quantity * item.unitPrice;
                const normalizedDescription = description.toLowerCase();

                if (aggregatedItems[normalizedDescription]) {
                    aggregatedItems[normalizedDescription].value += total;
                } else {
                    aggregatedItems[normalizedDescription] = {
                        name: description,
                        value: total,
                    };
                }
            });
        });
        
        const currentTotal = sourceTransactions.reduce((acc, t) => acc + calculateTotalAmount(t.items), 0);

        const sortedItems = Object.values(aggregatedItems)
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
        
        return { topItems: sortedItems, selectedCategoryTotal: currentTotal };
    }, [filteredTransactions, selectedCategory]);


    const formatCurrency = (value: number) => value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

    const maxItemValue = topItems.length > 0 ? topItems[0].value : 1;

    return (
        <div className="max-w-md mx-auto h-[calc(100dvh-4.5rem-var(--sat,0px)-4rem)] flex flex-col bg-white dark:bg-slate-950 overflow-hidden border-x border-slate-100 dark:border-slate-900">
            <header className="sticky top-0 z-40 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                <div className="flex items-center px-4 h-14">
                    <button onClick={onBack} className="p-2 -ml-2 text-slate-900 dark:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="flex-grow text-center font-bold text-slate-900 dark:text-white mr-8">Expense Analysis</h1>
                </div>
            </header>

            <div className="flex-grow overflow-y-auto no-scrollbar bg-slate-50/50 dark:bg-slate-950">
                <div className="p-4 space-y-4">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm grid grid-cols-2 gap-3">
                         <div className="col-span-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">From</label>
                            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-1 rounded-md outline-none px-1" />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">To</label>
                            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-1 rounded-md outline-none px-1" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expenses by Category</h3>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatCurrency(totalExpenses)}</p>
                        </div>
                        <div className="h-64">
                            <CategoryExpenseChart 
                                transactions={filteredTransactions}
                                onSliceClick={handleCategorySelect}
                                selectedCategory={selectedCategory}
                            />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {selectedCategory ? `Top Items: ${selectedCategory}` : 'Overall Top Items'}
                            </h3>
                            {selectedCategory && (
                                <button onClick={() => setSelectedCategory(null)} className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Clear</button>
                            )}
                        </div>
                        <div className="p-4 space-y-5">
                            {topItems.length > 0 ? (
                                topItems.map(item => (
                                    <div key={item.name} className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate pr-4">{item.name}</span>
                                            <span className="text-xs font-black text-rose-500">{formatCurrency(item.value)}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-rose-500 h-1.5 rounded-full transition-all duration-500"
                                                style={{ width: `${(item.value / maxItemValue) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-10">
                                    <EmptyState 
                                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                        title="No Items Found"
                                        message="No data for this period."
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ExpenseBreakdownReport;
