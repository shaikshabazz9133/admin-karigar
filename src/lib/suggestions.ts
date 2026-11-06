import type { Project } from "./types";
import { CONFIGURATIONS } from "./rooms";

export type Suggestions = { developments: string[]; communities: string[]; configurations: string[] };

/** Values already used across homes, offered as suggestions so names stay consistent on the website's filters. */
export function suggestionsFrom(all: Project[]): Suggestions {
  const uniq = (values: string[]) => [...new Set(values.filter(Boolean))].sort();
  return {
    developments: uniq(all.map((p) => p.development)),
    communities: uniq(all.map((p) => p.community)),
    configurations: uniq([...CONFIGURATIONS, ...all.map((p) => p.configuration)]),
  };
}
