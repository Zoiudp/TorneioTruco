import type { Team } from "./types";

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function teamById(teams: Team[], id: string | null): Team | undefined {
  if (!id) return undefined;
  return teams.find((t) => t.id === id);
}
