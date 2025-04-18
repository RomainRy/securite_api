// filepath: c:\Users\romai\Desktop\Cours\securite_api\config\supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_KEY must be defined in the .env file');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
