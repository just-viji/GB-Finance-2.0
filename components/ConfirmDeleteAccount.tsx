
import React, { useState } from 'react';

interface ConfirmDeleteAccountProps {
    onConfirm: () => void;
    onClose: () => void;
    isLoading?: boolean;
}

const ConfirmDeleteAccount: React.FC<ConfirmDeleteAccountProps> = ({ onConfirm, onClose, isLoading }) => {
    const [inputValue, setInputValue] = useState('');
    const REQUIRED_TEXT = 'DELETE MY ACCOUNT';
    const isMatch = inputValue === REQUIRED_TEXT;

    return (
        <div className="fixed inset-0 bg-black/60 z-[200] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all p-8" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 border border-red-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h3 className="text-xl font-black text-brand-dark text-center mb-2 uppercase tracking-tight">Delete Account?</h3>
                <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
                    This action will permanently wipe <strong className="text-red-600">all your financial history</strong>, categories, and settings. This cannot be undone.
                </p>

                <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-center">To confirm, type the phrase below</p>
                        <p className="text-center font-mono font-bold text-brand-dark select-none">{REQUIRED_TEXT}</p>
                    </div>

                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="w-full bg-white border border-gray-300 text-brand-dark rounded-lg p-3 focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none text-center font-bold"
                        placeholder="Type the phrase here"
                        autoFocus
                        disabled={isLoading}
                    />
                </div>

                <div className="mt-8 flex flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={!isMatch || isLoading}
                        className="w-full py-4 bg-red-600 text-white font-black rounded-lg shadow-lg hover:bg-red-700 transition-all active:scale-[0.98] disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Wiping Data...
                            </>
                        ) : 'Permanently Delete My Account'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full py-3 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Keep My Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteAccount;
