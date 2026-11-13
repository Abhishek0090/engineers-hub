import type { IconName } from "@/components/icons";
import type { Area, Level } from "@/lib/types";

export const SITE_NAME = "Software Engineers Hub";
export const AUTHOR = "Abhishek Pal";

export const AREAS: { id: Area; label: string; icon: IconName; blurb: string }[] = [
  { id: "fundamentals", label: "Fundamentals", icon: "lightbulb", blurb: "How the web works, Git, DSA and system design" },
  { id: "frontend", label: "Frontend", icon: "layout", blurb: "HTML, CSS, JavaScript, TypeScript, React and Next.js" },
  { id: "backend", label: "Backend", icon: "server", blurb: "Node.js, APIs, authentication and security" },
  { id: "database", label: "Databases", icon: "database", blurb: "MongoDB, PostgreSQL, Prisma, Drizzle and Redis" },
  { id: "devops", label: "DevOps and Cloud", icon: "container", blurb: "Docker, CI/CD, Kubernetes and AWS" },
  { id: "career", label: "Career", icon: "user", blurb: "Behavioral rounds, resumes and growth" },
];

export const LEVELS: { id: Level; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

export const levelLabel = (l: Level) => LEVELS.find((x) => x.id === l)?.label ?? l;

export const GOAL_ICONS: Record<string, IconName> = {
  target: "target",
  layers: "layers",
  layout: "layout",
  server: "server",
  sprout: "sprout",
};
