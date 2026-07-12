import { Menu, Moon, Sun, TrendingUp } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

interface MobileNavProps {
  onMenuClick: () => void;
}

export function MobileNav({ onMenuClick }: MobileNavProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg px-4 lg:hidden">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600">
            <TrendingUp className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-base font-bold text-gray-900 dark:text-white">
            FinanceFlow
          </span>
        </div>
      </div>

      <button
        onClick={toggleTheme}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        {resolvedTheme === "dark" ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
