import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit, Wallet, Landmark, Banknote, CreditCard, PiggyBank, ArrowRight, Settings2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from "@/hooks/use-accounts";
import { CURRENCIES } from "@/config/constants";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const ACCOUNT_TYPES = ["checking", "savings", "cash", "wallet", "credit"] as const;

const PRESET_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6"];

const TYPE_ICONS: Record<string, typeof Wallet> = {
  checking: Landmark,
  savings: PiggyBank,
  cash: Banknote,
  wallet: Wallet,
  credit: CreditCard,
};

const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  currency: z.string().min(1, "Currency is required"),
  color: z.string().min(1, "Color is required"),
  initial_balance: z.number().min(0, "Balance must be 0 or more"),
});

type AccountFormData = z.infer<typeof accountSchema>;

function AccountForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  defaultValues,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: AccountFormData) => void;
  isLoading: boolean;
  defaultValues?: Partial<AccountFormData>;
}) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "checking",
      currency: "USD",
      color: "#6366f1",
      initial_balance: 0,
      ...defaultValues,
    },
  });

  const color = watch("color");
  const type = watch("type");

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? t("accounts.editAccount") : t("accounts.createAccount")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("accounts.form.name")}</Label>
            <Input
              {...register("name")}
              placeholder={t("accounts.form.namePlaceholder")}
              className="bg-background"
            />
            {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t("accounts.form.type")}</Label>
            <Select value={type} onValueChange={(v) => setValue("type", v)}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((tp) => (
                  <SelectItem key={tp} value={tp}>
                    <span className="flex items-center gap-2 capitalize">
                      {(() => {
                        const Icon = TYPE_ICONS[tp] || Wallet;
                        return <Icon className="h-4 w-4" />;
                      })()}
                      {tp}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("accounts.form.currency")}</Label>
            <Select
              value={watch("currency")}
              onValueChange={(v) => setValue("currency", v)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} {c.code} - {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("accounts.form.initialBalance")}</Label>
            <div className="relative">
              <Input type="number" step="0.01" {...register("initial_balance", { valueAsNumber: true })} placeholder="0.00" className="pl-7 bg-background" />
            </div>
            {errors.initial_balance && <p className="text-xs text-rose-500">{errors.initial_balance.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t("accounts.form.color")}</Label>
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setValue("color", c)}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all",
                      color === c ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <Input
              value={color}
              onChange={(e) => setValue("color", e.target.value)}
              className="bg-background font-mono text-sm"
              placeholder="#6366f1"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleClose(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "..." : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AccountsPage() {
  const { t } = useTranslation();
  const { data: accounts = [], isLoading } = useAccounts();
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deleteMutation = useDeleteAccount();

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [ratesOpen, setRatesOpen] = useState(false);

  const [baseCurrency, setBaseCurrency] = useState<string>(() => {
    return localStorage.getItem("base_currency") || "USD";
  });
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem("exchange_rates") || "{}"); } catch { return {}; }
  });

  useEffect(() => { localStorage.setItem("base_currency", baseCurrency); }, [baseCurrency]);
  useEffect(() => { localStorage.setItem("exchange_rates", JSON.stringify(exchangeRates)); }, [exchangeRates]);

  const uniqueCurrencies = useMemo(() => {
    const set = new Set(accounts.map((a: any) => a.currency).filter(Boolean));
    return Array.from(set);
  }, [accounts]);

  const hasMultipleCurrencies = uniqueCurrencies.length > 1;

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum: number, a: any) => {
      const amt = (a.balance || 0) + (a.initial_balance || 0);
      if (a.currency === baseCurrency) return sum + amt;
      const rate = exchangeRates[a.currency];
      if (rate != null && rate > 0) return sum + (amt / rate);
      return sum + amt;
    }, 0);
  }, [accounts, baseCurrency, exchangeRates]);

  const setRate = (code: string, value: string) => {
    const num = parseFloat(value);
    setExchangeRates((prev) => ({ ...prev, [code]: isNaN(num) ? 0 : num }));
  };

  const getCurrencySymbol = (code: string) => {
    return CURRENCIES.find((c) => c.code === code)?.symbol || code;
  };

  const openCreate = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  const openEdit = (account: any) => {
    setEditItem(account);
    setFormOpen(true);
  };

  const handleSubmit = (data: AccountFormData) => {
    const icon = TYPE_ICONS[data.type] ? data.type : "wallet";
    if (editItem) {
      updateMutation.mutate(
        { ...data, icon, id: editItem.id, balance: editItem.balance, user_id: editItem.user_id, is_active: editItem.is_active },
        {
          onSuccess: () => {
            toast.success(t("accounts.editAccount"));
            setFormOpen(false);
            setEditItem(null);
          },
          onError: () => toast.error("Failed to update account"),
        }
      );
    } else {
      createMutation.mutate(
        { ...data, icon, balance: 0, user_id: "", is_active: true },
        {
          onSuccess: () => {
            toast.success(t("accounts.createAccount"));
            setFormOpen(false);
          },
          onError: () => toast.error("Failed to create account"),
        }
      );
    }
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.id, {
      onSuccess: () => {
        toast.success(t("common.delete"));
        setDeleteItem(null);
      },
      onError: () => toast.error("Failed to delete account"),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("accounts.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("accounts.description")}</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("accounts.addAccount")}
          </Button>
        </motion.div>

        {accounts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("accounts.totalBalance")}</p>
                    <p className="text-3xl font-bold tracking-tight mt-1">
                      {formatCurrency(totalBalance, baseCurrency)}
                    </p>
                    {hasMultipleCurrencies && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("accounts.baseCurrency")}: {baseCurrency}
                      </p>
                    )}
                  </div>
                  {hasMultipleCurrencies && (
                    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setRatesOpen((v) => !v)}>
                      <Settings2 className="h-4 w-4" />
                      {t("accounts.exchangeRates")}
                    </Button>
                  )}
                </div>

                <AnimatePresence>
                  {ratesOpen && hasMultipleCurrencies && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground shrink-0">{t("accounts.baseCurrency")}:</Label>
                          <Select value={baseCurrency} onValueChange={setBaseCurrency}>
                            <SelectTrigger className="h-8 w-36 text-xs bg-background"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {uniqueCurrencies.filter((c) => c !== baseCurrency).map((code) => (
                            <div key={code} className="flex items-center gap-2">
                              <Badge variant="secondary" className="shrink-0 font-mono text-xs">1 {baseCurrency}</Badge>
                              <div className="relative flex-1">
                                <Input
                                  type="number"
                                  step="0.0001"
                                  value={exchangeRates[code] ?? ""}
                                  onChange={(e) => setRate(code, e.target.value)}
                                  placeholder="—"
                                  className="h-8 text-xs bg-background tabular-nums"
                                />
                              </div>
                              <span className="text-xs text-muted-foreground shrink-0">{code}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground/70">{t("accounts.exchangeRatesHint")}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Wallet className="h-9 w-9 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">{t("accounts.noAccounts")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("accounts.noAccountsDesc")}</p>
            <Button onClick={openCreate} className="mt-6 gap-2">
              <Plus className="h-4 w-4" />
              {t("accounts.addAccount")}
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {accounts.map((account: any, index: number) => {
                const currency = CURRENCIES.find((c) => c.code === account.currency);
                const TypeIcon = TYPE_ICONS[account.type] || Wallet;
                return (
                  <motion.div
                    key={account.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-border/50 bg-card/50 backdrop-blur hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group relative overflow-hidden">
                      <div
                        className="absolute top-0 left-0 w-full h-1"
                        style={{ backgroundColor: account.color || "#6366f1" }}
                      />
                      <CardContent className="pt-6 pb-4 px-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-10 w-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${account.color || "#6366f1"}15` }}
                            >
                              <TypeIcon className="h-5 w-5" style={{ color: account.color || "#6366f1" }} />
                            </div>
                            <div>
                              <p className="font-semibold leading-tight">{account.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(account)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rose-500 hover:text-rose-600"
                              onClick={() => setDeleteItem(account)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-2xl font-bold tabular-nums">
                            {currency?.symbol || ""}{((account.balance || 0) + (account.initial_balance || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="secondary" className="text-xs font-mono">
                              {account.currency}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                              asChild
                            >
                              <Link to={`/transactions?account=${account.id}`}>
                                {t("accounts.viewTransactions")}
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Button
        onClick={openCreate}
        size="icon"
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg shadow-primary/25 z-50 lg:hidden"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <AccountForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
        defaultValues={
          editItem
            ? {
                name: editItem.name,
                type: editItem.type,
                currency: editItem.currency,
                color: editItem.color,
                initial_balance: editItem.initial_balance || 0,
              }
            : undefined
        }
      />

      <Dialog open={!!deleteItem} onOpenChange={(v) => { if (!v) setDeleteItem(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t("accounts.deleteAccount")}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            {t("accounts.deleteConfirm", { name: deleteItem?.name })}
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteItem(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "..." : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
