"use client";

import { CalendarDays, Film, FolderOpen, LayoutGrid, Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { appLinkProps, fetchApps, iconFor, PublicApp, TONE_CLASSES } from "@/lib/apps";

const BUILT_IN = [
  { href: "/drive", label: "Drive", Icon: FolderOpen, tone: "bg-mustard text-ink" },
  { href: "/videos", label: "Videos", Icon: Film, tone: "bg-accent text-white" },
  { href: "/calendar", label: "Calendar", Icon: CalendarDays, tone: "bg-ink text-canvas" },
  { href: "/mail", label: "Mail", Icon: Mail, tone: "bg-surface text-ink" },
];

/** The 3x3-style launcher in the header, like the apps grid in other big products. */
export default function AppsMenu() {
  const [open, setOpen] = useState(false);
  const [apps, setApps] = useState<PublicApp[]>([]);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchApps().then(setApps);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const tile = "flex flex-col items-center gap-2 p-2 text-center transition-colors hover:bg-mustard";
  const iconBox = "flex h-12 w-12 items-center justify-center border-2 border-line";

  return (
    <div ref={box} className="relative">
      <button
        className={`icon-btn ${open ? "!bg-ink !text-canvas" : ""}`}
        aria-label="Apps"
        aria-expanded={open}
        title="Apps"
        onClick={() => setOpen((o) => !o)}
      >
        <LayoutGrid size={20} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[19rem] border-4 border-line bg-canvas">
          <p className="kicker border-b-2 border-line bg-ink px-4 py-2 text-canvas">Nexa apps</p>
          <div className="grid grid-cols-3 gap-1 p-2">
            {BUILT_IN.map(({ href, label, Icon, tone }) => (
              <Link key={href} href={href} className={tile} onClick={() => setOpen(false)}>
                <span className={`${iconBox} ${tone}`}>
                  <Icon size={22} />
                </span>
                <span className="text-xs font-black uppercase tracking-tight">{label}</span>
              </Link>
            ))}
            {apps.map((app) => {
              const Icon = iconFor(app.icon);
              return (
                <a key={app.id} {...appLinkProps(app)} className={tile} onClick={() => setOpen(false)}>
                  <span className={`${iconBox} ${TONE_CLASSES[app.tone] ?? TONE_CLASSES.mustard}`}>
                    <Icon size={22} />
                  </span>
                  <span className="text-xs font-black uppercase tracking-tight">{app.name}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
