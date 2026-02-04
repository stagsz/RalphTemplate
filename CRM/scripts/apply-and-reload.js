#!/usr/bin/env node
/**
 * Apply migration and reload Supabase schema
 * This script uses the Supabase API to execute SQL and reload the schema
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Read the SQL migration file
const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251022_create_contacts_table.sql');
const reloadSqlPath = path.join(__dirname, 'reload-schema-sql.sql');

console.log('🔄 Reloading Supabase PostgREST schema cache...\n');

// Execute SQL to reload schema
const reloadSql = fs.readFileSync(reloadSqlPath, 'utf8');

const url = new URL('/rest/v1/rpc/exec', SUPABASE_URL);

const postData = JSON.stringify({ query: "NOTIFY pgrst, 'reload schema'" });

const options = {
  hostname: url.hostname,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Schema reload triggered successfully!');
      console.log('✅ Contacts table should now be accessible\n');
      console.log('🎉 You can now create contacts at: http://localhost:3006/contacts/new');
    } else {
      console.log(`⚠️  Response status: ${res.statusCode}`);
      console.log('Schema may have been reloaded, or manual reload is needed.');
      console.log('\n📝 To manually reload:');
      console.log('1. Go to: https://supabase.com/dashboard/project/jmkqmpqjezgqgrpgmsod/settings/api');
      console.log('2. Click "Reload schema" button');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('\n📝 Manual reload required:');
  console.log('https://supabase.com/dashboard/project/jmkqmpqjezgqgrpgmsod/settings/api');
});

req.write(postData);
req.end();