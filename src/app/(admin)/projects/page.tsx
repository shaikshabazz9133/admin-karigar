import type { Metadata } from "next";
import { projectsApi } from "@/lib/api";
import { ProjectsBoard } from "./ProjectsBoard";

export const metadata: Metadata = { title: "Homes" };

export default async function ProjectsPage() {
  return <ProjectsBoard initial={await projectsApi.list()} />;
}
