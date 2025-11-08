export type TransactionType = 'sale' | 'expense';
export type PaymentMethod = 'Cash' | 'Online';

export interface TransactionLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Transaction {
  id:string;
  type: TransactionType;
  description: string; // Overall description for the transaction
  date: string; // ISO string format
  category: string;
  paymentMethod: PaymentMethod;
  items: TransactionLineItem[];
}
