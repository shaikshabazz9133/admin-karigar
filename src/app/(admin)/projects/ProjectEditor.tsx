"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Project, ProjectDetails, ProjectImage } from "@/lib/types";
import type { Suggestions } from "@/lib/suggestions";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toaster";
import { Select } from "@/components/Select";
import { saveProject } from "../actions";
import { PhotoManager } from "./PhotoManager";

const ease = [0.22, 1, 0.36, 1] as const;
const EMPTY: ProjectDetails = { name: "", flatNo: "", configuration: "", development: "", community: "", area: "" };

const pick = (p: Project | null): ProjectDetails =>
  p ? { name: p.name, flatNo: p.flatNo, configuration: p.configuration, development: p.development, community: p.community, area: p.area } : EMPTY;

export function ProjectEditor({ project, suggestions, siteUrl }: { project: Project | null; suggestions: Suggestions; siteUrl: string }) {
  const router = useRouter();
  const toast = useToast();
  const isNew = !project;

  const [saved, setSaved] = useState(() => pick(project));
  const [details, setDetails] = useState(saved);
  const [images, setImages] = useState<ProjectImage[]>(project?.images ?? []);
  const [coverSrc, setCoverSrc] = useState(project?.coverSrc ?? null);
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectDetails, string>>>({});
  const [saving, setSaving] = useState(false);
  // On "Add a home", photos are picked before the home exists; once it's created they upload to this id.
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  const dirty = (Object.keys(details) as (keyof ProjectDetails)[]).some((k) => details[k] !== saved[k]);
  const set = (k: keyof ProjectDetails) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setDetails((d) => ({ ...d, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  const save = async () => {
    setSaving(true);
    const res = await saveProject(project?.id ?? null, details);
    if (!res.ok) {
      setSaving(false);
      setErrors(res.fields ?? {});
      toast(res.error, "error");
      if (res.fields) document.querySelector<HTMLElement>(`[name="${Object.keys(res.fields)[0]}"]`)?.focus();
      return;
    }
    if (isNew) {
      if (pendingCount === 0) {
        toast("Home created — now add its photographs");
        router.replace(`/projects/${res.project.id}#photos`);
        return;
      }
      // PhotoManager uploads the queued photos, then calls onUploadsSettled.
      setSaved(pick(res.project));
      setCreatedId(res.project.id);
      return;
    }
    setSaving(false);
    setSaved(pick(res.project));
    setDetails(pick(res.project));
    setSlug(res.project.slug);
    toast("Changes saved");
    router.refresh();
  };

  const onImagesChange = (next: ProjectImage[], cover: string | null) => {
    setImages(next);
    setCoverSrc(cover);
  };

  const onUploadsSettled = (uploaded: number, failed: number) => {
    if (!createdId) return;
    toast(failed ? `Home created — ${failed} photo${failed > 1 ? "s" : ""} didn't upload` : `Home created with ${uploaded} photograph${uploaded === 1 ? "" : "s"}`, failed ? "error" : "success");
    router.replace(`/projects/${createdId}`);
  };
  const cover = images.find((i) => i.src === coverSrc) ?? images[0];

  return (
    <>
      <header>
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease }}>
          <Link href="/projects" className="group inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">
            <Icon name="arrowLeft" size={16} className="transition-transform group-hover:-translate-x-1" /> All homes
          </Link>
        </motion.div>
        <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <motion.p className="eyebrow text-brass-ink" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05, ease }}>
              {isNew ? "New home" : `Flat ${saved.flatNo} · ${saved.community}`}
            </motion.p>
            <motion.h1 className="display mt-4 truncate text-4xl md:text-5xl" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1, ease }}>
              {details.name || (isNew ? <>Add a <span className="accent text-walnut">home.</span></> : "Untitled home")}
            </motion.h1>
          </div>
          {!isNew && (
            <motion.div className="flex items-center gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease }}>
              {images.length > 0 && siteUrl && (
                <a href={`${siteUrl}/projects/${slug}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-white px-4 text-sm text-ink-soft transition-colors hover:border-ink hover:text-ink">
                  <Icon name="external" size={15} /> View on website
                </a>
              )}
            </motion.div>
          )}
        </div>
      </header>

      <div className="mt-8 grid gap-6 md:mt-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8 2xl:grid-cols-[minmax(0,1fr)_23rem]">
        <motion.section
          aria-labelledby="details-title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease }}
          className="rounded-3xl border border-line bg-white p-4 sm:p-6 md:p-8"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-walnut-tint text-walnut"><Icon name="edit" size={18} /></span>
            <div>
              <h2 id="details-title" className="display text-xl">Details</h2>
              <p className="text-sm text-muted">Shown on the home&apos;s card and page on the website.</p>
            </div>
          </div>

          <form className="mt-8 grid gap-x-5 gap-y-6 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
            <Field label="Home name" hint="Shown as the heading on the website" error={errors.name} className="sm:col-span-2" i={0}>
              <input name="name" value={details.name} onChange={set("name")} className="field" placeholder="Warm Modernism" aria-invalid={!!errors.name} />
            </Field>
            <Field label="Flat number" error={errors.flatNo} i={1}>
              <input name="flatNo" value={details.flatNo} onChange={set("flatNo")} className="field" placeholder="13102" inputMode="numeric" aria-invalid={!!errors.flatNo} />
            </Field>
            <Field label="Configuration" error={errors.configuration} i={2}>
              <Select
                name="configuration"
                label="Configuration"
                placeholder="Choose…"
                value={details.configuration}
                options={suggestions.configurations}
                invalid={!!errors.configuration}
                onChange={(v) => { setDetails((d) => ({ ...d, configuration: v })); setErrors((x) => ({ ...x, configuration: undefined })); }}
              />
            </Field>
            <Field label="Community" error={errors.community} i={3}>
              <input name="community" list="communities" value={details.community} onChange={set("community")} className="field" placeholder="The Prestige City" aria-invalid={!!errors.community} />
              <datalist id="communities">{suggestions.communities.map((d) => <option key={d} value={d} />)}</datalist>
            </Field>
            <Field label="Built-up area" error={errors.area} i={4}>
              <input name="area" value={details.area} onChange={set("area")} className="field" placeholder="1,600 sq. ft." aria-invalid={!!errors.area} />
            </Field>
            <button type="submit" hidden />
          </form>
        </motion.section>

        <motion.aside
          aria-label="Website preview"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease }}
          className="lg:sticky lg:top-24 lg:self-start xl:top-8"
        >
          <p className="eyebrow mb-4 flex items-center gap-2 text-muted">
            <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-success" /></span>
            Live preview
          </p>
          <PreviewCard details={details} cover={cover} count={images.length} />
        </motion.aside>
      </div>

      <PhotoManager
        projectId={project?.id ?? createdId}
        deferred={isNew}
        images={images}
        coverSrc={coverSrc}
        onChange={onImagesChange}
        onPendingChange={setPendingCount}
        onSettled={onUploadsSettled}
      />

      <div className="h-28" />
      <AnimatePresence>
        {(dirty || isNew) && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 xl:pl-72"
          >
            <div className="flex w-full max-w-xl items-center justify-between gap-4 rounded-full bg-espresso py-2 pl-6 pr-2 text-white shadow-lift">
              <p className="flex items-center gap-2.5 text-sm">
                {!isNew && <span className="size-2 rounded-full bg-brass" />}
                {createdId
                  ? `Uploading ${pendingCount} photograph${pendingCount === 1 ? "" : "s"}…`
                  : isNew
                    ? pendingCount ? `${pendingCount} photograph${pendingCount === 1 ? "" : "s"} ready to upload` : "Fill in the details and add photographs"
                    : "Unsaved changes"}
              </p>
              <div className="flex items-center gap-1">
                {!isNew && (
                  <button onClick={() => { setDetails(saved); setErrors({}); }} className="h-10 rounded-full px-4 text-sm text-white/70 transition-colors hover:text-white">Discard</button>
                )}
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex h-10 items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-espresso transition-transform hover:scale-[1.03] disabled:opacity-70"
                >
                  {saving && <span className="size-3.5 animate-spin rounded-full border-2 border-espresso/20 border-t-espresso" />}
                  {isNew ? (pendingCount ? "Create home & upload" : "Create home") : "Save changes"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Field({ label, hint, error, className, i, children }: { label: string; hint?: string; error?: string; className?: string; i: number; children: React.ReactNode }) {
  return (
    <motion.label
      className={cn("block", className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.25 + i * 0.05, ease }}
    >
      <span className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink-soft">{label}</span>
        {hint && <span className="truncate text-xs text-muted">{hint}</span>}
      </span>
      {children}
      <AnimatePresence>
        {error && (
          <motion.span initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="block overflow-hidden">
            <span className="mt-2 flex items-center gap-1.5 text-xs text-danger"><Icon name="alert" size={13} />{error}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.label>
  );
}

/** Mirrors the website's ProjectCard so the studio sees exactly how the home will be listed. */
function PreviewCard({ details: d, cover, count }: { details: ProjectDetails; cover?: ProjectImage; count: number }) {
  return (
    <article className="rounded-3xl border border-line bg-white p-3 shadow-soft max-lg:mx-auto max-lg:max-w-sm">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-line">
        <AnimatePresence initial={false}>
          {cover ? (
            <motion.div key={cover.src} className="absolute inset-0" initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease }}>
              <Image src={cover.src} alt="" fill sizes="23rem" className="object-cover" />
            </motion.div>
          ) : (
            <motion.div key="empty" className="skeleton absolute inset-0 grid place-items-center text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Icon name="image" size={30} />
            </motion.div>
          )}
        </AnimatePresence>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent opacity-70" />
        {d.configuration && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-ink backdrop-blur-sm">{d.configuration}</span>}
      </div>
      <div className="flex items-start justify-between gap-3 px-2 pb-2 pt-4">
        <div className="min-w-0">
          <p className="eyebrow mb-2 truncate text-muted">Flat {d.flatNo || "—"} · {d.community || "Community"}</p>
          <h3 className="display truncate text-xl tracking-tight">{d.name || "Home name"}</h3>
        </div>
        <p className="mt-5 shrink-0 text-right text-xs text-muted">
          {d.area || "Area"}
          <span className="block">{count} {count === 1 ? "photograph" : "photographs"}</span>
        </p>
      </div>
    </article>
  );
}
