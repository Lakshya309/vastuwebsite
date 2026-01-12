```sql
-- STEP 3: Minimal Project Table
-- This table stores project information and links it to a Firebase user.
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,          -- Stores the Firebase UID.
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  floor_plan_url TEXT,
  boundary_normalized JSONB,
  north_direction FLOAT
);

-- Enable Row Level Security (RLS) for the projects table.
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can only see their own projects.
CREATE POLICY "Users can view their own projects"
ON projects FOR SELECT
USING (auth.uid()::text = user_id);

-- Policy: Users can insert new projects for themselves.
CREATE POLICY "Users can create their own projects"
ON projects FOR INSERT
WITH CHECK (auth.uid()::text = user_id);


-- STEP 4: Add floor_plan_url to projects table
-- Add a column to store the URL of the uploaded floor plan image.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS floor_plan_url TEXT;

-- Policy: Users can update their own projects (e.g., to add the floor_plan_url).
CREATE POLICY "Users can update their own projects"
ON projects FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);


-- STEP 5: Analysis Data Model Tables
-- This table stores high-level information about an analysis for a project.
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' or 'reviewed'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for analyses table.
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view analyses for projects they own.
-- This requires a JOIN with the projects table to check ownership.
CREATE POLICY "Users can view analyses for their own projects"
ON analyses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = analyses.project_id
    AND projects.user_id = auth.uid()::text
  )
);


-- This table stores individual items detected during an analysis.
CREATE TABLE IF NOT EXISTS analysis_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  object TEXT NOT NULL,
  direction TEXT NOT NULL,
  boundary_normalized JSONB,
  confidence REAL, -- e.g., 0.82 for 82%
  source TEXT NOT NULL, -- 'ai' or 'manual'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for analysis_items table.
ALTER TABLE analysis_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view analysis items for analyses they have access to.
-- This requires a JOIN through the analyses and projects tables.
CREATE POLICY "Users can view items for their own analyses"
ON analysis_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM analyses
    JOIN projects ON analyses.project_id = projects.id
    WHERE analyses.id = analysis_items.analysis_id
    AND projects.user_id = auth.uid()::text
  )
);

```
