-- Add plot dimensions to projects table
ALTER TABLE public.projects 
ADD COLUMN plot_width DOUBLE PRECISION,
ADD COLUMN plot_height DOUBLE PRECISION;
