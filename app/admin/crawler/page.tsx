"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import Header from "@/components/Header";
import {
  getCrawlerStatus,
  startCrawler,
  stopCrawler,
} from "@/lib/api";
import { CrawlerStatus } from "@/lib/types";

export default function AdminCrawlerPage() {
  const [status, setStatus] = useState<CrawlerStatus | null>(null);
  const [seedInput, setSeedInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function refreshStatus() {
    try {
      const s = await getCrawlerStatus();
      setStatus(s);
    } catch {
      // backend not reachable yet — leave status as-is
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
      <div className="px-6">
        <h1 className="mb-4 text-2xl font-semibold">Crawler</h1>
        <AdminNav />

        <div className="mb-6 max-w-xl">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Seed URLs (one per line)
          </label>
          <textarea
            value={seedInput}
            onChange={(e) => setSeedInput(e.target.value)}
            rows={4}
            placeholder="https://example.com"
            className="w-full rounded-md border border-gray-300 p-2 text-sm"
          />
          <div className="mt-3 flex gap-3">
            <button
              onClick={handleStart}
              disabled={busy || status?.running}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
            >
              Start Crawl
            </button>
            <button
              onClick={handleStop}
              disabled={busy || !status?.running}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Stop Crawl
            </button>
          </div>
        </div>

        <div className="max-w-xl rounded-lg border border-gray-200 p-4 text-sm">
          <p>
            Status:{" "}
            <span className={status?.running ? "text-green-600" : "text-gray-500"}>
              {status?.running ? "Running" : "Idle"}
            </span>
          </p>
          {status && (
            <>
              <p>Crawled: {status.crawled}</p>
              <p>Queued: {status.queued}</p>
              <p>Failed: {status.failed}</p>
              {status.currentUrl && <p>Current: {status.currentUrl}</p>}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
