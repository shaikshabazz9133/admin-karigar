import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TOKEN_COOKIE } from "./session";
import type { Project, ProjectDetails } from "./types";

export const API_URL = (process.env.API_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

/** Calls the API with the signed-in admin's token. An expired session sends the admin back to sign in. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) redirect("/login");

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(503, "Can't reach the server. Check that the API is running.");
  }

  // The cookie can only be cleared in a route handler, so hand off to one.
  if (res.status === 401) redirect("/session-expired");
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.detail ?? "Something went wrong. Please try again.", body.fields);
  return body as T;
}

const json = (body: unknown) => JSON.stringify(body);

export type ProjectPatch = Partial<ProjectDetails> & {
  position?: number;
  coverImageId?: string;
  /** The photographs in their new order with their rooms; any left out are deleted. */
  images?: { id: string; room: string }[];
};

export const projectsApi = {
  list: () => api<Project[]>("/projects"),
  get: async (id: string) => {
    try {
      return await api<Project>(`/projects/${encodeURIComponent(id)}`);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 422)) return null;
      throw e;
    }
  },
  create: (details: ProjectDetails) => api<Project>("/projects", { method: "POST", body: json(details) }),
  update: (id: string, patch: ProjectPatch) => api<Project>(`/projects/${id}`, { method: "PATCH", body: json(patch) }),
  remove: (id: string) => api<void>(`/projects/${id}`, { method: "DELETE" }),
  upload: (id: string, form: FormData) =>
    api<{ images: Project["images"]; errors: { filename: string; error: string }[]; project: Project }>(
      `/projects/${id}/images`,
      { method: "POST", body: form },
    ),
};
