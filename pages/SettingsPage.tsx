import React from 'react';
import GoogleSheetSync from '../components/GoogleSheetSync';
import { Transaction } from '../types';

interface SettingsPageProps {
  transactions: Transaction[];
}

const SettingsPage: React.FC<SettingsPageProps> = ({ transactions }) => {
  return (
    <div>
      <h1>Settings</h1>
      <GoogleSheetSync transactions={transactions} />
    </div>
  );
};

export default SettingsPage;
