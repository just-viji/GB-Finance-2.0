import React, { useState, useEffect } from 'react';
import { getAppScriptUrl, verifyAppScriptUrl } from '../services/supabase';

interface GoogleSheetSyncProps {
  onConnect: () => void;
  onDisconnect: () => void;
}

const APPS_SCRIPT_CODE = `
// 1. Paste your Google Sheet ID here.
// You can find it in your sheet's URL: https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";

// --- You don't need to change anything below this line ---

const TRANSACTIONS_SHEET = 'Transactions';
const CATEGORIES_SHEET = 'Categories';
const TRANSACTION_HEADERS = ['id', 'type', 'description', 'date', 'category', 'paymentMethod', 'items_json'];
const CATEGORY_HEADERS = ['name'];

function doGet(e) {
  try {
    if (SPREADSHEET_ID === "YOUR_SPREADSHEET_ID_HERE") {
        throw new Error("Please replace 'YOUR_SPREADSHEET_ID_HERE' with your actual Google Sheet ID in the script.");
    }
    setupSheets();
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const title = spreadsheet.getName();
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', title: title }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const requestBody = JSON.parse(e.postData.contents);
    const action = requestBody.action;
    const payload = requestBody.payload;
    let result;

    switch (action) {
      case 'loadData':
        result = loadData();
        break;
      case 'saveTransactions':
        result = saveTransactions(payload);
        break;
      case 'saveCategories':
        result = saveCategories(payload);
        break;
      case 'clearAllData':
        result = clearAllData();
        break;
      default:
        throw new Error("Invalid action specified.");
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log(error);
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: "Script Error: " + error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function loadData() {
  setupSheets();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  const transactionsSheet = ss.getSheetByName(TRANSACTIONS_SHEET);
  const categoriesSheet = ss.getSheetByName(CATEGORIES_SHEET);

  const transactionsData = transactionsSheet.getDataRange().getValues();
  const categoriesData = categoriesSheet.getDataRange().getValues();
  
  let transactions = (transactionsData.length > 1) ? arrayToTransactions(transactionsData) : [];
  let categories = (categoriesData.length > 1) ? categoriesData.slice(1).map(row => row[0]) : [];

  if (transactions.length === 0 && categories.length === 0) {
    const seeded = seedInitialData();
    saveTransactions(seeded.transactions);
    saveCategories(seeded.categories);
    return seeded;
  }
  
  return { transactions, categories };
}

function saveTransactions(transactions) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TRANSACTIONS_SHEET);
  
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  }
  if (transactions && transactions.length > 0) {
    const data = transactionsToArray(transactions);
    sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  }
  return { message: "Transactions saved successfully." };
}

function saveCategories(categories) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(CATEGORIES_SHEET);

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  }
  if (categories && categories.length > 0) {
    const data = categories.map(c => [c]);
    sheet.getRange(2, 1, data.length, 1).setValues(data);
  }
  return { message: "Categories saved successfully." };
}

function clearAllData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const transactionsSheet = ss.getSheetByName(TRANSACTIONS_SHEET);
  const categoriesSheet = ss.getSheetByName(CATEGORIES_SHEET);

  if (transactionsSheet.getLastRow() > 1) {
    transactionsSheet.getRange(2, 1, transactionsSheet.getLastRow() - 1, transactionsSheet.getLastColumn()).clearContent();
  }
  if (categoriesSheet.getLastRow() > 1) {
    categoriesSheet.getRange(2, 1, categoriesSheet.getLastRow() - 1, categoriesSheet.getLastColumn()).clearContent();
  }
  
  const seeded = seedInitialData();
  saveTransactions(seeded.transactions);
  saveCategories(seeded.categories);

  return { message: "All data cleared and reset to initial state." };
}

function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let transactionsSheet = ss.getSheetByName(TRANSACTIONS_SHEET);
  if (!transactionsSheet) {
    transactionsSheet = ss.insertSheet(TRANSACTIONS_SHEET);
    transactionsSheet.getRange(1, 1, 1, TRANSACTION_HEADERS.length).setValues([TRANSACTION_HEADERS]).setFontWeight('bold');
    transactionsSheet.setFrozenRows(1);
  }
  
  let categoriesSheet = ss.getSheetByName(CATEGORIES_SHEET);
  if (!categoriesSheet) {
    categoriesSheet = ss.insertSheet(CATEGORIES_SHEET);
    categoriesSheet.getRange(1, 1, 1, CATEGORY_HEADERS.length).setValues([CATEGORY_HEADERS]).setFontWeight('bold');
    categoriesSheet.setFrozenRows(1);
  }
}

function arrayToTransactions(values) {
  return values.slice(1).map(row => ({
    id: row[0], type: row[1], description: row[2], date: row[3], category: row[4], paymentMethod: row[5], items: JSON.parse(row[6] || '[]'),
  }));
}

function transactionsToArray(transactions) {
  return transactions.map(t => [
    t.id, t.type, t.description, t.date, t.category, t.paymentMethod, JSON.stringify(t.items)
  ]);
}

function seedInitialData() {
  const INITIAL_CATEGORIES = [
    "Salaries & Wages", "Utilities (Electricity, Water)", "Maintenance & Repairs", "Marketing & Advertising", "Guest Supplies (Toiletries, etc.)", "Linen & Laundry", "Food & Beverage Costs", "Administrative Costs", "Property Taxes & Insurance", "Booking Commissions", "Miscellaneous",
  ];
  const sampleTransactions = [
    { type: 'sale', description: 'Room booking - Deluxe Suite', date: new Date(Date.now() - 2 * 86400000).toISOString(), category: 'Sale', paymentMethod: 'Online', items: [{id: '1a', description: 'Room Charge', quantity: 2, unitPrice: 8500}] },
    { type: 'expense', description: 'Guest toiletries order', date: new Date(Date.now() - 3 * 86400000).toISOString(), category: 'Guest Supplies (Toiletries, etc.)', paymentMethod: 'Online', items: [{id: '2a', description: 'Shampoo, Soap, etc.', quantity: 1, unitPrice: 15000}] },
  ];
  const transactionsWithIds = sampleTransactions.map((t, index) => ({
    ...t, id: \`\${new Date().getTime()}-\${index}\`, items: t.items.map((item, itemIndex) => ({...item, id: \`\${new Date().getTime()}-\${index}-\${itemIndex}\`}))
  }));
  return { transactions: transactionsWithIds, categories: INITIAL_CATEGORIES.sort() };
}
`;


const GoogleSheetSync: React.FC<GoogleSheetSyncProps> = ({ onConnect, onDisconnect }) => {
  const [urlInput, setUrlInput] = useState('');
  const [connectedSheetTitle, setConnectedSheetTitle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      setIsLoading(true);
      const currentUrl = getAppScriptUrl();
      if (currentUrl) {
        try {
          const { title } = await verifyAppScriptUrl(currentUrl);
          setConnectedSheetTitle(title);
        } catch (e) {
          setError('Could not connect to the saved Apps Script URL. It may have been redeployed or permissions changed.');
          onDisconnect(); // This clears the bad URL
        }
      }
      setIsLoading(false);
    };
    checkConnection();
  }, [onDisconnect]);

  const handleConnect = async () => {
    const inputValue = urlInput.trim();
    if (!inputValue) {
      setError('Please enter your Google Apps Script Web App URL.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const { title } = await verifyAppScriptUrl(inputValue);
      localStorage.setItem('google-appscript-url', inputValue);
      setConnectedSheetTitle(title);
      onConnect();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect. Check the URL and ensure the script is deployed correctly.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
    setConnectedSheetTitle(null);
    setUrlInput('');
    setError(null);
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE.trim());
    alert('Apps Script code copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md text-center">
         <svg className="animate-spin h-8 w-8 text-brand-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
         <p className="mt-2 text-sm text-brand-secondary">Checking connection...</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-xl font-semibold text-brand-dark mb-2">Data Storage: Google Apps Script</h3>
      
      {connectedSheetTitle ? (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg text-sm">
            <p className="font-semibold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Connected to Sheet: <span className="font-bold">{connectedSheetTitle}</span>
            </p>
          </div>
          <button
            onClick={handleDisconnect}
            className="w-full px-4 py-2 text-sm rounded-md font-semibold bg-red-100 text-red-700 hover:bg-red-200"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-brand-secondary">
            This app uses a private Google Sheet as its database, accessed securely via Google Apps Script. Please follow these steps to connect:
          </p>
          <div className="text-sm text-brand-secondary space-y-3">
            <div>
                <p className="font-semibold">Part A: Create Your Google Sheet</p>
                <ol className="list-decimal list-inside pl-2 space-y-1">
                    <li>Create a new, blank Google Sheet. <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="text-brand-primary underline">Click here to create one.</a></li>
                    <li>Copy the Sheet ID from its URL. The URL looks like: <code className="bg-gray-200 text-gray-800 px-1 rounded">.../spreadsheets/d/SHEET_ID/edit</code>. You will need this ID in Part B.</li>
                    <li><strong>Important:</strong> Unlike the old method, you do NOT need to share this sheet. Keep it private to your account.</li>
                </ol>
            </div>
            <div>
                <p className="font-semibold">Part B: Set Up Google Apps Script</p>
                <ol className="list-decimal list-inside pl-2 space-y-1" start={4}>
                    <li>In your Google Sheet, go to <code className="bg-gray-200 text-gray-800 px-1 rounded">Extensions {'>'} Apps Script</code>.</li>
                    <li>Delete any placeholder code in the <code className="bg-gray-200 text-gray-800 px-1 rounded">Code.gs</code> file and paste in the full script below.</li>
                    <div className="my-2">
                        <textarea readOnly value={APPS_SCRIPT_CODE.trim()} rows={5} className="w-full bg-gray-100 text-xs p-2 rounded-md border border-gray-300"></textarea>
                        <button onClick={copyCodeToClipboard} className="w-full text-center py-1 text-xs font-semibold bg-gray-200 hover:bg-gray-300 rounded-md">Copy Code</button>
                    </div>
                    <li>At the very top of the script, replace <code className="bg-gray-200 text-gray-800 px-1 rounded">"YOUR_SPREADSHEET_ID_HERE"</code> with the ID you copied in step 2.</li>
                    <li>Click the "Save project" icon.</li>
                </ol>
            </div>
             <div>
                <p className="font-semibold">Part C: Deploy & Connect</p>
                <ol className="list-decimal list-inside pl-2 space-y-1" start={8}>
                    <li>Click the blue <strong>"Deploy"</strong> button (top right), then select <strong>"New deployment"</strong>.</li>
                    <li>Click the gear icon next to "Select type" and choose <strong>"Web app"</strong>.</li>
                    <li>For "Execute as", select <strong>"Me"</strong>. For "Who has access", select <strong>"Anyone"</strong>.</li>
                    <li>Click <strong>"Deploy"</strong>. You will need to "Authorize access" for your Google Account the first time.</li>
                    <li>After deploying, copy the <strong>Web app URL</strong>.</li>
                    <li>Paste the URL below and click Connect.</li>
                </ol>
            </div>
          </div>
          {error && <div className="bg-red-100 border border-red-200 text-red-800 p-3 rounded-lg text-sm font-semibold">{error}</div>}
          <div className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste Web App URL here"
              className="flex-grow w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
              aria-label="Google Apps Script Web App URL"
            />
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="px-4 py-2 bg-brand-primary text-white rounded-md font-semibold hover:bg-brand-primary-hover disabled:bg-gray-400"
            >
              Connect
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleSheetSync;
