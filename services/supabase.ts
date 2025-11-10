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
  const { data, error } = await supabase
    .from('transactions')
    .select('*');
  if (error) throw error;
  return data;
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
  const { data, error } = await supabase
    .from('transactions')
    .insert([transaction]);
  if (error) throw error;
  return data;
};

export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('name');
  if (error) throw error;
  return data?.map(c => c.name) || [];
};

export const addCategory = async (category: string) => {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name: category }]);
  if (error) throw error;
  return data;
};
