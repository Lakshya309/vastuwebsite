CREATE TABLE map_plots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE projects
DROP COLUMN floor_plan_path;

ALTER TABLE projects
ADD COLUMN active_map_plot_id UUID REFERENCES map_plots(id);
