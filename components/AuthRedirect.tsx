"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import AuthForm from "@/components/AuthForm";
import { AUTH_URL, startAuth } from "@/lib/authRedirect";

function Redirector({ mode }: { mode: "login" | "register" }) {
  const next = useSearchParams().get("next");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // React dev mode runs effects twice: only start one flow
    started.current = true;
    startAuth(mode, next);
  }, [mode, next]);

  return (
    <div className="page pt-16">
      <p className="kicker mb-3">Sign in</p>
      <h1 className="display text-[clamp(2.5rem,7vw,5rem)]">One moment.</h1>
      <p className="mt-4 max-w-md text-base font-medium">Taking you to the Nexa sign-in page&hellip;</p>
      <button className="btn-ghost mt-6" onClick={() => startAuth(mode, next)}>
        Not redirected? Continue
      </button>
    </div>
  );
}

/**
 * The /login and /register pages: hand off to the separate accounts app when one is
 * configured, otherwise show this app's own form.
 */
export default function AuthRedirect({ mode }: { mode: "login" | "register" }) {
  if (!AUTH_URL) return <AuthForm mode={mode} />;
  return (
    <Suspense fallback={null}>
      <Redirector mode={mode} />
    </Suspense>
  );
}
