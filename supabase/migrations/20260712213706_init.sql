-- FinanceFlow Database Schema
-- Run this in Supabase SQL Editor

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null default '',
  avatar_url text,
  currency text not null default 'USD',
  language text not null default 'en',
  initial_balance numeric(12,2) not null default 0,
  monthly_budget numeric(12,2) not null default 0,
  savings_goal numeric(12,2) not null default 0,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ACCOUNTS
-- ============================================================
create table if not exists public.accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text not null default 'checking',
  balance numeric(12,2) not null default 0,
  color text not null default '#6366f1',
  icon text not null default 'Wallet',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.accounts enable row level security;

create policy "Users can manage own accounts"
  on public.accounts for all
  using (auth.uid() = user_id);

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  icon text not null default 'Tag',
  color text not null default '#6366f1',
  type text not null check (type in ('income', 'expense')),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Users can manage own categories"
  on public.categories for all
  using (auth.uid() = user_id);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  account_id uuid references public.accounts(id) on delete set null,
  type text not null check (type in ('income', 'expense', 'transfer')),
  name text not null,
  amount numeric(12,2) not null,
  category_id uuid references public.categories(id) on delete set null,
  store text,
  date date not null default CURRENT_DATE,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Users can manage own transactions"
  on public.transactions for all
  using (auth.uid() = user_id);

create index idx_transactions_user_id on public.transactions(user_id);
create index idx_transactions_date on public.transactions(date);
create index idx_transactions_type on public.transactions(type);

-- ============================================================
-- BUDGETS
-- ============================================================
create table if not exists public.budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(12,2) not null,
  period text not null default 'monthly' check (period in ('weekly', 'monthly', 'yearly')),
  start_date date not null default CURRENT_DATE,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.budgets enable row level security;

create policy "Users can manage own budgets"
  on public.budgets for all
  using (auth.uid() = user_id);

-- ============================================================
-- SAVING GOALS
-- ============================================================
create table if not exists public.saving_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  target_amount numeric(12,2) not null,
  current_amount numeric(12,2) not null default 0,
  deadline date,
  color text not null default '#6366f1',
  icon text not null default 'PiggyBank',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.saving_goals enable row level security;

create policy "Users can manage own saving goals"
  on public.saving_goals for all
  using (auth.uid() = user_id);

-- ============================================================
-- MONTHLY SUMMARIES
-- ============================================================
create table if not exists public.monthly_summaries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  month text not null,
  year integer not null,
  total_income numeric(12,2) not null default 0,
  total_expenses numeric(12,2) not null default 0,
  total_savings numeric(12,2) not null default 0,
  savings_rate numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, month, year)
);

alter table public.monthly_summaries enable row level security;

create policy "Users can manage own monthly summaries"
  on public.monthly_summaries for all
  using (auth.uid() = user_id);

-- ============================================================
-- NOTIFICATION SETTINGS
-- ============================================================
create table if not exists public.notification_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  daily_reminder boolean not null default true,
  daily_reminder_time time not null default '09:00',
  budget_warning_enabled boolean not null default true,
  budget_warning_threshold integer not null default 80,
  budget_critical_threshold integer not null default 100,
  push_notifications boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_settings enable row level security;

create policy "Users can manage own notification settings"
  on public.notification_settings for all
  using (auth.uid() = user_id);

-- Auto-create notification settings
create or replace function public.handle_new_profile_notifications()
returns trigger as $$
begin
  insert into public.notification_settings (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_profile_created_notifications
  after insert on public.profiles
  for each row execute function public.handle_new_profile_notifications();

-- ============================================================
-- USER SETTINGS
-- ============================================================
create table if not exists public.user_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  date_format text not null default 'MMM d, yyyy',
  number_format text not null default 'en-US',
  fiscal_year_start integer not null default 1,
  show_decimals boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "Users can manage own user settings"
  on public.user_settings for all
  using (auth.uid() = user_id);

-- Auto-create user settings
create or replace function public.handle_new_profile_settings()
returns trigger as $$
begin
  insert into public.user_settings (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_profile_created_settings
  after insert on public.profiles
  for each row execute function public.handle_new_profile_settings();
