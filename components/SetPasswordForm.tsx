
import React, { useState } from 'react';
import { updateUserPassword } from '../services/supabase';

interface SetPasswordFormProps {
  onSuccess: () => void;
  onSkip?: () => void;
}

const SetPasswordForm: React.FC<SetPasswordFormProps> = ({ onSuccess, onSkip }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await updateUserPassword(password);
      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        You've signed in with Google. Please set a password for your account to ensure you can access it via email/password in the future.
      </p>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm font-semibold border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary shadow-sm"
            placeholder="Minimum 6 characters"
            required
            minLength={6}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <input 
            type="password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary shadow-sm"
            placeholder="Re-enter password"
            required
            minLength={6}
          />
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            {onSkip && (
                <button
                    type="button"
                    onClick={onSkip}
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                >
                    Skip for now
                </button>
            )}
            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-2 bg-brand-primary text-white font-bold rounded-md hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary shadow-sm disabled:opacity-50"
            >
                {isLoading ? 'Saving...' : 'Set Password'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default SetPasswordForm;
