import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { Transaction } from '../types';
import { calculateTotalAmount } from '../utils/transactionUtils';
import EmptyState from './EmptyState';

interface FinancialChartProps {
  data: Transaction[];
}

const FinancialChart: React.FC<FinancialChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const groupedData: { [key: string]: { sales: number; expenses: number } } = {};

    // Get data for the last 14 days
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }).reverse();

    last14Days.forEach(date => {
      groupedData[date] = { sales: 0, expenses: 0 };
    });

    data.forEach(transaction => {
      const date = new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (groupedData[date]) {
        const totalAmount = calculateTotalAmount(transaction.items);
        if (transaction.type === 'sale') {
          groupedData[date].sales += totalAmount;
        } else {
          groupedData[date].expenses += totalAmount;
        }
      }
    });

    return Object.keys(groupedData).map(date => ({
      date,
      Sales: groupedData[date].sales,
      Expenses: groupedData[date].expenses,
    }));
  }, [data]);

  if (data.length === 0) {
    return (
        <div className="h-full flex items-center justify-center">
            <EmptyState
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>}
                title="No Data for Chart"
                message="Add some transactions to see your financial overview."
            />
        </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${new Intl.NumberFormat('en-IN', { notation: 'compact', compactDisplay: 'short' }).format(value as number)}`} />
        <Tooltip
          formatter={(value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)}
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
          }}
          labelStyle={{ color: '#334155' }}
          cursor={{ fill: 'rgba(100, 116, 139, 0.1)'}}
        />
        <Legend wrapperStyle={{fontSize: "14px"}} />
        <Bar dataKey="Sales" fill="#14b8a6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default FinancialChart;