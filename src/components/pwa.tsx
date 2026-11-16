"use client";

// PWA glue: registers the service worker (production only, so dev reloads never serve stale
// files), offers an "Install app" button where the browser supports it, and clears offline
// caches on logout.
import { useEffect, useState } from "react";

import { Icon } from "./icons";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // show our own button instead of the mini-infobar
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Not fatal: the app works without offline support.
    });
  }, []);
  return null;
}

/** Removes every cached page (call on logout so the next person on this device sees nothing). */
export async function clearOfflineCaches() {
  try {
    navigator.serviceWorker?.controller?.postMessage("clear-caches");
    if ("caches" in window) await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
  } catch {
    // Ignore: nothing cached or storage unavailable.
  }
}

const isIos = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

/** "Install app" button. Chrome/Edge/Android: native prompt. iOS Safari: short instructions. Hidden once installed. */
export function InstallAppButton({ className = "nav-item" }: { className?: string }) {
  const [, force] = useState(0);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read browser-only state after hydration
    setMounted(true);
    return () => {
      listeners.delete(l);
    };
  }, []);

  if (!mounted || isStandalone()) return null;
  if (!deferredPrompt && !isIos()) return null;

  const install = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      notify();
    } else setShowIosHelp((v) => !v);
  };

  return (
    <>
      <button type="button" className={className} onClick={install} style={{ background: "none", width: "100%" }}>
        <Icon name="arrowRight" size={22} style={{ transform: "rotate(90deg)" }} /> Install app
      </button>
      {showIosHelp ? (
        <p className="faint" style={{ fontSize: 13, padding: "0 12px" }}>
          In Safari, tap Share, then <b>Add to Home Screen</b>.
        </p>
      ) : null}
    </>
  );
}
