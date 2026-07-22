-- Recalculate all account balances from transactions and transfers

-- Reset all balances to 0 first
UPDATE public.accounts SET balance = 0;

-- Add income transactions
UPDATE public.accounts a
SET balance = balance + t.amount, updated_at = now()
FROM public.transactions t
WHERE t.account_id = a.id AND t.type = 'income';

-- Subtract expense transactions
UPDATE public.accounts a
SET balance = balance - t.amount, updated_at = now()
FROM public.transactions t
WHERE t.account_id = a.id AND t.type = 'expense';

-- Subtract transfers going out
UPDATE public.accounts a
SET balance = balance - tr.from_amount, updated_at = now()
FROM public.transfers tr
WHERE tr.from_account_id = a.id;

-- Add transfers coming in
UPDATE public.accounts a
SET balance = balance + tr.to_amount, updated_at = now()
FROM public.transfers tr
WHERE tr.to_account_id = a.id;

-- Recreate trigger to ensure it exists
CREATE OR REPLACE FUNCTION public.handle_transaction_balance()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.account_id IS NOT NULL THEN
      IF NEW.type = 'income' THEN
        UPDATE public.accounts SET balance = balance + NEW.amount, updated_at = now() WHERE id = NEW.account_id;
      ELSIF NEW.type = 'expense' THEN
        UPDATE public.accounts SET balance = balance - NEW.amount, updated_at = now() WHERE id = NEW.account_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverse old
    IF OLD.account_id IS NOT NULL THEN
      IF OLD.type = 'income' THEN
        UPDATE public.accounts SET balance = balance - OLD.amount, updated_at = now() WHERE id = OLD.account_id;
      ELSIF OLD.type = 'expense' THEN
        UPDATE public.accounts SET balance = balance + OLD.amount, updated_at = now() WHERE id = OLD.account_id;
      END IF;
    END IF;
    -- Apply new
    IF NEW.account_id IS NOT NULL THEN
      IF NEW.type = 'income' THEN
        UPDATE public.accounts SET balance = balance + NEW.amount, updated_at = now() WHERE id = NEW.account_id;
      ELSIF NEW.type = 'expense' THEN
        UPDATE public.accounts SET balance = balance - NEW.amount, updated_at = now() WHERE id = NEW.account_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.account_id IS NOT NULL THEN
      IF OLD.type = 'income' THEN
        UPDATE public.accounts SET balance = balance - OLD.amount, updated_at = now() WHERE id = OLD.account_id;
      ELSIF OLD.type = 'expense' THEN
        UPDATE public.accounts SET balance = balance + OLD.amount, updated_at = now() WHERE id = OLD.account_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_transaction_balance_change ON public.transactions;
CREATE TRIGGER on_transaction_balance_change
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_balance();
