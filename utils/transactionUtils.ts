import { TransactionLineItem } from '../types';

export const calculateTotalAmount = (items: TransactionLineItem[]): number => {
  if (!items || items.length === 0) {
    return 0;
  }
  return items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
};
