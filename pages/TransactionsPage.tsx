import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';

interface TransactionsPageProps {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  categories: string[];
  onTransactionClick: (transaction: Transaction) => void;
  transactionDescriptions: string[];
  itemDescriptions: string[];
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  addTransaction,
  categories,
  onTransactionClick,
  transactionDescriptions,
  itemDescriptions,
  showToast,
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <TransactionForm 
          onSubmit={addTransaction} 
          categories={categories} 
          transactionDescriptions={transactionDescriptions}
          itemDescriptions={itemDescriptions}
          showToast={showToast}
        />
      </div>
      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
        <div className="mb-4">
            <input
                type="text"
                placeholder="Search transactions by description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
            />
        </div>
        <div className="max-h-[65vh] lg:max-h-[75vh] overflow-y-auto pr-2">
             <TransactionList
                transactions={filteredTransactions}
                title="All Transactions"
                onTransactionClick={onTransactionClick}
            />
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;