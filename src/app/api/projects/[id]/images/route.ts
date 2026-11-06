import { revalidatePath } from "next/cache";
import { ApiError, projectsApi } from "@/lib/api";
import { requireSession } from "@/lib/auth";

/**
 * Forwards one photo (multipart: `file`, `room`) to the API with the admin's token, which browser code can't read.
 * The editor sends files one at a time so it can show each one's progress.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/projects/[id]/images">) {
  await requireSession();
  const { id } = await ctx.params;
  const incoming = await req.formData();
  const file = incoming.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file received." }, { status: 400 });

  const form = new FormData();
  form.append("room", String(incoming.get("room") ?? ""));
  form.append("files", file, file.name);
  try {
    const { images, errors, project } = await projectsApi.upload(id, form);
    if (!images.length) return Response.json({ error: errors[0]?.error ?? "Upload failed." }, { status: 415 });
    revalidatePath("/projects");
    revalidatePath("/photos");
    return Response.json({ image: images[0], coverSrc: project.coverSrc });
  } catch (e) {
    if (e instanceof ApiError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
