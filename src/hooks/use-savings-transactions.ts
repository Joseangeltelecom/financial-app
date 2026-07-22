import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface SavingsTransaction {
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
}

async function getSavingsTransactions(savingGoalId?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  let query = supabase
    .from("savings_transactions")
    .select("*, account:accounts!account_id(name, currency, icon, color), saving_goal:saving_goals!saving_goal_id(name, color, icon)")
    .eq("user_id", user.id);

  if (savingGoalId) {
    query = query.eq("saving_goal_id", savingGoalId);
  }

  const { data, error } = await query.order("date", { ascending: false });

  if (error) throw error;
  return data as (SavingsTransaction & {
    account: { name: string; currency: string; icon: string; color: string } | null;
    saving_goal: { name: string; color: string; icon: string } | null;
  })[];
}

export function useSavingsTransactions(savingGoalId?: string) {
  return useQuery({
    queryKey: ["savings_transactions", savingGoalId ?? "all"],
    queryFn: () => getSavingsTransactions(savingGoalId),
  });
}

export function useCreateSavingsTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: Omit<SavingsTransaction, "id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("savings_transactions")
        .insert({ ...transaction, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as SavingsTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings_transactions"] });
      queryClient.invalidateQueries({ queryKey: ["savings_goals"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteSavingsTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("savings_transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings_transactions"] });
      queryClient.invalidateQueries({ queryKey: ["savings_goals"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
