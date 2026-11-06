"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Project } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { CountUp } from "@/components/CountUp";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toaster";
import { deleteProject, reorderProjects } from "../actions";

const ALL = "All homes";

const ease = [0.22, 1, 0.36, 1] as const;

export function ProjectsBoard({ initial }: { initial: Project[] }) {
  const [projects, setProjects] = useState(initial);
  const [filter, setFilter] = useState(ALL);
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState<Project | null>(null);
  const [deleting, startDelete] = useTransition();
  const toast = useToast();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter(
      (p) =>
        (filter === ALL || p.development === filter) &&
        (!q || [p.name, p.flatNo, p.development, p.community, p.configuration].some((v) => v.toLowerCase().includes(q))),
    );
  }, [projects, filter, query]);
  const canReorder = filter === ALL && !query.trim();
  const filters = [ALL, ...new Set(projects.map((p) => p.development))];

  const stats = [
    { label: "Flats delivered", value: projects.length, icon: "home" as const, href: undefined },
    { label: "Photographs", value: projects.reduce((n, p) => n + p.images.length, 0), icon: "image" as const, href: "/photos" },
    { label: "Rooms photographed", value: projects.reduce((n, p) => n + new Set(p.images.map((i) => i.room)).size, 0), icon: "layers" as const, href: undefined },
    { label: "Communities", value: new Set(projects.map((p) => p.development)).size, icon: "globe" as const, href: undefined },
  ];

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...projects];
    const to = index + dir;
    if (to < 0 || to >= next.length) return;
    [next[index], next[to]] = [next[to], next[index]];
    setProjects(next);
    await reorderProjects(next.map((p) => p.id));
  };

  const confirmDelete = () =>
    startDelete(async () => {
      if (!toDelete) return;
      await deleteProject(toDelete.id);
      setProjects((all) => all.filter((p) => p.id !== toDelete.id));
      toast(`${toDelete.name} deleted`);
      setToDelete(null);
    });

  return (
    <>
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <motion.p className="eyebrow text-brass-ink" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
            Portfolio
          </motion.p>
          <motion.h1 className="display mt-4 text-5xl md:text-6xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.08, ease }}>
            <CountUp value={projects.length} /> flats, <span className="accent text-walnut">delivered.</span>
          </motion.h1>
          <motion.p className="mt-4 max-w-lg text-[0.9375rem] text-muted" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.16, ease }}>
            Every home here appears on the website&apos;s Homes page, with all its photographs, in the order shown.
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2, ease }}>
          <Link href="/projects/new" className="group relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-full bg-espresso pl-5 pr-6 text-sm font-medium text-white shadow-soft transition-shadow hover:shadow-lift">
            <span aria-hidden className="absolute inset-0 origin-left scale-x-0 bg-walnut transition-transform duration-500 ease-[var(--ease-premium)] group-hover:scale-x-100" />
            <Icon name="plus" size={18} className="relative transition-transform duration-500 group-hover:rotate-90" />
            <span className="relative">Add a home</span>
          </Link>
        </motion.div>
      </header>

      <section aria-label="Summary" className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 + i * 0.07, ease }}
            className="group relative overflow-hidden rounded-2xl border border-line bg-white p-5 transition-shadow duration-500 hover:shadow-soft md:p-6"
          >
            {s.href && <Link href={s.href} aria-label={`See all ${s.label.toLowerCase()}`} className="absolute inset-0 z-10" />}
            {s.href && <Icon name="arrowUpRight" size={16} className="absolute right-5 top-5 z-[1] text-muted transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-walnut" />}
            <span className="grid size-10 place-items-center rounded-xl bg-walnut-tint text-walnut transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
              <Icon name={s.icon} size={19} />
            </span>
            <p className="display mt-5 text-4xl"><CountUp value={s.value} /></p>
            <p className="mt-1.5 text-sm text-muted">{s.label}</p>
            <span aria-hidden className="absolute -right-8 -top-8 size-24 rounded-full bg-walnut-tint/60 transition-transform duration-700 group-hover:scale-150" />
          </motion.div>
        ))}
      </section>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.45, ease }}
        className="sticky top-16 z-30 -mx-4 mt-10 flex flex-col gap-3 border-b border-line bg-canvas/85 px-4 py-4 backdrop-blur-xl sm:-mx-8 sm:px-8 md:flex-row md:items-center md:justify-between xl:top-0 lg:-mx-12 lg:px-12"
      >
        <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-full border border-line bg-white p-1" role="tablist" aria-label="Filter by community">
          {filters.map((f) => {
            const active = filter === f;
            const count = f === ALL ? projects.length : projects.filter((p) => p.development === f).length;
            return (
              <button key={f} role="tab" aria-selected={active} onClick={() => setFilter(f)} className={cn("relative h-9 shrink-0 rounded-full px-4 text-sm transition-colors", active ? "text-white" : "text-muted hover:text-ink")}>
                {active && <motion.span layoutId="filter-pill" className="absolute inset-0 rounded-full bg-espresso" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                <span className="relative">{f} <span className="ml-1 tabular-nums opacity-60">{count}</span></span>
              </button>
            );
          })}
        </div>
        <label className="relative block md:w-80">
          <span className="sr-only">Search homes</span>
          <Icon name="search" size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, flat or community" className="field h-11 rounded-full pl-11" />
        </label>
      </motion.div>

      <ul className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((p, i) => (
            <motion.li
              key={p.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.25 } }}
              transition={{ duration: 0.7, delay: Math.min(i, 8) * 0.05, ease, layout: { type: "spring", stiffness: 380, damping: 36 } }}
            >
              <ProjectTile
                project={p}
                position={projects.indexOf(p)}
                total={projects.length}
                canReorder={canReorder}
                onMove={(dir) => move(projects.indexOf(p), dir)}
                onDelete={() => setToDelete(p)}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {visible.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex flex-col items-center rounded-3xl border border-dashed border-line-strong bg-white/60 px-6 py-20 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-walnut-tint text-walnut"><Icon name={projects.length ? "search" : "home"} size={24} /></span>
          <h2 className="display mt-5 text-2xl">{projects.length ? "No homes match" : "No homes yet"}</h2>
          <p className="mt-2 max-w-sm text-sm text-muted">
            {projects.length ? "Try another search or filter." : "Add your first home and upload its photographs to put it on the website."}
          </p>
          {!projects.length && (
            <Link href="/projects/new" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-espresso px-5 text-sm font-medium text-white transition-colors hover:bg-walnut">
              <Icon name="plus" size={16} /> Add your first home
            </Link>
          )}
        </motion.div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title={`Delete ${toDelete?.name ?? "this home"}?`}
        body={<>This removes the home and its {toDelete?.images.length ?? 0} photographs from the admin and the website. It can&apos;t be undone.</>}
        confirmLabel="Delete home"
        pending={deleting}
        onConfirm={confirmDelete}
        onClose={() => !deleting && setToDelete(null)}
      />
    </>
  );
}

function ProjectTile({
  project: p, position, total, canReorder, onMove, onDelete,
}: {
  project: Project; position: number; total: number; canReorder: boolean;
  onMove: (dir: -1 | 1) => void; onDelete: () => void;
}) {
  const rooms = new Set(p.images.map((i) => i.room)).size;
  return (
    <article className="group relative">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-line sm:aspect-[4/5]">
        {p.coverSrc ? (
          <Image
            src={p.coverSrc}
            alt=""
            fill
            sizes="(min-width: 1280px) 26vw, (min-width: 640px) 45vw, 92vw"
            className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-premium)] group-hover:scale-[1.06]"
          />
        ) : (
          <div className="grid h-full place-items-center bg-gradient-to-br from-walnut-tint to-line text-walnut">
            <div className="flex flex-col items-center gap-2 text-sm"><Icon name="image" size={30} /> No photographs yet</div>
          </div>
        )}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/25 opacity-80 transition-opacity duration-700 group-hover:opacity-100" />

        <div className="absolute inset-x-3 top-3 z-10 flex items-start justify-end gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-ink backdrop-blur">{p.configuration}</span>
        </div>

        <div className="absolute inset-x-4 bottom-4 z-10 flex items-end justify-between gap-3">
          <p className="flex gap-3 text-xs text-white/90">
            <span className="flex items-center gap-1.5"><Icon name="image" size={14} />{p.images.length}</span>
            <span className="flex items-center gap-1.5"><Icon name="layers" size={14} />{rooms} {rooms === 1 ? "room" : "rooms"}</span>
          </p>
          <div className="flex translate-y-3 gap-1.5 opacity-0 transition-all duration-500 ease-[var(--ease-premium)] group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 touch:translate-y-0 touch:opacity-100">
            {canReorder && (
              <>
                <TileButton label="Move earlier" icon="chevronLeft" disabled={position === 0} onClick={() => onMove(-1)} />
                <TileButton label="Move later" icon="chevronRight" disabled={position === total - 1} onClick={() => onMove(1)} />
              </>
            )}
            <TileButton label={`Delete ${p.name}`} icon="trash" danger onClick={onDelete} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-4 px-1">
        <div className="min-w-0">
          <p className="eyebrow mb-2 truncate text-muted">Flat {p.flatNo} · {p.development}</p>
          <h2 className="display text-xl tracking-tight">
            <Link href={`/projects/${p.id}`} className="after:absolute after:inset-0 after:content-[''] hover:text-walnut">{p.name}</Link>
          </h2>
        </div>
        <div className="shrink-0 text-right text-xs text-muted">
          <p>{p.area}</p>
          <p className="mt-1">Edited {timeAgo(p.updatedAt)}</p>
        </div>
      </div>
      {canReorder && (
        <span className="absolute -left-2 -top-2 z-10 grid size-7 place-items-center rounded-full bg-espresso text-[0.7rem] font-medium tabular-nums text-white shadow-soft">
          {position + 1}
        </span>
      )}
    </article>
  );
}

function TileButton({ label, icon, onClick, disabled, danger }: { label: string; icon: "chevronLeft" | "chevronRight" | "trash"; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      className={cn(
        "relative z-10 grid size-9 place-items-center rounded-full bg-white/95 text-ink shadow-soft backdrop-blur transition-all hover:scale-110 disabled:pointer-events-none disabled:opacity-40",
        danger && "hover:bg-danger hover:text-white",
      )}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}
