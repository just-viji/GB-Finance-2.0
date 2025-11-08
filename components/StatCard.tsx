import React from 'react';

interface StatCardProps {
  title: string;
  amount: number;
  type: 'sale' | 'expense' | 'profit';
}

const StatCard: React.FC<StatCardProps> = ({ title, amount, type }) => {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  };

  const colors = {
    sale: 'text-green-500',
    expense: 'text-red-500',
    profit: amount >= 0 ? 'text-blue-500' : 'text-red-500',
  };

  const icon = {
    sale: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" /></svg>,
    expense: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" /></svg>,
    profit: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 6-3 6m18-12-3 6 3 6" /></svg>,
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between">
      <div>
        <p className="text-brand-secondary font-medium">{title}</p>
        <p className={`text-2xl sm:text-3xl font-bold ${colors[type]}`}>{formatCurrency(amount)}</p>
      </div>
      <div className={`p-3 rounded-full bg-gray-100 ${colors[type]}`}>
        {icon[type]}
      </div>
    </div>
  );
};

export default StatCard;