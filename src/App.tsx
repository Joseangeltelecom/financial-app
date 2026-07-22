import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { AppLayout } from "@/components/layout/app-layout";
import { Skeleton } from "@/components/ui/skeleton";

const LoginPage = lazy(() => import("@/pages/login"));
const SignupPage = lazy(() => import("@/pages/signup"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password"));
const EmailVerificationPage = lazy(() => import("@/pages/email-verification"));
const DashboardPage = lazy(() => import("@/pages/dashboard"));
const TransactionsPage = lazy(() => import("@/pages/transactions"));
const SavingsPage = lazy(() => import("@/pages/savings"));
const AiReportPage = lazy(() => import("@/pages/ai-report"));
const AccountsPage = lazy(() => import("@/pages/accounts"));
const TransfersPage = lazy(() => import("@/pages/transfers"));
const SettingsPage = lazy(() => import("@/pages/settings"));

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <PublicRoute>
                      <SignupPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <PublicRoute>
                      <ForgotPasswordPage />
                    </PublicRoute>
                  }
                />
                <Route path="/email-verification" element={<EmailVerificationPage />} />

                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/transactions"
                  element={
                    <ProtectedRoute>
                      <TransactionsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/savings"
                  element={
                    <ProtectedRoute>
                      <SavingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai-report"
                  element={
                    <ProtectedRoute>
                      <AiReportPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/accounts"
                  element={
                    <ProtectedRoute>
                      <AccountsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/transfers"
                  element={
                    <ProtectedRoute>
                      <TransfersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>

            <Toaster
              position="top-right"
              richColors
              closeButton
              toastOptions={{
                style: {
                  borderRadius: "12px",
                  padding: "12px 16px",
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
