// Shapes returned by the backend API (camelCase JSON).

export interface ProjectImage {
  id: string;
  /** Absolute URL: the API's /media for uploads, the website's /images for photos it already ships. */
  src: string;
  room: string;
  width: number;
  height: number;
  position: number;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  flatNo: string;
  configuration: string;
  development: string;
  community: string;
  area: string;
  /** Website order (lower first). */
  position: number;
  coverImageId: string | null;
  coverSrc: string | null;
  photoCount: number;
  roomCount: number;
  images: ProjectImage[];
  createdAt: string;
  updatedAt: string;
}

export type ProjectDetails = Pick<Project, "name" | "flatNo" | "configuration" | "development" | "community" | "area">;
