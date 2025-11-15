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
                if (!description) return; // Skip items with no/empty description

                const total = item.quantity * item.unitPrice;
                const normalizedDescription = description.toLowerCase();

                if (aggregatedItems[normalizedDescription]) {
                    aggregatedItems[normalizedDescription].value += total;
                } else {
                    // Store the first-seen casing of the description for display
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
                         <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-semibold text-brand-dark">
                                   {selectedCategory ? `Top Items in "${selectedCategory}"` : 'Top Items by Expense'}
                                </h3>
                                 <p className="text-sm text-brand-secondary">
                                   Total: <span className="font-bold">{formatCurrency(selectedCategory ? selectedCategoryTotal : totalExpenses)}</span>
                                </p>
                            </div>
                            {selectedCategory && (
                                <button onClick={() => setSelectedCategory(null)} className="text-xs font-semibold text-brand-primary hover:underline flex-shrink-0 ml-2">
                                    Clear Filter
                                </button>
                            )}
                        </div>
                        {topItems.length > 0 ? (
                            <ul className="space-y-4">
                                {topItems.map(item => (
                                    <li key={item.name}>
                                        <div className="flex justify-between items-center text-sm mb-1">
                                            <span className="font-medium text-brand-dark truncate pr-4">{item.name}</span>
                                            <span className="font-semibold text-red-500 flex-shrink-0">{formatCurrency(item.value)}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div
                                                className="bg-red-400 h-1.5 rounded-full"
                                                style={{ width: `${(item.value / maxItemValue) * 100}%` }}
                                                title={`${formatCurrency(item.value)}`}
                                            ></div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-brand-secondary text-center py-8">
                                No items found for this {selectedCategory ? 'category' : 'period'}.
                            </p>
                        )}
                    </div>
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-semibold text-brand-dark">Expenses by Category</h3>
                        <p className="text-sm text-brand-secondary mb-4">Total: <span className="font-bold">{formatCurrency(totalExpenses)}</span></p>
                        <div className="h-80">
                            <CategoryExpenseChart 
                                transactions={filteredTransactions}
                                onSliceClick={handleCategorySelect}
                                selectedCategory={selectedCategory}
                            />
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