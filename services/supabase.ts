import { Transaction } from '../types';
import { INITIAL_CATEGORIES } from '../constants';

const API_KEY = process.env.API_KEY;
const SPREADSHEET_ID_KEY = 'google-sheet-id';
const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

const TRANSACTIONS_SHEET = 'Transactions';
const CATEGORIES_SHEET = 'Categories';
const TRANSACTION_HEADERS = ['id', 'type', 'description', 'date', 'category', 'paymentMethod', 'items_json'];
const CATEGORY_HEADERS = ['name'];

export const getSheetId = (): string | null => localStorage.getItem(SPREADSHEET_ID_KEY);

export const disconnectSheet = (): void => localStorage.removeItem(SPREADSHEET_ID_KEY);

const sheetRequest = async (url: string, options: RequestInit = {}, bypassIdCheck = false): Promise<any> => {
    if (!API_KEY) throw new Error("API Key is not configured in environment variables.");
    
    if (!bypassIdCheck) {
        const sheetId = getSheetId();
        if (!sheetId) {
            throw new Error("Google Sheet ID is not set.");
        }
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error?.message || `Request failed with status ${response.status}`;

            if (errorMessage.includes('API key not valid')) {
                throw new Error('The provided API Key is not valid. Please check your configuration in the Google Cloud Console, and ensure any referrer restrictions are correctly set up for this web app\'s domain.');
            }
            if (errorMessage.includes('API has not been used') || errorMessage.includes('is disabled')) {
                throw new Error('The Google Sheets API has not been enabled for your project. Please enable it in your Google Cloud Console and wait a few minutes before trying again.');
            }
            if (errorMessage.includes('caller does not have permission')) {
                throw new Error('Permission denied. Please make sure the sheet is shared with "Anyone with the link" as an "Editor".');
            }
            if (errorMessage.includes('Not Found')) {
                throw new Error('Google Sheet not found. Please check if the ID or URL is correct.');
            }
            throw new Error(errorMessage);
        }
        return response.json();
    } catch (e) {
        // Re-throw custom errors or provide a generic network error.
        if (e instanceof Error) {
            throw e;
        }
        throw new Error('A network error occurred. Please check your connection.');
    }
};

export const getSheetProperties = async (sheetId: string) => {
    const url = `${BASE_URL}/${sheetId}?key=${API_KEY}`;
    // The third argument `true` bypasses the localStorage sheet ID check, as this is used for the initial connection.
    return sheetRequest(url, {}, true);
};

const seedInitialData = () => {
    const sampleTransactions: Omit<Transaction, 'id'>[] = [
        { type: 'sale', description: 'Room booking - Deluxe Suite', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), category: 'Sale', paymentMethod: 'Online', items: [{id: '1a', description: 'Room Charge', quantity: 2, unitPrice: 8500}] },
        { type: 'expense', description: 'Guest toiletries order', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), category: 'Guest Supplies (Toiletries, etc.)', paymentMethod: 'Online', items: [{id: '2a', description: 'Shampoo, Soap, etc.', quantity: 1, unitPrice: 15000}] },
        { type: 'sale', description: 'Restaurant Dinner - Table 5', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), category: 'Sale', paymentMethod: 'Cash', items: [{id: '3a', description: 'Food & Drinks', quantity: 1, unitPrice: 4500}] },
        { type: 'expense', description: 'Monthly electricity bill', date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), category: 'Utilities (Electricity, Water)', paymentMethod: 'Online', items: [{id: '4a', description: 'Electricity Bill', quantity: 1, unitPrice: 75000}] },
    ];
    
    const transactionsWithIds: Transaction[] = sampleTransactions.map((t, index) => ({
        ...t,
        id: `${new Date().getTime()}-${index}`,
        items: t.items.map((item, itemIndex) => ({...item, id: `${new Date().getTime()}-${index}-${itemIndex}`}))
    }));

    return { transactions: transactionsWithIds, categories: INITIAL_CATEGORIES.sort() };
};

const arrayToTransactions = (values: string[][]): Transaction[] => {
    return values.slice(1).map(row => {
        try {
            return {
                id: row[0],
                type: row[1] as 'sale' | 'expense',
                description: row[2],
                date: new Date(row[3]).toISOString(),
                category: row[4],
                paymentMethod: row[5] as 'Cash' | 'Online',
                items: JSON.parse(row[6] || '[]'),
            };
        } catch (e) {
            console.error("Failed to parse transaction row:", row, e);
            return null;
        }
    }).filter((t): t is Transaction => t !== null);
};

const transactionsToArray = (transactions: Transaction[]): string[][] => {
    return transactions.map(t => [
        t.id,
        t.type,
        t.description,
        t.date,
        t.category,
        t.paymentMethod,
        JSON.stringify(t.items),
    ]);
};

export const loadData = async (): Promise<{ transactions: Transaction[], categories: string[] }> => {
    const sheetId = getSheetId();
    const ranges = [`${TRANSACTIONS_SHEET}!A:G`, `${CATEGORIES_SHEET}!A:A`];
    const url = `${BASE_URL}/${sheetId}/values:batchGet?ranges=${ranges.join('&ranges=')}&key=${API_KEY}`;
    
    const data = await sheetRequest(url);
    const [transactionsResult, categoriesResult] = data.valueRanges;

    let transactions: Transaction[] = [];
    if (!transactionsResult.values || transactionsResult.values.length <= 1) {
        const seeded = seedInitialData();
        await saveTransactions(seeded.transactions);
        transactions = seeded.transactions;
    } else {
        transactions = arrayToTransactions(transactionsResult.values);
    }

    let categories: string[] = [];
    if (!categoriesResult.values || categoriesResult.values.length <= 1) {
        const seeded = seedInitialData();
        await saveCategories(seeded.categories);
        categories = seeded.categories;
    } else {
        categories = categoriesResult.values.slice(1).map((row: string[]) => row[0]).filter(Boolean);
    }
    
    return { transactions, categories };
};

const writeToSheet = async (sheetName: string, headers: string[], data: any[][]) => {
    const sheetId = getSheetId();
    const clearRange = `${sheetName}!A2:Z`;
    const clearUrl = `${BASE_URL}/${sheetId}/values/${clearRange}:clear?key=${API_KEY}`;
    await sheetRequest(clearUrl, { method: 'POST', body: '{}' });

    const values = [headers, ...data];
    const writeUrl = `${BASE_URL}/${sheetId}/values/${sheetName}!A1?valueInputOption=USER_ENTERED&key=${API_KEY}`;
    await sheetRequest(writeUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
    });
};

export const saveTransactions = async (transactions: Transaction[]) => {
    const data = transactionsToArray(transactions);
    await writeToSheet(TRANSACTIONS_SHEET, TRANSACTION_HEADERS, data);
};

export const saveCategories = async (categories: string[]) => {
    const data = categories.map(c => [c]);
    await writeToSheet(CATEGORIES_SHEET, CATEGORY_HEADERS, data);
};

export const clearAllData = async () => {
    const sheetId = getSheetId();
    const clearRequests = {
        requests: [
            {
                updateCells: {
                    range: { sheetId: 0 }, // Assumes first sheet is Transactions
                    fields: "userEnteredValue"
                }
            },
             {
                updateCells: {
                    range: { sheetId: 1 }, // Assumes second sheet is Categories
                    fields: "userEnteredValue"
                }
            }
        ]
    };
    // This is a more robust way to clear, but requires sheet IDs which is another API call.
    // Let's stick to the simpler clear per range.
    const url = `${BASE_URL}/${sheetId}/values:batchClear?key=${API_KEY}`;
    const body = {
      ranges: [`${TRANSACTIONS_SHEET}!A2:Z`, `${CATEGORIES_SHEET}!A2:Z`]
    };
    await sheetRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
};