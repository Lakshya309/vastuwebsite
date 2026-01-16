-- Migration to simplify the project_objects table by removing derived analysis data.
-- This aligns with the architectural shift to compute all Vastu analysis on the client.

ALTER TABLE public.project_objects
DROP COLUMN IF EXISTS analysis_result,
DROP COLUMN IF EXISTS vastu_status,
DROP COLUMN IF EXISTS devta_zone;
