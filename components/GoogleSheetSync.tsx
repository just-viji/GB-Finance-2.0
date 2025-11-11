import React, { useState, useEffect } from 'react';
import { getSheetId, getSheetProperties } from '../services/supabase';

interface GoogleSheetSyncProps {
  onConnect: () => void;
  onDisconnect: () => void;
}

const GoogleSheetSync: React.FC<GoogleSheetSyncProps> = ({ onConnect, onDisconnect }) => {
  const [sheetIdInput, setSheetIdInput] = useState('');
  const [connectedSheetTitle, setConnectedSheetTitle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      setIsLoading(true);
      const currentSheetId = getSheetId();
      if (currentSheetId) {
        try {
          const properties = await getSheetProperties(currentSheetId);
          setConnectedSheetTitle(properties.properties.title);
        } catch (e) {
          setError('Could not connect to the saved sheet. It may have been deleted or permissions changed.');
          onDisconnect(); // This clears the bad ID
        }
      }
      setIsLoading(false);
    };
    checkConnection();
  }, [onDisconnect]);

  const handleConnect = async () => {
    const inputValue = sheetIdInput.trim();
    if (!inputValue) {
      setError('Please enter a Google Sheet ID or URL.');
      return;
    }
    
    let extractedId = inputValue;
    const match = inputValue.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      extractedId = match[1];
    }

    setIsLoading(true);
    setError(null);
    try {
      const properties = await getSheetProperties(extractedId);
      localStorage.setItem('google-sheet-id', extractedId);
      setConnectedSheetTitle(properties.properties.title);
      onConnect();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect. Check Sheet ID/URL and permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
    setConnectedSheetTitle(null);
    setSheetIdInput('');
    setError(null);
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
      <h3 className="text-xl font-semibold text-brand-dark mb-2">Data Storage: Google Sheets</h3>
      
      {connectedSheetTitle ? (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg text-sm">
            <p className="font-semibold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Connected to: <span className="font-bold">{connectedSheetTitle}</span>
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
            This app uses a Google Sheet as its database. Please follow these steps to connect:
          </p>
          <div className="text-sm text-brand-secondary space-y-3">
            <div>
                <p className="font-semibold">Part A: Configure Google Cloud Project</p>
                <ol className="list-decimal list-inside pl-2 space-y-1">
                    <li>Go to your Google Cloud Console and create or select a project.</li>
                    <li>Enable the <strong>Google Sheets API</strong> for your project.</li>
                    <li>Create an API Key. <strong>Important:</strong> For security, you must restrict the key.
                        <ul className="list-disc list-inside pl-4">
                            <li>Under API restrictions, select "Google Sheets API".</li>
                            <li>Under Application restrictions, select "HTTP referrers" and add your web app's domain.</li>
                        </ul>
                    </li>
                </ol>
            </div>
            <div>
                <p className="font-semibold">Part B: Configure Google Sheet</p>
                <ol className="list-decimal list-inside pl-2 space-y-1" start={4}>
                    <li>Create a new, blank Google Sheet in your Google account.</li>
                    <li>Click the "Share" button (top right).</li>
                    <li>Under "General access", change "Restricted" to "<strong>Anyone with the link</strong>".</li>
                    <li>Change the role from "Viewer" to "<strong>Editor</strong>". This is required to save data.</li>
                </ol>
            </div>
             <div>
                <p className="font-semibold">Part C: Connect App</p>
                <ol className="list-decimal list-inside pl-2" start={8}>
                    <li>Paste the ID or the full sheet URL below and click Connect.</li>
                </ol>
            </div>
          </div>
          {error && <div className="bg-red-100 border border-red-200 text-red-800 p-3 rounded-lg text-sm font-semibold">{error}</div>}
          <div className="flex gap-2">
            <input
              type="text"
              value={sheetIdInput}
              onChange={(e) => setSheetIdInput(e.target.value)}
              placeholder="Google Sheet ID or URL"
              className="flex-grow w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
              aria-label="Google Sheet ID or URL"
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