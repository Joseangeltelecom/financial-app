import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { DEFAULT_CATEGORIES } from "@/config/constants";

interface Category {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  icon: string | null;
  color: string | null;
  created_at: string;
}

async function getCategories(type?: "income" | "expense") {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  let query = supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (type) {
    query = query.eq("type", type);
  }

  let { data, error } = await query;
  if (error) throw error;

  if (!data || data.length === 0) {
    const defaults = DEFAULT_CATEGORIES.map((c) => ({
      ...c,
      user_id: user.id,
      is_default: true,
    }));
    const { data: inserted, error: insertError } = await supabase
      .from("categories")
      .insert(defaults)
      .select("*")
      .order("name", { ascending: true });

    if (insertError) throw insertError;
    data = inserted;

    if (type) {
      data = data.filter((c) => c.type === type);
    }
  }

  return data as Category[];
}

export function useCategories(type?: "income" | "expense") {
  return useQuery({
    queryKey: ["categories", type],
    queryFn: () => getCategories(type),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Omit<Category, "id" | "created_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("categories")
        .insert({ ...category, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Partial<Category> & { id: string }) => {
      const { id, ...updates } = category;
      const { data, error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
