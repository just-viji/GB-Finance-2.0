import { createClient } from '@supabase/supabase-js';

const supabaseUrl = https://azxgslenqdvnmvqzkhqi.supabase.co;
const supabaseAnonKey = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6eGdzbGVucWR2bm12cXpraHFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNTcwNDUsImV4cCI6MjA3NzYzMzA0NX0.YF6JBkmSb4flONLHudhjtqtsjWoGxOWW2ScXZTBqtRI;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is not set in environment variables.');
  // This error will be caught by ConfigurationErrorPage
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);