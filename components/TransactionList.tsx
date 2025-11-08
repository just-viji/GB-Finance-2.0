import React, { useState } from 'react';
import { Transaction } from '../types';
import { calculateTotalAmount } from '../utils/transactionUtils';
import EmptyState from './EmptyState';

interface TransactionItemProps {
  transaction: Transaction;
  onTransactionClick?: (transaction: Transaction) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onTransactionClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { type, description, date, category, paymentMethod, items } = transaction;
  const totalAmount = calculateTotalAmount(items);
  const isSale = type === 'sale';
  const amountColor = isSale ? 'text-green-600' : 'text-red-600';
  const sign = isSale ? '+' : '-';

  return (
    <li 
      className={`group bg-white rounded-lg transition-all duration-200 hover:bg-gray-50/80 shadow-sm border border-gray-200/80 p-3 ${onTransactionClick ? 'cursor-pointer' : ''}`}
      onClick={() => onTransactionClick && onTransactionClick(transaction)}
    >
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 min-w-0">
                <div className={`w-2 h-10 rounded-full flex-shrink-0 ${isSale ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <div className="truncate">
                    <p className="font-semibold text-brand-dark truncate">{description}</p>
                    <p className="text-sm text-brand-secondary truncate">{!isSale && `${category} • `}{paymentMethod} &bull; {new Date(date).toLocaleDateString()}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 ml-2">
                <p className={`font-bold text-base sm:text-lg text-right ${amountColor}`}>{sign} {totalAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</p>
                <div className="flex gap-1">
                    {items.length > 1 &&
                        <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} aria-label="View items" className="p-2 rounded-full hover:bg-gray-200 text-brand-secondary">
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                    }
                </div>
            </div>
        </div>
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 mt-2' : 'max-h-0'}`}>
             {items.length > 1 && (
                <div className="pl-6 border-l-2 border-gray-200 ml-2 pt-2">
                    <ul className="text-sm text-brand-secondary space-y-1">
                        {items.map(item => (
                            <li key={item.id} className="flex justify-between">
                                <span>{item.description} ({item.quantity} x {item.unitPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })})</span>
                                <span>{(item.quantity * item.unitPrice).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    </li>
  );
};

interface TransactionListProps {
  transactions: Transaction[];
  title?: string;
  limit?: number;
  onTransactionClick?: (transaction: Transaction) => void;
}


const TransactionList: React.FC<TransactionListProps> = ({ transactions, title = "Recent Transactions", limit, onTransactionClick }) => {
  const transactionsToDisplay = limit ? transactions.slice(0, limit) : transactions;

  return (
    <div>
        <h3 className="text-lg font-semibold mb-2 text-brand-dark">{title}</h3>
        {transactionsToDisplay.length > 0 ? (
             <ul className="space-y-3">
                {transactionsToDisplay.map(t => <TransactionItem key={t.id} transaction={t} onTransactionClick={onTransactionClick} />)}
            </ul>
        ) : (
             <EmptyState
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
                title="No Transactions Found"
                message={limit ? "Add a new sale or expense to see it here." : "Your filtered search did not return any results."}
            />
        )}
    </div>
  );
};

export default TransactionList;