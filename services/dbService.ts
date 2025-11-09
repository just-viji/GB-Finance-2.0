import { createClient } from '@supabase/supabase-js';
import { Transaction } from '../types';

/*
  Supabase Database Schema Setup:

  Please create the following tables in your Supabase project.

  1. categories table:
  --------------------
  CREATE TABLE categories (
      name TEXT PRIMARY KEY
  );

  2. transactions table:
  ----------------------
  CREATE TABLE transactions (
      id UUID PRIMARY KEY,
      type TEXT,
      description TEXT,
      date TIMESTAMPTZ,
      category TEXT REFERENCES categories(name),
      "paymentMethod" TEXT
  );

  3. transaction_items table:
  ---------------------------
  CREATE TABLE transaction_items (
      id UUID PRIMARY KEY,
      transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
      description TEXT,
      quantity REAL,
      "unitPrice" REAL
  );
  
  Note: Using quoted identifiers like "paymentMethod" and "unitPrice" is important
  if you want to maintain camelCase column names in your database.
  Also, setting "ON DELETE CASCADE" for the transaction_id foreign key is recommended.
*/

// Assume these are set in the environment
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase URL or Anon Key is not set. Please check your environment variables.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEFAULT_CATEGORIES = [
  'Groceries', 'Utilities', 'Rent', 'Transportation', 'Entertainment',
  'Office Supplies', 'Salary', 'Sale',
];

// Transaction Functions
export const dbGetAllTransactions = async (): Promise<Transaction[]> => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*, items:transaction_items(*)')
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
    }
    
    // The query aliases transaction_items to items, so it should match the Transaction type
    return (data as any[]) || [];
};

export const dbAddTransaction = async (transaction: Transaction): Promise<void> => {
    const { items, ...transactionData } = transaction;

    const { error: transactionError } = await supabase
        .from('transactions')
        .insert(transactionData);

    if (transactionError) {
        console.error('Error adding transaction:', transactionError);
        throw transactionError;
    }

    if (items && items.length > 0) {
        const itemsWithTransactionId = items.map(item => ({ ...item, transaction_id: transaction.id, unitPrice: item.unitPrice }));
        const { error: itemsError } = await supabase
            .from('transaction_items')
            .insert(itemsWithTransactionId);

        if (itemsError) {
            console.error('Error adding transaction items:', itemsError);
            throw itemsError;
        }
    }
};

export const dbUpdateTransaction = async (transaction: Transaction): Promise<void> => {
    const { items, ...transactionData } = transaction;

    const { error: transactionError } = await supabase
        .from('transactions')
        .update(transactionData)
        .eq('id', transaction.id);

    if (transactionError) {
        console.error('Error updating transaction:', transactionError);
        throw transactionError;
    }

    const { error: deleteError } = await supabase
        .from('transaction_items')
        .delete()
        .eq('transaction_id', transaction.id);

    if (deleteError) {
        console.error('Error deleting old transaction items:', deleteError);
        throw deleteError;
    }

    if (items && items.length > 0) {
        const itemsWithTransactionId = items.map(item => ({ ...item, transaction_id: transaction.id, unitPrice: item.unitPrice }));
        const { error: insertError } = await supabase
            .from('transaction_items')
            .insert(itemsWithTransactionId);

        if (insertError) {
            console.error('Error inserting updated transaction items:', insertError);
            throw insertError;
        }
    }
};

export const dbDeleteTransaction = async (id: string): Promise<void> => {
    // If ON DELETE CASCADE is set on the foreign key, this is sufficient.
    // If not, you must delete items first. This code assumes cascade is NOT set, for safety.
    const { error: itemsError } = await supabase
        .from('transaction_items')
        .delete()
        .eq('transaction_id', id);

    if (itemsError) {
        console.error('Error deleting transaction items:', itemsError);
        throw itemsError;
    }

    const { error: transactionError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

    if (transactionError) {
        console.error('Error deleting transaction:', transactionError);
        throw transactionError;
    }
};

// Category Functions
export const dbGetAllCategories = async (): Promise<string[]> => {
    const { data, error } = await supabase.from('categories').select('name');
    if (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
    return (data || []).map(c => c.name).sort((a,b) => a.localeCompare(b));
};

export const dbSeedDefaultCategories = async (): Promise<string[]> => {
    const categoriesToInsert = DEFAULT_CATEGORIES.map(name => ({ name }));
    const { error } = await supabase.from('categories').insert(categoriesToInsert);
    if (error) {
        console.error('Error seeding categories:', error);
        if (error.code !== '23505') { // Ignore primary key violations (already exists)
             throw error;
        }
    }
    return DEFAULT_CATEGORIES.sort((a,b) => a.localeCompare(b));
};

export const dbAddCategory = async (category: string): Promise<boolean> => {
    const { error } = await supabase.from('categories').insert({ name: category });
    if (error) {
        if (error.code === '23505') { // unique constraint violation
            console.log(`Category "${category}" already exists.`);
            return false;
        }
        console.error('Error adding category:', error);
        throw error;
    }
    return true;
};

export const dbDeleteCategory = async (category: string): Promise<void> => {
    const { error } = await supabase.from('categories').delete().eq('name', category);
    if (error) {
        console.error('Error deleting category:', error);
        throw error;
    }
};

// Data Management Functions
export const dbClearAllData = async (): Promise<void> => {
    // Order matters due to foreign key constraints if cascade is not enabled.
    const { error: itemsError } = await supabase.from('transaction_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (itemsError) throw itemsError;

    const { error: transactionsError } = await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (transactionsError) throw transactionsError;

    const { error: categoriesError } = await supabase.from('categories').delete().neq('name', 'this-is-a-dummy-name-that-should-not-exist');
    if (categoriesError) throw categoriesError;
};