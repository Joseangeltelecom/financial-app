import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  ArrowLeftRight,
  PiggyBank,
  BrainCircuit,
  Settings,
  ChevronLeft,
  LogOut,
  Moon,
  Sun,
  User,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { cn, getInitials } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
  isMobile: boolean;
}

const navItems = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { to: "/savings", icon: PiggyBank, label: "Savings" },
  { to: "/ai-report", icon: BrainCircuit, label: "AI Report" },
];

const bottomNavItems = [
  { to: "/settings", icon: Settings, label: "Settings" },
];

const sidebarVariants = {
  expanded: { width: 260 },
  collapsed: { width: 72 },
};

const mobileSidebarVariants = {
  hidden: { x: "-100%" },
  visible: { x: 0 },
};

export function Sidebar({ collapsed, onToggle, onMobileClose, isMobile }: SidebarProps) {
  const { user, signOut } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const userName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const userEmail = user?.email || "";
  const avatarUrl = user?.user_metadata?.avatar_url;

  useEffect(() => {
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    onMobileClose();
  };

  const content = (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4">
        <AnimatePresence mode="wait" initial={false}>
          {(!collapsed || isMobile) ? (
            <motion.div
              key="logo-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2.5 min-w-0"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
                <TrendingUp className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white truncate">
                FinanceFlow
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="logo-icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex w-full justify-center"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
                <TrendingUp className="h-4.5 w-4.5 text-white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isMobile && (
          <button
            onClick={onToggle}
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors",
              collapsed && "mx-auto mt-2"
            )}
          >
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.div>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={isMobile ? onMobileClose : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 group relative",
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200",
                collapsed && !isMobile && "justify-center px-0"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                  )}
                />
                <AnimatePresence mode="wait" initial={false}>
                  {(!collapsed || isMobile) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {collapsed && !isMobile && (
                  <div className="pointer-events-none absolute left-full ml-3 rounded-md bg-gray-900 dark:bg-gray-700 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}

        <div className="my-3 h-px bg-gray-200 dark:bg-gray-800" />

        {bottomNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={isMobile ? onMobileClose : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 group relative",
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200",
                collapsed && !isMobile && "justify-center px-0"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                  )}
                />
                <AnimatePresence mode="wait" initial={false}>
                  {(!collapsed || isMobile) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {collapsed && !isMobile && (
                  <div className="pointer-events-none absolute left-full ml-3 rounded-md bg-gray-900 dark:bg-gray-700 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Dark Mode Toggle */}
      <div className={cn("px-3 pb-2", collapsed && !isMobile && "px-2")}>
        <button
          onClick={toggleTheme}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200 transition-colors",
            collapsed && !isMobile && "justify-center px-0"
          )}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500" />
          ) : (
            <Moon className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500" />
          )}
          <AnimatePresence mode="wait" initial={false}>
            {(!collapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="truncate"
              >
                {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
              </motion.span>
            )}
          </AnimatePresence>
          {collapsed && !isMobile && (
            <div className="pointer-events-none absolute left-full ml-3 rounded-md bg-gray-900 dark:bg-gray-700 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
            </div>
          )}
        </button>
      </div>

      {/* User Section */}
      <div className={cn("border-t border-gray-200 dark:border-gray-800 px-3 py-3", collapsed && !isMobile && "px-2")} ref={userMenuRef}>
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50",
              collapsed && !isMobile && "justify-center px-0"
            )}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="h-8 w-8 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                {getInitials(userName)}
              </div>
            )}
            <AnimatePresence mode="wait" initial={false}>
              {(!collapsed || isMobile) && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-start min-w-0"
                >
                  <span className="font-medium text-gray-900 dark:text-white truncate max-w-full">
                    {userName}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-full">
                    {userEmail}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                className={cn(
                  "absolute bottom-full mb-2 w-56 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-50 overflow-hidden",
                  collapsed && !isMobile ? "left-0" : "left-0 right-0"
                )}
              >
                <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {userEmail}
                  </p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      window.location.href = "/settings";
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return null;
  }

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={collapsed ? "collapsed" : "expanded"}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="fixed inset-y-0 left-0 z-40 flex flex-col"
    >
      {content}
    </motion.aside>
  );
}
