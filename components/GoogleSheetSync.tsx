
import React, { useState, useEffect } from 'react';
import { initGoogleClient, handleSignIn, handleSignOut, createSpreadsheet, syncTransactionsToSheet } from '../services/googleSheetsService';
import { Transaction } from '../types';

interface GoogleSheetSyncProps {
  transactions: Transaction[];
}

const GoogleSheetSync: React.FC<GoogleSheetSyncProps> = ({ transactions }) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [newSheetTitle, setNewSheetTitle] = useState('My Finances');

  useEffect(() => {
    initGoogleClient(setIsSignedIn);
  }, []);

  const handleCreateSheet = async () => {
    if (!newSheetTitle) {
      alert('Please enter a title for the new spreadsheet.');
      return;
    }
    try {
      const response = await createSpreadsheet(newSheetTitle);
      const id = response.result.spreadsheetId;
      if (id) {
        setSpreadsheetId(id);
        alert(`Spreadsheet created with ID: ${id}`);
      }
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      alert('Failed to create spreadsheet.');
    }
  };

  const handleSync = async () => {
    if (!spreadsheetId) {
      alert('Please create or provide a Spreadsheet ID to sync.');
      return;
    }
    try {
      await syncTransactionsToSheet(spreadsheetId, transactions);
      alert('Transactions synced successfully!');
    } catch (error) {
      console.error('Error syncing transactions:', error);
      alert('Failed to sync transactions.');
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md">
      <h2 className="text-white text-lg font-bold mb-4">Google Sheets Sync</h2>
      {isSignedIn ? (
        <div>
          <button onClick={handleSignOut} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded mb-4">
            Sign Out from Google
          </button>
          <div className="flex items-center mb-4">
            <input
              type="text"
              value={newSheetTitle}
              onChange={(e) => setNewSheetTitle(e.target.value)}
              placeholder="New Spreadsheet Title"
              className="bg-gray-700 text-white rounded-l-md p-2 flex-grow"
            />
            <button onClick={handleCreateSheet} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-r-md">
              Create Sheet
            </button>
          </div>
          <div className="flex items-center">
            <input
              type="text"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              placeholder="Enter Spreadsheet ID"
              className="bg-gray-700 text-white rounded-l-md p-2 flex-grow"
            />
            <button onClick={handleSync} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-r-md">
              Sync Now
            </button>
          </div>
        </div>
      ) : (
        <button onClick={handleSignIn} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
          Sign In with Google
        </button>
      )}
    </div>
  );
};

export default GoogleSheetSync;
