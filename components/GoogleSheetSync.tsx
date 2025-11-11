import React, { useState, useEffect } from 'react';

// Mock functions for Google Sheets API interaction
// In a real app, these would use the Google Sheets API client library and OAuth
const mockConnectToSheet = async (url: string): Promise<{ sheetTitle: string }> => {
  console.log(`Connecting to Google Sheet at: ${url}`);
  if (!url || !url.startsWith('https://docs.google.com/spreadsheets/')) {
    throw new Error('Invalid Google Sheet URL.');
  }
  return new Promise(resolve => setTimeout(() => resolve({ sheetTitle: 'My Finance Tracker Sheet' }), 1500));
};

const mockSyncData = async (data: any): Promise<void> => {
  console.log('Syncing data...', data);
  // Simulate a network request
  return new Promise(resolve => setTimeout(() => {
    console.log('Sync complete!');
    resolve();
  }, 2000));
};

const GoogleSheetSync = () => {
  const [sheetUrl, setSheetUrl] = useState('');
  const [connectedSheet, setConnectedSheet] = useState<{ url: string; title: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    // Load connection state from localStorage on mount
    const savedSheet = localStorage.getItem('google-sheet-sync');
    if (savedSheet) {
      setConnectedSheet(JSON.parse(savedSheet));
    }
  }, []);

  const handleConnect = async () => {
    if (!sheetUrl) {
      setError('Please enter a Google Sheet URL.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { sheetTitle } = await mockConnectToSheet(sheetUrl);
      const connectionInfo = { url: sheetUrl, title: sheetTitle };
      setConnectedSheet(connectionInfo);
      localStorage.setItem('google-sheet-sync', JSON.stringify(connectionInfo));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('google-sheet-sync');
    setConnectedSheet(null);
    setSheetUrl('');
    setError(null);
  };
  
  const handleSync = async () => {
    if (!connectedSheet) return;
    setIsSyncing(true);
    setSyncSuccess(null);
    try {
        // In a real app, we would get this from the global state or props
        const transactions = JSON.parse(localStorage.getItem('gb-finance-transactions') || '[]');
        const categories = JSON.parse(localStorage.getItem('gb-finance-categories') || '[]');
        await mockSyncData({ transactions, categories });
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(null), 3000); // Reset after 3 seconds
    } catch (e) {
        setSyncSuccess(false);
        setTimeout(() => setSyncSuccess(null), 3000); // Reset after 3 seconds
    } finally {
        setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-xl font-semibold text-brand-dark mb-2">Data Storage & Sync</h3>
      <p className="text-brand-secondary mb-4 text-sm">
        Connect a Google Sheet to back up and sync your transaction data. This provides a way to keep your data safe.
      </p>

      {connectedSheet ? (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg text-sm">
            <p className="font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                Connected to Google Sheet:
            </p>
            <a href={connectedSheet.url} target="_blank" rel="noopener noreferrer" className="underline break-all ml-7">{connectedSheet.title}</a>
          </div>
          <div className="flex gap-2">
            <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex-1 px-4 py-2 text-sm rounded-md font-semibold bg-brand-primary text-white hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-colors"
            >
             {isSyncing ? (
                 <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Syncing...</span>
                 </>
             ) : (
                 'Sync Now'
             )}
            </button>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 text-sm rounded-md font-semibold bg-gray-200 text-brand-dark hover:bg-gray-300"
            >
              Disconnect
            </button>
          </div>
            {syncSuccess === true && <p className="text-sm text-green-600">Sync successful!</p>}
            {syncSuccess === false && <p className="text-sm text-red-600">Sync failed. Please try again.</p>}
        </div>
      ) : (
        <div className="space-y-3">
            {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded-md">{error}</p>}
          <input
            type="url"
            value={sheetUrl}
            onChange={(e) => { setSheetUrl(e.target.value); setError(null); }}
            placeholder="Paste your Google Sheet URL here"
            className="w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
            disabled={isLoading}
            aria-label="Google Sheet URL"
          />
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full px-4 py-2 rounded-md font-semibold bg-brand-primary text-white hover:bg-brand-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
                 <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Connecting...</span>
                 </>
            ) : (
                'Connect to Google Sheets'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleSheetSync;
