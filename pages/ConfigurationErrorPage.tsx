import React from 'react';

const ConfigurationErrorPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 text-center">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-lg">
            <svg className="w-16 h-16 mx-auto text-red-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h1 className="text-2xl font-bold text-brand-dark mb-2">
                Database Not Configured
            </h1>
            <p className="text-brand-secondary">
                This application cannot start because it's not connected to a Supabase database.
            </p>
            <div className="mt-6 text-left bg-gray-50 p-4 rounded-md border border-gray-200">
                <p className="font-semibold text-brand-dark">Action Required:</p>
                <p className="text-sm text-gray-600">To fix this, you must provide the following Supabase credentials as environment variables:</p>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-2 font-mono">
                    <li><code>SUPABASE_URL</code></li>
                    <li><code>SUPABASE_ANON_KEY</code></li>
                </ul>
                <p className="text-sm text-gray-600 mt-4">You can find these keys in your Supabase project dashboard under <strong>Project Settings &gt; API</strong>.</p>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="font-semibold text-sm text-brand-dark">Important Note</p>
                    <p className="text-xs text-gray-500">
                       If you have already set these environment variables, you may need to redeploy the application for the changes to take effect.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ConfigurationErrorPage;