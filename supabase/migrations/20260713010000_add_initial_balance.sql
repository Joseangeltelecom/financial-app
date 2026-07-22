-- Add initial_balance column to accounts
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS initial_balance numeric(15,2) NOT NULL DEFAULT 0;

-- Recalculate all balances to include initial_balance
-- balance column = initial_balance + income transfers in - expense transfers out + income transactions - expense transactions
UPDATE public.accounts SET balance = 0;

UPDATE public.accounts a
SET balance = balance + t.amount, updated_at = now()
FROM public.transactions t
WHERE t.account_id = a.id AND t.type = 'income';

UPDATE public.accounts a
SET balance = balance - t.amount, updated_at = now()
FROM public.transactions t
WHERE t.account_id = a.id AND t.type = 'expense';

UPDATE public.accounts a
SET balance = balance - tr.from_amount, updated_at = now()
FROM public.transfers tr
WHERE tr.from_account_id = a.id;

UPDATE public.accounts a
SET balance = balance + tr.to_amount, updated_at = now()
FROM public.transfers tr
WHERE tr.to_account_id = a.id;

-- Now balance = transaction-derived only. The app will display initial_balance + balance.
