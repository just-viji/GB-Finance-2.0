
import React, { useState, useMemo } from 'react';
import { Transaction } from '../../types';
import PaymentMethodSummary from './PaymentMethodSummary';
import EmptyState from '../EmptyState';
import { calculateTotalAmount } from '../../utils/transactionUtils';

interface FundsFlowReportProps {
  transactions: Transaction[];
  onBack: () => void;
}

const FundsFlowReport: React.FC<FundsFlowReportProps> = ({ transactions, onBack }) => {
    const getMonthDateRange = () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const formatDate = (date: Date) => {
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        return {
            startDate: formatDate(firstDay),
            endDate: formatDate(lastDay)
        };
    };
    
    const [filters, setFilters] = useState({ startDate: getMonthDateRange().startDate, endDate: getMonthDateRange().endDate });

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const transactionDate = new Date(t.date);
            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            const endDate = filters.endDate ? new Date(filters.endDate) : null;
            if(startDate) startDate.setHours(0,0,0,0);
            if(endDate) endDate.setHours(23,59,59,999);
            return (!startDate || transactionDate >= startDate) && (!endDate || transactionDate <= endDate);
        });
    }, [transactions, filters]);

    const { netCashFlow, netBankFlow } = useMemo(() => {
        return filteredTransactions.reduce((acc, t) => {
          const totalAmount = calculateTotalAmount(t.items);
          if (t.paymentMethod === 'Cash') {
            if (t.type === 'income') acc.netCashFlow += totalAmount;
            else acc.netCashFlow -= totalAmount;
          } else if (t.paymentMethod === 'Online') {
            if (t.type === 'income') acc.netBankFlow += totalAmount;
            else acc.netBankFlow -= totalAmount;
          }
          return acc;
        }, { netCashFlow: 0, netBankFlow: 0 });
      }, [filteredTransactions]);

    const formatCurrency = (value: number) => value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

    return (
        <div className="max-w-md mx-auto h-[calc(100dvh-4.5rem-var(--sat,0px)-4rem)] flex flex-col bg-white dark:bg-slate-950 overflow-hidden border-x border-slate-100 dark:border-slate-900">
            <header className="sticky top-0 z-40 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                <div className="flex items-center px-4 h-14">
                    <button onClick={onBack} className="p-2 -ml-2 text-slate-900 dark:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="flex-grow text-center font-bold text-slate-900 dark:text-white mr-8">Funds Flow</h1>
                </div>
            </header>

            <div className="flex-grow overflow-y-auto no-scrollbar bg-slate-50/50 dark:bg-slate-950">
                <div className="p-4 space-y-4">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm grid grid-cols-2 gap-3">
                         <div className="col-span-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">From</label>
                            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-1 rounded-md outline-none px-1" />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">To</label>
                            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-1 rounded-md outline-none px-1" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                </div>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Net Cash</span>
                            </div>
                            <span className={`text-sm font-bold ${netCashFlow >= 0 ? 'text-blue-500' : 'text-rose-500'}`}>{formatCurrency(netCashFlow)}</span>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Net Bank</span>
                            </div>
                            <span className={`text-sm font-bold ${netBankFlow >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatCurrency(netBankFlow)}</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Flow Breakdown</h3>
                        {filteredTransactions.length > 0 ? (
                            <PaymentMethodSummary transactions={filteredTransactions} />
                        ) : (
                            <div className="py-10">
                                <EmptyState 
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
                                    title="No Activity"
                                    message="No flows detected in range."
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default FundsFlowReport;
