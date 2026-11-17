"use client";

import { ReactNode } from "react";
import { AUTH_URL, startAuth } from "@/lib/authRedirect";

/**
 * A "Sign in" / "Sign up" link that goes straight to the accounts app (no stop on a page of this app first).
 * A normal click remembers the page you were on, so you come back to it after signing in.
 */
export default function SignInLink({
  mode = "login",
  className,
  children,
}: {
  mode?: "login" | "register";
  className?: string;
  children: ReactNode;
}) {
  if (!AUTH_URL) {
    // Sign-in lives in a separate app: without its address there is nowhere to send people.
    return (
      <span className={`${className ?? ""} cursor-not-allowed opacity-50`} title="Sign-in isn't configured: set NEXT_PUBLIC_AUTH_URL">
        {children}
      </span>
    );
  }

  return (
    <a
      href={`${AUTH_URL}/${mode}`}
      className={className}
      onClick={(e) => {
        // Plain left-click: add the return address and a fresh state check, then go.
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        startAuth(mode, window.location.pathname + window.location.search);
      }}
    >
      {children}
    </a>
  );
}
