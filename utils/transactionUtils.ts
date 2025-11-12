import { Transaction, TransactionLineItem } from '../types';

export const calculateTotalAmount = (items: TransactionLineItem[]): number => {
  if (!items || items.length === 0) {
    return 0;
  }
  return items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
};

export const exportTransactionsToCSV = (transactions: Transaction[]) => {
  if (transactions.length === 0) {
    alert('No transactions to export.');
    return;
  }

  // Sort transactions by date in ascending order for a chronological export
  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const headers = [
    'Transaction ID',
    'Date',
    'Type',
    'Overall Description',
    'Category',
    'Payment Method',
    'Item Description',
    'Item Quantity',
    'Item Unit Price',
    'Item Line Total'
  ];

  const csvRows = [headers.join(',')];

  // Helper to escape CSV values
  const escapeCsv = (val: string | number) => {
    if (typeof val === 'string') {
      const str = val.replace(/"/g, '""'); // Escape double quotes
      return `"${str}"`;
    }
    return val;
  };

  // Flatten the data: one row per line item
  for (const transaction of sortedTransactions) {
    for (const item of transaction.items) {
      const row = [
        escapeCsv(transaction.id),
        new Date(transaction.date).toLocaleDateString('en-CA'), // YYYY-MM-DD format
        escapeCsv(transaction.type),
        escapeCsv(transaction.description),
        escapeCsv(transaction.category),
        escapeCsv(transaction.paymentMethod),
        escapeCsv(item.description),
        item.quantity,
        item.unitPrice,
        item.quantity * item.unitPrice
      ];
      csvRows.push(row.join(','));
    }
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `gb-finance-export-${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};