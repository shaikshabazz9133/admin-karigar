import type { Metadata } from "next";
import { projectsApi } from "@/lib/api";
import { suggestionsFrom } from "@/lib/suggestions";
import { ProjectEditor } from "../ProjectEditor";

export const metadata: Metadata = { title: "Add a home" };

export default async function NewProjectPage() {
  return <ProjectEditor project={null} suggestions={suggestionsFrom(await projectsApi.list())} siteUrl={process.env.SITE_ORIGIN ?? "https://redesign-home-karigar.vercel.app"} />;
}
