-- Update test@example.com to be an admin for testing purposes
UPDATE public.users
SET role = 'admin'
WHERE email = 'test@example.com';
