import React, { useState } from 'react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate network request
    setTimeout(() => {
      // Hardcoded credentials for demonstration
      if (username === 'admin' && password === 'password') {
        onLoginSuccess();
      } else {
        setError('Invalid username or password.');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
            <div className="inline-block bg-brand-primary p-4 rounded-full">
                 <svg className="w-10 h-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            </div>
          <h1 className="text-3xl font-bold text-brand-dark mt-4">GB Finance 2.0</h1>
          <p className="text-brand-secondary">Please sign in to continue</p>
        </div>
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-md space-y-6">
          
          {error && <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm font-semibold">{error}</div>}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-brand-secondary mb-1">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-3 focus:ring-brand-primary focus:border-brand-primary"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-brand-secondary mb-1">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-3 focus:ring-brand-primary focus:border-brand-primary"
              placeholder="password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-md hover:bg-brand-primary-hover transition-colors shadow-sm hover:shadow-md disabled:bg-gray-400 disabled:cursor-wait flex items-center justify-center gap-2"
          >
             {isLoading && (
                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
             )}
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
         <p className="text-center text-xs text-gray-400 mt-6">
            Demo Credentials - Username: <span className="font-semibold">admin</span>, Password: <span className="font-semibold">password</span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;