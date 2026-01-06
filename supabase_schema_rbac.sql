
-- Step 2.1: Create profiles table for RBAC
-- This table stores public user data and roles.
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY, -- This will be the Firebase UID
  email TEXT,
  role TEXT NOT NULL DEFAULT 'user'
);

-- Enable RLS for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile.
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (id = auth.uid()::text);

-- Policy: Users can update their own profile.
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (id = auth.uid()::text);


-- Modify the projects table to use the profiles table
-- This assumes you have already run the previous SQL script.
-- We will change user_id to be a foreign key to the profiles table.
-- First, drop the old RLS policies on 'projects' that use user_id directly if they exist
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;

-- Now, update the user_id column type and add the foreign key constraint
-- Note: This will fail if you have existing data where user_id does not match a profile.
-- It's best to run this on a clean slate.
-- ALTER TABLE projects DROP COLUMN IF EXISTS user_id; -- Be careful with this on existing data
-- ALTER TABLE projects ADD COLUMN user_id TEXT REFERENCES profiles(id);

-- Re-create RLS policies for 'projects' that reference the profiles table's user_id
-- This is a more robust way to check ownership.
CREATE POLICY "Users can view their own projects"
ON projects FOR SELECT
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create their own projects"
ON projects FOR INSERT
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own projects"
ON projects FOR UPDATE
USING (user_id = auth.uid()::text);

```

**Important Note for the User:**
The provided SQL modifies the `projects` table to link `user_id` to the new `profiles` table. If you have existing data in your `projects` table, you might need to handle the migration carefully (e.g., by ensuring every `user_id` in `projects` has a corresponding entry in `profiles` before applying the foreign key constraint). For a clean setup, running this on an empty database is safest.
