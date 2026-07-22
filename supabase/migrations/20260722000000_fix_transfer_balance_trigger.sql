-- Fix: handle_transfer_balance() was using OLD (NULL on INSERT) instead of NEW
DROP TRIGGER IF EXISTS on_transfer_insert_balance ON public.transfers;

CREATE OR REPLACE FUNCTION public.handle_transfer_balance()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.accounts
    SET balance = balance - NEW.from_amount, updated_at = now()
    WHERE id = NEW.from_account_id;

    UPDATE public.accounts
    SET balance = balance + NEW.to_amount, updated_at = now()
    WHERE id = NEW.to_account_id;

  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.accounts
    SET balance = balance + OLD.from_amount, updated_at = now()
    WHERE id = OLD.from_account_id;

    UPDATE public.accounts
    SET balance = balance - OLD.to_amount, updated_at = now()
    WHERE id = OLD.to_account_id;

    UPDATE public.accounts
    SET balance = balance - NEW.from_amount, updated_at = now()
    WHERE id = NEW.from_account_id;

    UPDATE public.accounts
    SET balance = balance + NEW.to_amount, updated_at = now()
    WHERE id = NEW.to_account_id;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.accounts
    SET balance = balance + OLD.from_amount, updated_at = now()
    WHERE id = OLD.from_account_id;

    UPDATE public.accounts
    SET balance = balance - OLD.to_amount, updated_at = now()
    WHERE id = OLD.to_account_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_transfer_insert_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION public.handle_transfer_balance();

-- Recalculate all account balances from scratch
UPDATE public.accounts SET balance = 0;

UPDATE public.accounts
SET balance = balance - t.from_amount
FROM public.transfers t
WHERE public.accounts.id = t.from_account_id;

UPDATE public.accounts
SET balance = balance + t.to_amount
FROM public.transfers t
WHERE public.accounts.id = t.to_account_id;
