"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

type Variant = "field" | "pill" | "glass";

const TRIGGER: Record<Variant, string> = {
  // Matches .field inputs.
  field: "h-12 w-full rounded-[0.625rem] border border-line-strong bg-white pl-4 pr-3 text-[0.9375rem] hover:border-muted",
  // Toolbar / drop zone.
  pill: "h-11 w-full rounded-full border border-line-strong bg-white pl-4 pr-3 text-sm hover:border-muted",
  // Over a photograph.
  glass: "h-8 w-full rounded-full bg-white/95 pl-3 pr-2 text-xs shadow-sm backdrop-blur hover:bg-white",
};

/**
 * A styled listbox in place of the native <select>. The menu is portalled to <body> with fixed positioning,
 * so it is never clipped by the photo tiles' overflow, and it opens upward when there's no room below.
 * With `allowCustom`, a last "Other…" row turns into a text box for a value that isn't in the list.
 */
export function Select({
  value, options: given, onChange, label, placeholder, variant = "field", invalid, name, className, allowCustom, customLabel = "Other…",
}: {
  value: string; options: readonly string[]; onChange: (v: string) => void; label: string; placeholder?: string;
  variant?: Variant; invalid?: boolean; name?: string; className?: string; allowCustom?: boolean; customLabel?: string;
}) {
  // A custom value picked earlier still shows (ticked) in the list.
  const options = value && allowCustom && !given.includes(value) ? [...given, value] : given;
  // With allowCustom the "Other…" row sits at index options.length.
  const count = options.length + (allowCustom ? 1 : 0);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number; maxHeight: number; up: boolean } | null>(null);
  const typed = useRef({ text: "", at: 0 });
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const place = useCallback(() => {
    const r = trigger.current?.getBoundingClientRect();
    if (!r) return;
    const gap = 6, margin = 12;
    const below = window.innerHeight - r.bottom - margin;
    const above = r.top - margin;
    const want = Math.min(count * 40 + 12, 320);
    const up = below < want && above > below;
    const width = Math.max(r.width, 200);
    const left = Math.min(Math.max(margin, r.left), window.innerWidth - width - margin);
    setPos({
      left,
      width,
      up,
      maxHeight: Math.max(120, Math.min(320, (up ? above : below) - gap)),
      ...(up ? { bottom: window.innerHeight - r.top + gap } : { top: r.bottom + gap }),
    });
  }, [count]);

  const show = () => {
    setActive(Math.max(0, options.indexOf(value)));
    setAdding(false);
    setDraft("");
    place();
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  };
  const choose = (v: string) => {
    if (v !== value) onChange(v);
    close();
  };
  const startAdding = () => {
    setActive(options.length);
    setAdding(true);
  };
  const addCustom = () => {
    const v = draft.trim().replace(/\s+/g, " ");
    if (!v) return;
    // Typing an existing option (in any case) picks that option rather than a near-duplicate.
    choose(options.find((o) => o.toLowerCase() === v.toLowerCase()) ?? v);
  };

  useLayoutEffect(() => {
    if (!open) return;
    list.current?.focus({ preventScroll: true });
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!trigger.current?.contains(t) && !list.current?.contains(t)) close(false);
    };
    const onMove = (e: Event) => {
      if (list.current?.contains(e.target as Node)) return;
      place();
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open, place]);

  const move = (i: number) => {
    const n = (i + count) % count;
    setActive(n);
    list.current?.querySelector<HTMLElement>(`[data-index="${n}"]`)?.scrollIntoView({ block: "nearest" });
  };

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); move(active + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(active - 1); }
    else if (e.key === "Home") { e.preventDefault(); move(0); }
    else if (e.key === "End") { e.preventDefault(); move(count - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (active === options.length) startAdding(); else choose(options[active]); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "Tab") close(false);
    else if (e.key.length === 1) {
      // Type-ahead: jump to the first option starting with what's been typed.
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : "") + e.key.toLowerCase(), at: now };
      const i = options.findIndex((o) => o.toLowerCase().startsWith(typed.current.text));
      if (i >= 0) move(i);
    }
  };

  return (
    <>
      <button
        ref={trigger}
        type="button"
        name={name}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-invalid={invalid || undefined}
        onClick={() => (open ? close() : show())}
        onKeyDown={(e) => {
          if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); show(); }
        }}
        className={cn(
          "group flex min-w-0 items-center justify-between gap-2 text-left text-ink transition-[border-color,box-shadow,background-color] duration-200 focus:outline-none",
          "focus-visible:border-walnut focus-visible:shadow-[0_0_0_4px_rgb(110_80_56/0.12)]",
          TRIGGER[variant],
          open && variant !== "glass" && "border-walnut shadow-[0_0_0_4px_rgb(110_80_56/0.12)]",
          invalid && "border-danger",
          className,
        )}
      >
        <span className={cn("truncate", !value && "text-muted")}>{value || placeholder}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className={cn("grid shrink-0 place-items-center rounded-full", variant === "glass" ? "size-4" : "size-6 bg-canvas text-muted group-hover:text-ink")}>
          <Icon name="chevronDown" size={variant === "glass" ? 12 : 14} />
        </motion.span>
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && pos && (
              <motion.ul
                ref={list}
                id={`${id}-list`}
                role="listbox"
                aria-label={label}
                tabIndex={-1}
                aria-activedescendant={`${id}-${active}`}
                onKeyDown={onListKey}
                initial={{ opacity: 0, y: pos.up ? 8 : -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: pos.up ? 4 : -4, scale: 0.98, transition: { duration: 0.12 } }}
                transition={{ type: "spring", stiffness: 520, damping: 34 }}
                style={{ position: "fixed", left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight, transformOrigin: pos.up ? "bottom" : "top" }}
                className="no-scrollbar z-[120] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-white/95 p-1.5 shadow-lift outline-none backdrop-blur-xl"
              >
                {options.map((o, i) => {
                  const selected = o === value;
                  return (
                    <li
                      key={o}
                      id={`${id}-${i}`}
                      data-index={i}
                      role="option"
                      aria-selected={selected}
                      onPointerEnter={() => setActive(i)}
                      onClick={() => choose(o)}
                      className={cn(
                        "relative flex h-10 cursor-pointer select-none items-center justify-between gap-3 rounded-xl px-3 text-sm transition-colors",
                        selected ? "font-medium text-walnut" : "text-ink-soft",
                      )}
                    >
                      {i === active && (
                        <motion.span layoutId={`${id}-hover`} className="absolute inset-0 rounded-xl bg-walnut-tint" transition={{ type: "spring", stiffness: 700, damping: 45 }} />
                      )}
                      <span className="relative truncate">{o}</span>
                      {selected && <Icon name="check" size={15} className="relative shrink-0" />}
                    </li>
                  );
                })}
                {allowCustom && (
                  <li
                    id={`${id}-${options.length}`}
                    data-index={options.length}
                    role="option"
                    aria-selected={false}
                    onPointerEnter={() => setActive(options.length)}
                    onClick={() => !adding && startAdding()}
                    className={cn(
                      "relative mt-1 flex min-h-10 select-none items-center gap-2 rounded-xl text-sm text-walnut before:absolute before:inset-x-2 before:-top-0.5 before:h-px before:bg-line",
                      adding ? "p-1" : "cursor-pointer px-3",
                    )}
                  >
                    {active === options.length && !adding && (
                      <motion.span layoutId={`${id}-hover`} className="absolute inset-0 rounded-xl bg-walnut-tint" transition={{ type: "spring", stiffness: 700, damping: 45 }} />
                    )}
                    {adding ? (
                      <form
                        className="relative flex w-full items-center gap-1"
                        onSubmit={(e) => { e.preventDefault(); addCustom(); }}
                      >
                        <input
                          autoFocus
                          value={draft}
                          maxLength={40}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            // Keep typing out of the list's arrow-key / type-ahead handling.
                            e.stopPropagation();
                            if (e.key === "Escape") { e.preventDefault(); setAdding(false); list.current?.focus(); }
                          }}
                          placeholder="Type a name"
                          aria-label={`New ${label.toLowerCase()}`}
                          className="h-8 min-w-0 flex-1 rounded-lg border border-line-strong bg-white px-2.5 text-sm text-ink outline-none focus:border-walnut"
                        />
                        <button
                          type="submit"
                          disabled={!draft.trim()}
                          aria-label="Add"
                          className="grid size-8 shrink-0 place-items-center rounded-lg bg-espresso text-white transition-opacity disabled:opacity-30"
                        >
                          <Icon name="check" size={14} />
                        </button>
                      </form>
                    ) : (
                      <>
                        <Icon name="plus" size={15} className="relative shrink-0" />
                        <span className="relative truncate font-medium">{customLabel}</span>
                      </>
                    )}
                  </li>
                )}
              </motion.ul>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
