import { useState, useCallback, useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { useMediaQuery } from "@/hooks/use-media-query";

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 72;

export function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const openMobile = useCallback(() => {
    setMobileOpen(true);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setCollapsed(false);
      setMobileOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebarWidth = isMobile ? 0 : collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <div className="min-h-screen bg-background">
      {!isMobile && (
        <Sidebar
          collapsed={collapsed}
          onToggle={toggleCollapse}
          onMobileClose={closeMobile}
          isMobile={false}
        />
      )}

      <AnimatePresence>
        {isMobile && mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMobile}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="fixed inset-y-0 left-0 z-50 w-[260px]"
            >
              <Sidebar
                collapsed={false}
                onToggle={toggleCollapse}
                onMobileClose={closeMobile}
                isMobile
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div
        className="flex flex-col transition-[margin] duration-200 ease-in-out min-h-screen"
        style={{ marginLeft: sidebarWidth }}
      >
        {isMobile && <MobileNav onMenuClick={openMobile} />}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
