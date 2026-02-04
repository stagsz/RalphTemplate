/**
 * Script to reload Supabase PostgREST schema cache
 * Run this after creating new tables or modifying the database schema
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function reloadSchema() {
  console.log('🔄 Reloading Supabase schema cache...')

  try {
    // Execute NOTIFY command to reload schema
    const { error } = await supabase.rpc('notify_pgrst_reload')

    if (error) {
      // Try alternative method using raw SQL
      console.log('Trying alternative method via SQL query...')
      const { error: sqlError } = await supabase
        .from('contacts')
        .select('count')
        .limit(0)

      if (sqlError && sqlError.code === 'PGRST205') {
        console.error('❌ Schema cache not refreshed yet.')
        console.error('Please manually reload via Supabase Dashboard:')
        console.error('https://supabase.com/dashboard/project/jmkqmpqjezgqgrpgmsod/settings/api')
        console.error('Click "Reload schema" button under PostgREST Configuration')
        process.exit(1)
      } else if (!sqlError) {
        console.log('✅ Schema cache appears to be updated!')
        console.log('✅ Contacts table is now accessible')
      }
    } else {
      console.log('✅ Schema reload triggered successfully!')
    }

    console.log('\nTesting contacts table access...')
    const { data, error: testError } = await supabase
      .from('contacts')
      .select('count')
      .limit(0)

    if (testError) {
      if (testError.code === 'PGRST205') {
        console.error('❌ Contacts table still not in schema cache')
        console.error('Manual reload required - see instructions above')
        process.exit(1)
      } else {
        console.error('⚠️  Unexpected error:', testError.message)
      }
    } else {
      console.log('✅ Contacts table is accessible!')
      console.log('✅ You can now create contacts')
    }

  } catch (error) {
    console.error('❌ Error reloading schema:', error)
    process.exit(1)
  }
}

reloadSchema()
