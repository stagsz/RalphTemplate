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

// Sample data definitions
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

const sampleContacts = [
  // Contacts for sales1 (Sarah Johnson)
  {
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@acmecorp.com',
    phone: '+1-555-0101',
    company: 'Acme Corporation',
    title: 'VP of Engineering',
    status: 'customer' as const,
    custom_fields: { industry: 'Technology', source: 'Referral' }
  },
  {
    first_name: 'Emily',
    last_name: 'Chen',
    email: 'emily.chen@techstart.io',
    phone: '+1-555-0102',
    company: 'TechStart Inc',
    title: 'CTO',
    status: 'lead' as const,
    custom_fields: { industry: 'Software', source: 'Website' }
  },
  {
    first_name: 'Robert',
    last_name: 'Garcia',
    email: 'r.garcia@globalfin.com',
    phone: '+1-555-0103',
    company: 'Global Finance',
    title: 'Director of IT',
    status: 'customer' as const,
    custom_fields: { industry: 'Finance', source: 'Conference' }
  },
  {
    first_name: 'Sarah',
    last_name: 'Miller',
    email: 'smiller@retailplus.com',
    phone: '+1-555-0104',
    company: 'RetailPlus',
    title: 'Head of Operations',
    status: 'lead' as const,
    custom_fields: { industry: 'Retail', source: 'Cold call' }
  },
  // Contacts for sales2 (Mike Williams)
  {
    first_name: 'David',
    last_name: 'Kim',
    email: 'david.kim@innovateai.com',
    phone: '+1-555-0201',
    company: 'InnovateAI',
    title: 'CEO',
    status: 'customer' as const,
    custom_fields: { industry: 'AI/ML', source: 'LinkedIn' }
  },
  {
    first_name: 'Lisa',
    last_name: 'Thompson',
    email: 'lthompson@healthcare.org',
    phone: '+1-555-0202',
    company: 'HealthCare Solutions',
    title: 'CFO',
    status: 'lead' as const,
    custom_fields: { industry: 'Healthcare', source: 'Website' }
  },
  {
    first_name: 'James',
    last_name: 'Wilson',
    email: 'jwilson@buildco.com',
    phone: '+1-555-0203',
    company: 'BuildCo Construction',
    title: 'Project Manager',
    status: 'customer' as const,
    custom_fields: { industry: 'Construction', source: 'Referral' }
  },
  {
    first_name: 'Amanda',
    last_name: 'Brown',
    email: 'abrown@edutech.edu',
    phone: '+1-555-0204',
    company: 'EduTech Academy',
    title: 'Director',
    status: 'lead' as const,
    custom_fields: { industry: 'Education', source: 'Trade show' }
  }
]

const dealTemplates = [
  { title: 'Enterprise License', amount: 50000, stage: 'negotiation' as const, probability: 75 },
  { title: 'Annual Subscription', amount: 12000, stage: 'proposal' as const, probability: 50 },
  { title: 'Consulting Package', amount: 25000, stage: 'closed-won' as const, probability: 100 },
  { title: 'Platform Migration', amount: 75000, stage: 'lead' as const, probability: 20 },
  { title: 'Support Contract', amount: 8000, stage: 'closed-won' as const, probability: 100 },
  { title: 'Custom Development', amount: 35000, stage: 'proposal' as const, probability: 40 },
  { title: 'Training Program', amount: 15000, stage: 'negotiation' as const, probability: 60 },
  { title: 'Integration Project', amount: 45000, stage: 'closed-lost' as const, probability: 0 }
]

const activityTemplates = [
  { type: 'call' as const, subject: 'Discovery call', status: 'completed' as const, priority: 'medium' as const },
  { type: 'meeting' as const, subject: 'Product demo', status: 'completed' as const, priority: 'high' as const },
  { type: 'email' as const, subject: 'Follow-up on proposal', status: 'completed' as const, priority: 'medium' as const },
  { type: 'note' as const, subject: 'Meeting notes', status: 'completed' as const, priority: 'low' as const },
  { type: 'task' as const, subject: 'Send contract', status: 'todo' as const, priority: 'high' as const },
  { type: 'task' as const, subject: 'Schedule follow-up', status: 'in_progress' as const, priority: 'medium' as const },
  { type: 'call' as const, subject: 'Pricing discussion', status: 'todo' as const, priority: 'high' as const },
  { type: 'meeting' as const, subject: 'Stakeholder presentation', status: 'todo' as const, priority: 'high' as const }
]

// Helper to get a date in the past or future
function getRelativeDate(daysOffset: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysOffset)
  return date.toISOString()
}

async function seedUsers(): Promise<Map<string, string>> {
  console.log('Creating sample users...')
  const userIdMap = new Map<string, string>()

  for (const user of sampleUsers) {
    // Check if user already exists
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', user.email)
      .limit(1)

    if (existingUsers && existingUsers.length > 0) {
      console.log(`⏭️  User ${user.email} already exists, skipping...`)
      userIdMap.set(user.email, existingUsers[0].id)
      continue
    }

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

    userIdMap.set(user.email, authData.user.id)
    console.log(`✅ Created user: ${user.email}`)
  }

  return userIdMap
}

async function seedContacts(userIdMap: Map<string, string>): Promise<Map<string, string>> {
  console.log('\nCreating sample contacts...')
  const contactIdMap = new Map<string, string>()

  const sales1Id = userIdMap.get('sales1@example.com')
  const sales2Id = userIdMap.get('sales2@example.com')

  if (!sales1Id || !sales2Id) {
    console.error('Sales users not found, skipping contacts')
    return contactIdMap
  }

  for (let i = 0; i < sampleContacts.length; i++) {
    const contact = sampleContacts[i]

    // Check if contact already exists
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', contact.email)
      .is('deleted_at', null)
      .limit(1)

    if (existing && existing.length > 0) {
      console.log(`⏭️  Contact ${contact.email} already exists, skipping...`)
      contactIdMap.set(contact.email, existing[0].id)
      continue
    }

    // First 4 contacts belong to sales1, rest to sales2
    const ownerId = i < 4 ? sales1Id : sales2Id

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        ...contact,
        owner_id: ownerId
      })
      .select('id')
      .single()

    if (error) {
      console.error(`Error creating contact ${contact.email}:`, error.message)
      continue
    }

    contactIdMap.set(contact.email, data.id)
    console.log(`✅ Created contact: ${contact.first_name} ${contact.last_name} (${contact.company})`)
  }

  return contactIdMap
}

async function seedDeals(
  userIdMap: Map<string, string>,
  contactIdMap: Map<string, string>
): Promise<Map<string, string>> {
  console.log('\nCreating sample deals...')
  const dealIdMap = new Map<string, string>()

  const contactEmails = Array.from(contactIdMap.keys())

  for (let i = 0; i < dealTemplates.length; i++) {
    const template = dealTemplates[i]
    const contactEmail = contactEmails[i % contactEmails.length]
    const contactId = contactIdMap.get(contactEmail)

    if (!contactId) continue

    // Determine owner based on contact owner
    const ownerId = i < 4
      ? userIdMap.get('sales1@example.com')
      : userIdMap.get('sales2@example.com')

    if (!ownerId) continue

    // Check if deal already exists
    const { data: existing } = await supabase
      .from('deals')
      .select('id')
      .eq('title', template.title)
      .eq('contact_id', contactId)
      .is('deleted_at', null)
      .limit(1)

    if (existing && existing.length > 0) {
      console.log(`⏭️  Deal "${template.title}" already exists, skipping...`)
      dealIdMap.set(`${contactEmail}-${template.title}`, existing[0].id)
      continue
    }

    // Set expected close date based on stage
    let expectedCloseDate: string | null = null
    if (template.stage === 'lead') {
      expectedCloseDate = getRelativeDate(60).split('T')[0]
    } else if (template.stage === 'proposal') {
      expectedCloseDate = getRelativeDate(30).split('T')[0]
    } else if (template.stage === 'negotiation') {
      expectedCloseDate = getRelativeDate(14).split('T')[0]
    }

    const { data, error } = await supabase
      .from('deals')
      .insert({
        title: template.title,
        amount: template.amount,
        stage: template.stage,
        probability: template.probability,
        expected_close_date: expectedCloseDate,
        contact_id: contactId,
        owner_id: ownerId,
        description: `${template.title} deal with ${contactEmail.split('@')[0]}`
      })
      .select('id')
      .single()

    if (error) {
      console.error(`Error creating deal "${template.title}":`, error.message)
      continue
    }

    dealIdMap.set(`${contactEmail}-${template.title}`, data.id)
    console.log(`✅ Created deal: ${template.title} ($${template.amount.toLocaleString()})`)
  }

  return dealIdMap
}

async function seedActivities(
  userIdMap: Map<string, string>,
  contactIdMap: Map<string, string>,
  dealIdMap: Map<string, string>
): Promise<void> {
  console.log('\nCreating sample activities...')

  const contactEmails = Array.from(contactIdMap.keys())
  const dealKeys = Array.from(dealIdMap.keys())

  for (let i = 0; i < activityTemplates.length; i++) {
    const template = activityTemplates[i]
    const contactEmail = contactEmails[i % contactEmails.length]
    const contactId = contactIdMap.get(contactEmail)
    const dealKey = dealKeys[i % dealKeys.length]
    const dealId = dealIdMap.get(dealKey)

    // Determine owner
    const ownerId = i < 4
      ? userIdMap.get('sales1@example.com')
      : userIdMap.get('sales2@example.com')

    if (!ownerId || !contactId) continue

    // Check if activity already exists
    const { data: existing } = await supabase
      .from('activities')
      .select('id')
      .eq('subject', template.subject)
      .eq('contact_id', contactId)
      .is('deleted_at', null)
      .limit(1)

    if (existing && existing.length > 0) {
      console.log(`⏭️  Activity "${template.subject}" already exists, skipping...`)
      continue
    }

    // Set due date for tasks
    let dueDate: string | null = null
    let completedAt: string | null = null
    if (template.type === 'task') {
      if (template.status === 'todo') {
        dueDate = getRelativeDate(7)
      } else if (template.status === 'in_progress') {
        dueDate = getRelativeDate(3)
      }
    }
    if (template.status === 'completed') {
      completedAt = getRelativeDate(-2)
    }

    const { error } = await supabase
      .from('activities')
      .insert({
        type: template.type,
        subject: template.subject,
        status: template.status,
        priority: template.priority,
        contact_id: contactId,
        deal_id: dealId,
        owner_id: ownerId,
        assigned_to: ownerId,
        due_date: dueDate,
        completed_at: completedAt,
        description: `${template.subject} for ${contactEmail.split('@')[0]}`,
        duration_minutes: template.status === 'completed' ? Math.floor(Math.random() * 60) + 15 : null
      })

    if (error) {
      console.error(`Error creating activity "${template.subject}":`, error.message)
      continue
    }

    console.log(`✅ Created activity: ${template.type} - ${template.subject}`)
  }
}

async function seed() {
  console.log('🌱 Starting database seed...\n')

  try {
    // Step 1: Create users
    const userIdMap = await seedUsers()

    // Step 2: Create contacts
    const contactIdMap = await seedContacts(userIdMap)

    // Step 3: Create deals
    const dealIdMap = await seedDeals(userIdMap, contactIdMap)

    // Step 4: Create activities
    await seedActivities(userIdMap, contactIdMap, dealIdMap)

    console.log('\n✅ Seed completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   Users: ${userIdMap.size}`)
    console.log(`   Contacts: ${contactIdMap.size}`)
    console.log(`   Deals: ${dealIdMap.size}`)
    console.log(`   Activities: ${activityTemplates.length}`)
    console.log('\n🔑 Test credentials:')
    console.log('   Admin: admin@example.com / admin123')
    console.log('   User 1: sales1@example.com / sales123')
    console.log('   User 2: sales2@example.com / sales123')

  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

seed()
