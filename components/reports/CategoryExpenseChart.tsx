import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip } from 'recharts';
import { Transaction } from '../../types';
import { calculateTotalAmount } from '../../utils/transactionUtils';
import EmptyState from '../EmptyState';

interface CategoryExpenseChartProps {
  transactions: Transaction[];
  onSliceClick: (category: string) => void;
  selectedCategory: string | null;
}

const COLORS = ['#14b8a6', '#f43f5e', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#65a30d', '#0891b2'];

const CustomizedAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const label = payload.value as string;
    // Truncate label if it's too long to prevent overlap
    const truncatedLabel = label.length > 12 ? `${label.substring(0, 10)}...` : label;
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={16} textAnchor="end" fill="#64748b" transform="rotate(-40)" fontSize={12}>
                {truncatedLabel}
            </text>
        </g>
    );
};


const CategoryExpenseChart: React.FC<CategoryExpenseChartProps> = ({ transactions, onSliceClick, selectedCategory }) => {
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
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 50 }}>
        <XAxis 
            dataKey="name"
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={<CustomizedAxisTick />}
        />
        <YAxis 
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₹${new Intl.NumberFormat('en-IN', { notation: 'compact', compactDisplay: 'short' }).format(value as number)}`} 
        />
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
        <Bar dataKey="value" name="Expense" onClick={(data) => onSliceClick(data.name)} radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell 
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]} 
                fillOpacity={!selectedCategory || selectedCategory === entry.name ? 1 : 0.3}
                stroke={selectedCategory === entry.name ? '#334155' : 'none'}
                strokeWidth={2}
                className="cursor-pointer transition-opacity"
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CategoryExpenseChart;