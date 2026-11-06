import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projectsApi } from "@/lib/api";
import { ProjectEditor } from "../ProjectEditor";
import { suggestionsFrom } from "@/lib/suggestions";

export async function generateMetadata({ params }: PageProps<"/projects/[id]">): Promise<Metadata> {
  const p = await projectsApi.get((await params).id);
  return { title: p?.name ?? "Home" };
}

export default async function EditProjectPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const [project, all] = await Promise.all([projectsApi.get(id), projectsApi.list()]);
  if (!project) notFound();
  return <ProjectEditor key={project.id} project={project} suggestions={suggestionsFrom(all)} siteUrl={process.env.SITE_ORIGIN ?? "https://redesign-home-karigar.vercel.app"} />;
}
