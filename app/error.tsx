"use client";

import Link from "next/link";

// Catches errors thrown while rendering a page, instead of a blank screen.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="page pt-16">
      <p className="kicker mb-4 flex items-center gap-3">
        <span className="inline-block h-3 w-10 bg-danger" />
        Something broke
      </p>
      <h1 className="display text-[clamp(3rem,10vw,7rem)]">Error.</h1>
      <p className="mt-5 max-w-lg text-lg font-medium">
        This page hit a problem. It might be the server being unreachable. Try again, or head back home.
      </p>
      {error.digest && <p className="mt-2 text-xs font-semibold text-mute">Reference: {error.digest}</p>}
      <div className="mt-6 flex gap-3">
        <button className="btn-primary !py-3" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="btn-ghost !py-3">
          Home
        </Link>
      </div>
    </main>
  );
}
