-- Trigger PostgREST schema reload
NOTIFY pgrst, 'reload schema';

-- Verify contacts table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'contacts'
) as contacts_table_exists;

-- Check RLS policies on contacts
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'contacts';