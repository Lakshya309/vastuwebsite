ALTER TABLE public.analyses
ADD COLUMN analysis_type TEXT,
ADD COLUMN analysis_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN boundary_normalized JSONB,
ADD COLUMN north_direction DOUBLE PRECISION;