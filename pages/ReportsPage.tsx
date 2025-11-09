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

const ReportMenuItem: React.FC<{ title: string, description: string, onClick: () => void, icon: React.ReactNode }> = ({ title, description, onClick, icon }) => (
    <div 
        className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 hover:border-brand-primary"
        onClick={onClick}
    >
        <div className="flex items-center gap-4">
            <div className="flex-shrink-0 text-brand-primary bg-brand-primary/10 p-3 rounded-lg">
                {icon}
            </div>
            <div>
                <h3 className="text-lg font-semibold text-brand-dark">{title}</h3>
                <p className="text-sm text-brand-secondary mt-1">{description}</p>
            </div>
        </div>
    </div>
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
    />
  }

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-brand-dark">Reports Hub</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReportMenuItem 
                title="Transaction Log"
                description="View, search, and filter all your recorded transactions."
                onClick={() => setCurrentView('transaction_log')}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
            />
            <ReportMenuItem 
                title="Expense Breakdown"
                description="Analyze your spending by category and top items."
                onClick={() => setCurrentView('expense_breakdown')}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>}
            />
            <ReportMenuItem 
                title="Funds Flow"
                description="See the movement of money through cash and bank accounts."
                onClick={() => setCurrentView('funds_flow')}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
            />
        </div>
    </div>
  );
};

export default ReportsPage;