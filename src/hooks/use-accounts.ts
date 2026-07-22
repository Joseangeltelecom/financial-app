import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: string;
  balance: number;
  initial_balance: number;
  currency: string;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

async function getAccounts() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Account[];
}

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (account: Omit<Account, "id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("accounts")
        .insert({ ...account, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as Account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (account: Partial<Account> & { id: string }) => {
      const { id, ...updates } = account;
      const { data, error } = await supabase
        .from("accounts")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("accounts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
