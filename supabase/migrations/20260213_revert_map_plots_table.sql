
ALTER TABLE projects
ADD COLUMN floor_plan_path TEXT;

DROP TABLE map_plots;

ALTER TABLE projects
DROP COLUMN active_map_plot_id;
