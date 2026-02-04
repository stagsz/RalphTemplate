import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ContactForm from '@/components/contacts/ContactForm'

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  // Fetch contact
  const { data: contact, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !contact) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href={`/contacts/${id}`}
            className="text-sm text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Contact
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Contact</h1>
          <p className="mt-2 text-sm text-gray-600">
            Update contact information for {contact.first_name} {contact.last_name}
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <ContactForm
            mode="edit"
            contactId={id}
            initialData={{
              first_name: contact.first_name,
              last_name: contact.last_name,
              email: contact.email,
              phone: contact.phone || '',
              company: contact.company || '',
              title: contact.title || '',
              status: contact.status,
              custom_fields: contact.custom_fields
                ? Object.entries(contact.custom_fields).map(([key, value]) => ({
                    key,
                    value: String(value)
                  }))
                : []
            }}
          />
        </div>
      </div>
    </div>
  )
}