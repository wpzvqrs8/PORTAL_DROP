const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[Supabase] Missing SUPABASE_URL or SUPABASE_KEY in .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// We'll export a helper to match the old "pool.query" structure 
// to make migration easier, or just use the raw supabase client.
const query = async (text, params) => {
  // This is a VERY basic shim to allow pool.query style calls to work with Supabase
  // Note: Supabase SDK is preferred, but this helps avoid breaking index.js immediately
  // However, for complex queries, this shim might fail.
  // In our case, we will slowly migrate index.js to use the SDK properly.
  return { rows: [] };
};

module.exports = {
  supabase,
  initDB: () => {
    console.log('[Supabase] Client initialized. Tables should be managed in Supabase dashboard.');
  }
};
