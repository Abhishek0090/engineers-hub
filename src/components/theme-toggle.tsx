"use client";

import { useEffect, useState } from "react";

import { Icon } from "./icons";

type Theme = "dark" | "light";

export const THEME_SCRIPT = `try{var t=localStorage.getItem("seh:theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;}catch(e){}`;

function currentTheme(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the DOM theme after mount
    setTheme(currentTheme());
  }, []);
  const toggle = () => {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("seh:theme", next);
    } catch {}
    setTheme(next);
  };
  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label="Switch color theme" title="Switch color theme">
      <Icon name={theme === "light" ? "moon" : "sun"} size={18} />
    </button>
  );
}
