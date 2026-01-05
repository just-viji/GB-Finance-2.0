
import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { Transaction } from '../types';
import { calculateTotalAmount } from '../utils/transactionUtils';

interface FinancialChartProps {
  data: Transaction[];
}

const FinancialChart: React.FC<FinancialChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const groupedData: { [key: string]: { income: number; expenses: number } } = {};
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }).reverse();

    last14Days.forEach(date => {
      groupedData[date] = { income: 0, expenses: 0 };
    });

    data.forEach(transaction => {
      const date = new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (groupedData[date]) {
        const totalAmount = calculateTotalAmount(transaction.items);
        if (transaction.type === 'income') groupedData[date].income += totalAmount;
        else groupedData[date].expenses += totalAmount;
      }
    });

    return Object.keys(groupedData).map(date => ({
      date,
      Income: groupedData[date].income,
      Expenses: groupedData[date].expenses,
    }));
  }, [data]);

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={6}>
        <XAxis 
            dataKey="date" 
            stroke="#64748b" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            tick={{ fontWeight: 700, textAnchor: 'middle' }}
        />
        <YAxis 
            stroke="#64748b" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `₹${new Intl.NumberFormat('en-IN', { notation: 'compact', compactDisplay: 'short' }).format(value)}`} 
        />
        <Tooltip
          cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
          contentStyle={{
            backgroundColor: '#0f172a',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
            fontSize: '12px',
            padding: '12px'
          }}
          itemStyle={{ fontWeight: 800 }}
          labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
        />
        <Bar dataKey="Income" fill="#10b981" radius={[3, 3, 0, 0]} name="Revenue" barSize={10} />
        <Bar dataKey="Expenses" fill="#e11d48" radius={[3, 3, 0, 0]} name="Expense" barSize={10} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default React.memo(FinancialChart);
