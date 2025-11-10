import { gapi } from 'gapi-script';
import { Transaction } from '../types';

// Values from .env file
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

/**
 * Initializes the Google API client.
 * @param callback Function to execute after client is initialized.
 */
export const initGoogleClient = (updateSigninStatus: (isSignedIn: boolean) => void) => {
  console.log("Starting Google Client initialization...");
  if (!API_KEY || !CLIENT_ID) {
    console.error("Google API Key or Client ID is missing. Make sure it's in your .env file and the server was restarted.");
    alert("Google API Key or Client ID is missing. Check console for details.");
    return;
  }

  const initClient = () => {
    console.log("gapi.client trying to init...");
    gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES,
    }).then(() => {
      console.log("gapi.client initialized successfully.");
      const authInstance = gapi.auth2.getAuthInstance();
      // Listen for sign-in state changes.
      authInstance.isSignedIn.listen(updateSigninStatus);
      // Handle the initial sign-in state.
      updateSigninStatus(authInstance.isSignedIn.get());
    }).catch(error => {
        console.error("Error initializing Google client. Check your API Key, Client ID, and Google Cloud project settings (like authorized URIs).", error);
        alert("Error initializing Google client. See the browser console for more details.");
    });
  };

  console.log("Loading gapi.client:auth2...");
  gapi.load('client:auth2', initClient);
};


/**
 * Signs the user in with Google.
 */
export const handleSignIn = () => {
  gapi.auth2.getAuthInstance().signIn();
};

/**
 * Signs the user out.
 */
export const handleSignOut = () => {
  gapi.auth2.getAuthInstance().signOut();
};


/**
 * Creates a new spreadsheet.
 * @param title The title of the spreadsheet.
 */
export const createSpreadsheet = (title: string): Promise<gapi.client.Response<gapi.client.sheets.Spreadsheet>> => {
    return gapi.client.sheets.spreadsheets.create({
        properties: {
            title: title,
        }
    });
};


/**
 * Syncs transactions to a Google Sheet. Creates a header row if the sheet is new.
 * @param spreadsheetId The ID of the spreadsheet.
 * @param transactions The list of transactions to sync.
 */
export const syncTransactionsToSheet = async (spreadsheetId: string, transactions: Transaction[]) => {
  const sheetName = 'Transactions';
  const range = `${sheetName}!A1`;

  const header = [
    'ID', 'Date', 'Type', 'Category', 'Amount', 'Payment Method', 
    'Description', 'Merchant', 'Item Name', 'Item Category', 'Item Price', 'Item Quantity'
  ];

  const values = transactions.flatMap(t => {
      if (!t.items || t.items.length === 0) {
          return [[
              t.id, t.date, t.type, t.category, t.amount, t.paymentMethod,
              t.description, t.merchant, '', '', '', ''
          ]];
      }
      return t.items.map((item, index) => (
          index === 0 ? [
              t.id, t.date, t.type, t.category, t.amount, t.paymentMethod,
              t.description, t.merchant, item.name, item.category, item.price, item.quantity
          ] : [
              '', '', '', '', '', '', '', '', // Don't repeat transaction info for subsequent items
              item.name, item.category, item.price, item.quantity
          ]
      ));
  });

  // Prepend header to the values
  const dataToWrite = [header, ...values];

  const body = {
    values: dataToWrite,
  };

  return gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId,
    range: range,
    valueInputOption: 'USER_ENTERED',
    resource: body,
  });
};
