ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS budget_currency text NOT NULL DEFAULT 'USD';
