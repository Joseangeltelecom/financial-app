import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface SavingsGoal {
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
}

async function getSavingsGoals() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("saving_goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const goals = data as SavingsGoal[];
  goals.sort((a, b) => {
    const aHasDeadline = !!a.deadline;
    const bHasDeadline = !!b.deadline;
    if (aHasDeadline && bHasDeadline) {
      const deadlineDiff = new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime();
      if (deadlineDiff !== 0) return deadlineDiff;
    } else if (aHasDeadline !== bHasDeadline) {
      return aHasDeadline ? -1 : 1;
    }
    const aPct = a.target_amount > 0 ? a.current_amount / a.target_amount : 0;
    const bPct = b.target_amount > 0 ? b.current_amount / b.target_amount : 0;
    return bPct - aPct;
  });

  return goals;
}

export function useSavingsGoals() {
  return useQuery({
    queryKey: ["savings_goals"],
    queryFn: getSavingsGoals,
  });
}

export function useCreateSavingsGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: Omit<SavingsGoal, "id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("saving_goals")
        .insert({ ...goal, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as SavingsGoal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings_goals"] });
    },
  });
}

export function useUpdateSavingsGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: Partial<SavingsGoal> & { id: string }) => {
      const { id, ...updates } = goal;
      const { data, error } = await supabase
        .from("saving_goals")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as SavingsGoal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings_goals"] });
    },
  });
}

export function useDeleteSavingsGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("saving_goals")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings_goals"] });
    },
  });
}
