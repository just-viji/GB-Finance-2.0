import React, { useState, useEffect } from 'react';
import CategoryManager from '../components/CategoryManager';

interface SettingsPageProps {
  categories: string[];
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
  onClearAllData: () => void;
  syncUrl: string;
  onSaveSyncUrl: (url: string) => void;
  onSyncNow: () => Promise<boolean>;
  syncStatus: string;
  lastSyncTimestamp: string | null;
}

const SyncStatusIndicator: React.FC<{status: string, lastSyncTimestamp: string | null}> = ({ status, lastSyncTimestamp }) => {
    let color = 'text-gray-500';
    let text = 'Not configured.';
    let isSyncing = false;

    if(status.startsWith('error:')) {
        color = 'text-red-500';
        text = `Error: ${status.substring(7)}`;
    } else if (status === 'syncing') {
        color = 'text-blue-500';
        text = 'Syncing...';
        isSyncing = true;
    } else if (status === 'success') {
        color = 'text-green-600';
        text = `Synced successfully`;
        if (lastSyncTimestamp) {
            text += ` at ${new Date(lastSyncTimestamp).toLocaleTimeString()}`;
        }
    } else if (status === 'idle' && lastSyncTimestamp) {
        color = 'text-gray-500';
        text = `Idle. Last synced at ${new Date(lastSyncTimestamp).toLocaleTimeString()}`;
    }

    return (
        <div className="flex items-center gap-2 text-sm">
            {isSyncing && <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
            <span className={color}>{text}</span>
        </div>
    );
};


const SettingsPage: React.FC<SettingsPageProps> = ({ 
    categories, 
    onAddCategory, 
    onDeleteCategory, 
    onClearAllData, 
    syncUrl,
    onSaveSyncUrl,
    onSyncNow,
    syncStatus,
    lastSyncTimestamp
}) => {
  const [urlInput, setUrlInput] = useState(syncUrl);

  useEffect(() => {
    setUrlInput(syncUrl);
  }, [syncUrl]);

  const appsScriptCode = `
const SHEET_NAME_TRANSACTIONS = "Transactions";
const SHEET_NAME_CATEGORIES = "Categories";

// Run this function once from the script editor to set up your sheets.
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(SHEET_NAME_TRANSACTIONS)) {
    ss.insertSheet(SHEET_NAME_TRANSACTIONS);
    const transactionsSheet = ss.getSheetByName(SHEET_NAME_TRANSACTIONS);
    const headers = [
      'id', 'type', 'description', 'date', 'category', 'paymentMethod',
      'itemId', 'itemDescription', 'quantity', 'unitPrice'
    ];
    transactionsSheet.appendRow(headers);
    transactionsSheet.getRange("A1:J1").setFontWeight("bold");
    ss.deleteSheet(ss.getSheetByName('Sheet1')); // delete default sheet
  }
  if (!ss.getSheetByName(SHEET_NAME_CATEGORIES)) {
    ss.insertSheet(SHEET_NAME_CATEGORIES);
    const categoriesSheet = ss.getSheetByName(SHEET_NAME_CATEGORIES);
    categoriesSheet.appendRow(['category']);
    categoriesSheet.getRange("A1").setFontWeight("bold");
  }
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const transactionsSheet = ss.getSheetByName(SHEET_NAME_TRANSACTIONS);
    const categoriesSheet = ss.getSheetByName(SHEET_NAME_CATEGORIES);

    if (!transactionsSheet || !categoriesSheet) {
      throw new Error("Please run the 'setup' function from the Apps Script editor first.");
    }

    const transactionsData = transactionsSheet.getDataRange().getValues();
    const categoriesData = categoriesSheet.getDataRange().getValues();

    const transactionHeaders = transactionsData.shift() || [];
    const transactions = transactionsData.map(row => {
      const transactionObj = {};
      transactionHeaders.forEach((header, i) => {
        transactionObj[header] = row[i];
      });
      return transactionObj;
    });

    const groupedTransactions = {};
    transactions.forEach(item => {
      if (!item.id) return;
      if (!groupedTransactions[item.id]) {
        groupedTransactions[item.id] = {
          id: item.id, type: item.type, description: item.description,
          date: item.date, category: item.category, paymentMethod: item.paymentMethod,
          items: []
        };
      }
      groupedTransactions[item.id].items.push({
        id: item.itemId, description: item.itemDescription,
        quantity: parseFloat(item.quantity) || 0,
        unitPrice: parseFloat(item.unitPrice) || 0,
      });
    });

    const finalTransactions = Object.values(groupedTransactions);

    categoriesData.shift(); // remove header
    const finalCategories = categoriesData.map(row => row[0]).filter(Boolean);

    const result = { transactions: finalTransactions, categories: finalCategories };
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(30000); // Wait up to 30 seconds for other processes to finish.

    const data = JSON.parse(e.postData.contents);
    const { transactions, categories } = data;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const transactionsSheet = ss.getSheetByName(SHEET_NAME_TRANSACTIONS);
    const categoriesSheet = ss.getSheetByName(SHEET_NAME_CATEGORIES);
    
    if (!transactionsSheet || !categoriesSheet) {
      throw new Error("Please run the 'setup' function from the Apps Script editor first.");
    }

    transactionsSheet.getRange(2, 1, transactionsSheet.getMaxRows() - 1, transactionsSheet.getMaxColumns()).clearContent();
    categoriesSheet.getRange(2, 1, categoriesSheet.getMaxRows() - 1, categoriesSheet.getMaxColumns()).clearContent();
    
    const transactionRows = [];
    (transactions || []).forEach(t => {
      (t.items || []).forEach(item => {
        transactionRows.push([
          t.id, t.type, t.description, t.date, t.category, t.paymentMethod,
          item.id, item.description, item.quantity, item.unitPrice
        ]);
      });
    });
    if(transactionRows.length > 0) {
       transactionsSheet.getRange(2, 1, transactionRows.length, transactionRows[0].length).setValues(transactionRows);
    }
    
    const categoryRows = (categories || []).map(c => [c]);
    if(categoryRows.length > 0) {
      categoriesSheet.getRange(2, 1, categoryRows.length, 1).setValues(categoryRows);
    }
    
    lock.releaseLock();
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}
`.trim();
  
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-brand-dark">Settings</h2>

      <CategoryManager
        categories={categories}
        onAddCategory={onAddCategory}
        onDeleteCategory={onDeleteCategory}
      />
      
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-2 text-brand-dark">Google Sheets Sync</h2>
        <p className="text-brand-secondary mt-2 mb-4">
          Connect a Google Sheet to use as a real-time database. All your data will be loaded from and saved to this sheet automatically.
        </p>
        <div className="space-y-4">
            <div>
                <label htmlFor="sync-url" className="block text-sm font-medium text-brand-secondary mb-1">Google Apps Script Web App URL</label>
                <div className="flex gap-2">
                    <input 
                        id="sync-url"
                        type="text"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="Paste your deployed web app URL here"
                        className="flex-grow w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
                    />
                    <button onClick={() => onSaveSyncUrl(urlInput)} className="px-4 py-2 bg-brand-primary text-white rounded-md text-sm font-semibold hover:bg-brand-primary-hover">
                        Save
                    </button>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <SyncStatusIndicator status={syncStatus} lastSyncTimestamp={lastSyncTimestamp} />
                <button onClick={onSyncNow} disabled={!syncUrl || syncStatus === 'syncing'} className="px-4 py-2 text-sm rounded-md font-semibold bg-gray-100 text-brand-dark hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed">
                  Force Sync
                </button>
            </div>
        </div>
        <details className="mt-6">
            <summary className="cursor-pointer text-sm font-semibold text-brand-primary hover:text-brand-primary-hover">How to get your Web App URL</summary>
            <div className="mt-2 text-sm text-brand-secondary space-y-2 prose prose-sm max-w-none">
                <ol className="list-decimal pl-5 space-y-2">
                    <li>Create a new Google Sheet at <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">sheets.new</a>.</li>
                    <li>Open the script editor via <strong>Extensions &gt; Apps Script</strong>.</li>
                    <li>Delete any existing code in <code>Code.gs</code> and paste the entire code block below.</li>
                    <li>
                        <div className="my-2">
                            <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-x-auto"><code>{appsScriptCode}</code></pre>
                        </div>
                    </li>
                    <li>Save the script (Ctrl+S or Cmd+S).</li>
                    <li>From the function dropdown at the top, select <strong>setup</strong> and click <strong>Run</strong>. Authorize the script when prompted. This will create the necessary "Transactions" and "Categories" sheets for you.</li>
                    <li>Click the <strong>Deploy</strong> button (top right), then <strong>New deployment</strong>.</li>
                    <li>Click the gear icon next to "Select type" and choose <strong>Web app</strong>.</li>
                    <li>Under "Configuration", give it a description (e.g., "GB Finance Sync").</li>
                    <li>Set "Execute as" to <strong>Me</strong>.</li>
                    <li>Set "Who has access" to <strong>Anyone with Google account</strong> (more secure) or <strong>Anyone</strong>.</li>
                    <li>Click <strong>Deploy</strong>. Authorize again if needed.</li>
                    <li>Copy the provided <strong>Web app URL</strong> and paste it into the input field above.</li>
                </ol>
            </div>
        </details>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-md border border-red-200">
        <h3 className="text-xl font-semibold text-red-600">Danger Zone</h3>
        <p className="text-brand-secondary mt-2 mb-4">
          Clearing all data will permanently delete all local data, clear the linked Google Sheet, and remove the sync URL. This action cannot be undone.
        </p>
        <button
          onClick={onClearAllData}
          className="px-4 py-2 text-sm rounded-md font-semibold bg-brand-accent text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Clear All App Data
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;