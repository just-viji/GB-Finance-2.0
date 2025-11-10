import { createClient } from '@supabase/supabase-js';
import { Transaction } from '../types';

// Initialize Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and anon key are required.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication Functions
export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ?? null;
}

// Data Functions
export const getTransactions = async () => {
  const user = await getCurrentUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id);
  if (error) throw error;
  return data;
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated to add transaction.");

  const transactionWithUser = { ...transaction, user_id: user.id };

  const { data, error } = await supabase
    .from('transactions')
    .insert([transactionWithUser])
    .select();

  if (error) throw error;
  return data;
};

export const getCategories = async () => {
  const user = await getCurrentUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .eq('user_id', user.id);
  if (error) throw error;
  return data?.map(c => c.name) || [];
};

export const addCategory = async (category: string) => {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from('categories')
    .insert([{ name: category, user_id: user.id }]);
  if (error) throw error;
  return data;
};

export const deleteCategory = async (categoryName: string) => {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not authenticated");
    const { data, error } = await supabase
        .from('categories')
        .delete()
        .eq('name', categoryName)
        .eq('user_id', user.id);
    if (error) throw error;
    return data;
}

export const updateTransaction = async (transaction: Transaction) => {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not authenticated");
    const { data, error } = await supabase
        .from('transactions')
        .update(transaction)
        .eq('id', transaction.id)
        .eq('user_id', user.id);
    if (error) throw error;
    return data;
}

export const deleteTransaction = async (transactionId: string) => {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not authenticated");
    const { data, error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', user.id);
    if (error) throw error;
    return data;
}