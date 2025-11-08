import React, { useMemo } from 'react';
import { Transaction } from '../../types';
import { calculateTotalAmount } from '../../utils/transactionUtils';

interface PaymentMethodSummaryProps {
  transactions: Transaction[];
}

const SummaryCard: React.FC<{ title: string; amount: number; color: string }> = ({ title, amount, color }) => (
    <div className="bg-gray-50 p-4 rounded-lg text-center">
        <p className="text-sm font-medium text-brand-secondary">{title}</p>
        <p className={`text-xl font-bold ${color}`}>
            {amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
        </p>
    </div>
);

const PaymentMethodSummary: React.FC<PaymentMethodSummaryProps> = ({ transactions }) => {
  const summary = useMemo(() => {
    return transactions.reduce((acc, t) => {
        const totalAmount = calculateTotalAmount(t.items);
        if (t.type === 'sale') {
            if (t.paymentMethod === 'Cash') acc.cashIn += totalAmount;
            else acc.bankIn += totalAmount;
        } else {
            if (t.paymentMethod === 'Cash') acc.cashOut += totalAmount;
            else acc.bankOut += totalAmount;
        }
        return acc;
    }, { cashIn: 0, bankIn: 0, cashOut: 0, bankOut: 0 });
  }, [transactions]);

  return (
    <div className="grid grid-cols-2 gap-4">
        <SummaryCard title="Cash In (Sales)" amount={summary.cashIn} color="text-green-600" />
        <SummaryCard title="Cash Out (Expenses)" amount={summary.cashOut} color="text-red-600" />
        <SummaryCard title="Bank In (Sales)" amount={summary.bankIn} color="text-green-600" />
        <SummaryCard title="Bank Out (Expenses)" amount={summary.bankOut} color="text-red-600" />
    </div>
  );
};

export default PaymentMethodSummary;
