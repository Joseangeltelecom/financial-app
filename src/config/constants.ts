export const DEFAULT_CATEGORIES = [
  { name: "Home Food", icon: "ShoppingCart", color: "#6366f1", type: "expense" as const },
  { name: "Restaurants & Snacks", icon: "UtensilsCrossed", color: "#f59e0b", type: "expense" as const },
  { name: "Housing / Rent", icon: "Home", color: "#ef4444", type: "expense" as const },
  { name: "Utilities", icon: "Zap", color: "#f97316", type: "expense" as const },
  { name: "Health", icon: "Heart", color: "#ec4899", type: "expense" as const },
  { name: "Transportation", icon: "Car", color: "#8b5cf6", type: "expense" as const },
  { name: "Education", icon: "GraduationCap", color: "#06b6d4", type: "expense" as const },
  { name: "Entertainment", icon: "Gamepad2", color: "#14b8a6", type: "expense" as const },
  { name: "Hygiene", icon: "Droplets", color: "#3b82f6", type: "expense" as const },
  { name: "Beauty", icon: "Sparkles", color: "#d946ef", type: "expense" as const },
  { name: "Household Items", icon: "Sofa", color: "#84cc16", type: "expense" as const },
  { name: "Personal Items", icon: "User", color: "#f43f5e", type: "expense" as const },
  { name: "Clothing", icon: "Shirt", color: "#a855f7", type: "expense" as const },
  { name: "Salary", icon: "Wallet", color: "#22c55e", type: "income" as const },
  { name: "Freelance", icon: "Laptop", color: "#3b82f6", type: "income" as const },
  { name: "Investments", icon: "TrendingUp", color: "#10b981", type: "income" as const },
  { name: "Other Income", icon: "Plus", color: "#6366f1", type: "income" as const },
];

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "PEN", symbol: "S/", name: "Peruvian Sol" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
];

export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "pt", name: "Português" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "ja", name: "日本語" },
];

export const TRANSACTION_TYPES = [
  { value: "income", label: "Income", color: "#22c55e" },
  { value: "expense", label: "Expense", color: "#ef4444" },
] as const;

export const CHART_COLORS = [
  "#6366f1",
  "#f59e0b",
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#14b8a6",
  "#84cc16",
  "#d946ef",
  "#f43f5e",
];

export const TIME_FILTERS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
] as const;

export const BUDGET_THRESHOLDS = {
  warning: 80,
  critical: 100,
} as const;
