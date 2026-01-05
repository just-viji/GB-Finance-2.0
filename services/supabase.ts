
import { createClient, Session, User } from '@supabase/supabase-js';
import { Transaction } from '../types';
import { INITIAL_CATEGORIES } from '../constants';

const DEMO_USER_ID = 'demo-user-123';
const DEMO_STORAGE_KEY_DATA = 'gb_demo_data';
const DEMO_STORAGE_KEY_CATS = 'gb_demo_cats';
const DEMO_STORAGE_KEY_MODE = 'gb_demo_mode';
const APP_SCRIPT_URL_KEY = 'gb_app_script_url';

const supabaseUrl = process.env.SUPABASE_URL || 'https://kogthqnbbuturocmpvnz.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_2dtOYDPfCbSOxtaW4MO3yA_wKSsuDeQ';

const supabase = createClient(supabaseUrl, supabaseKey);

let demoSession: Session | null = null;
const observers: ((session: Session | null) => void)[] = [];

if (typeof window !== 'undefined' && localStorage.getItem(DEMO_STORAGE_KEY_MODE) === 'true') {
    demoSession = {
        user: { id: DEMO_USER_ID, email: 'demo@example.com' } as User,
        access_token: 'fake-jwt-token',
        refresh_token: 'fake-refresh-token',
        expires_in: 3600,
        token_type: 'bearer'
    };
}

const notifyObservers = (session: Session | null) => {
    observers.forEach(cb => cb(session));
};

// Fix: Added getAppScriptUrl to retrieve the stored Google Apps Script Web App URL from local storage.
export const getAppScriptUrl = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(APP_SCRIPT_URL_KEY);
};

// Fix: Added saveAppScriptUrl to persist the Google Apps Script Web App URL to local storage.
export const saveAppScriptUrl = (url: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(APP_SCRIPT_URL_KEY, url);
    }
};

// Fix: Added verifyAppScriptUrl to validate the Google Apps Script connection by fetching and parsing the response JSON.
export const verifyAppScriptUrl = async (url: string): Promise<{ title: string }> => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Connection failed with status: ${response.status}`);
        }
        const data = await response.json();
        if (data.status === 'success') {
            return { title: data.title };
        }
        throw new Error(data.message || 'Verification failed');
    } catch (e: any) {
        throw new Error(`Apps Script connection failed: ${e.message}`);
    }
};

export const signUpNewUser = (email, password) => supabase.auth.signUp({ email, password });

export const signInWithPassword = async (email, password) => {
    if (email === 'demo@example.com' && password === 'demo123') {
        localStorage.setItem(DEMO_STORAGE_KEY_MODE, 'true');
        demoSession = {
            user: { id: DEMO_USER_ID, email: 'demo@example.com' } as User,
            access_token: 'fake-jwt-token',
            refresh_token: 'fake-refresh-token',
            expires_in: 3600,
            token_type: 'bearer'
        };
        notifyObservers(demoSession);
        return { data: { user: demoSession.user, session: demoSession }, error: null };
    }
    return supabase.auth.signInWithPassword({ email, password });
};

export const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
    });
    return { data, error };
};

export const updateUserPassword = async (password: string) => {
    if (demoSession) return { error: { message: "Disabled in Demo Mode." } };
    return supabase.auth.updateUser({ password, data: { password_set: true } });
};

export const signOut = async () => {
    if (demoSession) {
        localStorage.removeItem(DEMO_STORAGE_KEY_MODE);
        demoSession = null;
        notifyObservers(null);
        return { error: null };
    }
    return supabase.auth.signOut();
};

export const deleteUserAccount = async () => {
    const userId = await getUserId();
    if (!userId) throw new Error("Access Denied: Unauthenticated.");

    // Wipe related tables first
    await clearAllData();
    
    // Note: auth.users deletion typically requires an edge function. 
    // This logs out the user after wiping their data identity.
    return signOut();
};

export const onAuthStateChange = (callback: (session: Session | null) => void) => {
    observers.push(callback);
    if (demoSession) callback(demoSession);
    else supabase.auth.getSession().then(({ data: { session } }) => { if (!demoSession) callback(session); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!demoSession) callback(session);
    });

    return {
        unsubscribe: () => {
            subscription.unsubscribe();
            const idx = observers.indexOf(callback);
            if (idx > -1) observers.splice(idx, 1);
        }
    };
};

const handleSupabaseError = (error: any, context: string) => {
    if (error) {
        console.error(`Error in ${context}:`, error);
        throw new Error(`DB Fault: ${error.message}`);
    }
};

const getUserId = async (): Promise<string | null> => {
    if (demoSession) return DEMO_USER_ID;
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
}

export const loadData = async (): Promise<{ transactions: Transaction[], categories: string[] }> => {
    const userId = await getUserId();
    if (!userId) return { transactions: [], categories: [] };

    if (userId === DEMO_USER_ID) {
        const storedTx = localStorage.getItem(DEMO_STORAGE_KEY_DATA);
        const storedCats = localStorage.getItem(DEMO_STORAGE_KEY_CATS);
        return { 
            transactions: storedTx ? JSON.parse(storedTx) : [], 
            categories: (storedCats ? JSON.parse(storedCats) : INITIAL_CATEGORIES).sort() 
        };
    }

    const { data: txData } = await supabase.from('transactions').select('*').eq('user_id', userId);
    const { data: catData } = await supabase.from('categories').select('name').eq('user_id', userId);

    const transactions = (txData as Transaction[] || []);
    const categories = catData?.map(c => c.name) || INITIAL_CATEGORIES;
    return { transactions, categories: categories.sort() };
};

export const saveTransactions = async (transactions: Transaction[]) => {
    const userId = await getUserId();
    if (!userId) throw new Error("Auth Denied.");
    if (userId === DEMO_USER_ID) {
        localStorage.setItem(DEMO_STORAGE_KEY_DATA, JSON.stringify(transactions));
        return;
    }
    const { error: delError } = await supabase.from('transactions').delete().eq('user_id', userId);
    handleSupabaseError(delError, 'cleanup');
    if (transactions.length > 0) {
        const toInsert = transactions.map(t => ({ ...t, user_id: userId, created_at: t.created_at || new Date().toISOString() }));
        const { error: insError } = await supabase.from('transactions').insert(toInsert);
        handleSupabaseError(insError, 'storage');
    }
};

export const saveCategories = async (categories: string[]) => {
    const userId = await getUserId();
    if (!userId) throw new Error("Auth Denied.");
    if (userId === DEMO_USER_ID) {
        localStorage.setItem(DEMO_STORAGE_KEY_CATS, JSON.stringify(categories));
        return;
    }
    const { error: delError } = await supabase.from('categories').delete().eq('user_id', userId);
    handleSupabaseError(delError, 'cleanup');
    if (categories.length > 0) {
        const toInsert = categories.map(name => ({ name, user_id: userId }));
        const { error: insError } = await supabase.from('categories').insert(toInsert);
        handleSupabaseError(insError, 'storage');
    }
};

export const clearAllData = async () => {
    const userId = await getUserId();
    if (!userId) throw new Error("Auth Denied.");
    await saveTransactions([]);
    await saveCategories([]);
};
