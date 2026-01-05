
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { PAYMENT_METHODS } from '../constants';
import { calculateTotalAmount } from '../utils/transactionUtils';
import EmptyState from './EmptyState';

interface TransactionLogReportProps {
  transactions: Transaction[];
  categories: string[];
  onTransactionClick: (transaction: Transaction) => void;
  onBack: () => void;
}

const TransactionLogReport: React.FC<TransactionLogReportProps> = ({ transactions, categories, onTransactionClick, onBack }) => {
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
  
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    paymentMethod: 'all',
    startDate: getMonthDateRange().startDate,
    endDate: getMonthDateRange().endDate,
    searchTerm: '',
  });
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;
      
      if(startDate) startDate.setHours(0,0,0,0);
      if(endDate) endDate.setHours(23,59,59,999);

      const searchMatch = !filters.searchTerm.trim() ||
        t.description.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        t.items.some(item => item.description.toLowerCase().includes(filters.searchTerm.toLowerCase()));

      return (
        (filters.type === 'all' || t.type === filters.type) &&
        (filters.category === 'all' || t.category === filters.category) &&
        (filters.paymentMethod === 'all' || t.paymentMethod === filters.paymentMethod) &&
        (!startDate || transactionDate >= startDate) &&
        (!endDate || transactionDate <= endDate) &&
        searchMatch
      );
    });
  }, [transactions, filters]);

  const summary = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
        const totalAmount = calculateTotalAmount(t.items);
        if(t.type === 'income') acc.income += totalAmount;
        if(t.type === 'expense') acc.expenses += totalAmount;
        return acc;
    }, {income: 0, expenses: 0})
  }, [filteredTransactions]);

  const formatCurrency = (value: number) => value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <div className="max-w-md mx-auto h-[calc(100dvh-4.5rem-var(--sat,0px)-4rem)] flex flex-col bg-white dark:bg-slate-950 overflow-hidden border-x border-slate-100 dark:border-slate-900">
        <header className="sticky top-0 z-40 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
            <div className="flex items-center px-4 h-14">
                <button onClick={onBack} className="p-2 -ml-2 text-slate-900 dark:text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="flex-grow text-center font-bold text-slate-900 dark:text-white mr-8">Transaction Log</h1>
            </div>
        </header>

        <div className="flex-grow overflow-y-auto no-scrollbar bg-slate-50/50 dark:bg-slate-950">
            <div className="p-4 space-y-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="relative mb-3">
                        <input 
                            type="text" 
                            name="searchTerm" 
                            placeholder="Search descriptions..." 
                            value={filters.searchTerm} 
                            onChange={handleFilterChange} 
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    
                    <button 
                        onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
                        className="w-full flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1"
                    >
                        <span>Filter Options</span>
                        <svg className={`w-4 h-4 transition-transform ${isAdvancedFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                    </button>

                    {isAdvancedFilterOpen && (
                        <div className="pt-4 grid grid-cols-2 gap-x-3 gap-y-4 animate-fade-in">
                            <div className="col-span-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Type</label>
                                <select name="type" value={filters.type} onChange={handleFilterChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-1.5 rounded-md outline-none">
                                    <option value="all">All Types</option>
                                    <option value="income">Income</option>
                                    <option value="expense">Expense</option>
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category</label>
                                <select name="category" value={filters.category} onChange={handleFilterChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-1.5 rounded-md outline-none">
                                    <option value="all">All Categories</option>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Method</label>
                                <select name="paymentMethod" value={filters.paymentMethod} onChange={handleFilterChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-1.5 rounded-md outline-none">
                                    <option value="all">All Methods</option>
                                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Start Date</label>
                                <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-1 rounded-md outline-none px-1" />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">End Date</label>
                                <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-1 rounded-md outline-none px-1" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Income</p>
                        <p className="text-sm font-bold text-emerald-600">{formatCurrency(summary.income)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Expense</p>
                        <p className="text-sm font-bold text-rose-600">{formatCurrency(summary.expenses)}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filtered Entries ({filteredTransactions.length})</h3>
                    </div>
                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map(t => {
                                const totalAmount = calculateTotalAmount(t.items);
                                const isIncome = t.type === 'income';
                                return (
                                    <button 
                                        key={t.id} 
                                        onClick={() => onTransactionClick(t)} 
                                        className="w-full flex items-center justify-between p-4 active:bg-slate-50 dark:active:bg-slate-800 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-1 h-8 rounded-full flex-shrink-0 ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                            <div className="truncate">
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{t.description}</p>
                                                <p className="text-[10px] text-slate-400 font-semibold uppercase">{t.category} • {t.paymentMethod} • {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                                            </div>
                                        </div>
                                        <p className={`text-sm font-bold shrink-0 ${isIncome ? 'text-emerald-600' : 'text-slate-900 dark:text-slate-100'}`}>
                                            {isIncome ? '+' : ''}{formatCurrency(totalAmount)}
                                        </p>
                                    </button>
                                )
                            })
                        ) : (
                            <div className="py-20">
                                <EmptyState
                                    icon={<svg className="h-10 w-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" /></svg>}
                                    title="No Matching Records"
                                    message="Try adjusting your filters."
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

export default TransactionLogReport;
