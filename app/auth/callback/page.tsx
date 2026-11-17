"use client";

import { useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import { exchangeCode, startAuth, takeFlow } from "@/lib/authRedirect";

/**
 * Where the accounts app sends people back to: /auth/callback?code=...&state=...
 * Checks that this browser started the sign-in (state), then swaps the one-time code for a session.
 */
function Callback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // the code works once: never run twice (React dev mode runs effects twice)
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    // Take the code out of the address bar and history straight away.
    window.history.replaceState(null, "", window.location.pathname);

    const flow = takeFlow();
    if (!code) return setError("The sign-in didn't come back with a code.");
    if (!flow || !state || flow.state !== state) {
      return setError("We couldn't verify that this sign-in started here. Please try again.");
    }

    exchangeCode(code)
      .then(() => {
        // Full navigation, so the header and every page pick up the new session.
        window.location.replace(flow.next);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Sign-in failed."));
  }, [router]);

  if (!error) {
    return (
      <div className="page pt-16">
        <p className="kicker mb-3">Signing you in</p>
        <h1 className="display text-[clamp(2.5rem,7vw,5rem)]">Almost there.</h1>
      </div>
    );
  }

  return (
    <div className="page pt-16">
      <p className="kicker mb-3 text-danger">Sign-in problem</p>
      <h1 className="display text-[clamp(2.5rem,7vw,5rem)]">Not signed in.</h1>
      <p className="mt-4 max-w-md border-2 border-danger px-3 py-2 text-sm font-bold text-danger">{error}</p>
      <button className="btn-primary mt-6 !py-3" onClick={() => startAuth("login", "/")}>
        Try again
      </button>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <main>
      <Header />
      <Suspense fallback={null}>
        <Callback />
      </Suspense>
    </main>
  );
}
