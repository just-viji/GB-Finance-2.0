import React from 'react';
import { Transaction } from '../types';
import StatCard from '../components/StatCard';
import FinancialChart from '../components/FinancialChart';
import TransactionList from '../components/TransactionList';

interface HomePageProps {
  stats: {
    totalSales: number;
    totalExpenses: number;
    netProfit: number;
  };
  transactions: Transaction[];
  onTransactionClick: (transaction: Transaction) => void;
}

const HomePage: React.FC<HomePageProps> = ({ stats, transactions, onTransactionClick }) => {
  const { totalSales, totalExpenses, netProfit } = stats;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Sales" amount={totalSales} type="sale" />
        <StatCard title="Total Expenses" amount={totalExpenses} type="expense" />
        <StatCard title="Net Profit" amount={netProfit} type="profit" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-brand-dark">Financial Overview</h2>
        <div className="h-72 md:h-80 mb-8 min-h-[300px]">
          <FinancialChart data={transactions} />
        </div>
        <TransactionList 
          transactions={transactions} 
          limit={5}
          onTransactionClick={onTransactionClick}
        />
      </div>
    </>
  );
};

export default HomePage;