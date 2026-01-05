
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import TransactionList from '../components/TransactionList';

interface TransactionsPageProps {
  transactions: Transaction[];
  onTransactionClick: (transaction: Transaction) => void;
  onAddTransactionClick: () => void;
}

const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  onTransactionClick,
  onAddTransactionClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) {
      return transactions;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return transactions.filter(t =>
      t.description.toLowerCase().includes(lowercasedFilter) ||
      t.items.some(item => item.description.toLowerCase().includes(lowercasedFilter))
    );
  }, [transactions, searchTerm]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pt-6 px-4">
       <div className="flex justify-between items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Ledger</h2>
        <button
          onClick={onAddTransactionClick}
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2 text-xs uppercase tracking-wider active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>New Entry</span>
        </button>
      </div>

      <div className="space-y-4">
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <input
                type="text"
                placeholder="Search descriptions or items..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400 shadow-sm"
            />
        </div>
        
        <div className="max-h-[70vh] overflow-y-auto no-scrollbar rounded-xl">
             <TransactionList
                transactions={filteredTransactions}
                title={`All Entries (${filteredTransactions.length})`}
                onTransactionClick={onTransactionClick}
            />
        </div>
      </div>
      
      <p className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest py-4">End-to-End Secure Cloud Sync</p>
    </div>
  );
};

export default TransactionsPage;
