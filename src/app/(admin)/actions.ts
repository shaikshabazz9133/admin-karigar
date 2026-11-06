"use server";

import { revalidatePath } from "next/cache";
import { ApiError, projectsApi, type ProjectPatch } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import type { Project, ProjectDetails } from "@/lib/types";

export type SaveResult =
  | { ok: true; project: Project }
  | { ok: false; error: string; fields?: Partial<Record<keyof ProjectDetails, string>> };

type Result = { ok: true; project: Project } | { ok: false; error: string };

const REQUIRED: [keyof ProjectDetails, string][] = [
  ["name", "Give the home its design name."],
  ["flatNo", "Enter the flat number."],
  ["configuration", "Choose the configuration."],
  ["development", "Enter the development."],
  ["community", "Enter the community."],
  ["area", "Enter the built-up area."],
];

const touched = (id?: string) => {
  revalidatePath("/projects");
  revalidatePath("/photos");
  if (id) revalidatePath(`/projects/${id}`);
};

/** Turns API errors into results the UI shows; anything else (e.g. the session-expired redirect) propagates. */
async function attempt<T extends { ok: true }>(fn: () => Promise<T>): Promise<T | { ok: false; error: string; fields?: Record<string, string> }> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message, fields: e.fields };
    throw e;
  }
}

export async function saveProject(id: string | null, input: ProjectDetails): Promise<SaveResult> {
  await requireSession();
  const details = Object.fromEntries(
    REQUIRED.map(([k]) => [k, String(input[k] ?? "").trim().replace(/\s+/g, " ")]),
  ) as ProjectDetails;
  const fields: Partial<Record<keyof ProjectDetails, string>> = {};
  for (const [key, msg] of REQUIRED) if (!details[key]) fields[key] = msg;
  if (Object.keys(fields).length) return { ok: false, error: "A few details are missing.", fields };

  const res = await attempt(async () => {
    const project = id ? await projectsApi.update(id, details) : await projectsApi.create(details);
    return { ok: true as const, project };
  });
  if (res.ok) touched(res.project.id);
  return res as SaveResult;
}

export async function deleteProject(id: string) {
  await requireSession();
  await projectsApi.remove(id);
  touched();
}

/** Saves a new website order: only homes whose position changes are updated. */
export async function reorderProjects(ids: string[]) {
  await requireSession();
  const current = await projectsApi.list();
  const position = new Map(current.map((p) => [p.id, p.position]));
  await Promise.all(ids.map((id, i) => (position.get(id) === i ? null : projectsApi.update(id, { position: i }))));
  touched();
}

/** Loads the home, lets `edit` build a patch from its current photos, and saves it. */
async function editPhotos(id: string, edit: (p: Project) => ProjectPatch | string | null): Promise<Result> {
  await requireSession();
  const res = await attempt(async () => {
    const project = await projectsApi.get(id);
    if (!project) throw new ApiError(404, "This home no longer exists.");
    const patch = edit(project);
    if (typeof patch === "string") throw new ApiError(404, patch);
    return { ok: true as const, project: patch ? await projectsApi.update(id, patch) : project };
  });
  if (res.ok) touched(id);
  return res;
}

const photoList = (p: Project) => p.images.map(({ id, room }) => ({ id, room }));
const missing = "That photograph was already removed.";

export async function setImageRoom(id: string, imageId: string, room: string) {
  return editPhotos(id, (p) => {
    if (!p.images.some((i) => i.id === imageId)) return missing;
    return { images: photoList(p).map((i) => (i.id === imageId ? { ...i, room } : i)) };
  });
}

export async function setCover(id: string, imageId: string) {
  return editPhotos(id, (p) => (p.images.some((i) => i.id === imageId) ? { coverImageId: imageId } : missing));
}

/** Moves a photo one place earlier or later among the photos of the same room. */
export async function moveImage(id: string, imageId: string, dir: -1 | 1) {
  return editPhotos(id, (p) => {
    const list = photoList(p);
    const from = list.findIndex((i) => i.id === imageId);
    if (from < 0) return missing;
    let to = from + dir;
    while (to >= 0 && to < list.length && list[to].room !== list[from].room) to += dir;
    if (to < 0 || to >= list.length) return null;
    [list[from], list[to]] = [list[to], list[from]];
    return { images: list };
  });
}

export async function deleteImage(id: string, imageId: string) {
  // Photographs left out of the list are deleted by the API.
  return editPhotos(id, (p) => ({ images: photoList(p).filter((i) => i.id !== imageId) }));
}
