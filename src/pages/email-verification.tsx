import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const COOLDOWN_SECONDS = 60;

export default function EmailVerificationPage() {
  const { t } = useTranslation();
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setCooldown(COOLDOWN_SECONDS);
    } finally {
      setIsResending(false);
    }
  }, [cooldown, isResending]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-black"
          >
            <span className="text-lg font-bold text-white">$</span>
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            FinanceFlow
          </h1>
        </div>

        <Card className="border-gray-200 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold">
              {t("auth.emailVerification.title")}
            </CardTitle>
            <CardDescription>
              {t("auth.emailVerification.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2,
                }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50"
              >
                <Mail className="h-8 w-8 text-blue-600" />
              </motion.div>

              <div className="space-y-1">
                <p className="font-medium text-gray-900">{t("auth.emailVerification.checkInbox")}</p>
                <p className="text-sm text-gray-500">
                  {t("auth.emailVerification.checkInboxDesc")}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResend}
                disabled={cooldown > 0 || isResending}
              >
                {isResending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : cooldown > 0 ? (
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                {cooldown > 0
                  ? t("auth.emailVerification.resendIn", { seconds: cooldown })
                  : isResending
                    ? t("auth.emailVerification.sending")
                    : t("auth.emailVerification.resendVerification")}
              </Button>

              <Link to="/login">
                <Button variant="ghost" className="w-full">
                  {t("auth.emailVerification.backToSignIn")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
