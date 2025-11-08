import { createClient, Session, SupabaseClient, AuthChangeEvent } from '@supabase/supabase-js';
import { Transaction } from '../types';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

const supabase: SupabaseClient | null = isSupabaseConfigured
    ? createClient(supabaseUrl!, supabaseAnonKey!)
    : null;

const getClient = (): SupabaseClient => {
    if (!supabase) {
        throw new Error("Supabase is not configured. This function should not have been called, as a configuration check should have prevented it.");
    }
    return supabase;
}

// --- Auth Wrappers ---
export const getSession = () => {
    return getClient().auth.getSession();
}

export const onAuthStateChange = (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
    return getClient().auth.onAuthStateChange(callback);
}

export const signInWithGoogle = async () => {
    const { error } = await getClient().auth.signInWithOAuth({
        provider: 'google',
    });
    if (error) {
        console.error('Error signing in with Google:', error);
        throw error;
    }
};

export const signOut = async () => {
    const { error } = await getClient().auth.signOut();
    if (error) {
        console.error('Error signing out:', error);
        throw error;
    }
};

// --- Data Fetching ---
export const getInitialData = async () => {
    const client = getClient();
    const [transactionsRes, categoriesRes] = await Promise.all([
        client.from('transactions').select('*, items:transaction_line_items(*)').order('date', { ascending: false }),
        client.from('categories').select('name').order('name', { ascending: true }),
    ]);

    if (transactionsRes.error) throw transactionsRes.error;
    if (categoriesRes.error) throw categoriesRes.error;

    const transactions = transactionsRes.data?.map(t => ({
        ...t,
        items: t.items.map((i: any) => ({ ...i, unitPrice: i.unit_price })) // Map snake_case to camelCase
    })) || [];

    const categories = categoriesRes.data?.map(c => c.name) || [];
    
    // Add default categories if user has none
    if (categories.length === 0) {
        const { data: defaultCategories, error } = await client.from('default_categories').select('name');
        if (error) console.error("Error fetching default categories", error);
        if (defaultCategories) {
            categories.push(...defaultCategories.map(c => c.name));
        }
    }
    
    return { transactions, categories };
};

// --- Data Mutation ---

export const addTransaction = async (transaction: Transaction) => {
    const client = getClient();
    const { items, ...transactionData } = transaction;

    const { data, error } = await client
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();
    
    if (error) throw error;
    
    const lineItems = items.map(item => ({
        ...item,
        transaction_id: data.id,
        unit_price: item.unitPrice
    }));

    const { error: itemsError } = await client.from('transaction_line_items').insert(lineItems);
    
    if (itemsError) {
        // Attempt to roll back the transaction insert
        await client.from('transactions').delete().match({ id: data.id });
        throw itemsError;
    }
};

export const updateTransaction = async (transaction: Transaction) => {
    const client = getClient();
    const { items, ...transactionData } = transaction;
    
    // 1. Update the main transaction record
    const { error: transactionError } = await client
        .from('transactions')
        .update(transactionData)
        .match({ id: transaction.id });
    
    if (transactionError) throw transactionError;

    // 2. Delete existing line items for this transaction
    const { error: deleteError } = await client
        .from('transaction_line_items')
        .delete()
        .match({ transaction_id: transaction.id });
    
    if (deleteError) throw deleteError;

    // 3. Insert new line items
    if (items.length > 0) {
        const lineItems = items.map(item => ({
            ...item,
            transaction_id: transaction.id,
            unit_price: item.unitPrice
        }));
        const { error: insertError } = await client.from('transaction_line_items').insert(lineItems);
        if (insertError) throw insertError;
    }
};

export const deleteTransaction = async (id: string) => {
    const client = getClient();
    // RLS and CASCADE DELETE on the foreign key will handle deleting line items
    const { error } = await client.from('transactions').delete().match({ id });
    if (error) throw error;
};

export const addCategory = async (name: string, userId: string) => {
    const client = getClient();
    const { error } = await client.from('categories').insert({ name, user_id: userId });
    if (error) throw error;
};

export const deleteCategory = async (name: string, userId: string) => {
    const client = getClient();
    const { error } = await client.from('categories').delete().match({ name, user_id: userId });
    if (error) throw error;
};
