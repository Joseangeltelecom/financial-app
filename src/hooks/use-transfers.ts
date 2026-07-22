import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Transfer {
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
}

async function getTransfers() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("transfers")
    .select("*, from_account:accounts!from_account_id(name, currency, icon, color), to_account:accounts!to_account_id(name, currency, icon, color)")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (error) throw error;
  return data as (Transfer & {
    from_account: { name: string; currency: string; icon: string; color: string } | null;
    to_account: { name: string; currency: string; icon: string; color: string } | null;
  })[];
}

export function useTransfers() {
  return useQuery({
    queryKey: ["transfers"],
    queryFn: getTransfers,
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transfer: Omit<Transfer, "id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("transfers")
        .insert({ ...transfer, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as Transfer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("transfers")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
