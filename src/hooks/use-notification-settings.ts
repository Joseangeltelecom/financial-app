import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface NotificationSettings {
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
}

async function getNotificationSettings() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) throw error;
  return data as NotificationSettings;
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: ["notification_settings"],
    queryFn: getNotificationSettings,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Omit<NotificationSettings, "id" | "user_id" | "created_at">>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("notification_settings")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as NotificationSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification_settings"] });
    },
  });
}
