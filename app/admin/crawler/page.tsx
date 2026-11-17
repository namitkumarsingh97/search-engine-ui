"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import Header from "@/components/Header";
import SignInLink from "@/components/SignInLink";
import PageTitle from "@/components/PageTitle";
import {
  ApiError,
  getCrawlerStatus,
  startCrawler,
  stopCrawler,
} from "@/lib/api";
import { CrawlerStatus } from "@/lib/types";

export default function AdminCrawlerPage() {
  const [status, setStatus] = useState<CrawlerStatus | null>(null);
  const [seedInput, setSeedInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState<number | null>(null);

  async function refreshStatus() {
    try {
      const s = await getCrawlerStatus();
      setStatus(s);
    } catch (e) {
      // Backend not reachable yet: leave status as-is. A 401/403 means "not an admin".
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) setDenied(e.status);
    }
  }

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  async function handleStart() {
    const seedUrls = seedInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (seedUrls.length === 0) return;

    setBusy(true);
    try {
      await startCrawler(seedUrls);
      await refreshStatus();
    } finally {
      setBusy(false);
    }
  }

  async function handleStop() {
    setBusy(true);
    try {
      await stopCrawler();
      await refreshStatus();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <Header />
      <div className="page">
        <PageTitle kicker="Section 04 / Control room" title="Crawler" subtitle="Add seed URLs and watch the crawl progress." />
        {denied ? (
          <div className="card max-w-xl border-4 p-6">
            <p className="kicker mb-2 text-danger">Restricted</p>
            <h2 className="display text-4xl">Admin only</h2>
            <p className="mt-3 text-sm font-medium">
              {denied === 401 ? "Sign in with an admin account to use the crawler." : "This account doesn't have admin access."}
            </p>
            {denied === 401 && (
              <SignInLink className="btn-primary mt-4">
                Sign in
              </SignInLink>
            )}
          </div>
        ) : (
        <>
        <AdminNav />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <label className="kicker mb-2 block">Seed URLs (one per line)</label>
            <textarea
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              rows={5}
              placeholder="https://example.com"
              className="input font-mono"
            />
            <div className="mt-4 flex gap-3">
              <button onClick={handleStart} disabled={busy || status?.running} className="btn-primary">
                Start crawl
              </button>
              <button onClick={handleStop} disabled={busy || !status?.running} className="btn-ghost">
                Stop crawl
              </button>
            </div>
          </div>

          <div className="card p-5 text-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className={`h-3 w-3 ${status?.running ? "bg-ok" : "bg-mute"}`} />
              <span className="kicker">{status?.running ? "Running" : "Idle"}</span>
            </div>
            {status ? (
              <dl className="grid grid-cols-3 gap-3">
                {[
                  ["Crawled", status.crawled],
                  ["Queued", status.queued],
                  ["Failed", status.failed],
                ].map(([label, value]) => (
                  <div key={label} className="border-2 border-line bg-surface2 p-3">
                    <dt className="kicker text-mute">{label}</dt>
                    <dd className="display text-4xl">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-mute">Waiting for the backend…</p>
            )}
            {status?.currentUrl && <p className="mt-4 truncate text-mute">Current: {status.currentUrl}</p>}
          </div>
        </div>
        </>
        )}
      </div>
    </main>
  );
}
