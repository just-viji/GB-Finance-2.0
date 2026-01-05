
import React from 'react';

interface StatCardProps {
  title: string;
  amount: number;
  type: 'income' | 'expense' | 'savings';
  onAddClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, amount, type, onAddClick }) => {
  const formatCurrency = (value: number) => {
    return Math.abs(value).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  };

  const colorConfig = {
    income: 'text-emerald-600',
    expense: 'text-rose-600',
    savings: amount >= 0 ? 'text-blue-600' : 'text-rose-600'
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h3>
        {onAddClick && (
          <button 
            onClick={onAddClick} 
            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          </button>
        )}
      </div>
      <div className="flex items-baseline">
        <span className={`text-2xl font-extrabold tracking-tight ${colorConfig[type]}`}>
          {type === 'savings' && amount < 0 ? '-' : ''}{formatCurrency(amount)}
        </span>
      </div>
    </div>
  );
};

export default React.memo(StatCard);
