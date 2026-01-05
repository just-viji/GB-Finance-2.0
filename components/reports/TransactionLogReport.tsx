
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
    <div className="space-y-6">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-brand-secondary hover:text-brand-dark">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            Back to Reports
        </button>
        <h2 className="text-2xl font-bold text-brand-dark">Transaction Log</h2>
        
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-brand-dark">Filter Transactions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <input 
              type="text" 
              name="searchTerm" 
              placeholder="Search by description..." 
              value={filters.searchTerm} 
              onChange={handleFilterChange} 
              className="sm:col-span-4 w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
            />
            <button 
              onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)} 
              aria-expanded={isAdvancedFilterOpen}
              aria-controls="advanced-filters"
              className={`sm:col-span-1 w-full flex items-center justify-center gap-2 text-brand-secondary font-semibold p-2 rounded-md transition-colors ${isAdvancedFilterOpen ? 'bg-brand-primary/10 text-brand-primary' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM15 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" /></svg>
              <span>Filters</span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${isAdvancedFilterOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
        </div>
        <div id="advanced-filters" className={`transition-all duration-300 ease-in-out overflow-hidden ${isAdvancedFilterOpen ? 'max-h-96 pt-4' : 'max-h-0'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t border-gray-200 pt-4">
                <div>
                    <label htmlFor="filter-type" className="text-xs font-medium text-gray-500">Type</label>
                    <select id="filter-type" name="type" value={filters.type} onChange={handleFilterChange} className="mt-1 block w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary">
                        <option value="all">All Types</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="filter-category" className="text-xs font-medium text-gray-500">Category</label>
                    <select id="filter-category" name="category" value={filters.category} onChange={handleFilterChange} className="mt-1 block w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary">
                        <option value="all">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="filter-payment" className="text-xs font-medium text-gray-500">Payment</label>
                    <select id="filter-payment" name="paymentMethod" value={filters.paymentMethod} onChange={handleFilterChange} className="mt-1 block w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary">
                        <option value="all">All Methods</option>
                        {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
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
      </div>
       <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-brand-dark">Report Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                    <p className="text-brand-secondary">Total Income</p>
                    <p className="text-2xl font-bold text-green-500">{formatCurrency(summary.income)}</p>
                </div>
                <div>
                    <p className="text-brand-secondary">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-500">{formatCurrency(summary.expenses)}</p>
                </div>
                <div>
                    <p className="text-brand-secondary">Net Savings</p>
                    <p className={`text-2xl font-bold ${summary.income - summary.expenses >= 0 ? 'text-blue-500' : 'text-red-500'}`}>{formatCurrency(summary.income - summary.expenses)}</p>
                </div>
            </div>
        </div>
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-brand-dark">Filtered Transactions ({filteredTransactions.length})</h3>
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {filteredTransactions.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {filteredTransactions.map(t => {
                const totalAmount = calculateTotalAmount(t.items);
                const isIncome = t.type === 'income';
                return (
                 <li key={t.id} onClick={() => onTransactionClick(t)} className="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-50 rounded-md -mx-2 px-2 transition-colors">
                    <div className="flex items-center space-x-4 min-w-0">
                        <div className={`w-2 h-10 rounded-full flex-shrink-0 ${isIncome ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <div className="truncate">
                            <p className="font-semibold text-brand-dark truncate">{t.description}</p>
                            <p className="text-sm text-brand-secondary truncate">{t.category} &bull; {t.paymentMethod} &bull; {new Date(t.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <p className={`font-bold flex-shrink-0 ml-2 text-right ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                        {isIncome ? '+' : '-'} {formatCurrency(totalAmount)}
                    </p>
                </li>
              )})}
            </ul>
          ) : (
            <EmptyState
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" /></svg>}
                title="No Matching Transactions"
                message="No transactions match the current filters. Try adjusting your search."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionLogReport;
