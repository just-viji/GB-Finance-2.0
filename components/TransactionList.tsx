
import React from 'react';
import { Transaction } from '../types';
import { calculateTotalAmount } from '../utils/transactionUtils';

const TransactionItem: React.FC<{ transaction: Transaction; onTransactionClick?: (t: Transaction) => void }> = ({ transaction, onTransactionClick }) => {
  const totalAmount = calculateTotalAmount(transaction.items);
  const isIncome = transaction.type === 'income';
  
  return (
    <div 
      className="group bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      onClick={() => onTransactionClick?.(transaction)}
    >
        <div className="px-4 py-3.5 flex items-center gap-4">
            {/* Simple Circle Icon */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isIncome ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                {isIncome ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                )}
            </div>
            
            <div className="flex-grow min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate leading-tight mb-0.5">{transaction.description}</p>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {new Date(transaction.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700"></span>
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">{transaction.category}</span>
                </div>
            </div>
            
            <div className="text-right flex flex-col items-end">
                <p className={`text-sm font-extrabold ${isIncome ? 'text-emerald-600' : 'text-slate-900 dark:text-slate-100'}`}>
                    {isIncome ? '+' : ''}₹{totalAmount.toLocaleString('en-IN')}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{transaction.paymentMethod}</p>
            </div>
        </div>
    </div>
  );
};

const TransactionList: React.FC<{ transactions: Transaction[]; title?: string; limit?: number; onTransactionClick?: (t: Transaction) => void }> = ({ transactions, title = "Transaction History", limit, onTransactionClick }) => {
  const displayTransactions = limit ? transactions.slice(0, limit) : transactions;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h3>
            {limit && transactions.length > limit && (
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">See More</span>
            )}
        </div>
        {displayTransactions.length > 0 ? (
             <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {displayTransactions.map(t => <TransactionItem key={t.id} transaction={t} onTransactionClick={onTransactionClick} />)}
            </div>
        ) : (
             <div className="py-12 flex flex-col items-center opacity-30">
                 <svg className="h-10 w-10 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                 <span className="text-[10px] font-bold uppercase tracking-[0.2em]">No Ledger Entries</span>
             </div>
        )}
    </div>
  );
};

export default React.memo(TransactionList);
