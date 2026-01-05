
import React, { useState } from 'react';

interface ConfirmDeleteAllDataProps {
    onConfirm: () => void;
    onClose: () => void;
}

const ConfirmDeleteAllData: React.FC<ConfirmDeleteAllDataProps> = ({ onConfirm, onClose }) => {
    const [inputValue, setInputValue] = useState('');
    const isMatch = inputValue === 'DELETE';

    return (
        <div>
            <p className="mb-4 text-brand-secondary">
                To confirm, please type <strong>DELETE</strong> in the box below. This action cannot be undone.
            </p>
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
                placeholder="Type DELETE to confirm"
                autoFocus
            />
            <div className="mt-6 flex flex-row-reverse gap-3 pt-4 border-t border-gray-200">
                <button
                    onClick={onConfirm}
                    disabled={!isMatch}
                    className="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 w-auto sm:text-sm transition-colors bg-brand-accent hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Permanently Delete
                </button>
                <button
                    onClick={onClose}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default ConfirmDeleteAllData;
