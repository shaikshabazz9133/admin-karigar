"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { logout } from "@/app/login/actions";
import { Icon, type IconName } from "./Icon";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { href: "/projects", label: "Homes", icon: "grid", match: (p) => p === "/projects" || (p.startsWith("/projects/") && p !== "/projects/new") },
  { href: "/projects/new", label: "Add a home", icon: "plus", match: (p) => p === "/projects/new" },
  { href: "/photos", label: "All photographs", icon: "image", match: (p) => p === "/photos" },
];

export function Sidebar({ email, siteUrl }: { email: string; siteUrl: string }) {
  const pathname = usePathname();
  return (
    <>
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-espresso px-4 py-7 text-white xl:flex">
        <Link href="/projects" className="px-2"><Logo tone="light" /></Link>
        <nav className="mt-12 flex flex-col gap-1" aria-label="Admin">
          <p className="eyebrow mb-3 px-3 text-white/40">Portfolio</p>
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn("relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors", active ? "text-white" : "text-white/60 hover:text-white")}
              >
                {active && (
                  <motion.span layoutId="nav-active" className="absolute inset-0 rounded-xl bg-white/[0.08] ring-1 ring-white/10" transition={{ type: "spring", stiffness: 500, damping: 38 }} />
                )}
                <Icon name={item.icon} size={18} className={cn("relative", active && "text-brass")} />
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
          <a href={siteUrl} target="_blank" rel="noreferrer" className="group flex h-11 items-center gap-3 rounded-xl px-3 text-sm text-white/60 transition-colors hover:text-white">
            <Icon name="globe" size={18} />
            View website
            <Icon name="arrowUpRight" size={14} className="ml-auto opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
          </a>
        </nav>

        <div className="mt-auto rounded-2xl border border-espresso-line bg-espresso-soft p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-walnut text-sm font-medium uppercase">{email[0]}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium">Studio admin</p>
              <p className="truncate text-xs text-white/50">{email}</p>
            </div>
          </div>
          <form action={logout} className="mt-4">
            <button className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-espresso-line text-xs text-white/70 transition-colors hover:border-white/30 hover:text-white">
              <Icon name="logout" size={14} /> Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Phones and tablets: a slim top bar. Labels show from md; phones get icons. */}
      <header className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur-xl xl:hidden">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-8">
          <Link href="/projects" aria-label="Home Karigar — homes" className="min-w-0 shrink"><Logo markOnlyOnMobile /></Link>
          <nav className="flex items-center gap-1" aria-label="Admin">
            {[...NAV, { href: siteUrl, label: "Website", icon: "globe" as const, match: () => false }].map((item) => {
              const active = item.match(pathname);
              const external = item.href === siteUrl;
              const isAdd = item.href === "/projects/new";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  target={external ? "_blank" : undefined}
                  className={cn(
                    "relative flex h-10 items-center gap-2 rounded-full text-sm transition-colors max-md:w-10 max-md:justify-center md:px-3.5",
                    isAdd ? "bg-espresso text-white hover:bg-walnut" : active ? "text-ink" : "text-muted hover:text-ink",
                    external && "max-sm:hidden",
                  )}
                >
                  {active && !isAdd && <motion.span layoutId="topnav-active" className="absolute inset-0 rounded-full bg-canvas" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                  <Icon name={item.icon} size={18} className="relative shrink-0" />
                  <span className="relative hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
            <form action={logout}>
              <button aria-label="Sign out" title="Sign out" className="grid size-10 place-items-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink"><Icon name="logout" size={18} /></button>
            </form>
          </nav>
        </div>
      </header>
    </>
  );
}
