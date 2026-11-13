// Shared content and progress types. The JSON files in src/content and the MongoDB
// collections both follow these shapes, so either data source can back the app.

export type Area = "fundamentals" | "frontend" | "backend" | "database" | "devops" | "career";
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
export type Question = McqQuestion | MultiQuestion | TrueFalseQuestion | FillQuestion | InterviewQuestion;

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
  interviewCount: number;
}

export interface TrackSummary extends Omit<Track, "chapters"> {
  chapters: ChapterSummary[];
  questionCount: number;
}

export interface Goal {
  id: string;
  title: string;
  tagline: string;
  description: string;
  icon: string;
  dailyGoalXp: number;
  trackIds: string[];
}

export interface InterviewItem extends InterviewQuestion {
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
