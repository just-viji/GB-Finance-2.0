import React, { useState, useEffect } from 'react';
import { getSheetId, getSheetProperties } from '../services/supabase';

interface GoogleSheetSyncProps {
  onConnect: () => void;
  onDisconnect: () => void;
}

const GoogleSheetSync: React.FC<GoogleSheetSyncProps> = ({ onConnect, onDisconnect }) => {
  const [sheetId, setSheetId] = useState('');
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
    if (!sheetId) {
      setError('Please enter a Google Sheet ID.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const properties = await getSheetProperties(sheetId);
      localStorage.setItem('google-sheet-id', sheetId);
      setConnectedSheetTitle(properties.properties.title);
      onConnect();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect. Check Sheet ID and permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
    setConnectedSheetTitle(null);
    setSheetId('');
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
              Connected to: <span className="font-bold underline">{connectedSheetTitle}</span>
            </p>
          </div>
          <button
              onClick={handleDisconnect}
              className="w-full px-4 py-2 text-sm rounded-md font-semibold bg-gray-200 text-brand-dark hover:bg-gray-300"
            >
              Disconnect
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      ) : (
        <div className="space-y-4">
            <p className="text-brand-secondary text-sm">
                This app uses a Google Sheet as its database. Please follow these steps to connect:
            </p>
            <ol className="list-decimal list-inside text-sm text-brand-secondary space-y-1 bg-gray-50 p-3 rounded-md">
                <li>Create a new, blank Google Sheet in your Google account.</li>
                <li>Click the "Share" button (top right).</li>
                <li>Under "General access", change "Restricted" to <span className="font-semibold">"Anyone with the link"</span>.</li>
                <li>Change the role from "Viewer" to <span className="font-semibold">"Editor"</span>. This is required to save data.</li>
                <li>Copy the Sheet ID from the URL (e.g., the long string in `.../d/SHEET_ID/edit`).</li>
                <li>Paste the ID below and click Connect.</li>
            </ol>
            {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded-md">{error}</p>}
            <div className="flex gap-2 items-center">
                <input
                    type="text"
                    value={sheetId}
                    onChange={(e) => { setSheetId(e.target.value); setError(null); }}
                    placeholder="Paste your Google Sheet ID here"
                    className="flex-grow w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
                    disabled={isLoading}
                    aria-label="Google Sheet ID"
                />
                <button
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-md font-semibold bg-brand-primary text-white hover:bg-brand-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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