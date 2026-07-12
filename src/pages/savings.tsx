import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Target, Calendar, TrendingUp, Edit, Trash2, PiggyBank, Trophy, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useSavingsGoals, useCreateSavingsGoal, useUpdateSavingsGoal, useDeleteSavingsGoal } from "@/hooks/use-savings";
import { useTransactions } from "@/hooks/use-transactions";
import { cn, formatCurrency, getPercentage } from "@/lib/utils";
import { CHART_COLORS } from "@/config/constants";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const goalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  target_amount: z.number().positive("Target must be positive"),
  current_amount: z.number().min(0, "Cannot be negative").optional(),
  deadline: z.string().optional(),
  color: z.string().optional(),
});
type GoalFormData = z.infer<typeof goalSchema>;

const PRESET_COLORS = ["#6366f1", "#f59e0b", "#ef4444", "#22c55e", "#3b82f6", "#ec4899", "#8b5cf6", "#06b6d4", "#f97316", "#14b8a6"];
const PRESET_ICONS = ["PiggyBank", "Trophy", "Target", "TrendingUp", "Calendar", "DollarSign"];

const ICON_MAP: Record<string, React.ElementType> = {
  PiggyBank, Trophy, Target, TrendingUp, Calendar, DollarSign,
};

function getIconForGoal(goal: any): React.ElementType {
  const iconName = goal?.icon || "PiggyBank";
  return ICON_MAP[iconName] || PiggyBank;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" as const } },
};

function GoalCard({
  goal,
  onEdit,
  onDelete,
}: {
  goal: any;
  onEdit: (g: any) => void;
  onDelete: (g: any) => void;
}) {
  const pct = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
  const Icon = getIconForGoal(goal);
  const color = goal.color || PRESET_COLORS[0];
  const isComplete = goal.current_amount >= goal.target_amount;

  return (
    <motion.div variants={cardVariants} layout>
      <Card className={cn(
        "group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur transition-all duration-300",
        "hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20",
        isComplete && "ring-1 ring-emerald-500/20",
      )}>
        <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: color }} />
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ backgroundColor: `${color}15` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{goal.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                </p>
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(goal)}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-600" onClick={() => onDelete(goal)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="font-medium" style={{ color: isComplete ? "#22c55e" : color }}>{pct.toFixed(1)}%</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
          </div>

          {goal.deadline && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Due {format(new Date(goal.deadline), "MMM d, yyyy")}</span>
            </div>
          )}

          {isComplete && (
            <div className="mt-3">
              <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1">
                <Trophy className="h-3 w-3" /> Goal Achieved
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function GoalForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  defaultValues,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: GoalFormData) => void;
  isLoading: boolean;
  defaultValues?: Partial<GoalFormData & { icon?: string; current_amount?: number }>;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      target_amount: undefined,
      current_amount: undefined,
      deadline: "",
      color: PRESET_COLORS[0],
      ...defaultValues,
    },
  });

  const selectedColor = watch("color") || "#6366f1";
  const selectedIcon = defaultValues?.icon || "PiggyBank";

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{defaultValues?.name ? "Edit Goal" : "Create Goal"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Goal Name</Label>
            <Input {...register("name")} placeholder="e.g. Emergency Fund" className="bg-background" />
            {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Target Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  step="0.01"
                  {...register("target_amount", { valueAsNumber: true })}
                  placeholder="0.00"
                  className="pl-7 bg-background"
                />
              </div>
              {errors.target_amount && <p className="text-xs text-rose-500">{errors.target_amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Current Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  step="0.01"
                  {...register("current_amount", { valueAsNumber: true })}
                  placeholder="0.00"
                  className="pl-7 bg-background"
                />
              </div>
              {errors.current_amount && <p className="text-xs text-rose-500">{errors.current_amount.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Deadline <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input type="date" {...register("deadline")} className="bg-background" />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue("color", c)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all",
                    selectedColor === c && "ring-2 ring-offset-2 ring-offset-background scale-110",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_ICONS.map((iconName) => {
                const Icon = ICON_MAP[iconName];
                const isActive = defaultValues?.icon === iconName || (!defaultValues?.icon && iconName === "PiggyBank");
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setValue("icon" as any, iconName)}
                    className={cn(
                      "flex items-center justify-center w-9 h-9 rounded-lg border transition-all",
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-muted-foreground/30 text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : defaultValues?.name ? "Save Changes" : "Create Goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SavingsPage() {
  const { user } = useAuth();
  const { data: goals = [], isLoading: goalsLoading } = useSavingsGoals();
  const { data: transactions = [] } = useTransactions();
  const createMutation = useCreateSavingsGoal();
  const updateMutation = useUpdateSavingsGoal();
  const deleteMutation = useDeleteSavingsGoal();

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [chartTimeFilter, setChartTimeFilter] = useState("monthly");

  const openCreate = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  const handleSubmit = (data: GoalFormData) => {
    if (editItem) {
      updateMutation.mutate(
        { id: editItem.id, ...data, icon: editItem.icon },
        {
          onSuccess: () => {
            toast.success("Goal updated");
            setFormOpen(false);
          },
          onError: () => toast.error("Failed to update goal"),
        },
      );
    } else {
      createMutation.mutate(
        { ...data, icon: "PiggyBank", user_id: user?.id } as any,
        {
          onSuccess: () => {
            toast.success("Goal created");
            setFormOpen(false);
          },
          onError: () => toast.error("Failed to create goal"),
        },
      );
    }
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.id, {
      onSuccess: () => {
        toast.success("Goal deleted");
        setDeleteItem(null);
      },
      onError: () => toast.error("Failed to delete goal"),
    });
  };

  const incomeTx = transactions.filter((t: any) => t.type === "income" && t.date);
  const expenseTx = transactions.filter((t: any) => t.type === "expense" && t.date);

  const monthlySavingsData = useMemo(() => {
    const map = new Map<string, { income: number; expense: number; count: number }>();
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = format(d, "yyyy-MM");
      const label = format(d, "MMM yyyy");
      map.set(key, { income: 0, expense: 0, count: 0 });
    }
    incomeTx.forEach((t: any) => {
      const key = format(new Date(t.date), "yyyy-MM");
      if (map.has(key)) map.get(key)!.income += t.amount;
    });
    expenseTx.forEach((t: any) => {
      const key = format(new Date(t.date), "yyyy-MM");
      if (map.has(key)) map.get(key)!.expense += t.amount;
    });
    return Array.from(map, ([key, val]) => ({
      month: key,
      label: format(new Date(key + "-01"), "MMM yy"),
      savings: val.income - val.expense,
      income: val.income,
      expense: val.expense,
      savingsPct: val.income > 0 ? ((val.income - val.expense) / val.income) * 100 : 0,
    }));
  }, [incomeTx, expenseTx]);

  const chartData = useMemo(() => {
    const now = new Date();
    if (chartTimeFilter === "daily") {
      return Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (29 - i));
        const key = format(d, "yyyy-MM-dd");
        const dayIncome = incomeTx.filter((t: any) => format(new Date(t.date), "yyyy-MM-dd") === key).reduce((s: number, t: any) => s + t.amount, 0);
        const dayExpense = expenseTx.filter((t: any) => format(new Date(t.date), "yyyy-MM-dd") === key).reduce((s: number, t: any) => s + t.amount, 0);
        return { name: format(d, "MMM d"), savings: dayIncome - dayExpense };
      });
    }
    if (chartTimeFilter === "weekly") {
      return Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (11 - i) * 7);
        const end = new Date(d.getTime() + 6 * 86400000);
        const weekIncome = incomeTx.filter((t: any) => { const td = new Date(t.date); return td >= d && td <= end; }).reduce((s: number, t: any) => s + t.amount, 0);
        const weekExpense = expenseTx.filter((t: any) => { const td = new Date(t.date); return td >= d && td <= end; }).reduce((s: number, t: any) => s + t.amount, 0);
        return { name: format(d, "MMM d"), savings: weekIncome - weekExpense };
      });
    }
    if (chartTimeFilter === "yearly") {
      return Array.from({ length: 5 }, (_, i) => {
        const y = now.getFullYear() - 4 + i;
        const yearIncome = incomeTx.filter((t: any) => new Date(t.date).getFullYear() === y).reduce((s: number, t: any) => s + t.amount, 0);
        const yearExpense = expenseTx.filter((t: any) => new Date(t.date).getFullYear() === y).reduce((s: number, t: any) => s + t.amount, 0);
        return { name: String(y), savings: yearIncome - yearExpense };
      });
    }
    return monthlySavingsData.map((d) => ({ name: d.label, savings: d.savings }));
  }, [incomeTx, expenseTx, chartTimeFilter, monthlySavingsData]);

  const currentMonthData = monthlySavingsData.find(
    (d) => d.month === format(new Date(), "yyyy-MM"),
  );

  const annualEstimate = currentMonthData
    ? currentMonthData.savings * 12
    : 0;

  const isCurrentMonth = (monthKey: string) => monthKey === format(new Date(), "yyyy-MM");

  const isLoading = goalsLoading;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Savings</h1>
            <p className="text-muted-foreground mt-1">Track your savings goals and progress</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add Goal
          </Button>
        </motion.div>

        {/* Annual Estimate Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-background">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>Annual Savings Estimate</span>
                  </div>
                  <p className="text-3xl font-bold tracking-tight">
                    {annualEstimate >= 0 ? "+" : ""}{formatCurrency(annualEstimate)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Based on your {format(new Date(), "MMMM")} savings of{" "}
                    {currentMonthData ? formatCurrency(currentMonthData.savings) : "$0"}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full text-sm font-medium">
                  <TrendingUp className="h-4 w-4" />
                  {annualEstimate > 0 ? "On track" : "Needs attention"}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Savings Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Savings Over Time
              </CardTitle>
              <Tabs value={chartTimeFilter} onValueChange={setChartTimeFilter}>
                <TabsList className="h-8">
                  {["Daily", "Weekly", "Monthly", "Yearly"].map((f) => (
                    <TabsTrigger key={f} value={f.toLowerCase()} className="text-xs capitalize px-2">
                      {f}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -15 }}>
                    <defs>
                      <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.9} />
                        <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={{ stroke: "hsl(var(--border))", opacity: 0.5 }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `$${v}`}
                    />
                    <Tooltip
                      formatter={(v) => [formatCurrency(Number(v)), "Savings"]}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                      cursor={{ fill: "hsl(var(--primary)/0.08)" }}
                    />
                    <Bar
                      dataKey="savings"
                      fill="url(#savingsGradient)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Savings Goals Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Savings Goals</h2>
            <Badge variant="secondary" className="font-normal">
              {goals.length} {goals.length === 1 ? "goal" : "goals"}
            </Badge>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-xl" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : goals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-border/50 border-dashed">
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <PiggyBank className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">No savings goals yet</h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        Start building your financial future by setting your first savings goal. Whether it's an emergency fund, a vacation, or a big purchase — every goal starts with a single step.
                      </p>
                    </div>
                    <Button onClick={openCreate} className="gap-2 mt-2">
                      <Plus className="h-4 w-4" /> Set Your First Goal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {goals.map((goal: any) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={(g) => {
                    setEditItem(g);
                    setFormOpen(true);
                  }}
                  onDelete={setDeleteItem}
                />
              ))}
            </motion.div>
          )}
        </div>

        <Separator />

        {/* Savings Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Monthly Savings Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground">
                      <th className="p-3 text-left font-medium">Month</th>
                      <th className="p-3 text-left font-medium">Savings Goal</th>
                      <th className="p-3 text-left font-medium">Actual Savings</th>
                      <th className="p-3 text-left font-medium">Savings Rate</th>
                      <th className="p-3 text-left font-medium">Annual Estimate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlySavingsData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">
                          No transaction data available yet.
                        </td>
                      </tr>
                    ) : (
                      monthlySavingsData.map((row) => {
                        const current = isCurrentMonth(row.month);
                        return (
                          <tr
                            key={row.month}
                            className={cn(
                              "border-b border-border/50 transition-colors",
                              current && "bg-primary/[0.03]",
                              !current && "hover:bg-muted/30",
                            )}
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{row.label}</span>
                                {current && (
                                  <Badge variant="default" className="h-5 text-[10px] px-1.5 bg-primary/10 text-primary border-primary/20">
                                    Current
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              {goals.length > 0 ? (
                                <span className="tabular-nums">{formatCurrency(goals[0]?.target_amount || 0)}</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className={cn(
                              "p-3 font-medium tabular-nums",
                              row.savings >= 0 ? "text-emerald-500" : "text-rose-500",
                            )}>
                              {row.savings >= 0 ? "+" : ""}{formatCurrency(row.savings)}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full",
                                      row.savingsPct >= 20 ? "bg-emerald-500" : row.savingsPct > 0 ? "bg-amber-500" : "bg-rose-500",
                                    )}
                                    style={{ width: `${Math.min(Math.max(row.savingsPct, 0), 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                  {row.savingsPct.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="p-3 tabular-nums text-muted-foreground">
                              {row.savings >= 0 ? "+" : ""}{formatCurrency(row.savings * 12)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Goal Form Modal */}
      <GoalForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
        defaultValues={
          editItem
            ? {
                name: editItem.name,
                target_amount: editItem.target_amount,
                current_amount: editItem.current_amount,
                deadline: editItem.deadline?.slice(0, 10),
                color: editItem.color || PRESET_COLORS[0],
                icon: editItem.icon || "PiggyBank",
              }
            : undefined
        }
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteItem} onOpenChange={(v) => { if (!v) setDeleteItem(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Goal</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Are you sure you want to delete "<span className="text-foreground font-medium">{deleteItem?.name}</span>"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteItem(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
