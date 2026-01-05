
import { Transaction, TransactionLineItem, TransactionType, PaymentMethod } from '../types';

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
    'Item Line Total',
    'Created At'
  ];

  const csvRows = [headers.join(',')];

  // Helper to escape CSV values
  const escapeCsv = (val: string | number) => {
    let str = String(val);
    // Escape double quotes by doubling them
    str = str.replace(/"/g, '""');
    // If the string contains a comma, a newline, or a double quote, wrap it in double quotes
    if (str.search(/("|,|\n)/g) >= 0) {
      str = `"${str}"`;
    }
    return str;
  };

  // Flatten the data: one row per line item
  for (const transaction of sortedTransactions) {
    for (const item of transaction.items) {
      const row = [
        escapeCsv(transaction.id),
        new Date(transaction.date).toLocaleDateString('en-CA'), // YYYY-MM-DD format
        escapeCsv(transaction.type), // 'income' or 'expense'
        escapeCsv(transaction.description),
        escapeCsv(transaction.category),
        escapeCsv(transaction.paymentMethod),
        escapeCsv(item.description),
        item.quantity,
        item.unitPrice,
        item.quantity * item.unitPrice,
        escapeCsv(transaction.created_at || transaction.date)
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
    link.setAttribute('download', `personal-budget-export-${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const parseCsvRow = (row: string): string[] => {
  const values: string[] = [];
  let currentVal = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && i < row.length - 1 && row[i + 1] === '"') {
        currentVal += '"';
        i++; // Skip the second quote in a pair
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(currentVal);
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  values.push(currentVal);
  return values.map(v => v.trim());
};

export const importTransactionsFromCSV = (csvString: string): Transaction[] => {
  // Robustly split CSV into lines, handling newlines inside quoted fields.
  const normalizedCsv = csvString.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < normalizedCsv.length; i++) {
    const char = normalizedCsv[i];
    currentLine += char;

    if (char === '"') {
      if (inQuotes && i + 1 < normalizedCsv.length && normalizedCsv[i + 1] === '"') {
        currentLine += '"';
        i++; 
      } else {
        inQuotes = !inQuotes;
      }
    }

    if (char === '\n' && !inQuotes) {
      lines.push(currentLine.trim());
      currentLine = '';
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  if (lines.length < 2) {
    throw new Error("CSV file is empty or has no data rows.");
  }

  const headers = parseCsvRow(lines[0].trim());
  const expectedHeadersOld = [
    'Transaction ID', 'Date', 'Type', 'Overall Description', 'Category',
    'Payment Method', 'Item Description', 'Item Quantity', 'Item Unit Price', 'Item Line Total'
  ];
  const expectedHeadersNew = [...expectedHeadersOld, 'Created At'];
  
  if(headers[0].charCodeAt(0) === 0xFEFF) {
    headers[0] = headers[0].substring(1);
  }

  const isNewFormat = headers.length === expectedHeadersNew.length && headers.every((h, i) => h.trim() === expectedHeadersNew[i]);
  const isOldFormat = headers.length === expectedHeadersOld.length && headers.every((h, i) => h.trim() === expectedHeadersOld[i]);

  if (!isNewFormat && !isOldFormat) {
    console.error('CSV Header mismatch.');
    throw new Error("CSV headers do not match the expected format. Please use a file exported from this app.");
  }

  const transactionsMap = new Map<string, Transaction>();
  const itemRows = lines.slice(1);

  for (const row of itemRows) {
    if (!row.trim()) continue;

    const values = parseCsvRow(row);
    if ((isNewFormat && values.length !== expectedHeadersNew.length) || (isOldFormat && values.length !== expectedHeadersOld.length)) {
       continue;
    }

    const transactionId = values[0];
    if (!transactionId) continue;

    if (!transactionsMap.has(transactionId)) {
      let type = values[2].toLowerCase() as string;
      const paymentMethod = values[5] as PaymentMethod;

      // Legacy support: map 'sale' to 'income'
      if (type === 'sale') type = 'income';

      if (type !== 'income' && type !== 'expense') {
        console.warn(`Invalid transaction type found in CSV row: ${type}. Skipping.`);
        continue;
      }
      // Note: Payment method validation can be strict or loose. We keep strict here.
      if (paymentMethod !== 'Cash' && paymentMethod !== 'Online') {
        // Fallback for case sensitivity or new methods if added later
        // console.warn(`Invalid payment method found in CSV row: ${paymentMethod}. Skipping.`);
      }

      const dateString = values[1];
      const dateParts = dateString.split('-').map(Number);
      if (dateParts.length !== 3) continue;
      const [year, month, day] = dateParts;
      const transactionDate = new Date(year, month - 1, day, 12, 0, 0);

      let createdAt: string;
      if (isNewFormat) {
          const createdAtString = values[10];
          createdAt = createdAtString && !isNaN(Date.parse(createdAtString)) ? new Date(createdAtString).toISOString() : transactionDate.toISOString();
      } else {
          createdAt = transactionDate.toISOString();
      }

      const newTransaction: Transaction = {
        id: transactionId,
        date: transactionDate.toISOString(),
        type: type as TransactionType,
        description: values[3],
        category: values[4],
        paymentMethod: paymentMethod,
        items: [],
        created_at: createdAt,
      };
      transactionsMap.set(transactionId, newTransaction);
    }

    const quantity = parseFloat(values[7]);
    const unitPrice = parseFloat(values[8]);

    if (isNaN(quantity) || isNaN(unitPrice)) continue;

    const currentTransaction = transactionsMap.get(transactionId)!;
    const newItem: TransactionLineItem = {
      id: `${transactionId}-${currentTransaction.items.length}`,
      description: values[6],
      quantity: quantity,
      unitPrice: unitPrice,
    };
    currentTransaction.items.push(newItem);
  }

  return Array.from(transactionsMap.values());
};
