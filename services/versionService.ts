
import { createClient } from '@supabase/supabase-js';
import { AppRelease } from '../types';

const supabaseUrl = process.env.SUPABASE_URL || 'https://kogthqnbbuturocmpvnz.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_2dtOYDPfCbSOxtaW4MO3yA_wKSsuDeQ';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetches the latest release info from the 'app_releases' table.
 * Assumes the table has 'version', 'download_url', and 'release_notes'.
 */
export const getLatestRelease = async (): Promise<AppRelease | null> => {
  try {
    const { data, error } = await supabase
      .from('app_releases')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // PGRST116: No rows found
      // 42P01: Relation (table) does not exist
      // We also check for the specific "schema cache" error message from Supabase/PostgREST
      const isMissingTable = 
        error.code === 'PGRST116' || 
        error.code === '42P01' || 
        error.message?.includes('schema cache') || 
        error.message?.includes('could not find');

      if (isMissingTable) {
        console.debug(`App releases table not yet configured: ${error.message}`);
        return null; 
      }
      throw error;
    }

    return data as AppRelease;
  } catch (err: any) {
    // If it's a known missing table error handled above, we already returned null.
    // This catch handles other network or connectivity errors.
    const msg = err?.message || String(err);
    if (!msg.includes('schema cache') && !msg.includes('app_releases')) {
        console.error("Failed to fetch latest release:", msg);
    }
    return null;
  }
};

/**
 * Compares two version strings (e.g., "2.0.5" and "2.0.6").
 * Returns true if the latest version is higher than the current version.
 */
export const isUpdateAvailable = (currentVersion: string, latestVersion: string): boolean => {
  const currentParts = currentVersion.split('.').map(Number);
  const latestParts = latestVersion.split('.').map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const current = currentParts[i] || 0;
    const latest = latestParts[i] || 0;
    if (latest > current) return true;
    if (latest < current) return false;
  }
  return false;
};
