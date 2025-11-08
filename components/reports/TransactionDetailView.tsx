import React from 'react';
import { Transaction } from '../../types';
import { calculateTotalAmount } from '../../utils/transactionUtils';

interface TransactionDetailViewProps {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
}

const TransactionDetailView: React.FC<TransactionDetailViewProps> = ({ transaction, onEdit, onDelete }) => {
  const { type, description, date, category, paymentMethod, items } = transaction;
  const totalAmount = calculateTotalAmount(items);
  const isSale = type === 'sale';

  const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-brand-dark">{value}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-start">
          <p className="font-bold text-lg text-brand-dark pr-4">{description}</p>
          <p className={`font-bold text-lg flex-shrink-0 ${isSale ? 'text-green-600' : 'text-red-600'}`}>
            {isSale ? '+' : '-'} {totalAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <DetailItem label="Type" value={<span className={`font-semibold px-2 py-0.5 rounded-full ${isSale ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>} />
        <DetailItem label="Date" value={new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
        <DetailItem label="Category" value={category} />
        <DetailItem label="Payment Method" value={paymentMethod} />
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Line Items</p>
        <ul className="border border-gray-200 rounded-lg divide-y divide-gray-200">
          {items.map(item => (
            <li key={item.id} className="flex justify-between items-start p-3 text-sm">
              <div>
                <p className="font-medium text-brand-dark">{item.description}</p>
                <p className="text-brand-secondary">{item.quantity} x {item.unitPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
              </div>
              <p className="font-semibold text-brand-dark flex-shrink-0 pl-4">{(item.quantity * item.unitPrice).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6 flex flex-row-reverse gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onEdit}
            className="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 w-auto sm:text-sm transition-colors bg-brand-primary hover:bg-brand-primary-hover"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
          >
            Delete
          </button>
        </div>
    </div>
  );
};

export default TransactionDetailView;