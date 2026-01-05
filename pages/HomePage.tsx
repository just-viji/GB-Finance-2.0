
import React from 'react';
import { Transaction } from '../types';
import StatCard from '../components/StatCard';
import FinancialChart from '../components/FinancialChart';
import TransactionList from '../components/TransactionList';

interface HomePageProps {
  stats: { totalIncome: number; totalExpenses: number; netSavings: number; };
  transactions: Transaction[];
  onTransactionClick: (t: Transaction) => void;
  onAddTransaction: (type?: 'income' | 'expense', autoScan?: boolean) => void;
  onScanToPay: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ stats, transactions, onTransactionClick, onAddTransaction, onScanToPay }) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pt-6 px-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Overview of your financial activity</p>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={onScanToPay}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-blue-800 text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
            >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 00-1 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                Scan UPI
            </button>
            <button 
                onClick={() => onAddTransaction('expense', true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
            >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                AI Receipt
            </button>
          </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Income" amount={stats.totalIncome} type="income" onAddClick={() => onAddTransaction('income')} />
        <StatCard title="Expenses" amount={stats.totalExpenses} type="expense" onAddClick={() => onAddTransaction('expense')} />
        <StatCard title="Net Flow" amount={stats.netSavings} type="savings" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cashflow Activity</h3>
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span><span className="text-[10px] font-bold text-slate-500 uppercase">Income</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span><span className="text-[10px] font-bold text-slate-500 uppercase">Expense</span></div>
                </div>
            </div>
            <div className="h-64">
                <FinancialChart data={transactions} />
            </div>
        </section>

        <section className="lg:col-span-5">
            <TransactionList 
              transactions={transactions} 
              limit={5}
              title="Recent Activity"
              onTransactionClick={onTransactionClick}
            />
        </section>
      </div>
    </div>
  );
};

export default HomePage;
