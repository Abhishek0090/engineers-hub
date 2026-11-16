// Shared content and progress types. The JSON files in src/content and the MongoDB
// collections both follow these shapes, so either data source can back the app.

/** A program is a separate curriculum (software engineering, CA exam prep...). Defined in src/content/site.json. */
export type Program = string;
/** Area ids are defined in src/content/site.json; each area belongs to one program. */
export type Area = string;
export type Level = "beginner" | "intermediate" | "advanced";

export interface LessonSection {
  heading: string;
  body: string;
  code?: { lang: string; source: string };
}

interface QuestionBase {
  id: string;
  prompt: string;
  code?: string;
  level?: Level;
  explanation?: string;
  /** Marks a famous, frequently asked question; shown first in the track's Most asked section. */
  top?: boolean;
  /** Problem data shown under the prompt (rich text, supports tables). */
  data?: string;
  /** Id of a chapter case study the question belongs to. */
  caseId?: string;
  /** Copied from the case when content loads, so any screen can show it without the chapter. */
  caseTitle?: string;
  caseBody?: string;
  /** Set when content loads, from the track's area. */
  program?: Program;
}
export interface McqQuestion extends QuestionBase {
  type: "mcq";
  options: string[];
  answer: number;
}
export interface MultiQuestion extends QuestionBase {
  type: "multi";
  options: string[];
  answers: number[];
}
export interface TrueFalseQuestion extends QuestionBase {
  type: "truefalse";
  answer: boolean;
}
export interface FillQuestion extends QuestionBase {
  type: "fill";
  accept: string[];
}
export interface InterviewQuestion extends QuestionBase {
  type: "interview";
  answer: string;
}
/** A computation with one final figure, graded within a tolerance. */
export interface NumericQuestion extends QuestionBase {
  type: "numeric";
  answer: number;
  /** Absolute tolerance. Default: 0.1% of the answer (at least 0.01). */
  tolerance?: number;
  unit?: string;
}
/** A multi-step problem (journal entries, computations, reports) with a model solution; self-graded. */
export interface PracticalQuestion extends QuestionBase {
  type: "practical";
  answer: string;
}
export type Question =
  | McqQuestion
  | MultiQuestion
  | TrueFalseQuestion
  | FillQuestion
  | InterviewQuestion
  | NumericQuestion
  | PracticalQuestion;

/** Questions the learner grades against a model answer. */
export const isSelfRated = (q: Question): q is InterviewQuestion | PracticalQuestion =>
  q.type === "interview" || q.type === "practical";

export interface CaseStudy {
  id: string;
  title: string;
  body: string;
}

export interface Resource {
  title: string;
  url: string;
}

export interface Chapter {
  id: string;
  title: string;
  level: Level;
  summary: string;
  estMinutes: number;
  lesson: LessonSection[];
  keyPoints: string[];
  questions: Question[];
  resources?: Resource[];
  /** Case studies shared by several questions (questions point at them with caseId). */
  cases?: CaseStudy[];
  /** Exam attempts this chapter is written for, e.g. "May 2027 onward". */
  applicableFor?: string;
  /** Law or standards version, e.g. "Income-tax Act 2025 as amended by Finance Act 2026". */
  lawAsOf?: string;
  /** Not yet reviewed by a subject expert; the study page shows a warning. */
  draft?: boolean;
}

export interface Track {
  id: string;
  title: string;
  area: Area;
  order: number;
  icon: string;
  color: string;
  description: string;
  chapters: Chapter[];
}

/** A chapter without its lesson and questions: enough to draw paths and lists. */
export interface ChapterSummary {
  id: string;
  title: string;
  level: Level;
  summary: string;
  estMinutes: number;
  questionCount: number;
  /** Self-rated questions: interview (theory) and practical. */
  interviewCount: number;
}

export interface TrackSummary extends Omit<Track, "chapters"> {
  chapters: ChapterSummary[];
  questionCount: number;
  program: Program;
}

export interface Goal {
  id: string;
  /** Defaults to "software". */
  program?: Program;
  title: string;
  tagline: string;
  description: string;
  icon: string;
  dailyGoalXp: number;
  trackIds: string[];
}

export interface InterviewItem extends InterviewQuestion {
  program: Program;
  trackId: string;
  trackTitle: string;
  trackColor: string;
  chapterId: string;
  chapterTitle: string;
  chapterLevel: Level;
}

/** A question together with where it lives, used by the review session. */
export interface LocatedQuestion {
  question: Question;
  trackId: string;
  chapterId: string;
  chapterTitle: string;
}

export interface UserRecord {
  id: string;
  username: string;
  name: string;
  role: "admin" | "learner";
  passwordHash: string;
}

export type PublicUser = Omit<UserRecord, "passwordHash">;

export interface ChapterProgress {
  bestScore: number; // 0-100
  attempts: number;
  completedAt: string;
  studied?: boolean;
}

export interface Progress {
  version: 1;
  xp: number;
  goalId: string | null;
  /** Program of the current goal; everything in the app follows it. */
  program?: Program;
  dailyGoalXp: number;
  streak: { count: number; lastDay: string | null; best: number };
  /** XP earned per day, keyed YYYY-MM-DD (local time). */
  history: Record<string, number>;
  chapters: Record<string, ChapterProgress>;
  /** Question ids answered wrong (or marked "missed") and not yet fixed. */
  mistakes: string[];
  /** Interview questions the learner marked as practiced. */
  practiced: string[];
  updatedAt: string;
}
