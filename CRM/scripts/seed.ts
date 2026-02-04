import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seed() {
  console.log('🌱 Starting database seed...\n')

  try {
    // Create sample users
    console.log('Creating sample users...')
    const sampleUsers = [
      {
        email: 'admin@example.com',
        password: 'admin123',
        full_name: 'Admin User',
        role: 'admin'
      },
      {
        email: 'sales1@example.com',
        password: 'sales123',
        full_name: 'Sarah Johnson',
        role: 'user'
      },
      {
        email: 'sales2@example.com',
        password: 'sales123',
        full_name: 'Mike Williams',
        role: 'user'
      }
    ]

    for (const user of sampleUsers) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name
        }
      })

      if (authError) {
        console.error(`Error creating user ${user.email}:`, authError.message)
        continue
      }

      // Update role if needed
      if (user.role === 'admin') {
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: 'admin', full_name: user.full_name })
          .eq('id', authData.user.id)

        if (updateError) {
          console.error(`Error updating role for ${user.email}:`, updateError.message)
        }
      }

      console.log(`✅ Created user: ${user.email}`)
    }

    console.log('\n✅ Seed completed successfully!')
    console.log('\nTest credentials:')
    console.log('Admin: admin@example.com / admin123')
    console.log('User 1: sales1@example.com / sales123')
    console.log('User 2: sales2@example.com / sales123')

  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

seed()
