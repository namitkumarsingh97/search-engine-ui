"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ADULT_COOKIE } from "@/lib/auth";
import { SearchResponse } from "@/lib/types";

function setAdult(on: boolean) {
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = on
    ? `${ADULT_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax${secure}`
    : `${ADULT_COOKIE}=; path=/; max-age=0; SameSite=Lax${secure}`;
}

/**
 * The age signal. Shown when a search touches adult topics:
 *  - explicit queries: nothing is searched until the visitor confirms they are 18 or older;
 *  - mature (but encyclopedic) pages are hidden by SafeSearch, with an offer to show them.
 * The confirmation is the visitor's own word, kept in a cookie in this browser.
 */
export default function AgeGate({ data, adult }: { data: SearchResponse; adult: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const change = (on: boolean) => {
    setBusy(true);
    setAdult(on);
    router.refresh();
    setTimeout(() => setBusy(false), 800);
  };

  if (adult) {
    return (
      <p className="mb-5 flex flex-wrap items-center gap-3 border-2 border-line bg-surface px-3 py-2 text-sm font-semibold">
        <span className="kicker">SafeSearch off</span>
        Results about adult topics are shown on this browser.
        <button className="underline" onClick={() => change(false)} disabled={busy}>
          Turn SafeSearch back on
        </button>
      </p>
    );
  }

  if (!data.ageCheck) return null;

  const hidden = data.matureHidden ?? 0;
  const withheld = hidden === 0; // an explicit search: the API did not run it at all

  return (
    <section className="mb-6 border-2 border-line bg-mustard p-5" aria-label="Age check">
      <p className="kicker">Age check · 18+</p>
      <h2 className="mt-1 text-xl font-black uppercase tracking-tight">
        {withheld ? "This search is for adults only." : `SafeSearch hid ${hidden} result${hidden === 1 ? "" : "s"} about adult topics.`}
      </h2>
      <p className="mt-2 max-w-xl text-sm font-medium">
        {withheld
          ? "Confirm that you are 18 or older to continue. Nexa does not index explicit sites, so a search like this finds only general reference pages."
          : "These are reference pages on mature subjects (health, relationships, alcohol, gambling and similar). Confirm that you are 18 or older to see them."}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="btn-primary" onClick={() => change(true)} disabled={busy}>
          I am 18 or older
        </button>
        <span className="self-center text-sm font-semibold">Or just keep SafeSearch on.</span>
      </div>
    </section>
  );
}
