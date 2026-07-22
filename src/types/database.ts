export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          currency: string;
          language: string;
          initial_balance: number;
          monthly_budget: number;
          savings_goal: number;
          theme: "light" | "dark" | "system";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          avatar_url?: string | null;
          currency?: string;
          language?: string;
          initial_balance?: number;
          monthly_budget?: number;
          savings_goal?: number;
          theme?: "light" | "dark" | "system";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          currency?: string;
          language?: string;
          initial_balance?: number;
          monthly_budget?: number;
          savings_goal?: number;
          theme?: "light" | "dark" | "system";
          updated_at?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          balance: number;
          currency: string;
          color: string;
          icon: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: string;
          balance?: number;
          currency?: string;
          color?: string;
          icon?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: string;
          balance?: number;
          currency?: string;
          color?: string;
          icon?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      transfers: {
        Row: {
          id: string;
          user_id: string;
          from_account_id: string | null;
          to_account_id: string | null;
          from_amount: number;
          to_amount: number;
          exchange_rate: number | null;
          from_currency: string;
          to_currency: string;
          notes: string | null;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          from_account_id?: string | null;
          to_account_id?: string | null;
          from_amount: number;
          to_amount: number;
          exchange_rate?: number | null;
          from_currency: string;
          to_currency: string;
          notes?: string | null;
          date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          from_account_id?: string | null;
          to_account_id?: string | null;
          from_amount?: number;
          to_amount?: number;
          exchange_rate?: number | null;
          from_currency?: string;
          to_currency?: string;
          notes?: string | null;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string | null;
          type: "income" | "expense";
          name: string;
          amount: number;
          category_id: string | null;
          store: string | null;
          date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id?: string | null;
          type: "income" | "expense";
          name: string;
          amount: number;
          category_id?: string | null;
          store?: string | null;
          date: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          account_id?: string | null;
          type?: "income" | "expense";
          name?: string;
          amount?: number;
          category_id?: string | null;
          store?: string | null;
          date?: string;
          notes?: string | null;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string;
          color: string;
          type: "income" | "expense";
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon?: string;
          color?: string;
          type: "income" | "expense";
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          icon?: string;
          color?: string;
          type?: "income" | "expense";
          is_default?: boolean;
          updated_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          amount: number;
          period: "monthly" | "weekly" | "yearly";
          start_date: string;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          amount: number;
          period?: "monthly" | "weekly" | "yearly";
          start_date?: string;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          amount?: number;
          period?: "monthly" | "weekly" | "yearly";
          start_date?: string;
          end_date?: string | null;
          updated_at?: string;
        };
      };
      saving_goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount: number;
          currency: string;
          deadline: string | null;
          color: string;
          icon: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount?: number;
          currency?: string;
          deadline?: string | null;
          color?: string;
          icon?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          target_amount?: number;
          current_amount?: number;
          currency?: string;
          deadline?: string | null;
          color?: string;
          icon?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      savings_transactions: {
        Row: {
          id: string;
          user_id: string;
          saving_goal_id: string;
          account_id: string | null;
          type: "deposit" | "withdrawal";
          amount: number;
          description: string | null;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          saving_goal_id: string;
          account_id?: string | null;
          type: "deposit" | "withdrawal";
          amount: number;
          description?: string | null;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          saving_goal_id?: string;
          account_id?: string | null;
          type?: "deposit" | "withdrawal";
          amount?: number;
          description?: string | null;
          date?: string;
          updated_at?: string;
        };
      };
      monthly_summaries: {
        Row: {
          id: string;
          user_id: string;
          month: string;
          year: number;
          total_income: number;
          total_expenses: number;
          total_savings: number;
          savings_rate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: string;
          year: number;
          total_income?: number;
          total_expenses?: number;
          total_savings?: number;
          savings_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          total_income?: number;
          total_expenses?: number;
          total_savings?: number;
          savings_rate?: number;
          updated_at?: string;
        };
      };
      notification_settings: {
        Row: {
          id: string;
          user_id: string;
          daily_reminder: boolean;
          daily_reminder_time: string;
          budget_warning_enabled: boolean;
          budget_warning_threshold: number;
          budget_critical_threshold: number;
          push_notifications: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          daily_reminder?: boolean;
          daily_reminder_time?: string;
          budget_warning_enabled?: boolean;
          budget_warning_threshold?: number;
          budget_critical_threshold?: number;
          push_notifications?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          daily_reminder?: boolean;
          daily_reminder_time?: string;
          budget_warning_enabled?: boolean;
          budget_warning_threshold?: number;
          budget_critical_threshold?: number;
          push_notifications?: boolean;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          date_format: string;
          number_format: string;
          fiscal_year_start: number;
          show_decimals: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date_format?: string;
          number_format?: string;
          fiscal_year_start?: number;
          show_decimals?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          date_format?: string;
          number_format?: string;
          fiscal_year_start?: number;
          show_decimals?: boolean;
          updated_at?: string;
        };
      };
    };
  };
}
