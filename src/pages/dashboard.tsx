import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, Target, PiggyBank, Receipt,
  Percent, Plus, ArrowRight, Calendar,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { cn, formatCurrency, getPercentage } from "@/lib/utils";
import { CHART_COLORS } from "@/config/constants";
import { format } from "date-fns";
import { Link } from "react-router-dom";

function StatCard({ icon: Icon, label, value, color, change, delay }: {
  icon: React.ElementType; label: string; value: string; color: string; change?: string; delay: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}>
      <Card className="hover:shadow-md transition-shadow duration-200 h-full">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl", color)}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            {change && (
              <span className={cn("text-xs font-medium", change.startsWith("+") ? "text-green-600" : "text-red-500")}>
                {change}
              </span>
            )}
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tracking-tight mt-0.5">{value}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EditableValue({ value, onSave, label }: { value: number; onSave: (v: number) => void; label: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const commit = () => {
    setEditing(false);
    const parsed = parseFloat(draft);
    if (!isNaN(parsed) && parsed >= 0) onSave(parsed);
    else setDraft(String(value));
  };

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        className="w-full bg-transparent border-b border-primary outline-none text-2xl font-bold tracking-tight"
      />
    );
  }

  return (
    <p
      onClick={() => { setDraft(String(value)); setEditing(true); }}
      className="text-2xl font-bold tracking-tight mt-0.5 cursor-pointer hover:text-primary transition-colors"
      title={`Click to edit ${label.toLowerCase()}`}
    >
      {formatCurrency(value)}
    </p>
  );
}

function BudgetProgress({ spent, budget }: { spent: number; budget: number }) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const color = pct < 50 ? "bg-green-500" : pct < 80 ? "bg-yellow-500" : "bg-red-500";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Budget Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Spent: {formatCurrency(spent)}</span>
          <span>Budget: {formatCurrency(budget)}</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn("h-full rounded-full", color)}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right">{pct.toFixed(1)}% used</p>
      </CardContent>
    </Card>
  );
}

function ExpensePieChart({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Expenses by Category</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No expense data yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Expenses by Category</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
              {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v) => formatCurrency(Number(v))} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8}
              formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function TransactionRow({ t }: { t: { id: string; type: string; name: string; category_name: string; amount: number; store?: string | null; date: string } }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <Badge variant={t.type === "income" ? "default" : "destructive"} className="text-[10px] uppercase px-1.5 py-0">
          {t.type}
        </Badge>
        <div>
          <p className="text-sm font-medium">{t.name}</p>
          {t.store && <p className="text-xs text-muted-foreground">{t.store}</p>}
        </div>
      </div>
      <div className="text-right">
        <p className={cn("text-sm font-semibold", t.type === "income" ? "text-green-600" : "text-red-500")}>
          {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
        </p>
        <p className="text-[11px] text-muted-foreground">{format(new Date(t.date), "MMM d")}</p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-72" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { data: transactions = [], isLoading: txLoading } = useTransactions();
  const { data: categories = [] } = useCategories();

  const isLoading = profileLoading || txLoading;

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const now = new Date();
  const monthTx = useMemo(() => transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }), [transactions]);

  const monthlyIncome = useMemo(() => monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0), [monthTx]);
  const monthlyExpenses = useMemo(() => monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0), [monthTx]);
  const budget = profile?.monthly_budget ?? 0;
  const remaining = Math.max(budget - monthlyExpenses, 0);
  const remainingPct = budget > 0 ? getPercentage(remaining, budget) : 0;

  const pieData = useMemo(() => {
    const catMap = new Map<string, number>();
    monthTx.filter((t) => t.type === "expense").forEach((t) => {
      const catName = (t.category_id && categoryMap.get(t.category_id)) || "Uncategorized";
      catMap.set(catName, (catMap.get(catName) ?? 0) + t.amount);
    });
    return [...catMap.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [monthTx, categoryMap]);

  const recentTx = useMemo(() => monthTx.slice(0, 8), [monthTx]);

  const remainingColor =
    remainingPct > 50 ? "text-green-600" : remainingPct > 20 ? "text-yellow-600" : "text-red-500";
  const remainingBg =
    remainingPct > 50 ? "bg-green-500" : remainingPct > 20 ? "bg-yellow-500" : "bg-red-500";

  if (isLoading) return <div className="p-6 lg:p-8"><LoadingSkeleton /></div>;

  const userName = user?.user_metadata?.full_name ?? profile?.full_name ?? "there";

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {userName}
        </h1>
        <div className="flex items-center gap-2 mt-1 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{format(now, "EEEE, MMMM d, yyyy")}</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={DollarSign} label="Initial Balance" value={formatCurrency(profile?.initial_balance ?? 0)} color="bg-indigo-500" delay={0.05} />
        <StatCard icon={TrendingUp} label="Monthly Income" value={formatCurrency(monthlyIncome)} color="bg-green-500" delay={0.1} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
          <Card className="hover:shadow-md transition-shadow duration-200 h-full">
            <CardContent className="p-5">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground">Monthly Budget</p>
                <EditableValue value={budget} onSave={(v) => updateProfile.mutate({ monthly_budget: v })} label="Monthly Budget" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
          <Card className="hover:shadow-md transition-shadow duration-200 h-full">
            <CardContent className="p-5">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500">
                <PiggyBank className="w-5 h-5 text-white" />
              </div>
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground">Savings Goal</p>
                <EditableValue value={profile?.savings_goal ?? 0} onSave={(v) => updateProfile.mutate({ savings_goal: v })} label="Savings Goal" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <StatCard icon={Receipt} label="Current Expenses" value={formatCurrency(monthlyExpenses)} color="bg-red-500" delay={0.25} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
          <Card className="hover:shadow-md transition-shadow duration-200 h-full">
            <CardContent className="p-5">
              <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl", remainingBg)}>
                <Percent className="w-5 h-5 text-white" />
              </div>
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground">Remaining Budget</p>
                <p className={cn("text-2xl font-bold tracking-tight mt-0.5", remainingColor)}>
                  {remainingPct.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">{formatCurrency(remaining)} left</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.5 }}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/transactions" className="gap-1 text-xs">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentTx.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                No transactions this month. Start tracking your finances!
              </p>
            ) : (
              recentTx.map((t) => (
                <TransactionRow
                  key={t.id}
                  t={{
                    ...t,
                    category_name: (t.category_id && categoryMap.get(t.category_id)) || "Uncategorized",
                  }}
                />
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
          <ExpensePieChart data={pieData} />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45, duration: 0.5 }}>
          <BudgetProgress spent={monthlyExpenses} budget={budget} />
        </motion.div>
      </div>

      <Link to="/transactions" className="fixed bottom-6 right-6 lg:hidden z-50">
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
            <Plus className="w-6 h-6" />
          </Button>
        </motion.div>
      </Link>
    </div>
  );
}
