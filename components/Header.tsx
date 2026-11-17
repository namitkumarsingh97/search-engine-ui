"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getMe } from "@/lib/api";
import { AuthUser, getToken, parseUserCookie, saveSession, USER_COOKIE } from "@/lib/auth";
import { getFolders } from "@/lib/mail";
import AppsMenu from "./AppsMenu";
import LogoutButton from "./LogoutButton";

const APP_LINKS = [
  { href: "/drive", label: "Drive", needsAuth: true },
  { href: "/videos", label: "Videos", needsAuth: false },
  { href: "/news", label: "News", needsAuth: false },
  { href: "/calendar", label: "Calendar", needsAuth: true },
  { href: "/mail", label: "Mail", needsAuth: true },
];

function readUser(): AuthUser | null {
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${USER_COOKIE}=`));
  return parseUserCookie(match?.slice(USER_COOKIE.length + 1));
}

/** Square orange mark + heavy wordmark, like a magazine masthead. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center border-2 border-line bg-accent text-xl font-black leading-none text-white">
        N
      </span>
      <span className="display text-3xl">Nexa</span>
    </Link>
  );
}

// Client component (some admin pages are client components and render it),
// so the signed-in user is read from the cookie after mount.
export default function Header() {
  const pathname = usePathname();
  // After signing in, come back to the page the visitor was on.
  const nextParam = pathname && pathname !== "/" && !pathname.startsWith("/login") && !pathname.startsWith("/register") && !pathname.startsWith("/auth") ? `?next=${encodeURIComponent(pathname)}` : "";
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const current = readUser();
    setUser(current);
    setReady(true);
    if (!current) return;

    // Sessions saved before admin roles existed have no isAdmin flag: refresh it once.
    const token = getToken();
    if (token && current.isAdmin === undefined) {
      getMe(token)
        .then((fresh) => {
          saveSession(token, fresh);
          setUser(fresh);
        })
        .catch(() => undefined);
    }
    getFolders()
      .then((c) => setUnread(c.inbox.unread))
      .catch(() => undefined);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-canvas">
      <div className="bg-ink text-canvas">
        <div className="mx-auto flex h-7 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <span className="kicker text-mustard">Search / Files / Video / Calendar</span>
          <span className="kicker hidden text-canvas/70 sm:block">Issue Nº 01</span>
        </div>
      </div>

      <div className="border-b-4 border-line">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-6">
            <Logo />
            <nav className="hidden items-center sm:flex">
              {APP_LINKS.filter((l) => !l.needsAuth || user || !ready).map(({ href, label }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`kicker border-x border-transparent px-3.5 py-2.5 transition-colors ${
                      active ? "bg-ink text-canvas" : "hover:bg-mustard"
                    }`}
                  >
                    {label}
                    {href === "/mail" && unread > 0 && (
                      <span className="ml-1.5 bg-accent px-1.5 py-0.5 text-[10px] text-white">{unread}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <AppsMenu />
            {user?.isAdmin && (
              <Link
                href="/admin"
                className={`kicker hidden px-3 py-2.5 transition-colors sm:block ${
                  pathname.startsWith("/admin") ? "bg-ink text-canvas" : "hover:bg-mustard"
                }`}
              >
                Admin
              </Link>
            )}
            {ready &&
              (user ? (
                <div className="flex items-center gap-1">
                  <span
                    title={user.email}
                    className="flex h-9 w-9 items-center justify-center border-2 border-line bg-mustard text-base font-black"
                  >
                    {user.name.trim().charAt(0).toUpperCase() || "?"}
                  </span>
                  <LogoutButton />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href={`/login${nextParam}`} className="btn-ghost">
                    Sign in
                  </Link>
                  <Link href={`/register${nextParam}`} className="btn-primary hidden sm:inline-flex">
                    Get started
                  </Link>
                </div>
              ))}
          </div>
        </div>

        {/* Mobile nav row */}
        <nav className="flex border-t-2 border-line sm:hidden">
          {APP_LINKS.filter((l) => !l.needsAuth || user || !ready).map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`kicker flex-1 py-2.5 text-center ${pathname.startsWith(href) ? "bg-ink text-canvas" : ""}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
