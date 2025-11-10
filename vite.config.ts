import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // This is the host from your browser's URL, needed for HMR to work in this cloud environment
    const host = '3001-firebase-gb-finance-20git-1762799655236.cluster-fdkw7vjj7bgguspe3fbbc25tra.cloudworkstations.dev';

    return {
      server: {
        port: 3001,
        host: '0.0.0.0',
        hmr: {
          protocol: 'wss',
          host: host,
          clientPort: 443,
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(env.REACT_APP_SUPABASE_URL),
        'process.env.REACT_APP_SUPABASE_ANON_KEY': JSON.stringify(env.REACT_APP_SUPABASE_ANON_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
