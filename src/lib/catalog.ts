// Site configuration. Everything here comes from src/content/site.json: the site name, the
// programs (separate curricula such as software engineering and CA) with their wording, and the
// areas that group tracks. Add a program or an area by editing that file; no code changes needed.
import type { IconName } from "@/components/icons";
import site from "@/content/site.json";
import type { Area, Goal, Level, Program, Progress } from "@/lib/types";

export interface ProgramTerms {
  /** Sidebar label for the question bank. */
  nav: string;
  /** Label for an "interview" question in the practice player. */
  question: string;
  bank: string;
  bankHint: string;
  round: string;
  roundShort: string;
  mostAsked: string;
  /** "interview" or "theory": used in "12 top React interview questions". */
  kind: string;
  /** Name for the self-rated group in the practice intro ("interview questions", "written questions"). */
  written: string;
  prepEyebrow: string;
  prepText: string;
  search: string;
  doneText: string;
}

export interface ProgramConfig {
  id: Program;
  /** Ids of tracks, goals and questions of this program start with it. The default program has none. */
  idPrefix?: string;
  label: string;
  short: string;
  icon: IconName;
  color: string;
  blurb: string;
  heroLine: string;
  terms: ProgramTerms;
}

export interface AreaConfig {
  id: Area;
  program: Program;
  label: string;
  icon: IconName;
  blurb: string;
}

export const SITE_NAME: string = site.name;
export const SITE_TAGLINE: string = site.tagline;
export const SITE_DESCRIPTION: string = site.description;
export const AUTHOR: string = site.author;
export const DEFAULT_PROGRAM: Program = site.defaultProgram;

export const PROGRAMS = site.programs as ProgramConfig[];
export const AREAS = site.areas as AreaConfig[];

export const programConfig = (id: Program | null | undefined): ProgramConfig =>
  PROGRAMS.find((p) => p.id === id) ?? PROGRAMS.find((p) => p.id === DEFAULT_PROGRAM) ?? PROGRAMS[0];

export const programOf = (area: Area): Program => AREAS.find((a) => a.id === area)?.program ?? DEFAULT_PROGRAM;
export const goalProgram = (g: Pick<Goal, "program">): Program => g.program ?? DEFAULT_PROGRAM;
export const programLabel = (p: Program) => programConfig(p).label;

/** Program of a track, goal, chapter or question id, from the configured id prefixes. */
export const programOfId = (id: string | null | undefined): Program =>
  (id && PROGRAMS.find((p) => p.idPrefix && id.startsWith(p.idPrefix))?.id) || DEFAULT_PROGRAM;

/** The program the learner is in: set when they pick a goal (older progress falls back to the goal id). */
export const progressProgram = (p: Pick<Progress, "program" | "goalId">): Program => p.program ?? programOfId(p.goalId);

export const LEVELS: { id: Level; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

export const levelLabel = (l: Level) => LEVELS.find((x) => x.id === l)?.label ?? l;

/** Goal icons are icon names; unknown names fall back to "target". */
export const GOAL_ICONS: Record<string, IconName> = {
  target: "target",
  layers: "layers",
  layout: "layout",
  server: "server",
  sprout: "sprout",
  calculator: "calculator",
  scale: "scale",
  cap: "cap",
  code: "code",
};
