import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Target, Calendar, TrendingUp, Edit, Trash2, PiggyBank, Trophy, DollarSign, ArrowDownToLine, ArrowUpFromLine, History } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useSavingsGoals, useCreateSavingsGoal, useUpdateSavingsGoal, useDeleteSavingsGoal } from "@/hooks/use-savings";
import { useSavingsTransactions, useCreateSavingsTransaction, useDeleteSavingsTransaction } from "@/hooks/use-savings-transactions";
import { useAccounts } from "@/hooks/use-accounts";
import { useTransactions } from "@/hooks/use-transactions";
import { cn, formatCurrency, getPercentage } from "@/lib/utils";
import { CHART_COLORS, CURRENCIES } from "@/config/constants";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const goalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  target_amount: z.number().positive("Target must be positive"),
  current_amount: z.number().min(0, "Cannot be negative").optional(),
  currency: z.string().min(1, "Currency is required"),
  deadline: z.string().optional(),
  color: z.string().optional(),
});
type GoalFormData = z.infer<typeof goalSchema>;

const transferSchema = z.object({
  account_id: z.string().min(1, "Account is required"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional(),
});
type TransferFormData = z.infer<typeof transferSchema>;

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
  onDeposit,
  onWithdraw,
  onViewHistory,
}: {
  goal: any;
  onEdit: (g: any) => void;
  onDelete: (g: any) => void;
  onDeposit: (g: any) => void;
  onWithdraw: (g: any) => void;
  onViewHistory: (g: any) => void;
}) {
  const { t } = useTranslation();
  const pct = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
  const Icon = getIconForGoal(goal);
  const color = goal.color || PRESET_COLORS[0];
  const isComplete = goal.current_amount >= goal.target_amount;
  const currency = goal.currency || "USD";

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
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{goal.name}</h3>
                  <Badge variant="secondary" className="text-[10px] px-1.5 h-4 font-medium">{currency}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatCurrency(goal.current_amount, currency)} / {formatCurrency(goal.target_amount, currency)}
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
              <span>{t("savings.progress")}</span>
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
                <Trophy className="h-3 w-3" /> {t("savings.goalAchieved")}
              </Badge>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs"
              onClick={() => onDeposit(goal)}
              disabled={isComplete}
            >
              <ArrowDownToLine className="h-3.5 w-3.5" />
              {t("savings.deposit")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs"
              onClick={() => onWithdraw(goal)}
              disabled={goal.current_amount <= 0}
            >
              <ArrowUpFromLine className="h-3.5 w-3.5" />
              {t("savings.withdraw")}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => onViewHistory(goal)}
            >
              <History className="h-3.5 w-3.5" />
            </Button>
          </div>
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
  const { t } = useTranslation();
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
      currency: "USD",
      deadline: "",
      color: PRESET_COLORS[0],
      ...defaultValues,
    },
  });

  const selectedColor = watch("color") || "#6366f1";
  const selectedCurrency = watch("currency") || "USD";
  const currencySymbol = CURRENCIES.find((c) => c.code === selectedCurrency)?.symbol || "$";

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{defaultValues?.name ? t("savings.editGoal") : t("savings.createGoal")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("savings.form.goalName")}</Label>
            <Input {...register("name")} placeholder={t("savings.form.goalNamePlaceholder")} className="bg-background" />
            {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t("savings.form.currency")}</Label>
            <Select value={selectedCurrency} onValueChange={(v) => setValue("currency", v)}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="USD" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span>{c.symbol} {c.name} ({c.code})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.currency && <p className="text-xs text-rose-500">{errors.currency.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("savings.form.targetAmount")}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span>
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
              <Label>{t("savings.form.currentAmount")}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span>
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
            <Label>{t("savings.form.deadline")} <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input type="date" {...register("deadline")} className="bg-background" />
          </div>

          <div className="space-y-2">
            <Label>{t("savings.form.color")}</Label>
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
            <Label>{t("savings.form.icon")}</Label>
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
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t("common.saving") : defaultValues?.name ? t("savings.form.saveChanges") : t("savings.createGoal")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TransferDialog({
  open,
  onOpenChange,
  goal,
  type,
  accounts,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  goal: any;
  type: "deposit" | "withdrawal";
  accounts: any[];
  onSubmit: (data: TransferFormData) => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      account_id: "",
      amount: undefined,
      description: "",
    },
  });

  const selectedAccountId = watch("account_id");

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const isDeposit = type === "deposit";
  const goalCurrency = goal?.currency || "USD";
  const goalCurrencySymbol = CURRENCIES.find((c) => c.code === goalCurrency)?.symbol || "$";
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const accountCurrencySymbol = selectedAccount
    ? CURRENCIES.find((c) => c.code === selectedAccount.currency)?.symbol || "$"
    : "$";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{isDeposit ? t("savings.depositTitle") : t("savings.withdrawTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg"
              style={{ backgroundColor: `${goal?.color || PRESET_COLORS[0]}15` }}
            >
              {isDeposit
                ? <ArrowDownToLine className="h-4 w-4" style={{ color: goal?.color || PRESET_COLORS[0] }} />
                : <ArrowUpFromLine className="h-4 w-4" style={{ color: goal?.color || PRESET_COLORS[0] }} />
              }
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{goal?.name}</p>
                <Badge variant="secondary" className="text-[10px] px-1.5 h-4 font-medium">{goalCurrency}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {isDeposit ? t("savings.depositDesc") : t("savings.withdrawDesc")}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("savings.selectAccount")}</Label>
            <Select value={selectedAccountId} onValueChange={(v) => setValue("account_id", v)}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={t("savings.selectAccount")} />
              </SelectTrigger>
              <SelectContent>
                {accounts.filter((a) => a.is_active && a.currency === goalCurrency).map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center gap-2">
                      <span>{account.name}</span>
                      <span className="text-muted-foreground text-xs">
                        ({formatCurrency(account.balance + (account.initial_balance || 0), account.currency)})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.account_id && <p className="text-xs text-rose-500">{errors.account_id.message}</p>}
            {accounts.filter((a) => a.is_active && a.currency === goalCurrency).length === 0 && (
              <p className="text-xs text-amber-500">
                {t("savings.noAccountsWithCurrency", { currency: goalCurrency })}
              </p>
            )}
            {selectedAccount && selectedAccount.currency !== goalCurrency && (
              <p className="text-xs text-rose-500">
                {t("savings.currencyMismatch", { from: selectedAccount.currency, to: goalCurrency })}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("savings.amount")}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{goalCurrencySymbol}</span>
              <Input
                type="number"
                step="0.01"
                {...register("amount", { valueAsNumber: true })}
                placeholder="0.00"
                className="pl-7 bg-background"
              />
            </div>
            {errors.amount && <p className="text-xs text-rose-500">{errors.amount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t("savings.description")} <span className="text-muted-foreground text-xs">({t("common.optional")})</span></Label>
            <Input
              {...register("description")}
              placeholder={t("savings.descriptionPlaceholder")}
              className="bg-background"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleClose(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading || (selectedAccount != null && selectedAccount.currency !== goalCurrency)}>
              {isLoading ? t("common.saving") : isDeposit ? t("savings.confirmDeposit") : t("savings.confirmWithdraw")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TransactionHistoryDialog({
  open,
  onOpenChange,
  goal,
  transactions,
  onDelete,
  isDeleting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  goal: any;
  transactions: any[];
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const { t } = useTranslation();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const goalTransactions = transactions.filter((st) => st.saving_goal_id === goal?.id);
  const goalCurrency = goal?.currency || "USD";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            {t("savings.transactionHistory")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {goalTransactions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <History className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{t("savings.noTransactions")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("savings.noTransactionsDesc")}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {goalTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-lg",
                      tx.type === "deposit" ? "bg-emerald-500/10" : "bg-amber-500/10",
                    )}>
                      {tx.type === "deposit"
                        ? <ArrowDownToLine className="h-4 w-4 text-emerald-500" />
                        : <ArrowUpFromLine className="h-4 w-4 text-amber-500" />
                      }
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] px-1.5 h-4",
                            tx.type === "deposit"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-amber-500/10 text-amber-500",
                          )}
                        >
                          {tx.type === "deposit" ? t("savings.depositLabel") : t("savings.withdrawalLabel")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{tx.account?.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(tx.date), "MMM d, yyyy")}
                        {tx.description && ` - ${tx.description}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-medium tabular-nums",
                      tx.type === "deposit" ? "text-emerald-500" : "text-amber-500",
                    )}>
                      {tx.type === "deposit" ? "+" : "-"}{formatCurrency(tx.amount, goalCurrency)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-rose-500"
                      onClick={() => setDeleteId(tx.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>

      <Dialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t("savings.deleteTransaction")}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">{t("savings.deleteTransactionConfirm")}</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
              disabled={isDeleting}
            >
              {isDeleting ? t("common.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

export default function SavingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: goals = [], isLoading: goalsLoading } = useSavingsGoals();
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions();
  const { data: savingsTransactions = [] } = useSavingsTransactions();
  const createMutation = useCreateSavingsGoal();
  const updateMutation = useUpdateSavingsGoal();
  const deleteMutation = useDeleteSavingsGoal();
  const createSavingsTxMutation = useCreateSavingsTransaction();
  const deleteSavingsTxMutation = useDeleteSavingsTransaction();

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [chartTimeFilter, setChartTimeFilter] = useState("monthly");
  const [transferDialog, setTransferDialog] = useState<{ open: boolean; goal: any; type: "deposit" | "withdrawal" }>({
    open: false, goal: null, type: "deposit",
  });
  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; goal: any }>({
    open: false, goal: null,
  });

  const [baseCurrency, setBaseCurrency] = useState<string>("USD");
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

  useEffect(() => {
    const saved = localStorage.getItem("base_currency");
    if (saved) setBaseCurrency(saved);
    try {
      const rates = JSON.parse(localStorage.getItem("exchange_rates") || "{}");
      setExchangeRates(rates);
    } catch {}
  }, []);

  const toBase = (amount: number, currency?: string | null) => {
    if (!currency || currency === baseCurrency) return amount;
    const rate = exchangeRates[currency];
    return (rate != null && rate > 0) ? amount / rate : amount;
  };

  const baseCurrencySymbol = CURRENCIES.find((c) => c.code === baseCurrency)?.symbol || "$";

  const openCreate = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  const handleSubmit = (data: GoalFormData) => {
    const payload = { ...data, deadline: data.deadline || null, icon: editItem?.icon || "PiggyBank" };
    if (editItem) {
      updateMutation.mutate(
        { id: editItem.id, ...payload },
        {
          onSuccess: () => {
            toast.success(t("savings.goalUpdated"));
            setFormOpen(false);
          },
          onError: () => toast.error(t("savings.goalUpdateError")),
        },
      );
    } else {
      createMutation.mutate(
        { ...payload, user_id: user?.id, current_amount: data.current_amount || 0, is_active: true, currency: data.currency || "USD" } as any,
        {
          onSuccess: () => {
            toast.success(t("savings.goalCreated"));
            setFormOpen(false);
          },
          onError: () => toast.error(t("savings.goalCreateError")),
        },
      );
    }
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.id, {
      onSuccess: () => {
        toast.success(t("savings.goalDeleted"));
        setDeleteItem(null);
      },
      onError: () => toast.error(t("savings.goalDeleteError")),
    });
  };

  const handleTransfer = (data: TransferFormData) => {
    if (!transferDialog.goal) return;
    createSavingsTxMutation.mutate(
      {
        user_id: user?.id!,
        saving_goal_id: transferDialog.goal.id,
        account_id: data.account_id,
        type: transferDialog.type,
        amount: data.amount,
        description: data.description || null,
        date: format(new Date(), "yyyy-MM-dd"),
      },
      {
        onSuccess: () => {
          toast.success(transferDialog.type === "deposit" ? t("savings.depositSuccess") : t("savings.withdrawSuccess"));
          setTransferDialog({ open: false, goal: null, type: "deposit" });
        },
        onError: () => toast.error(transferDialog.type === "deposit" ? t("savings.depositError") : t("savings.withdrawError")),
      },
    );
  };

  const handleDeleteSavingsTx = (id: string) => {
    deleteSavingsTxMutation.mutate(id, {
      onSuccess: () => {
        toast.success(t("common.delete") + " " + t("common.confirm").toLowerCase());
      },
    });
  };

  const incomeTx = transactions.filter((tx: any) => tx.type === "income" && tx.date);
  const expenseTx = transactions.filter((tx: any) => tx.type === "expense" && tx.date);

  const monthlySavingsData = useMemo(() => {
    const map = new Map<string, { income: number; expense: number; count: number }>();
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = format(d, "yyyy-MM");
      const label = format(d, "MMM yyyy");
      map.set(key, { income: 0, expense: 0, count: 0 });
    }
    incomeTx.forEach((tx: any) => {
      const key = format(new Date(tx.date), "yyyy-MM");
      if (map.has(key)) map.get(key)!.income += toBase(tx.amount, tx.accounts?.currency);
    });
    expenseTx.forEach((tx: any) => {
      const key = format(new Date(tx.date), "yyyy-MM");
      if (map.has(key)) map.get(key)!.expense += toBase(tx.amount, tx.accounts?.currency);
    });
    return Array.from(map, ([key, val]) => ({
      month: key,
      label: format(new Date(key + "-01"), "MMM yy"),
      savings: val.income - val.expense,
      income: val.income,
      expense: val.expense,
      savingsPct: val.income > 0 ? ((val.income - val.expense) / val.income) * 100 : 0,
    }));
  }, [incomeTx, expenseTx, baseCurrency, exchangeRates]);

  const chartData = useMemo(() => {
    const now = new Date();
    if (chartTimeFilter === "daily") {
      return Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (29 - i));
        const key = format(d, "yyyy-MM-dd");
        const dayIncome = incomeTx.filter((tx: any) => format(new Date(tx.date), "yyyy-MM-dd") === key).reduce((s: number, tx: any) => s + toBase(tx.amount, tx.accounts?.currency), 0);
        const dayExpense = expenseTx.filter((tx: any) => format(new Date(tx.date), "yyyy-MM-dd") === key).reduce((s: number, tx: any) => s + toBase(tx.amount, tx.accounts?.currency), 0);
        return { name: format(d, "MMM d"), savings: dayIncome - dayExpense };
      });
    }
    if (chartTimeFilter === "weekly") {
      return Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (11 - i) * 7);
        const end = new Date(d.getTime() + 6 * 86400000);
        const weekIncome = incomeTx.filter((tx: any) => { const td = new Date(tx.date); return td >= d && td <= end; }).reduce((s: number, tx: any) => s + toBase(tx.amount, tx.accounts?.currency), 0);
        const weekExpense = expenseTx.filter((tx: any) => { const td = new Date(tx.date); return td >= d && td <= end; }).reduce((s: number, tx: any) => s + toBase(tx.amount, tx.accounts?.currency), 0);
        return { name: format(d, "MMM d"), savings: weekIncome - weekExpense };
      });
    }
    if (chartTimeFilter === "yearly") {
      return Array.from({ length: 5 }, (_, i) => {
        const y = now.getFullYear() - 4 + i;
        const yearIncome = incomeTx.filter((tx: any) => new Date(tx.date).getFullYear() === y).reduce((s: number, tx: any) => s + toBase(tx.amount, tx.accounts?.currency), 0);
        const yearExpense = expenseTx.filter((tx: any) => new Date(tx.date).getFullYear() === y).reduce((s: number, tx: any) => s + toBase(tx.amount, tx.accounts?.currency), 0);
        return { name: String(y), savings: yearIncome - yearExpense };
      });
    }
    return monthlySavingsData.map((d) => ({ name: d.label, savings: d.savings }));
  }, [incomeTx, expenseTx, chartTimeFilter, monthlySavingsData, baseCurrency, exchangeRates]);

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
            <h1 className="text-3xl font-bold tracking-tight">{t("savings.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("savings.description")}</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> {t("savings.addGoal")}
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
                    <span>{t("savings.annualEstimate")}</span>
                  </div>
                  <p className="text-3xl font-bold tracking-tight">
                    {annualEstimate >= 0 ? "+" : ""}{formatCurrency(annualEstimate, baseCurrency)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Based on your {format(new Date(), "MMMM")} savings of{" "}
                    {currentMonthData ? formatCurrency(currentMonthData.savings, baseCurrency) : formatCurrency(0, baseCurrency)}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full text-sm font-medium">
                  <TrendingUp className="h-4 w-4" />
                  {annualEstimate > 0 ? t("savings.onTrack") : t("savings.needsAttention")}
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
                {t("savings.savingsOverTime")}
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
                      tickFormatter={(v: number) => `${baseCurrencySymbol}${v}`}
                    />
                    <Tooltip
                      formatter={(v) => [formatCurrency(Number(v), baseCurrency), t("savings.savingsGoals")]}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        color: "hsl(var(--foreground))",
                      }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                      labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                      cursor={{ fill: "rgba(99, 102, 241, 0.12)" }}
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
            <h2 className="text-lg font-semibold">{t("savings.savingsGoals")}</h2>
            <Badge variant="secondary" className="font-normal">
              {t("savings.goalCount", { count: goals.length })}
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
                      <h3 className="text-lg font-semibold">{t("savings.noGoals")}</h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        {t("savings.noGoalsDesc")}
                      </p>
                    </div>
                    <Button onClick={openCreate} className="gap-2 mt-2">
                      <Plus className="h-4 w-4" /> {t("savings.setFirstGoal")}
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
                  onDeposit={(g) => setTransferDialog({ open: true, goal: g, type: "deposit" })}
                  onWithdraw={(g) => setTransferDialog({ open: true, goal: g, type: "withdrawal" })}
                  onViewHistory={(g) => setHistoryDialog({ open: true, goal: g })}
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
              <CardTitle className="text-sm font-medium">{t("savings.monthlyBreakdown")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground">
                      <th className="p-3 text-left font-medium">{t("common.date")}</th>
                      <th className="p-3 text-left font-medium">{t("savings.form.targetAmount")}</th>
                      <th className="p-3 text-left font-medium">Actual Savings</th>
                      <th className="p-3 text-left font-medium">{t("savings.savingsRate")}</th>
                      <th className="p-3 text-left font-medium">{t("savings.annualEstimateCol")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlySavingsData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">
                          {t("savings.noTransactionData")}
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
                                    {t("savings.current")}
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              {goals.length > 0 ? (
                                <span className="tabular-nums">{formatCurrency(toBase(goals[0]?.target_amount || 0, goals[0]?.currency), baseCurrency)}</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className={cn(
                              "p-3 font-medium tabular-nums",
                              row.savings >= 0 ? "text-emerald-500" : "text-rose-500",
                            )}>
                              {row.savings >= 0 ? "+" : ""}{formatCurrency(row.savings, baseCurrency)}
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
                              {row.savings >= 0 ? "+" : ""}{formatCurrency(row.savings * 12, baseCurrency)}
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
                currency: editItem.currency || "USD",
                deadline: editItem.deadline?.slice(0, 10),
                color: editItem.color || PRESET_COLORS[0],
                icon: editItem.icon || "PiggyBank",
              }
            : undefined
        }
      />

      {/* Deposit/Withdraw Dialog */}
      <TransferDialog
        open={transferDialog.open}
        onOpenChange={(v) => setTransferDialog((prev) => ({ ...prev, open: v }))}
        goal={transferDialog.goal}
        type={transferDialog.type}
        accounts={accounts}
        onSubmit={handleTransfer}
        isLoading={createSavingsTxMutation.isPending}
      />

      {/* Transaction History Dialog */}
      <TransactionHistoryDialog
        open={historyDialog.open}
        onOpenChange={(v) => setHistoryDialog((prev) => ({ ...prev, open: v }))}
        goal={historyDialog.goal}
        transactions={savingsTransactions}
        onDelete={handleDeleteSavingsTx}
        isDeleting={deleteSavingsTxMutation.isPending}
      />

      {/* Delete Goal Confirmation */}
      <Dialog open={!!deleteItem} onOpenChange={(v) => { if (!v) setDeleteItem(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t("savings.deleteGoal")}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            {t("savings.deleteConfirm", { name: deleteItem?.name })}
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteItem(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
