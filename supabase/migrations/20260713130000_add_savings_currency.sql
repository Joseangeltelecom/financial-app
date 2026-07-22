-- Add currency column to saving_goals
ALTER TABLE public.saving_goals ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
