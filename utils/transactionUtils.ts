import { TransactionLineItem } from '../types';

export const calculateTotalAmount = (items: TransactionLineItem[]): number => {
  if (!items || items.length === 0) {
    return 0;
  }
  return items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
};

export const getMonthDateRange = () => {
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
