"use client";

import { useActionState, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/Icon";
import { TAB_KEY } from "@/lib/session";
import { cn } from "@/lib/utils";
import { login, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const [show, setShow] = useState(false);

  return (
    <form action={action} onSubmit={markTab} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      <Field label="Email" icon="mail">
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          placeholder="you@homekarigar.in"
          aria-invalid={!!state.error}
          className="field pl-11"
        />
      </Field>
      <Field label="Password" icon="lock">
        <input
          name="password"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          required
          placeholder="••••••••"
          aria-invalid={!!state.error}
          className="field px-11"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink"
        >
          <Icon name={show ? "eyeOff" : "eye"} size={17} />
        </button>
      </Field>

      <AnimatePresence initial={false}>
        {state.error && !pending && (
          <motion.p
            key={state.at ?? state.error}
            role="alert"
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: [0, -8, 7, -5, 3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="flex items-center gap-2.5 rounded-xl bg-danger-tint px-4 py-3 text-sm text-danger"
          >
            <Icon name="alert" size={16} className="shrink-0" />
            {state.error}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={pending}
        className={cn(
          "group relative mt-2 flex h-[3.25rem] items-center justify-center gap-2 overflow-hidden rounded-full bg-espresso text-[0.9375rem] font-medium text-white transition-all duration-500",
          "hover:shadow-lift disabled:cursor-wait",
        )}
      >
        <span aria-hidden className="absolute inset-0 origin-left scale-x-0 bg-walnut transition-transform duration-500 ease-[var(--ease-premium)] group-hover:scale-x-100" />
        <span className="relative flex items-center gap-2">
          {pending ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <Icon name="arrowRight" size={17} className="transition-transform duration-500 group-hover:translate-x-1" />
            </>
          )}
        </span>
      </button>
    </form>
  );
}

function markTab() {
  try {
    sessionStorage.setItem(TAB_KEY, "1");
  } catch {}
}

function Field({ label, icon, children }: { label: string; icon: "mail" | "lock"; children: React.ReactNode }) {
  return (
    <label className="group block">
      <span className="mb-2 block text-sm font-medium text-ink-soft">{label}</span>
      <span className="relative block">
        <Icon name={icon} size={17} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted transition-colors group-focus-within:text-walnut" />
        {children}
      </span>
    </label>
  );
}
