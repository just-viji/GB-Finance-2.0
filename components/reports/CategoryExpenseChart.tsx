import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Transaction } from '../../types';
import { calculateTotalAmount } from '../../utils/transactionUtils';
import EmptyState from '../EmptyState';

interface CategoryExpenseChartProps {
  transactions: Transaction[];
}

const COLORS = ['#14b8a6', '#f43f5e', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#65a30d', '#0891b2'];

const CategoryExpenseChart: React.FC<CategoryExpenseChartProps> = ({ transactions }) => {
  const chartData = useMemo(() => {
    const expenseData = transactions.filter(t => t.type === 'expense');
    if (expenseData.length === 0) return [];

    const categoryTotals: { [key: string]: number } = {};
    expenseData.forEach(t => {
      const total = calculateTotalAmount(t.items);
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + total;
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

  }, [transactions]);

  if (chartData.length === 0) {
    return (
        <div className="h-full flex items-center justify-center">
            <EmptyState
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>}
                title="No Expense Data"
                message="No expenses found in the selected period."
            />
        </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={90}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
             const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
             const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
             const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
             return (percent * 100) > 3 ? (
                <text x={x} y={y} fill="#334155" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12">
                   {`${(percent * 100).toFixed(0)}%`}
                </text>
             ) : null;
          }}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
            formatter={(value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)}
            contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
            }}
        />
        <Legend iconSize={10} wrapperStyle={{fontSize: "12px", paddingTop: "10px", lineHeight: '20px'}}/>
      </PieChart>
    </ResponsiveContainer>
  );
};

export default CategoryExpenseChart;
