
import React, { useMemo } from 'react';
import { Transaction } from '../../types';
import { calculateTotalAmount } from '../../utils/transactionUtils';

interface PaymentMethodSummaryProps {
  transactions: Transaction[];
}

const SummaryItem: React.FC<{ title: string; amount: number; isIncome: boolean }> = ({ title, amount, isIncome }) => (
    <div className="flex justify-between items-center py-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</span>
        <span className={`text-xs font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
            {amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
        </span>
    </div>
);

const PaymentMethodSummary: React.FC<PaymentMethodSummaryProps> = ({ transactions }) => {
  const summary = useMemo(() => {
    return transactions.reduce((acc, t) => {
        const totalAmount = calculateTotalAmount(t.items);
        if (t.type === 'income') {
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
    <div className="space-y-4">
        <div>
            <p className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest mb-1">Cash Ledger</p>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                <SummaryItem title="Cash In (Income)" amount={summary.cashIn} isIncome={true} />
                <SummaryItem title="Cash Out (Exp)" amount={summary.cashOut} isIncome={false} />
            </div>
        </div>
        <div>
            <p className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest mb-1">Digital Ledger</p>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                <SummaryItem title="Bank In (Income)" amount={summary.bankIn} isIncome={true} />
                <SummaryItem title="Bank Out (Exp)" amount={summary.bankOut} isIncome={false} />
            </div>
        </div>
    </div>
  );
};

export default PaymentMethodSummary;
