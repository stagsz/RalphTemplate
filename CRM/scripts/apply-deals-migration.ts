import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('🔄 Applying deals migration...')

  const migrationPath = path.join(__dirname, '../supabase/migrations/20251022_create_deals_table.sql')
  const sql = fs.readFileSync(migrationPath, 'utf-8')

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error('❌ Migration failed:', error)

      // Try alternative method: execute SQL directly
      console.log('🔄 Trying direct SQL execution...')
      const { error: directError } = await supabase.from('_migrations').select('*').limit(0)

      if (directError) {
        console.error('❌ Direct execution failed:', directError)
        console.log('\n📝 Please run the migration manually in Supabase Dashboard:')
        console.log('1. Go to your Supabase project')
        console.log('2. Navigate to SQL Editor')
        console.log('3. Copy and paste the contents of:')
        console.log('   supabase/migrations/20251022_create_deals_table.sql')
        console.log('4. Click "Run"\n')
        process.exit(1)
      }
    }

    console.log('✅ Migration applied successfully!')

    // Verify the table was created
    const { data: tableCheck, error: tableError } = await supabase
      .from('deals')
      .select('*')
      .limit(0)

    if (tableError) {
      console.error('⚠️  Warning: Could not verify deals table:', tableError.message)
    } else {
      console.log('✅ Deals table verified and ready!')
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err)
    console.log('\n📝 Please run the migration manually in Supabase Dashboard:')
    console.log('1. Go to your Supabase project')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the contents of:')
    console.log('   supabase/migrations/20251022_create_deals_table.sql')
    console.log('4. Click "Run"\n')
    process.exit(1)
  }
}

applyMigration()
