"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ProjectImage } from "@/lib/types";
import { roomRank } from "@/lib/rooms";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { CountUp } from "@/components/CountUp";

export type WallPhoto = ProjectImage & { projectId: string; projectName: string; flatNo: string; development: string };

const ALL = "All rooms";
const EVERYWHERE = "All communities";
const ease = [0.22, 1, 0.36, 1] as const;

/** Every photograph across every home, filterable by room and community, with a full-screen viewer. */
export function PhotoWall({ photos, homes }: { photos: WallPhoto[]; homes: number }) {
  const [room, setRoom] = useState(ALL);
  const [place, setPlace] = useState(EVERYWHERE);
  const [open, setOpen] = useState<number | null>(null);

  const rooms = useMemo(() => [ALL, ...[...new Set(photos.map((p) => p.room))].sort((a, b) => roomRank(a) - roomRank(b))], [photos]);
  const places = useMemo(() => [EVERYWHERE, ...new Set(photos.map((p) => p.development))], [photos]);
  const visible = useMemo(
    () => photos.filter((p) => (room === ALL || p.room === room) && (place === EVERYWHERE || p.development === place)),
    [photos, room, place],
  );

  return (
    <>
      <header>
        <motion.p className="eyebrow text-brass-ink" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
          Gallery
        </motion.p>
        <motion.h1 className="display mt-4 text-5xl md:text-6xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.08, ease }}>
          <CountUp value={photos.length} /> photographs, <span className="accent text-walnut">every room.</span>
        </motion.h1>
        <motion.p className="mt-4 max-w-lg text-[0.9375rem] text-muted" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.16, ease }}>
          Across {homes} delivered flats. Click a photograph to view it full size, or open its home to edit.
        </motion.p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.25, ease }}
        className="sticky top-16 z-30 -mx-4 mt-10 flex flex-col gap-3 border-b border-line bg-canvas/85 px-4 py-4 backdrop-blur-xl sm:-mx-8 sm:px-8 xl:top-0 lg:-mx-12 lg:px-12"
      >
        <Pills id="room" options={rooms} value={room} onChange={setRoom} count={(o) => photos.filter((p) => (o === ALL || p.room === o) && (place === EVERYWHERE || p.development === place)).length} />
        {places.length > 2 && <Pills id="place" options={places} value={place} onChange={setPlace} small />}
      </motion.div>

      <ul className="mt-8 columns-2 gap-3 sm:columns-3 xl:columns-4 2xl:columns-5 [&>li]:mb-3">
        <AnimatePresence mode="popLayout">
          {visible.map((p, i) => (
            <motion.li
              key={p.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
              transition={{ duration: 0.6, delay: Math.min(i, 16) * 0.03, ease }}
              className="break-inside-avoid"
            >
              <button type="button" onClick={() => setOpen(visible.indexOf(p))} className="group relative block w-full overflow-hidden rounded-xl bg-line text-left">
                <Image
                  src={p.src}
                  alt={`${p.room} — ${p.projectName}`}
                  width={p.width}
                  height={p.height}
                  sizes="(min-width: 1536px) 18vw, (min-width: 1280px) 22vw, (min-width: 640px) 30vw, 46vw"
                  className="h-auto w-full transition-transform duration-[1.1s] ease-[var(--ease-premium)] group-hover:scale-[1.05]"
                />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 touch:opacity-100" />
                <span className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-500 ease-[var(--ease-premium)] group-hover:translate-y-0 group-hover:opacity-100 touch:translate-y-0 touch:opacity-100">
                  <span className="eyebrow block text-white/70">{p.room}</span>
                  <span className="mt-1.5 block truncate text-sm font-medium text-white">{p.projectName}</span>
                </span>
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {visible.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex flex-col items-center rounded-3xl border border-dashed border-line-strong bg-white/60 px-6 py-20 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-walnut-tint text-walnut"><Icon name="image" size={24} /></span>
          <h2 className="display mt-5 text-2xl">{photos.length ? "No photographs match" : "No photographs yet"}</h2>
          <p className="mt-2 max-w-sm text-sm text-muted">
            {photos.length ? "Try another room or community." : "Photographs you upload to your homes will all appear here."}
          </p>
          {!photos.length && (
            <Link href="/projects/new" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-espresso px-5 text-sm font-medium text-white transition-colors hover:bg-walnut">
              <Icon name="plus" size={16} /> Add a home
            </Link>
          )}
        </motion.div>
      )}

      <Viewer photos={visible} index={open} onIndex={setOpen} />
    </>
  );
}

function Pills({ id, options, value, onChange, count, small }: { id: string; options: string[]; value: string; onChange: (v: string) => void; count?: (o: string) => number; small?: boolean }) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1" role="tablist">
      {options.map((o) => {
        const active = o === value;
        return (
          <button key={o} role="tab" aria-selected={active} onClick={() => onChange(o)} className={cn("relative shrink-0 rounded-full px-4 text-sm transition-colors", small ? "h-8 text-xs" : "h-9", active ? "text-white" : "text-muted hover:bg-white hover:text-ink")}>
            {active && <motion.span layoutId={`pill-${id}`} className={cn("absolute inset-0 rounded-full", small ? "bg-walnut" : "bg-espresso")} transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
            <span className="relative">{o}{count && <span className="ml-1.5 tabular-nums opacity-60">{count(o)}</span>}</span>
          </button>
        );
      })}
    </div>
  );
}

function Viewer({ photos, index, onIndex }: { photos: WallPhoto[]; index: number | null; onIndex: (i: number | null) => void }) {
  const [dir, setDir] = useState(0);
  const go = useCallback(
    (d: -1 | 1) => {
      if (index === null) return;
      setDir(d);
      onIndex((index + d + photos.length) % photos.length);
    },
    [index, onIndex, photos.length],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onIndex(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [index, go, onIndex]);

  const p = index === null ? null : photos[index];
  return (
    <AnimatePresence>
      {p && (
        <motion.div role="dialog" aria-modal aria-label="Photograph" className="fixed inset-0 z-[95] flex flex-col bg-espresso/95 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="flex items-center justify-between gap-4 px-5 py-4 text-white">
            <div className="min-w-0">
              <p className="eyebrow text-brass">{p.room} · Flat {p.flatNo}</p>
              <p className="mt-1.5 truncate text-sm">{p.projectName}, {p.development}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="mr-2 text-xs tabular-nums text-white/50">{index! + 1} / {photos.length}</span>
              <Link href={`/projects/${p.projectId}#photos`} className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm transition-colors hover:bg-white/20">
                <Icon name="edit" size={15} /> Open home
              </Link>
              <button aria-label="Close" onClick={() => onIndex(null)} className="grid size-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"><Icon name="x" /></button>
            </div>
          </div>
          <div className="relative flex-1">
            <AnimatePresence initial={false} custom={dir}>
              <motion.div
                key={p.id}
                custom={dir}
                className="absolute inset-0 px-4 pb-6 sm:px-20"
                initial={{ opacity: 0, x: dir * 80, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: dir * -80, scale: 0.97 }}
                transition={{ duration: 0.5, ease }}
              >
                <div className="relative h-full w-full">
                  <Image src={p.src} alt={`${p.room} — ${p.projectName}`} fill sizes="100vw" quality={85} className="object-contain" />
                </div>
              </motion.div>
            </AnimatePresence>
            {photos.length > 1 && (
              <>
                <button aria-label="Previous" onClick={() => go(-1)} className="absolute left-3 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-all hover:scale-105 hover:bg-white/20"><Icon name="chevronLeft" /></button>
                <button aria-label="Next" onClick={() => go(1)} className="absolute right-3 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-all hover:scale-105 hover:bg-white/20"><Icon name="chevronRight" /></button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
