import { useState } from "react";
import { motion } from "framer-motion";
import { User, Palette, DollarSign, Bell, Shield, Moon, Sun, Monitor, Trash2, Save, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useNotificationSettings, useUpdateNotificationSettings } from "@/hooks/use-notification-settings";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { CURRENCIES, LANGUAGES } from "@/config/constants";
import { toast } from "sonner";

const animate = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35, ease: "easeOut" as const } },
});

const profileSchema = z.object({ full_name: z.string().min(1, "Name is required") });
type ProfileForm = z.infer<typeof profileSchema>;

const budgetSchema = z.object({
  monthly_budget: z.number().min(0),
  initial_balance: z.number(),
  savings_goal: z.number().min(0),
});
type BudgetForm = z.infer<typeof budgetSchema>;

const THEMES = [
  { value: "light" as const, icon: Sun, label: "Light", bg: "bg-amber-100 text-amber-600" },
  { value: "dark" as const, icon: Moon, label: "Dark", bg: "bg-slate-800 text-slate-100" },
  { value: "system" as const, icon: Monitor, label: "System", bg: "bg-gradient-to-br from-amber-100 to-slate-800 text-slate-600" },
];

const BUDGET_FIELDS = [
  { name: "monthly_budget" as const, label: "Monthly Budget", desc: "Your total spending limit per month" },
  { name: "initial_balance" as const, label: "Initial Balance", desc: "Starting balance for tracking" },
  { name: "savings_goal" as const, label: "Savings Goal", desc: "Target amount to save each month" },
];

function SkeletonSettings() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <CardHeader><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-64 mt-2" /></CardHeader>
          <CardContent className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-3/4" /></CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { isLoading: notifLoading } = useNotificationSettings();
  const { theme, setTheme } = useTheme();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [warningThreshold, setWarningThreshold] = useState(80);
  const [criticalThreshold, setCriticalThreshold] = useState(100);
  const [pushEnabled, setPushEnabled] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: { full_name: profile?.full_name ?? "" },
  });

  const budgetForm = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { monthly_budget: 0, initial_balance: 0, savings_goal: 0 },
  });

  if (profileLoading || notifLoading) return <div className="p-6"><SkeletonSettings /></div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Profile */}
      <motion.div {...animate(0)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Profile</CardTitle>
            <CardDescription>Manage your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                  {profile?.full_name?.charAt(0) ?? "U"}
                </div>
                <button className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                  <span className="text-xs font-medium text-white">Edit</span>
                </button>
              </div>
              <div className="flex-1 space-y-1">
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" {...profileForm.register("full_name")} />
                {profileForm.formState.errors.full_name && (
                  <p className="text-xs text-destructive">{profileForm.formState.errors.full_name.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled className="opacity-60" />
            </div>
            <Button onClick={profileForm.handleSubmit((data) => {
              updateProfile.mutate(data, { onSuccess: () => toast.success("Profile updated"), onError: () => toast.error("Failed to update profile") });
            })} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Appearance */}
      <motion.div {...animate(1)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> Appearance</CardTitle>
            <CardDescription>Choose your preferred theme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {THEMES.map((t) => (
                <button key={t.value} type="button" onClick={() => setTheme(t.value)}
                  className={cn("flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:border-primary/50",
                    theme === t.value ? "border-primary bg-primary/5" : "border-border")}>
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", t.bg)}>
                    <t.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Currency & Language */}
      <motion.div {...animate(2)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Currency & Language</CardTitle>
            <CardDescription>Set your preferred currency and language</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select defaultValue={profile?.currency ?? "USD"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select defaultValue="en">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Budget Settings */}
      <motion.div {...animate(3)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Budget Settings</CardTitle>
            <CardDescription>Configure your budget limits and goals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {BUDGET_FIELDS.map((f) => (
              <div key={f.name} className="space-y-1">
                <Label>{f.label}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input type="number" className="pl-7" {...budgetForm.register(f.name)} />
                </div>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
            <Button onClick={budgetForm.handleSubmit(() => toast.success("Budget settings saved"))}>
              <Save className="mr-2 h-4 w-4" /> Save Budget
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div {...animate(4)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</CardTitle>
            <CardDescription>Manage reminders and alert thresholds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Daily Reminder</p><p className="text-xs text-muted-foreground">Receive a daily spending summary</p></div>
              <Switch checked={dailyReminder} onCheckedChange={setDailyReminder} />
            </div>
            {dailyReminder && (
              <div className="space-y-1">
                <Label>Reminder Time</Label>
                <Input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className="w-40" />
              </div>
            )}
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Budget Warning Threshold</Label>
                <Badge variant="secondary">{warningThreshold}%</Badge>
              </div>
              <input type="range" min={50} max={100} value={warningThreshold} onChange={(e) => setWarningThreshold(Number(e.target.value))} className="w-full accent-primary" />
              <p className="text-xs text-muted-foreground">Alert when spending reaches this percentage</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Budget Critical Threshold</Label>
                <Badge variant="destructive">{criticalThreshold}%</Badge>
              </div>
              <input type="range" min={80} max={150} value={criticalThreshold} onChange={(e) => setCriticalThreshold(Number(e.target.value))} className="w-full accent-primary" />
              <p className="text-xs text-muted-foreground">Critical alert when spending exceeds this percentage</p>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Push Notifications</p>
                  <Badge variant="outline" className="text-[10px]">Coming Soon</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Receive push notifications on your device</p>
              </div>
              <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} disabled />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account */}
      <motion.div {...animate(5)}>
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive"><Shield className="h-5 w-5" /> Account</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete Account
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>This action is irreversible. All your data including transactions, budgets, and settings will be permanently deleted.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setDeleteOpen(false); toast.success("Account deletion requested"); }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
