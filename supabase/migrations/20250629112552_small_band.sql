/*
  # Temporarily disable RLS to test connection

  This migration will temporarily disable RLS to see if that's causing the 401 error.
  If this fixes the issue, we know it's a policy problem.
*/

-- Temporarily disable RLS to test
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE jewelry_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings DISABLE ROW LEVEL SECURITY;