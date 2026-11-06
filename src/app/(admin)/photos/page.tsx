import type { Metadata } from "next";
import { projectsApi } from "@/lib/api";
import { roomRank } from "@/lib/rooms";
import { PhotoWall, type WallPhoto } from "./PhotoWall";

export const metadata: Metadata = { title: "All photographs" };

export default async function PhotosPage() {
  const projects = await projectsApi.list();
  const photos: WallPhoto[] = projects.flatMap((p) =>
    [...p.images]
      .sort((a, b) => roomRank(a.room) - roomRank(b.room) || a.position - b.position)
      .map((img) => ({ ...img, projectId: p.id, projectName: p.name, flatNo: p.flatNo, development: p.development })),
  );
  return <PhotoWall photos={photos} homes={projects.length} />;
}
