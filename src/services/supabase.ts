import { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { Transaction } from '../types';
import { supabase } from '../integrations/supabase/client';

// --- Auth Wrappers ---
export const getSession = () => {
    return supabase.auth.getSession();
}

export const onAuthStateChange = (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
    return supabase.auth.onAuthStateChange(callback);
}

export const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
    });
    if (error) {
        console.error('Error signing in with Google:', error);
        throw error;
    }
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error signing out:', error);
        throw error;
    }
};

// --- Data Fetching ---
export const getInitialData = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error("User not authenticated.");

    const [transactionsRes, categoriesRes] = await Promise.all([
        supabase.from('transactions').select('*, items:transaction_line_items(*)').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('categories').select('name').eq('user_id', user.id).order('name', { ascending: true }),
    ]);

    if (transactionsRes.error) throw transactionsRes.error;
    if (categoriesRes.error) throw categoriesRes.error;

    const transactions = transactionsRes.data?.map(t => ({
        ...t,
        items: t.items.map((i: any) => ({ ...i, unitPrice: i.unit_price })) // Map snake_case to camelCase
    })) || [];

    let categories = categoriesRes.data?.map(c => c.name) || [];
    
    // Add default categories if user has none
    if (categories.length === 0) {
        const { data: defaultCategories, error } = await supabase.from('default_categories').select('name');
        if (error) console.error("Error fetching default categories", error);
        if (defaultCategories) {
            const newCategories = defaultCategories.map(c => ({ name: c.name, user_id: user.id }));
            const { error: insertError } = await supabase.from('categories').insert(newCategories);
            if (insertError) console.error("Error inserting default categories for user", insertError);
            categories.push(...defaultCategories.map(c => c.name));
        }
    }
    
    return { transactions, categories };
};

// --- Data Mutation ---

export const addTransaction = async (transaction: Transaction) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error("User not authenticated.");

    const { items, ...transactionData } = transaction;

    const { data, error } = await supabase
        .from('transactions')
        .insert({ ...transactionData, user_id: user.id })
        .select()
        .single();
    
    if (error) throw error;
    
    const lineItems = items.map(item => ({
        ...item,
        transaction_id: data.id,
        user_id: user.id,
        unit_price: item.unitPrice
    }));

    const { error: itemsError } = await supabase.from('transaction_line_items').insert(lineItems);
    
    if (itemsError) {
        // Attempt to roll back the transaction insert
        await supabase.from('transactions').delete().match({ id: data.id });
        throw itemsError;
    }
};

export const updateTransaction = async (transaction: Transaction) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error("User not authenticated.");

    const { items, ...transactionData } = transaction;
    
    // 1. Update the main transaction record
    const { error: transactionError } = await supabase
        .from('transactions')
        .update(transactionData)
        .match({ id: transaction.id, user_id: user.id });
    
    if (transactionError) throw transactionError;

    // 2. Delete existing line items for this transaction
    const { error: deleteError } = await supabase
        .from('transaction_line_items')
        .delete()
        .match({ transaction_id: transaction.id, user_id: user.id });
    
    if (deleteError) throw deleteError;

    // 3. Insert new line items
    if (items.length > 0) {
        const lineItems = items.map(item => ({
            ...item,
            transaction_id: transaction.id,
            user_id: user.id,
            unit_price: item.unitPrice
        }));
        const { error: insertError } = await supabase.from('transaction_line_items').insert(lineItems);
        if (insertError) throw insertError;
    }
};

export const deleteTransaction = async (id: string) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error("User not authenticated.");
    
    // RLS and CASCADE DELETE on the foreign key will handle deleting line items
    const { error } = await supabase.from('transactions').delete().match({ id, user_id: user.id });
    if (error) throw error;
};

export const addCategory = async (name: string, userId: string) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user || user.id !== userId) throw new Error("Unauthorized category operation.");
    const { error } = await supabase.from('categories').insert({ name, user_id: userId });
    if (error) throw error;
};

export const deleteCategory = async (name: string, userId: string) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user || user.id !== userId) throw new Error("Unauthorized category operation.");
    const { error } = await supabase.from('categories').delete().match({ name, user_id: userId });
    if (error) throw error;
};