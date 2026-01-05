
export type TransactionType = 'income' | 'expense';
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
  user_id?: string;
  created_at?: string;
}

export interface AppRelease {
  version: string;
  download_url: string;
  is_mandatory: boolean;
  release_notes?: string;
  created_at?: string;
}
