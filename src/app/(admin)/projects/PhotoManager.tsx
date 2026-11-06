"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ProjectImage } from "@/lib/types";
import { ROOMS, roomRank } from "@/lib/rooms";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Select } from "@/components/Select";
import { useToast } from "@/components/Toaster";
import { deleteImage, moveImage, setCover, setImageRoom } from "../actions";

const ease = [0.22, 1, 0.36, 1] as const;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 15 * 1024 * 1024;
const PARALLEL = 3;

type Upload = { key: string; name: string; preview: string; room: string; progress: number; state: "pending" | "queued" | "uploading" | "done" | "error"; error?: string };

/**
 * Uploads and arranges a home's photographs. With `deferred` (the "Add a home" page) there is no home yet:
 * picked photos wait as "pending" until `projectId` arrives, then upload, and `onSettled` reports the result.
 */
export function PhotoManager({
  projectId, deferred, images, coverSrc, onChange, onPendingChange, onSettled,
}: {
  projectId: string | null; deferred?: boolean; images: ProjectImage[]; coverSrc: string | null;
  onChange: (images: ProjectImage[], coverSrc: string | null) => void;
  onPendingChange?: (count: number) => void;
  onSettled?: (uploaded: number, failed: number) => void;
}) {
  const toast = useToast();
  const [room, setRoom] = useState<string>("Living Room");
  const [tab, setTab] = useState<string>("All");
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragging, setDragging] = useState(false);
  const [toDelete, setToDelete] = useState<ProjectImage | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const files = useRef(new Map<string, File>());
  // Uploads finish out of order, so keep the latest list here rather than in a stale closure.
  const latest = useRef({ images, coverSrc });
  latest.current = { images, coverSrc };
  const tally = useRef({ done: 0, failed: 0, settled: false });

  const patch = (key: string, p: Partial<Upload>) => setUploads((u) => u.map((x) => (x.key === key ? { ...x, ...p } : x)));

  // Once the home exists, release the photos picked before it was created.
  useEffect(() => {
    if (projectId) setUploads((u) => (u.some((x) => x.state === "pending") ? u.map((x) => (x.state === "pending" ? { ...x, state: "queued" } : x)) : u));
  }, [projectId]);

  const outstanding = uploads.filter((u) => u.state === "pending" || u.state === "queued" || u.state === "uploading").length;
  useEffect(() => { onPendingChange?.(outstanding); }, [outstanding, onPendingChange]);
  useEffect(() => {
    if (!deferred || !projectId || outstanding > 0 || tally.current.settled) return;
    tally.current.settled = true;
    onSettled?.(tally.current.done, tally.current.failed);
  }, [deferred, projectId, outstanding, onSettled]);

  // Start queued uploads, a few at a time.
  useEffect(() => {
    const running = uploads.filter((u) => u.state === "uploading").length;
    uploads.filter((u) => u.state === "queued").slice(0, Math.max(0, PARALLEL - running)).forEach((u) => {
      patch(u.key, { state: "uploading" });
      send(u);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploads]);

  const send = (u: Upload) => {
    const form = new FormData();
    form.append("file", files.current.get(u.key)!);
    form.append("room", u.room);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/projects/${projectId}/images`);
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => e.lengthComputable && patch(u.key, { progress: e.loaded / e.total });
    xhr.onerror = () => { tally.current.failed++; patch(u.key, { state: "error", error: "Network error" }); };
    xhr.onload = () => {
      files.current.delete(u.key);
      if (xhr.status !== 200) {
        tally.current.failed++;
        patch(u.key, { state: "error", error: xhr.response?.error ?? "Upload failed" });
        return;
      }
      const { image, coverSrc } = xhr.response as { image: ProjectImage; coverSrc: string | null };
      tally.current.done++;
      onChange([...latest.current.images, image], coverSrc);
      patch(u.key, { state: "done", progress: 1 });
      setTimeout(() => {
        setUploads((list) => list.filter((x) => x.key !== u.key));
        URL.revokeObjectURL(u.preview);
      }, 1400);
    };
    xhr.send(form);
  };

  const enqueue = (list: FileList | File[]) => {
    const next: Upload[] = [];
    let rejected = 0;
    for (const file of Array.from(list)) {
      if (!ACCEPT.includes(file.type) || file.size > MAX_BYTES) { rejected++; continue; }
      const key = crypto.randomUUID();
      files.current.set(key, file);
      next.push({ key, name: file.name, preview: URL.createObjectURL(file), room, progress: 0, state: projectId ? "queued" : "pending" });
    }
    if (rejected) toast(`${rejected} file${rejected > 1 ? "s" : ""} skipped — use JPEG, PNG or WebP under 15 MB`, "error");
    if (next.length) setUploads((u) => [...u, ...next]);
  };

  const removePending = (u: Upload) => {
    files.current.delete(u.key);
    URL.revokeObjectURL(u.preview);
    setUploads((list) => list.filter((x) => x.key !== u.key));
  };
  const pending = uploads.filter((u) => u.state === "pending");
  const inFlight = uploads.filter((u) => u.state !== "pending");

  // Server actions return the whole project; adopt its photo list so local state matches what was saved.
  const run = async (optimistic: ProjectImage[], cover: string | null, action: () => Promise<{ ok: true; project: { images: ProjectImage[]; coverSrc: string | null } } | { ok: false; error: string }>, success?: string) => {
    const before = latest.current;
    onChange(optimistic, cover);
    const res = await action();
    if (!res.ok) { onChange(before.images, before.coverSrc); toast(res.error, "error"); return; }
    onChange(res.project.images, res.project.coverSrc);
    if (success) toast(success);
  };

  // Photos in the grid belong to a saved home, so these only run once projectId is set.
  const id = projectId ?? "";
  const changeRoom = (img: ProjectImage, r: string) =>
    run(images.map((i) => (i.id === img.id ? { ...i, room: r } : i)), coverSrc, () => setImageRoom(id, img.id, r), `Moved to ${r}`);

  const makeCover = (img: ProjectImage) => run(images, img.src, () => setCover(id, img.id), "Cover photo updated");

  const move = (img: ProjectImage, dir: -1 | 1) => {
    const next = [...images];
    const from = next.indexOf(img);
    let to = from + dir;
    while (to >= 0 && to < next.length && next[to].room !== img.room) to += dir;
    if (to < 0 || to >= next.length) return;
    [next[from], next[to]] = [next[to], next[from]];
    run(next, coverSrc, () => moveImage(id, img.id, dir));
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    const img = toDelete;
    setToDelete(null);
    const rest = images.filter((i) => i.id !== img.id);
    run(rest, coverSrc === img.src ? (rest[0]?.src ?? null) : coverSrc, () => deleteImage(id, img.id), "Photograph removed");
  };

  const counts = new Map<string, number>();
  for (const img of images) counts.set(img.room, (counts.get(img.room) ?? 0) + 1);
  const tabs = ["All", ...[...counts.keys()].sort((a, b) => roomRank(a) - roomRank(b))];
  // The standard rooms plus any custom ones already used in this home, so they can be picked again.
  const roomOptions = [...new Set<string>([...ROOMS, ...images.map((i) => i.room), ...uploads.map((u) => u.room)])].filter(Boolean);
  const activeTab = tabs.includes(tab) ? tab : "All";
  const groups = tabs
    .slice(1)
    .filter((r) => activeTab === "All" || r === activeTab)
    .map((r) => ({ room: r, images: images.filter((i) => i.room === r) }));

  return (
    <motion.section
      id="photos"
      aria-labelledby="photos-title"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease }}
      className="mt-6 scroll-mt-24 rounded-3xl border border-line bg-white p-4 sm:p-6 md:mt-8 md:p-8 xl:scroll-mt-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-walnut-tint text-walnut"><Icon name="image" size={18} /></span>
          <div>
            <h2 id="photos-title" className="display text-xl">Photographs</h2>
            <p className="text-sm text-muted">
              {deferred && !projectId
                ? "Add as many as you like — they upload when you create the home."
                : `${images.length} uploaded · all shown on the website, grouped by room, in this order.`}
            </p>
          </div>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }}
        onDrop={(e) => { e.preventDefault(); setDragging(false); enqueue(e.dataTransfer.files); }}
        className={cn(
          "relative mt-7 overflow-hidden rounded-2xl border-2 border-dashed px-4 py-8 text-center sm:px-6 sm:py-10 transition-all duration-500",
          dragging ? "scale-[1.01] border-walnut bg-walnut-tint" : "border-line-strong bg-canvas/60 hover:border-muted",
        )}
      >
        <motion.span
          animate={dragging ? { y: -6, scale: 1.1 } : { y: [0, -5, 0] }}
          transition={dragging ? { type: "spring", stiffness: 400, damping: 20 } : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-walnut shadow-soft"
        >
          <Icon name="upload" size={24} />
        </motion.span>
        <p className="display mt-5 text-lg">{dragging ? "Drop to upload" : "Drag photographs here"}</p>
        <p className="mt-1 text-sm text-muted">JPEG, PNG or WebP, up to 15 MB each. Select many at once.</p>

        <div className="mx-auto mt-6 flex max-w-md flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center">
          <div className="flex items-center gap-2 text-sm text-ink-soft">
            <span className="shrink-0">Room</span>
            <Select variant="pill" label="Room for new photographs" value={room} options={roomOptions} onChange={setRoom} allowCustom customLabel="Other room…" className="sm:w-56" />
          </div>
          <button type="button" onClick={() => input.current?.click()} className="h-11 rounded-full bg-espresso px-5 text-sm font-medium text-white transition-colors hover:bg-walnut">
            Choose files
          </button>
          <input ref={input} type="file" accept={ACCEPT.join(",")} multiple hidden onChange={(e) => { if (e.target.files) enqueue(e.target.files); e.target.value = ""; }} />
        </div>
      </div>

      {/* Upload queue */}
      <AnimatePresence initial={false}>
        {pending.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <p className="mt-6 text-sm text-ink-soft">
              <span className="font-medium">{pending.length} ready to upload</span> <span className="text-muted">· set each photo&apos;s room</span>
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              <AnimatePresence initial={false} mode="popLayout">
                {pending.map((u, i) => (
                  <motion.li
                    key={u.key}
                    layout
                    initial={{ opacity: 0, scale: 0.85, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    transition={{ type: "spring", stiffness: 360, damping: 30, delay: Math.min(i, 10) * 0.03 }}
                    className="group relative overflow-hidden rounded-xl bg-line"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u.preview} alt="" className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <button type="button" aria-label={`Remove ${u.name}`} onClick={() => removePending(u)} className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white/95 text-ink opacity-0 transition-all hover:scale-110 hover:bg-danger hover:text-white group-hover:opacity-100 focus:opacity-100 touch:opacity-100">
                      <Icon name="x" size={14} />
                    </button>
                    <div className="absolute inset-x-2 bottom-2">
                      <Select variant="glass" label={`Room for ${u.name}`} value={u.room} options={roomOptions} onChange={(r) => patch(u.key, { room: r })} allowCustom customLabel="Other room…" />
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {inFlight.length > 0 && (
          <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 grid gap-2 overflow-hidden sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence initial={false}>
              {inFlight.map((u) => (
                <motion.li
                  key={u.key}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-3 rounded-xl border border-line bg-white p-2 pr-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u.preview} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{u.name}</p>
                    {u.state === "error" ? (
                      <p className="mt-1 truncate text-xs text-danger">{u.error}</p>
                    ) : (
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
                        <motion.div className={cn("h-full rounded-full", u.state === "done" ? "bg-success" : "bg-walnut")} animate={{ width: `${Math.round(u.progress * 100)}%` }} transition={{ ease: "easeOut" }} />
                      </div>
                    )}
                  </div>
                  {u.state === "done" ? (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 20 }} className="grid size-6 place-items-center rounded-full bg-success text-white"><Icon name="check" size={13} /></motion.span>
                  ) : u.state === "error" ? (
                    <button aria-label="Dismiss" onClick={() => setUploads((l) => l.filter((x) => x.key !== u.key))} className="grid size-6 place-items-center rounded-full text-muted hover:bg-canvas"><Icon name="x" size={13} /></button>
                  ) : (
                    <span className="text-xs tabular-nums text-muted">{u.state === "queued" ? "…" : `${Math.round(u.progress * 100)}%`}</span>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Room tabs */}
      {images.length > 0 && (
        <div className="no-scrollbar -mx-2 mt-8 flex gap-1 overflow-x-auto border-b border-line px-2" role="tablist" aria-label="Rooms">
          {tabs.map((t) => {
            const active = t === activeTab;
            return (
              <button key={t} role="tab" aria-selected={active} onClick={() => setTab(t)} className={cn("relative shrink-0 px-3 pb-3 pt-1 text-sm transition-colors", active ? "text-ink" : "text-muted hover:text-ink")}>
                {t} <span className="ml-0.5 text-xs tabular-nums opacity-60">{t === "All" ? images.length : counts.get(t)}</span>
                {active && <motion.span layoutId="room-tab" className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-walnut" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-10">
        {groups.map((g) => (
          <div key={g.room}>
            {activeTab === "All" && (
              <h3 className="mb-4 flex items-center gap-3 text-sm font-medium text-ink-soft">
                {g.room}
                <span className="h-px flex-1 bg-line" />
                <span className="text-xs text-muted">{g.images.length}</span>
              </h3>
            )}
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              <AnimatePresence initial={false} mode="popLayout">
                {g.images.map((img, i) => (
                  <motion.li
                    key={img.id}
                    layout
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    transition={{ type: "spring", stiffness: 360, damping: 30 }}
                  >
                    <PhotoTile
                      image={img}
                      rooms={roomOptions}
                      isCover={img.src === (coverSrc ?? images[0]?.src)}
                      first={i === 0}
                      last={i === g.images.length - 1}
                      onCover={() => makeCover(img)}
                      onRoom={(r) => changeRoom(img, r)}
                      onMove={(d) => move(img, d)}
                      onDelete={() => setToDelete(img)}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Remove this photograph?"
        body="It will disappear from the website straight away."
        confirmLabel="Remove"
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </motion.section>
  );
}

function PhotoTile({
  image, rooms, isCover, first, last, onCover, onRoom, onMove, onDelete,
}: {
  image: ProjectImage; rooms: readonly string[]; isCover: boolean; first: boolean; last: boolean;
  onCover: () => void; onRoom: (r: string) => void; onMove: (d: -1 | 1) => void; onDelete: () => void;
}) {
  return (
    <figure className={cn("group relative overflow-hidden rounded-xl bg-line ring-offset-2 transition-shadow", isCover && "ring-2 ring-brass")}>
      <div className="relative aspect-[4/5]">
        <Image src={image.src} alt={image.room} fill sizes="(min-width: 1280px) 15vw, (min-width: 640px) 28vw, 45vw" className="object-cover transition-transform duration-700 ease-[var(--ease-premium)] group-hover:scale-105" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100 touch:opacity-100" />
      </div>

      {isCover && (
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-brass px-2 py-1 text-[0.65rem] font-medium uppercase tracking-wider text-espresso transition-opacity duration-300 group-focus-within:opacity-0 group-hover:opacity-0 touch:top-12 touch:opacity-100">
          <Icon name="star" size={11} filled /> Cover
        </span>
      )}

      <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-1 opacity-0 transition-all duration-300 group-focus-within:opacity-100 group-hover:opacity-100 touch:opacity-100">
        <div className="flex gap-1">
          <TileAction label="Move earlier" icon="chevronLeft" disabled={first} onClick={() => onMove(-1)} />
          <TileAction label="Move later" icon="chevronRight" disabled={last} onClick={() => onMove(1)} />
        </div>
        <div className="flex gap-1">
          {!isCover && <TileAction label="Use as cover" icon="star" onClick={onCover} />}
          <TileAction label="Remove photograph" icon="trash" danger onClick={onDelete} />
        </div>
      </div>

      <figcaption className="absolute inset-x-2 bottom-2 translate-y-2 opacity-0 transition-all duration-300 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 touch:translate-y-0 touch:opacity-100">
        <Select variant="glass" label="Room" value={image.room} options={rooms} onChange={onRoom} allowCustom customLabel="Other room…" />
      </figcaption>
    </figure>
  );
}

function TileAction({ label, icon, onClick, disabled, danger }: { label: string; icon: "star" | "trash" | "chevronLeft" | "chevronRight"; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full bg-white/95 sm:size-8 text-ink backdrop-blur transition-all hover:scale-110 disabled:pointer-events-none disabled:opacity-40",
        danger ? "hover:bg-danger hover:text-white" : "hover:bg-brass",
      )}
    >
      <Icon name={icon} size={14} />
    </button>
  );
}
