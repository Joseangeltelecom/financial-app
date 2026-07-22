-- Create savings_transactions table for tracking deposits/withdrawals between accounts and saving goals
CREATE TABLE IF NOT EXISTS public.savings_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  saving_goal_id uuid REFERENCES public.saving_goals(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  description text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.savings_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own savings transactions"
  ON public.savings_transactions FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_savings_transactions_user_id ON public.savings_transactions(user_id);
CREATE INDEX idx_savings_transactions_saving_goal_id ON public.savings_transactions(saving_goal_id);
CREATE INDEX idx_savings_transactions_date ON public.savings_transactions(date);

-- Function to update account balance and saving goal current_amount after savings transaction
CREATE OR REPLACE FUNCTION public.handle_savings_transaction_balance()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'deposit' THEN
      -- Deposit: subtract from account, add to saving goal
      UPDATE public.accounts
      SET balance = balance - NEW.amount, updated_at = now()
      WHERE id = NEW.account_id;

      UPDATE public.saving_goals
      SET current_amount = current_amount + NEW.amount, updated_at = now()
      WHERE id = NEW.saving_goal_id;
    ELSIF NEW.type = 'withdrawal' THEN
      -- Withdrawal: add to account, subtract from saving goal
      UPDATE public.accounts
      SET balance = balance + NEW.amount, updated_at = now()
      WHERE id = NEW.account_id;

      UPDATE public.saving_goals
      SET current_amount = current_amount - NEW.amount, updated_at = now()
      WHERE id = NEW.saving_goal_id;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverse old transaction
    IF OLD.type = 'deposit' THEN
      UPDATE public.accounts SET balance = balance + OLD.amount, updated_at = now() WHERE id = OLD.account_id;
      UPDATE public.saving_goals SET current_amount = current_amount - OLD.amount, updated_at = now() WHERE id = OLD.saving_goal_id;
    ELSIF OLD.type = 'withdrawal' THEN
      UPDATE public.accounts SET balance = balance - OLD.amount, updated_at = now() WHERE id = OLD.account_id;
      UPDATE public.saving_goals SET current_amount = current_amount + OLD.amount, updated_at = now() WHERE id = OLD.saving_goal_id;
    END IF;
    -- Apply new transaction
    IF NEW.type = 'deposit' THEN
      UPDATE public.accounts SET balance = balance - NEW.amount, updated_at = now() WHERE id = NEW.account_id;
      UPDATE public.saving_goals SET current_amount = current_amount + NEW.amount, updated_at = now() WHERE id = NEW.saving_goal_id;
    ELSIF NEW.type = 'withdrawal' THEN
      UPDATE public.accounts SET balance = balance + NEW.amount, updated_at = now() WHERE id = NEW.account_id;
      UPDATE public.saving_goals SET current_amount = current_amount - NEW.amount, updated_at = now() WHERE id = NEW.saving_goal_id;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    -- Reverse the transaction
    IF OLD.type = 'deposit' THEN
      UPDATE public.accounts SET balance = balance + OLD.amount, updated_at = now() WHERE id = OLD.account_id;
      UPDATE public.saving_goals SET current_amount = current_amount - OLD.amount, updated_at = now() WHERE id = OLD.saving_goal_id;
    ELSIF OLD.type = 'withdrawal' THEN
      UPDATE public.accounts SET balance = balance - OLD.amount, updated_at = now() WHERE id = OLD.account_id;
      UPDATE public.saving_goals SET current_amount = current_amount + OLD.amount, updated_at = now() WHERE id = OLD.saving_goal_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_savings_transaction_balance_change
  AFTER INSERT OR UPDATE OR DELETE ON public.savings_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_savings_transaction_balance();
