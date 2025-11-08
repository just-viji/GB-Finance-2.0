import React, { useState } from 'react';
import { signInWithGoogle } from '../services/supabase';
import Modal from '../components/Modal';
import TroubleshootingGuide from '../components/TroubleshootingGuide';

const LoginPage: React.FC = () => {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      // You could show a toast or an alert here
      console.error("Login failed", error);
    }
  };

  return (
    <>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-brand-primary">
                    Welcome to GB Finance 2.0
                </h1>
                <p className="text-brand-secondary mt-2">Your simple and powerful sales and expense tracker.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
                <h2 className="text-xl font-semibold text-center text-brand-dark mb-6">Sign In</h2>
                <p className="text-center text-sm text-brand-secondary mb-6">Please sign in with your Google account to continue.</p>
                <button
                    onClick={handleLogin}
                    className="bg-white text-gray-700 font-semibold py-3 px-4 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 flex items-center justify-center gap-3 w-full transition-colors"
                    aria-label="Sign in with Google"
                >
                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                    Sign in with Google
                </button>
                <div className="text-center mt-6">
                    <button 
                    onClick={() => setIsHelpModalOpen(true)}
                    className="text-xs text-brand-secondary hover:text-brand-primary hover:underline"
                    >
                    Having trouble connecting?
                    </button>
                </div>
            </div>
            <p className="text-xs text-gray-400 mt-8">By signing in, you agree to our terms of service.</p>
        </div>
        <Modal
            isOpen={isHelpModalOpen}
            onClose={() => setIsHelpModalOpen(false)}
            title="Supabase Connection Troubleshooting"
        >
            <div className="max-h-[70vh] overflow-y-auto pr-2">
                <TroubleshootingGuide />
            </div>
      </Modal>
    </>
  );
};

export default LoginPage;
