"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "./Icon";

type Toast = { id: number; message: string; tone: "success" | "error" };
const ToastContext = createContext<(message: string, tone?: Toast["tone"]) => void>(() => {});

export const useToast = () => useContext(ToastContext);

export function Toaster({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  return (
    <ToastContext value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex w-[min(92vw,26rem)] -translate-x-1/2 flex-col items-center gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="pointer-events-auto flex items-center gap-3 rounded-full bg-espresso py-2.5 pl-2.5 pr-5 text-sm text-white shadow-lift"
            >
              <span className={`grid size-7 shrink-0 place-items-center rounded-full ${t.tone === "success" ? "bg-success" : "bg-danger"}`}>
                <Icon name={t.tone === "success" ? "check" : "alert"} size={15} />
              </span>
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext>
  );
}
