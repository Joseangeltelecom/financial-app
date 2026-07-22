import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target, PiggyBank, DollarSign, ArrowUpRight, ArrowDownRight, RefreshCw, Sparkles, Calendar } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useTransactions } from "@/hooks/use-transactions";
import { cn, formatCurrency, getPercentage } from "@/lib/utils";
import { CHART_COLORS } from "@/config/constants";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { useTranslation } from "react-i18next";

type Range = "1m" | "3m" | "6m";
const RANGES = [{ key: "1m" as const, label: "This Month", n: 1 }, { key: "3m" as const, label: "Last 3 Months", n: 3 }, { key: "6m" as const, label: "Last 6 Months", n: 6 }];
const IMPACT: Record<string, string> = {
  High: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  Low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

interface Rec { icon: React.ElementType; title: string; description: string; impact: "High" | "Medium" | "Low"; }
interface Analysis {
  score: number; income: number; expenses: number; savings: number; savingsRate: number;
  topCategory: { name: string; value: number } | null; spendingTrend: number;
  budgetPct: number; savingsTrend: "up" | "down"; recommendations: Rec[];
  trend: { month: string; score: number }[]; pieData: { name: string; value: number }[];
  projections: { label: string; amount: number }[];
}

function useCountUp(target: number, duration = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      setV(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return v;
}

function analyze(txs: any[], budget: number, months: number): Analysis {
  const now = new Date();
  const rangeStart = startOfMonth(subMonths(now, months - 1));
  const rangeEnd = endOfMonth(now);
  const prevStart = startOfMonth(subMonths(rangeStart, 1));
  const prevEnd = new Date(rangeStart.getTime() - 1);
  const pick = (s: Date, e: Date) => txs.filter((t) => isWithinInterval(new Date(t.date), { start: s, end: e }));
  const cur = pick(rangeStart, rangeEnd);
  const prev = pick(prevStart, prevEnd);
  const sum = (arr: any[], type: string) => arr.filter((t) => t.type === type).reduce((s: number, t: any) => s + t.amount, 0);
  const income = sum(cur, "income"), expenses = sum(cur, "expense");
  const prevIncome = sum(prev, "income"), prevExpenses = sum(prev, "expense");
  const savings = income - expenses, prevSavings = prevIncome - prevExpenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  const monthlyExp = expenses / months;
  const budgetPct = budget > 0 ? (monthlyExp / budget) * 100 : 0;
  const catMap = new Map<string, number>();
  cur.filter((t: any) => t.type === "expense").forEach((t: any) => {
    const c = t.name || "Other"; catMap.set(c, (catMap.get(c) ?? 0) + t.amount);
  });
  const pieData = [...catMap.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  const sScore = Math.min(40, Math.max(0, savingsRate * 1.33));
  const bScore = budget > 0 ? Math.max(0, 30 * (1 - Math.min(budgetPct, 150) / 150)) : 15;
  const dScore = catMap.size >= 3 ? 15 : catMap.size > 0 ? 8 : 0;
  const eDelta = prevExpenses > 0 ? (prevExpenses - expenses) / prevExpenses : 0;
  const score = Math.round(Math.min(100, sScore + bScore + dScore + Math.max(0, Math.min(15, eDelta * 75))));
  const spendingTrend = prevExpenses > 0 ? ((monthlyExp - prevExpenses) / prevExpenses) * 100 : 0;
  const trend = Array.from({ length: 6 }, (_, i) => {
    const m = subMonths(now, 5 - i), mTx = pick(startOfMonth(m), endOfMonth(m));
    const r = sum(mTx, "income") > 0 ? ((sum(mTx, "income") - sum(mTx, "expense")) / sum(mTx, "income")) * 100 : 0;
    return { month: format(m, "MMM"), score: Math.round(Math.min(100, Math.max(0, r * 1.5))) };
  });
  const recs: Rec[] = [];
  if (savingsRate < 10) recs.push({ icon: AlertTriangle, title: "Low Savings Rate", description: `Your savings rate is ${savingsRate.toFixed(1)}%. Aim for at least 20% of income.`, impact: "High" });
  if (budgetPct > 90) recs.push({ icon: AlertTriangle, title: "Budget Nearly Exceeded", description: `You've used ${budgetPct.toFixed(0)}% of your monthly budget. Consider cutting discretionary spending.`, impact: "High" });
  if (spendingTrend > 10) recs.push({ icon: TrendingUp, title: "Spending Is Rising", description: `Expenses increased ${spendingTrend.toFixed(0)}% vs previous period. Review your categories.`, impact: "High" });
  if (savingsRate >= 20) recs.push({ icon: Lightbulb, title: "Great Savings Habit", description: `Your ${savingsRate.toFixed(1)}% savings rate is excellent. Consider investing surplus funds.`, impact: "Medium" });
  recs.push({ icon: Target, title: "Set Financial Goals", description: "Define specific savings targets with deadlines to stay motivated.", impact: "Medium" });
  recs.push({ icon: PiggyBank, title: "Automate Savings", description: "Set up automatic transfers on payday to save consistently.", impact: "Low" });
  const avgSav = months > 0 ? savings / months : 0;
  const projections = [3, 6, 12].map((m) => ({ label: `${m} months`, amount: Math.max(0, savings + avgSav * m) }));
  return { score, income, expenses, savings, savingsRate, topCategory: pieData[0] ?? null, spendingTrend, budgetPct, savingsTrend: savings >= prevSavings ? "up" : "down", recommendations: recs, trend, pieData, projections };
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-[240px] w-full rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      <div className="grid md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}</div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

function ScoreCircle({ score }: { score: number }) {
  const { t } = useTranslation();
  const animated = useCountUp(score);
  const r = 85, circ = 2 * Math.PI * r, offset = circ * (1 - score / 100);
  const color = score > 80 ? "#22c55e" : score >= 60 ? "#3b82f6" : score >= 40 ? "#eab308" : "#ef4444";
  const label = score > 80 ? t("aiReport.scoreLabels.excellent") : score >= 60 ? t("aiReport.scoreLabels.good") : score >= 40 ? t("aiReport.scoreLabels.fair") : t("aiReport.scoreLabels.needsAttention");
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-[200px] h-[200px]">
        <svg width={200} height={200} className="-rotate-90">
          <circle cx={100} cy={100} r={r} fill="none" stroke="currentColor" strokeWidth={10} className="text-muted/50" />
          <motion.circle cx={100} cy={100} r={r} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1.5, ease: "easeOut" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold tracking-tight" style={{ color }}>{animated}</span>
          <span className="text-sm text-muted-foreground mt-1">{t("aiReport.outOf100")}</span>
        </div>
      </div>
      <Badge variant="outline" className={cn("text-sm font-medium px-3 py-1",
        score > 80 && "border-green-500 text-green-600",
        score >= 60 && score <= 80 && "border-blue-500 text-blue-600",
        score >= 40 && score < 60 && "border-yellow-500 text-yellow-600",
        score < 40 && "border-red-500 text-red-500")}>{label}</Badge>
    </div>
  );
}

export default function AIReportPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: transactions = [], isLoading: txLoading } = useTransactions();
  const [range, setRange] = useState<Range>("1m");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const isLoading = profileLoading || txLoading;
  const budget = profile?.monthly_budget ?? 0;
  const months = RANGES.find((r) => r.key === range)!.n;
  const analysis = useMemo(() => (transactions?.length ? analyze(transactions, budget, months) : null), [transactions, budget, months]);
  const handleGenerate = () => { setGenerating(true); setTimeout(() => { setGenerating(false); setGenerated(true); }, 1800); };

  if (isLoading) return <div className="p-6 lg:p-8"><LoadingSkeleton /></div>;
  if (generating) return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <Skeleton className="h-10 w-72" />
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground font-medium">{t("aiReport.analyzing")}</p>
        <p className="text-sm text-muted-foreground">{t("aiReport.analyzingDesc")}</p>
      </div>
      <LoadingSkeleton />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><Brain className="w-7 h-7 text-primary" /><h1 className="text-3xl font-bold tracking-tight">{t("aiReport.title")}</h1></div>
          <p className="text-muted-foreground mt-1">{t("aiReport.description")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={range} onValueChange={(v) => { setRange(v as Range); setGenerated(false); }}>
            <TabsList>{RANGES.map((r) => <TabsTrigger key={r.key} value={r.key}>{r.label}</TabsTrigger>)}</TabsList>
          </Tabs>
          <Button onClick={handleGenerate} className="gap-2">
            {generated ? <RefreshCw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            {generated ? t("aiReport.regenerate") : t("aiReport.generateReport")}
          </Button>
        </div>
      </motion.div>

      {!generated ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6"><Brain className="w-10 h-10 text-primary" /></div>
          <h2 className="text-2xl font-bold mb-2">{t("aiReport.readyToAnalyze")}</h2>
          <p className="text-muted-foreground max-w-md mb-8">{t("aiReport.readyToAnalyzeDesc")}</p>
          <Button onClick={handleGenerate} size="lg" className="gap-2"><Sparkles className="w-5 h-5" /> {t("aiReport.generateReport")}</Button>
        </motion.div>
      ) : !analysis ? (
        <Card className="p-12 text-center text-muted-foreground">{t("aiReport.noData")}</Card>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Card><CardContent className="p-8 flex flex-col items-center"><ScoreCircle score={analysis.score} /></CardContent></Card>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: DollarSign, label: t("aiReport.totalIncome"), value: formatCurrency(analysis.income), color: "bg-green-500" },
              { icon: TrendingDown, label: t("aiReport.totalExpenses"), value: formatCurrency(analysis.expenses), color: "bg-red-500" },
              { icon: PiggyBank, label: t("aiReport.netSavings"), value: formatCurrency(analysis.savings), color: "bg-blue-500" },
              { icon: Target, label: t("aiReport.savingsRate"), value: `${analysis.savingsRate.toFixed(1)}%`, color: "bg-purple-500" },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}>
                <Card className="hover:shadow-md transition-shadow h-full"><CardContent className="p-5">
                  <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl", s.color)}><s.icon className="w-5 h-5 text-white" /></div>
                  <p className="text-xs font-medium text-muted-foreground mt-3">{s.label}</p>
                  <p className="text-2xl font-bold tracking-tight mt-0.5">{s.value}</p>
                </CardContent></Card>
              </motion.div>
            ))}
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight mb-4">{t("aiReport.keyInsights")}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: PieChart, title: t("aiReport.biggestExpenseCategory"), value: analysis.topCategory ? `${analysis.topCategory.name} — ${formatCurrency(analysis.topCategory.value)}` : "No data", color: "bg-purple-500", pct: undefined as number | undefined },
                { icon: analysis.spendingTrend > 0 ? TrendingUp : TrendingDown, title: t("aiReport.spendingTrend"), value: `${Math.abs(analysis.spendingTrend).toFixed(1)}% ${analysis.spendingTrend > 0 ? t("aiReport.increase") : t("aiReport.decrease")}`, color: analysis.spendingTrend > 0 ? "bg-red-500" : "bg-green-500", pct: undefined },
                { icon: Target, title: t("aiReport.budgetUtilization"), value: budget > 0 ? `${analysis.budgetPct.toFixed(0)}% ${t("aiReport.used")}` : t("aiReport.budgetNotSet"), color: "bg-blue-500", pct: budget > 0 ? Math.min(analysis.budgetPct, 100) : undefined },
                { icon: PiggyBank, title: t("aiReport.savingsMomentum"), value: analysis.savingsTrend === "up" ? t("aiReport.savingsIncreasing") : t("aiReport.savingsDecreasing"), color: analysis.savingsTrend === "up" ? "bg-green-500" : "bg-amber-500", pct: undefined },
              ].map((ins, i) => (
                <motion.div key={ins.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.05 }}>
                  <Card className="hover:shadow-md transition-shadow h-full"><CardContent className="p-5">
                    <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl", ins.color)}><ins.icon className="w-5 h-5 text-white" /></div>
                    <p className="text-xs font-medium text-muted-foreground mt-3">{ins.title}</p>
                    <p className="text-sm font-semibold mt-1">{ins.value}</p>
                    {ins.pct !== undefined && <Progress value={ins.pct} className="mt-3 h-2" />}
                  </CardContent></Card>
                </motion.div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold tracking-tight mb-4">{t("aiReport.recommendations")}</h2>
            <div className="space-y-3">
              {analysis.recommendations.map((rec, i) => (
                <motion.div key={rec.title} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.05 }}>
                  <Card className="hover:shadow-md transition-shadow"><CardContent className="p-4 flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 shrink-0"><rec.icon className="w-5 h-5 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{rec.title}</p>
                        <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", IMPACT[rec.impact])}>{rec.impact}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{rec.description}</p>
                    </div>
                  </CardContent></Card>
                </motion.div>
              ))}
            </div>
          </div>

          <Separator />

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">{t("aiReport.monthlyScoreTrend")}</CardTitle><CardDescription>{t("aiReport.scoreTrendDesc")}</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={analysis.trend}>
                    <defs><linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" /><YAxis domain={[0, 100]} className="text-xs" /><Tooltip />
                    <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fill="url(#scoreGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Calendar className="w-4 h-4" /> {t("aiReport.futureProjections")}</CardTitle><CardDescription>{t("aiReport.projectionsDesc")}</CardDescription></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {analysis.projections.map((p) => (
                    <div key={p.label} className="text-center p-4 rounded-xl bg-muted/50">
                      <p className="text-xs text-muted-foreground">{p.label}</p>
                      <p className="text-xl font-bold mt-1">{formatCurrency(p.amount)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t("aiReport.estimatedSavings")}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}
