import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit, ArrowUpRight, ArrowDownRight, ArrowLeftRight, Search, Filter, PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useTransactions, useCreateTransaction, useDeleteTransaction } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { cn, formatCurrency } from "@/lib/utils";
import { CHART_COLORS, TIME_FILTERS } from "@/config/constants";
import { format, startOfDay, startOfWeek, startOfMonth, subDays, subMonths } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const transactionSchema = z.object({
  type: z.enum(["income", "expense", "transfer"]),
  name: z.string().min(1, "Name is required"),
  amount: z.number().positive("Amount must be positive"),
  category_id: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  store: z.string().optional(),
  notes: z.string().optional(),
});
type TransactionFormData = z.infer<typeof transactionSchema>;
const TYPE_CFG = { income: { icon: ArrowUpRight, color: "text-emerald-500", bg: "bg-emerald-500/10", badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" }, expense: { icon: ArrowDownRight, color: "text-rose-500", bg: "bg-rose-500/10", badge: "bg-rose-500/10 text-rose-500 border-rose-500/20" }, transfer: { icon: ArrowLeftRight, color: "text-indigo-500", bg: "bg-indigo-500/10", badge: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" } } as const;
const CHART_STYLE = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 };

function TransactionCharts({ transactions, timeFilter, onTimeFilterChange }: { transactions: any[]; timeFilter: string; onTimeFilterChange: (v: string) => void }) {
  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    transactions.filter((t: any) => t.type === "expense").forEach((t: any) => {
      const cat = t.category?.name || "Uncategorized";
      map.set(cat, (map.get(cat) || 0) + t.amount);
    });
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const expenseOverTime = useMemo(() => {
    const now = new Date();
    const expenses = transactions.filter((t: any) => t.type === "expense" && t.date);
    const makeInterval = (d: Date, label: string) => ({ start: startOfDay(d), end: startOfDay(new Date(d.getTime() + 86400000)), label });
    let intervals: { start: Date; end: Date; label: string }[] = [];
    if (timeFilter === "daily") intervals = Array.from({ length: 30 }, (_, i) => makeInterval(subDays(now, 29 - i), format(subDays(now, 29 - i), "MMM d")));
    else if (timeFilter === "weekly") intervals = Array.from({ length: 12 }, (_, i) => { const d = subDays(now, (11 - i) * 7); return { start: startOfWeek(d), end: startOfWeek(new Date(d.getTime() + 7 * 86400000)), label: format(d, "MMM d") }; });
    else if (timeFilter === "monthly") intervals = Array.from({ length: 12 }, (_, i) => { const d = subMonths(now, 11 - i); return { start: startOfMonth(d), end: startOfMonth(new Date(d.getFullYear(), d.getMonth() + 1)), label: format(d, "MMM yyyy") }; });
    else intervals = Array.from({ length: 5 }, (_, i) => { const y = now.getFullYear() - 4 + i; return { start: new Date(y, 0, 1), end: new Date(y + 1, 0, 1), label: String(y) }; });
    return intervals.map(({ start, end, label }) => ({ name: label, amount: expenses.filter((t: any) => { const d = new Date(t.date); return d >= start && d < end; }).reduce((s: number, t: any) => s + t.amount, 0) }));
  }, [transactions, timeFilter]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><PieChartIcon className="h-4 w-4 text-muted-foreground" />Expenses by Category</CardTitle></CardHeader>
          <CardContent>
            {expenseByCategory.length === 0 ? <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">No expense data</div> : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" stroke="none">
                    {expenseByCategory.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={CHART_STYLE} />
                  <Legend verticalAlign="bottom" height={36} formatter={(v: string) => <span className="text-xs text-muted-foreground">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4 text-muted-foreground" />Expenses Over Time</CardTitle>
            <Tabs value={timeFilter} onValueChange={onTimeFilterChange}><TabsList className="h-8">{TIME_FILTERS.map((f) => <TabsTrigger key={f.value} value={f.value} className="text-xs capitalize px-2">{f.label}</TabsTrigger>)}</TabsList></Tabs>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={expenseOverTime} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v: number) => `$${v}`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={CHART_STYLE} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function TransactionRow({ transaction, onEdit, onDelete, categories }: { transaction: any; onEdit: (t: any) => void; onDelete: (t: any) => void; categories: any[] }) {
  const cfg = TYPE_CFG[transaction.type as keyof typeof TYPE_CFG] || TYPE_CFG.expense;
  const Icon = cfg.icon;
  const amtColor = transaction.type === "income" ? "text-emerald-500" : transaction.type === "expense" ? "text-rose-500" : "text-indigo-500";
  return (
    <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
      <td className="p-3"><Badge variant="outline" className={cn("capitalize gap-1 font-medium", cfg.badge)}><Icon className="h-3 w-3" />{transaction.type}</Badge></td>
      <td className="p-3 font-medium">{transaction.name}</td>
      <td className={cn("p-3 font-semibold tabular-nums", amtColor)}>{transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}{formatCurrency(transaction.amount)}</td>
      <td className="p-3"><Badge variant="secondary" className="font-normal">{categories.find((c: any) => c.id === transaction.category_id)?.name || "\u2014"}</Badge></td>
      <td className="p-3 text-muted-foreground text-sm">{transaction.date ? format(new Date(transaction.date), "MMM d, yyyy") : "\u2014"}</td>
      <td className="p-3 text-muted-foreground text-sm">{transaction.store || "\u2014"}</td>
      <td className="p-3 text-right"><div className="flex gap-1 justify-end">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(transaction)}><Edit className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-600" onClick={() => onDelete(transaction)}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div></td>
    </motion.tr>
  );
}

function TransactionForm({ open, onOpenChange, onSubmit, isLoading, defaultValues }: { open: boolean; onOpenChange: (v: boolean) => void; onSubmit: (data: TransactionFormData) => void; isLoading: boolean; defaultValues?: Partial<TransactionFormData> }) {
  const { data: categories = [] } = useCategories();
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { type: "expense", name: "", amount: 0, category_id: "", date: format(new Date(), "yyyy-MM-dd"), store: "", notes: "", ...defaultValues },
  });
  const type = watch("type");
  const handleClose = (v: boolean) => { if (!v) reset(); onOpenChange(v); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle>{defaultValues ? "Edit" : "Create"} Transaction</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex gap-2">
            {(["income", "expense", "transfer"] as const).map((t) => {
              const cfg = TYPE_CFG[t]; const Icon = cfg.icon;
              return (<button key={t} type="button" onClick={() => setValue("type", t)} className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-medium transition-all", type === t ? cn(cfg.bg, cfg.color, "border-current") : "border-border hover:bg-muted/50 text-muted-foreground")}><Icon className="h-4 w-4" />{t.charAt(0).toUpperCase() + t.slice(1)}</button>);
            })}
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...register("name")} placeholder="e.g. Grocery shopping" className="bg-background" />
            {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input type="number" step="0.01" {...register("amount", { valueAsNumber: true })} placeholder="0.00" className="pl-7 bg-background" />
            </div>
            {errors.amount && <p className="text-xs text-rose-500">{errors.amount.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={watch("category_id") || ""} onValueChange={(v) => setValue("category_id", v)}>
              <SelectTrigger className="bg-background"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" {...register("date")} className="bg-background" />
            {errors.date && <p className="text-xs text-rose-500">{errors.date.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Store <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input {...register("store")} placeholder="e.g. Amazon" className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea {...register("notes")} placeholder="Additional notes..." className="bg-background resize-none h-20" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleClose(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save Transaction"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const { data: transactions = [], isLoading } = useTransactions();
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateTransaction();
  const deleteMutation = useDeleteTransaction();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("monthly");
  const [sortField, setSortField] = useState<"date" | "amount" | "name">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (search) { const q = search.toLowerCase(); list = list.filter((t: any) => t.name?.toLowerCase().includes(q) || t.store?.toLowerCase().includes(q)); }
    if (typeFilter !== "all") list = list.filter((t: any) => t.type === typeFilter);
    list.sort((a: any, b: any) => {
      const d = sortDir === "asc" ? 1 : -1;
      if (sortField === "date") return d * (new Date(a.date).getTime() - new Date(b.date).getTime());
      if (sortField === "amount") return d * (a.amount - b.amount);
      return d * (a.name || "").localeCompare(b.name || "");
    });
    return list;
  }, [transactions, search, typeFilter, sortField, sortDir]);

  const paged = filtered.slice(0, page * PER_PAGE);
  const hasMore = filtered.length > page * PER_PAGE;
  const handleSort = (f: "date" | "amount" | "name") => { sortField === f ? setSortDir(d => d === "asc" ? "desc" : "asc") : (setSortField(f), setSortDir("desc")); };
  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const handleCreate = (data: TransactionFormData) => {
    createMutation.mutate({ ...data, category_id: data.category_id ?? null, store: data.store ?? null, notes: data.notes ?? null, user_id: user?.id ?? "", account_id: null }, {
      onSuccess: () => { toast.success("Transaction created"); setFormOpen(false); },
      onError: () => toast.error("Failed to create transaction"),
    });
  };
  const handleDelete = () => {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.id, {
      onSuccess: () => { toast.success("Transaction deleted"); setDeleteItem(null); },
      onError: () => toast.error("Failed to delete transaction"),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-3xl font-bold tracking-tight">Transactions</h1><p className="text-muted-foreground mt-1">Manage your income, expenses, and transfers</p></div>
          <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Transaction</Button>
        </motion.div>

        <TransactionCharts transactions={transactions} timeFilter={timeFilter} onTimeFilterChange={setTimeFilter} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search transactions..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 bg-background" /></div>
                <div className="flex gap-2">
                  {["all", "income", "expense", "transfer"].map((t) => (
                    <Button key={t} variant={typeFilter === t ? "default" : "outline"} size="sm" onClick={() => { setTypeFilter(t); setPage(1); }} className="capitalize">{t}</Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground">
                      <th className="p-3 text-left font-medium">Type</th>
                      {(["name", "amount", "date"] as const).map((f) => (
                        <th key={f} className="p-3 text-left font-medium cursor-pointer hover:text-foreground transition-colors select-none" onClick={() => handleSort(f)}>
                          <span className="flex items-center gap-1">{f.charAt(0).toUpperCase() + f.slice(1)}{sortField === f && <span className="text-xs">{sortDir === "asc" ? "\u2191" : "\u2193"}</span>}</span>
                        </th>
                      ))}
                      <th className="p-3 text-left font-medium">Category</th>
                      <th className="p-3 text-left font-medium">Store</th>
                      <th className="p-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <AnimatePresence mode="popLayout">
                    <tbody>
                      {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-border/50">{Array.from({ length: 8 }).map((_, j) => <td key={j} className="p-3"><Skeleton className="h-5 w-full" /></td>)}</tr>
                      )) : paged.length === 0 ? (
                        <tr><td colSpan={8} className="p-12 text-center"><div className="flex flex-col items-center gap-3 text-muted-foreground"><div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center"><Filter className="h-7 w-7" /></div><p className="text-sm">No transactions found</p><Button variant="outline" size="sm" onClick={() => { setSearch(""); setTypeFilter("all"); }}>Clear filters</Button></div></td></tr>
                      ) : paged.map((t: any) => (
                        <TransactionRow key={t.id} transaction={t} categories={categories} onEdit={(item) => { setEditItem(item); setFormOpen(true); }} onDelete={setDeleteItem} />
                      ))}
                    </tbody>
                  </AnimatePresence>
                </table>
              </div>
              {hasMore && <div className="p-4 text-center border-t border-border/50"><Button variant="ghost" onClick={() => setPage(p => p + 1)}>Load more ({filtered.length - paged.length} remaining)</Button></div>}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Button onClick={openCreate} size="icon" className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg shadow-primary/25 z-50"><Plus className="h-6 w-6" /></Button>

      <TransactionForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} isLoading={createMutation.isPending} defaultValues={editItem ? { type: editItem.type, name: editItem.name, amount: editItem.amount, category_id: editItem.category_id, date: editItem.date?.slice(0, 10), store: editItem.store, notes: editItem.notes } : undefined} />

      <Dialog open={!!deleteItem} onOpenChange={(v) => { if (!v) setDeleteItem(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Delete Transaction</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm">Are you sure you want to delete &quot;<span className="text-foreground font-medium">{deleteItem?.name}</span>&quot;? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Deleting..." : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}