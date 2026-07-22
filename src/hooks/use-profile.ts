import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Profile {
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
}

async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error && error.code === "PGRST116") {
    const { data: created, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email ?? "",
        full_name: user.user_metadata?.full_name ?? "",
      })
      .select()
      .single();

    if (createError) throw createError;
    return created as Profile;
  }

  if (error) throw error;
  return data as Profile;
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Omit<Profile, "id" | "email" | "created_at">>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email ?? "",
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" })
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
