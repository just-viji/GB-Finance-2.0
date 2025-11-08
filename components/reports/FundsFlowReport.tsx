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
        // This function formats a date to 'YYYY-MM-DD' in the local timezone,
        // avoiding the conversion issues of toISOString().
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
            if (t.type === 'sale') acc.netCashFlow += totalAmount;
            else acc.netCashFlow -= totalAmount;
          } else if (t.paymentMethod === 'Online') {
            if (t.type === 'sale') acc.netBankFlow += totalAmount;
            else acc.netBankFlow -= totalAmount;
          }
          return acc;
        }, { netCashFlow: 0, netBankFlow: 0 });
      }, [filteredTransactions]);

    return (
        <div className="space-y-6">
            <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-brand-secondary hover:text-brand-dark">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Back to Reports
            </button>
            <h2 className="text-2xl font-bold text-brand-dark">Funds Flow</h2>

             <div className="bg-white p-4 rounded-xl shadow-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="filter-startdate" className="text-xs font-medium text-gray-500">Start Date</label>
                        <input id="filter-startdate" type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="mt-1 block w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"/>
                    </div>
                    <div>
                        <label htmlFor="filter-enddate" className="text-xs font-medium text-gray-500">End Date</label>
                        <input id="filter-enddate" type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="mt-1 block w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"/>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <p className="text-brand-secondary font-medium">Net Cash Flow (for period)</p>
                    <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                        {netCashFlow.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <p className="text-brand-secondary font-medium">Net Bank Flow (for period)</p>
                    <p className={`text-2xl font-bold ${netBankFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {netBankFlow.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                    </p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-brand-dark">Flow Breakdown</h3>
                {filteredTransactions.length > 0 ? (
                    <PaymentMethodSummary transactions={filteredTransactions} />
                ) : (
                    <EmptyState 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
                        title="No Transaction Data"
                        message="No transactions were found for the selected date range."
                    />
                )}
            </div>
        </div>
    );
};
export default FundsFlowReport;