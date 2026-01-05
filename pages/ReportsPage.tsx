
import React, { useState } from 'react';
import { Transaction } from '../types';
import TransactionLogReport from '../components/TransactionLogReport';
import ExpenseBreakdownReport from '../components/reports/ExpenseBreakdownReport';
import FundsFlowReport from '../components/reports/FundsFlowReport';

interface ReportsPageProps {
  transactions: Transaction[];
  categories: string[];
  onTransactionClick: (transaction: Transaction) => void;
}

type ReportView = 'menu' | 'transaction_log' | 'expense_breakdown' | 'funds_flow';

const ReportListRow: React.FC<{ title: string, description: string, onClick: () => void, icon: React.ReactNode, color: string }> = ({ title, description, onClick, icon, color }) => (
    <button 
        className="w-full flex items-center justify-between py-4 px-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 active:bg-slate-50 dark:active:bg-slate-800 transition-colors text-left"
        onClick={onClick}
    >
        <div className="flex items-center gap-4">
            <div className={`flex-shrink-0 p-2.5 rounded-lg text-white ${color}`}>
                {icon}
            </div>
            <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
            </div>
        </div>
        <svg className="w-4 h-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
    </button>
);

const ReportsPage: React.FC<ReportsPageProps> = ({ transactions, categories, onTransactionClick }) => {
  const [currentView, setCurrentView] = useState<ReportView>('menu');

  const handleBack = () => setCurrentView('menu');

  if (currentView === 'transaction_log') {
    return <TransactionLogReport 
        transactions={transactions} 
        categories={categories} 
        onTransactionClick={onTransactionClick} 
        onBack={handleBack} 
    />;
  }
  
  if (currentView === 'expense_breakdown') {
    return <ExpenseBreakdownReport
        transactions={transactions}
        onBack={handleBack}
    />;
  }

  if (currentView === 'funds_flow') {
    return <FundsFlowReport
        transactions={transactions}
        onBack={handleBack}
    />;
  }

  return (
    <div className="max-w-md mx-auto h-[calc(100dvh-4.5rem-var(--sat,0px)-4rem)] flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden border-x border-slate-100 dark:border-slate-900">
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center px-4 h-14">
            <h1 className="flex-grow text-center font-bold text-slate-900 dark:text-white">Reports Hub</h1>
        </div>
      </header>

      <div className="flex-grow overflow-y-auto no-scrollbar">
        <div className="mt-6 mb-2 px-5">
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Analysis Protocols</h2>
        </div>
        <div className="bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800">
            <ReportListRow 
                title="Transaction Log"
                description="Detailed audit trail of all ledger entries."
                onClick={() => setCurrentView('transaction_log')}
                color="bg-blue-500"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
            />
            <ReportListRow 
                title="Expense Breakdown"
                description="Categorical analysis and itemized spending."
                onClick={() => setCurrentView('expense_breakdown')}
                color="bg-rose-500"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>}
            />
            <ReportListRow 
                title="Funds Flow"
                description="Movement across cash and digital accounts."
                onClick={() => setCurrentView('funds_flow')}
                color="bg-emerald-500"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
            />
        </div>
        
        <div className="mt-10 px-5 text-center opacity-40">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic leading-relaxed">
              Automated Financial Intelligence<br/>Cloud Sync Enabled
            </p>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
