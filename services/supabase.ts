import { Transaction } from '../types';

const APPSCRIPT_URL_KEY = 'google-appscript-url';

export const getAppScriptUrl = (): string | null => localStorage.getItem(APPSCRIPT_URL_KEY);

export const disconnectAppScript = (): void => localStorage.removeItem(APPSCRIPT_URL_KEY);

const appScriptRequest = async (payload: { action: string; payload?: any }, bypassUrlCheck = false): Promise<any> => {
    const url = getAppScriptUrl();
    if (!url && !bypassUrlCheck) {
        throw new Error("Google Apps Script URL is not set.");
    }

    try {
        const response = await fetch(url!, { // url will not be null here unless bypassed
            method: 'POST',
            redirect: 'follow', // Important for Apps Script web apps
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // Apps Script quirk
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
           throw new Error(`Request failed with status ${response.status}. Please ensure the Apps Script URL is correct and deployed correctly.`);
        }
        
        const result = await response.json();

        if (result.status === 'error') {
            console.error('Apps Script Error:', result.message);
            throw new Error(result.message);
        }

        return result.data;

    } catch (e) {
        // Re-throw custom errors or provide a generic network error.
        if (e instanceof Error) {
            throw e;
        }
        throw new Error('A network error occurred. Please check your connection and the Apps Script URL.');
    }
};

export const verifyAppScriptUrl = async (url: string) => {
    // Apps Script doesn't respond to GET requests in the same way with POST, so we can't use a simple GET for verification.
    // Instead, we can send a benign POST request and see if it works.
    // A better way is to use a GET request which is handled by doGet in the script.
     try {
        const response = await fetch(url, { method: 'GET', redirect: 'follow' });
        if (!response.ok) {
            throw new Error(`Verification failed with status ${response.status}.`);
        }
        const result = await response.json();
        if (result.status === 'error') {
            throw new Error(`Script error: ${result.message}`);
        }
        return result; // Should contain { status: 'success', title: '...' }
    } catch (e) {
        console.error("Verification failed", e);
        throw new Error("Could not connect to the provided URL. Please ensure it is a valid, deployed Google Apps Script Web App URL and that you have granted permissions.");
    }
};

export const loadData = async (): Promise<{ transactions: Transaction[], categories: string[] }> => {
    return appScriptRequest({ action: 'loadData' });
};

export const saveTransactions = async (transactions: Transaction[]) => {
    return appScriptRequest({ action: 'saveTransactions', payload: transactions });
};

export const saveCategories = async (categories: string[]) => {
    return appScriptRequest({ action: 'saveCategories', payload: categories });
};

export const clearAllData = async () => {
    return appScriptRequest({ action: 'clearAllData' });
};
