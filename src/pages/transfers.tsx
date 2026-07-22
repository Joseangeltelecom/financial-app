import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ArrowLeftRight, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccounts } from "@/hooks/use-accounts";
import { useTransfers, useCreateTransfer, useDeleteTransfer } from "@/hooks/use-transfers";
import { cn, formatCurrency } from "@/lib/utils";
import { CURRENCIES } from "@/config/constants";
import { format } from "date-fns";
import { toast } from "sonner";

function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

function TransferForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  accounts,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: {
    from_account_id: string;
    to_account_id: string;
    from_amount: number;
    to_amount: number;
    exchange_rate: number;
    from_currency: string;
    to_currency: string;
    notes: string | null;
    date: string;
  }) => void;
  isLoading: boolean;
  accounts: any[];
}) {
  const { t } = useTranslation();
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");

  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);

  useEffect(() => {
    if (fromAccount && toAccount && fromAccount.currency === toAccount.currency) {
      setExchangeRate("1");
      if (fromAmount) setToAmount(fromAmount);
    } else if (fromAccount && toAccount) {
      const fromNum = parseFloat(fromAmount) || 0;
      const toNum = parseFloat(toAmount) || 0;
      const rateNum = parseFloat(exchangeRate) || 1;
      if (fromNum > 0 && toNum > 0 && rateNum === 1) {
        setExchangeRate((toNum / fromNum).toFixed(6));
      }
    }
  }, [fromAccountId, toAccountId]);

  const handleFromAmountChange = (val: string) => {
    setFromAmount(val);
    const fromNum = parseFloat(val) || 0;
    const rate = parseFloat(exchangeRate) || 1;
    if (fromNum > 0 && rate > 0) {
      setToAmount((fromNum * rate).toFixed(2));
    } else {
      setToAmount("");
    }
  };

  const handleToAmountChange = (val: string) => {
    setToAmount(val);
    const fromNum = parseFloat(fromAmount) || 0;
    const toNum = parseFloat(val) || 0;
    if (fromNum > 0 && toNum > 0) {
      setExchangeRate((toNum / fromNum).toFixed(6));
    }
  };

  const handleExchangeRateChange = (val: string) => {
    setExchangeRate(val);
    const fromNum = parseFloat(fromAmount) || 0;
    const rate = parseFloat(val) || 0;
    if (fromNum > 0 && rate > 0) {
      setToAmount((fromNum * rate).toFixed(2));
    }
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setFromAccountId("");
      setToAccountId("");
      setFromAmount("");
      setToAmount("");
      setExchangeRate("1");
      setDate(format(new Date(), "yyyy-MM-dd"));
      setNotes("");
    }
    onOpenChange(v);
  };

  const canSubmit =
    fromAccountId &&
    toAccountId &&
    fromAccountId !== toAccountId &&
    parseFloat(fromAmount) > 0 &&
    parseFloat(toAmount) > 0;

  const handleSubmit = () => {
    if (!canSubmit || !fromAccount || !toAccount) return;
    onSubmit({
      from_account_id: fromAccountId,
      to_account_id: toAccountId,
      from_amount: parseFloat(fromAmount),
      to_amount: parseFloat(toAmount),
      exchange_rate: parseFloat(exchangeRate) || 1,
      from_currency: fromAccount.currency,
      to_currency: toAccount.currency,
      notes: notes || null,
      date,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t("transfers.createTransfer")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("transfers.fromAccount")}</Label>
            <Select value={fromAccountId} onValueChange={setFromAccountId}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={t("transfers.selectAccount")} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} ({getCurrencySymbol(a.currency)} {a.currency}) — {formatCurrency((a.balance || 0) + (a.initial_balance || 0), a.currency)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-2">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("transfers.toAccount")}</Label>
            <Select value={toAccountId} onValueChange={setToAccountId}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={t("transfers.selectAccount")} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} ({getCurrencySymbol(a.currency)} {a.currency}) — {formatCurrency((a.balance || 0) + (a.initial_balance || 0), a.currency)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>{t("transfers.fromAmount")}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {fromAccount ? getCurrencySymbol(fromAccount.currency) : ""}
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={fromAmount}
                  onChange={(e) => handleFromAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="pl-7 bg-background"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("transfers.exchangeRate")}</Label>
              <Input
                type="number"
                step="0.000001"
                min="0"
                value={exchangeRate}
                onChange={(e) => handleExchangeRateChange(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("transfers.toAmount")}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {toAccount ? getCurrencySymbol(toAccount.currency) : ""}
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={toAmount}
                  onChange={(e) => handleToAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="pl-7 bg-background"
                />
              </div>
            </div>
          </div>

          {fromAccount && toAccount && (
            <div className="flex items-center justify-center gap-3 rounded-lg border border-border/50 bg-muted/30 px-4 py-2.5 text-sm">
              <span className="font-medium text-foreground">
                {formatCurrency(parseFloat(fromAmount) || 0, fromAccount.currency)} {fromAccount.currency}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">
                {formatCurrency(parseFloat(toAmount) || 0, toAccount.currency)} {toAccount.currency}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("common.date")}</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-background" />
          </div>

          <div className="space-y-2">
            <Label>
              {t("common.notes")} <span className="text-muted-foreground text-xs">{t("common.optional")}</span>
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("transactions.form.notesPlaceholder")}
              className="bg-background resize-none h-20"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit || isLoading}>
              {isLoading ? "..." : t("transfers.createTransfer")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TransfersPage() {
  const { t } = useTranslation();
  const { data: transfers = [], isLoading } = useTransfers();
  const { data: accounts = [] } = useAccounts();
  const createMutation = useCreateTransfer();
  const deleteMutation = useDeleteTransfer();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any>(null);

  const totalAmount = useMemo(() => {
    return transfers.reduce((sum: number, tr: any) => sum + (tr.from_amount || 0), 0);
  }, [transfers]);

  const totalTransfers = transfers.length;

  const handleCreate = (data: any) => {
    createMutation.mutate(
      {
        ...data,
        user_id: "",
      },
      {
        onSuccess: () => {
          toast.success(t("transfers.createTransfer"));
          setFormOpen(false);
        },
        onError: () => toast.error("Failed to create transfer"),
      }
    );
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.id, {
      onSuccess: () => {
        toast.success(t("transfers.deleteTransfer"));
        setDeleteItem(null);
      },
      onError: () => toast.error("Failed to delete transfer"),
    });
  };

  const getAccountDisplay = (account: any, amount: number) => {
    if (!account) return "—";
    return (
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: account.color }}
        />
        <span className="font-medium">{account.name}</span>
        <span className="text-muted-foreground text-xs ml-1">
          {formatCurrency(amount, account.currency)}
        </span>
      </span>
    );
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
            <h1 className="text-3xl font-bold tracking-tight">{t("transfers.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("transfers.description")}</p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("transfers.newTransfer")}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("transfers.totalTransfers")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight">{totalTransfers}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("transfers.fromAmount")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight">{formatCurrency(totalAmount)}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground">
                      <th className="p-3 text-left font-medium">{t("common.date")}</th>
                      <th className="p-3 text-left font-medium">{t("transfers.fromAccount")}</th>
                      <th className="p-3 text-right font-medium">{t("transfers.fromAmount")}</th>
                      <th className="p-3 text-center font-medium">{t("transfers.exchangeRate")}</th>
                      <th className="p-3 text-left font-medium">{t("transfers.toAccount")}</th>
                      <th className="p-3 text-right font-medium">{t("transfers.toAmount")}</th>
                      <th className="p-3 text-left font-medium">{t("common.notes")}</th>
                      <th className="p-3 text-right font-medium">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <AnimatePresence mode="popLayout">
                    <tbody>
                      {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="border-b border-border/50">
                            {Array.from({ length: 8 }).map((_, j) => (
                              <td key={j} className="p-3">
                                <Skeleton className="h-5 w-full" />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : transfers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-12 text-center">
                            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
                                <ArrowLeftRight className="h-7 w-7" />
                              </div>
                              <p className="text-sm font-medium">{t("transfers.noTransfers")}</p>
                              <p className="text-xs">{t("transfers.noTransfersDesc")}</p>
                              <Button variant="outline" size="sm" onClick={() => setFormOpen(true)} className="gap-2">
                                <Plus className="h-4 w-4" />
                                {t("transfers.newTransfer")}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        transfers.map((transfer: any) => (
                          <motion.tr
                            key={transfer.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                          >
                            <td className="p-3 text-muted-foreground text-sm">
                              {transfer.date ? format(new Date(transfer.date), "MMM d, yyyy") : "—"}
                            </td>
                            <td className="p-3">
                              {getAccountDisplay(transfer.from_account, transfer.from_amount)}
                            </td>
                            <td className="p-3 text-right font-semibold tabular-nums">
                              {formatCurrency(transfer.from_amount, transfer.from_currency)}
                            </td>
                            <td className="p-3 text-center text-muted-foreground tabular-nums">
                              {transfer.exchange_rate ?? 1}
                            </td>
                            <td className="p-3">
                              {getAccountDisplay(transfer.to_account, transfer.to_amount)}
                            </td>
                            <td className="p-3 text-right font-semibold tabular-nums">
                              {formatCurrency(transfer.to_amount, transfer.to_currency)}
                            </td>
                            <td className="p-3 text-muted-foreground text-sm max-w-[150px] truncate">
                              {transfer.notes || "—"}
                            </td>
                            <td className="p-3 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-rose-500 hover:text-rose-600"
                                onClick={() => setDeleteItem(transfer)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </AnimatePresence>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Button
        onClick={() => setFormOpen(true)}
        size="icon"
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg shadow-primary/25 z-50 lg:hidden"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <TransferForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
        accounts={accounts}
      />

      <Dialog open={!!deleteItem} onOpenChange={(v) => { if (!v) setDeleteItem(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t("transfers.deleteTransfer")}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">{t("transfers.deleteConfirm")}</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteItem(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
