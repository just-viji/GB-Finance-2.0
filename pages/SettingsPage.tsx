import React from 'react';
import CategoryManager from '../components/CategoryManager';
import { Transaction } from '../types';

// Helper function to escape strings for SQL
const escapeSqlString = (str: string | null | undefined): string => {
    if (str === null || str === undefined) {
        return 'NULL';
    }
    return `'${String(str).replace(/'/g, "''")}'`;
};

// Helper function to trigger file download
const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};


interface SettingsPageProps {
    categories: string[];
    transactions: Transaction[];
    onAddCategory: (category: string) => void;
    onDeleteCategory: (category: string) => void;
    onClearAllData: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
    categories,
    transactions,
    onAddCategory,
    onDeleteCategory,
    onClearAllData,
}) => {
    // Exclude 'Sale' category from being managed by the user as it's a special system category
    const userManagedCategories = categories.filter(c => c !== 'Sale');

    const handleExportSql = () => {
        let sql = `
-- GB Finance 2.0 SQL Export
-- Generated on: ${new Date().toISOString()}

-- Drop tables if they exist to prevent errors on re-import
DROP TABLE IF EXISTS transaction_items;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS categories;

-- Create categories table
CREATE TABLE categories (
    name VARCHAR(255) PRIMARY KEY
);

-- Insert categories
`;
        categories.forEach(cat => {
            sql += `INSERT INTO categories (name) VALUES (${escapeSqlString(cat)});\n`;
        });

        sql += `
-- Create transactions table
CREATE TABLE transactions (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(50),
    description TEXT,
    date DATETIME,
    category VARCHAR(255),
    paymentMethod VARCHAR(50),
    FOREIGN KEY (category) REFERENCES categories(name)
);

-- Create transaction_items table
CREATE TABLE transaction_items (
    id VARCHAR(255) PRIMARY KEY,
    transaction_id VARCHAR(255),
    description TEXT,
    quantity REAL,
    unitPrice REAL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

-- Insert transactions and items
`;
        transactions.forEach(t => {
            sql += `INSERT INTO transactions (id, type, description, date, category, paymentMethod) VALUES (${escapeSqlString(t.id)}, ${escapeSqlString(t.type)}, ${escapeSqlString(t.description)}, ${escapeSqlString(t.date)}, ${escapeSqlString(t.category)}, ${escapeSqlString(t.paymentMethod)});\n`;
            t.items.forEach(item => {
                sql += `INSERT INTO transaction_items (id, transaction_id, description, quantity, unitPrice) VALUES (${escapeSqlString(item.id)}, ${escapeSqlString(t.id)}, ${escapeSqlString(item.description)}, ${item.quantity}, ${item.unitPrice});\n`;
            });
        });

        downloadFile(sql, 'gb-finance-export.sql', 'application/sql');
    };

    const handleExportCsv = (type: 'transactions' | 'items' | 'categories') => {
        const headers: string[] = [];
        let rows: string[][] = [];
        let fileName = 'gb-finance-export.csv';

        const escapeCsvCell = (cell: any): string => {
            const str = String(cell);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
        
        const arrayToCsv = (headerRow: string[], dataRows: string[][]): string => {
             return [headerRow.join(','), ...dataRows.map(row => row.join(','))].join('\n');
        }

        if (type === 'categories') {
            fileName = 'gb-finance-categories.csv';
            headers.push('category_name');
            rows = categories.map(cat => [escapeCsvCell(cat)]);
        } else if (type === 'transactions') {
            fileName = 'gb-finance-transactions.csv';
            headers.push('id', 'type', 'description', 'date', 'category', 'payment_method');
            rows = transactions.map(t => [
                escapeCsvCell(t.id),
                escapeCsvCell(t.type),
                escapeCsvCell(t.description),
                escapeCsvCell(t.date),
                escapeCsvCell(t.category),
                escapeCsvCell(t.paymentMethod)
            ]);
        } else if (type === 'items') {
             fileName = 'gb-finance-transaction-items.csv';
             headers.push('item_id', 'transaction_id', 'description', 'quantity', 'unit_price');
             rows = transactions.flatMap(t => 
                t.items.map(item => [
                    escapeCsvCell(item.id),
                    escapeCsvCell(t.id),
                    escapeCsvCell(item.description),
                    escapeCsvCell(item.quantity),
                    escapeCsvCell(item.unitPrice)
                ])
             );
        }

        const csvContent = arrayToCsv(headers, rows);
        downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;');
    };

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <CategoryManager 
                categories={userManagedCategories}
                onAddCategory={onAddCategory}
                onDeleteCategory={onDeleteCategory}
            />

            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-brand-dark">Data Management</h2>
                <div className="space-y-3">
                    <p className="text-sm text-brand-secondary">Export your data for backup or use in other applications.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       <button onClick={handleExportSql} className="w-full text-center bg-gray-100 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-200">
                           Export as SQL
                       </button>
                        <button onClick={() => handleExportCsv('transactions')} className="w-full text-center bg-gray-100 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-200">
                           Export Transactions (CSV)
                       </button>
                       <button onClick={() => handleExportCsv('items')} className="w-full text-center bg-gray-100 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-200">
                           Export Items (CSV)
                       </button>
                       <button onClick={() => handleExportCsv('categories')} className="w-full text-center bg-gray-100 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-200">
                           Export Categories (CSV)
                       </button>
                    </div>
                </div>
                <div className="mt-6 pt-6 border-t border-red-200">
                     <p className="text-sm text-brand-secondary">Permanently remove all transactions and categories from this device. <span className="font-semibold text-red-600">This action cannot be undone.</span></p>
                    <button 
                        onClick={onClearAllData}
                        className="mt-3 w-full bg-red-100 py-2 px-4 border border-red-300 rounded-md shadow-sm text-sm font-semibold text-red-700 hover:bg-red-200"
                    >
                       Clear All Data
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
