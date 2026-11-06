"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { Icon } from "./Icon";

export function ConfirmDialog({
  open, title, body, confirmLabel, pending, onConfirm, onClose,
}: {
  open: boolean; title: string; body: React.ReactNode; confirmLabel: string; pending?: boolean;
  onConfirm: () => void; onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-espresso/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="alertdialog"
            aria-modal
            aria-labelledby="confirm-title"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-lift"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-danger-tint text-danger"><Icon name="trash" size={22} /></span>
            <h2 id="confirm-title" className="display mt-5 text-2xl">{title}</h2>
            <div className="mt-2 text-sm leading-relaxed text-muted">{body}</div>
            <div className="mt-7 flex justify-end gap-2">
              <button autoFocus onClick={onClose} className="h-11 rounded-full px-5 text-sm text-ink-soft transition-colors hover:bg-canvas">Cancel</button>
              <button onClick={onConfirm} disabled={pending} className="h-11 rounded-full bg-danger px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60">
                {pending ? "Deleting…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
