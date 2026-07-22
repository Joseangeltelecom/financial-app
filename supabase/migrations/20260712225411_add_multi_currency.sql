-- Multi-currency support

-- Add currency to accounts
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';

-- Create transfers table
CREATE TABLE IF NOT EXISTS public.transfers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  from_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  to_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  from_amount numeric(12,2) NOT NULL,
  to_amount numeric(12,2) NOT NULL,
  exchange_rate numeric(12,6),
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  notes text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transfers"
  ON public.transfers FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_transfers_user_id ON public.transfers(user_id);
CREATE INDEX idx_transfers_date ON public.transfers(date);

-- Function to update account balance after transfer
CREATE OR REPLACE FUNCTION public.handle_transfer_balance()
RETURNS trigger AS $$
BEGIN
  -- Deduct from source account
  IF OLD.from_account_id IS NULL THEN
    INSERT INTO public.accounts (id, user_id, name, type, balance, currency, is_active)
    VALUES (NEW.from_account_id, NEW.user_id, 'Pending', 'other', 0, NEW.from_currency, false)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  UPDATE public.accounts
  SET balance = balance - OLD.from_amount, updated_at = now()
  WHERE id = OLD.from_account_id;

  -- Add to destination account
  UPDATE public.accounts
  SET balance = balance + OLD.to_amount, updated_at = now()
  WHERE id = OLD.to_account_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_transfer_insert_balance
  AFTER INSERT ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION public.handle_transfer_balance();

-- Function to update account balance after transaction
CREATE OR REPLACE FUNCTION public.handle_transaction_balance()
RETURNS trigger AS $$
BEGIN
  IF NEW.account_id IS NOT NULL THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.type = 'income' THEN
        UPDATE public.accounts SET balance = balance + NEW.amount, updated_at = now() WHERE id = NEW.account_id;
      ELSIF NEW.type = 'expense' THEN
        UPDATE public.accounts SET balance = balance - NEW.amount, updated_at = now() WHERE id = NEW.account_id;
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      -- Reverse old transaction
      IF OLD.type = 'income' THEN
        UPDATE public.accounts SET balance = balance - OLD.amount, updated_at = now() WHERE id = OLD.account_id;
      ELSIF OLD.type = 'expense' THEN
        UPDATE public.accounts SET balance = balance + OLD.amount, updated_at = now() WHERE id = OLD.account_id;
      END IF;
      -- Apply new transaction
      IF NEW.type = 'income' THEN
        UPDATE public.accounts SET balance = balance + NEW.amount, updated_at = now() WHERE id = NEW.account_id;
      ELSIF NEW.type = 'expense' THEN
        UPDATE public.accounts SET balance = balance - NEW.amount, updated_at = now() WHERE id = NEW.account_id;
      END IF;
    ELSIF TG_OP = 'DELETE' THEN
      IF OLD.type = 'income' THEN
        UPDATE public.accounts SET balance = balance - OLD.amount, updated_at = now() WHERE id = OLD.account_id;
      ELSIF OLD.type = 'expense' THEN
        UPDATE public.accounts SET balance = balance + OLD.amount, updated_at = now() WHERE id = OLD.account_id;
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_transaction_balance_change
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_balance();
