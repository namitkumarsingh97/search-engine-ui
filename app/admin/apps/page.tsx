"use client";

import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import Header from "@/components/Header";
import PageTitle from "@/components/PageTitle";
import { ApiError, AppInput, createApp, deleteApp, getAllApps, updateApp } from "@/lib/api";
import { AdminApp, AppTone, ICON_NAMES, iconFor, TONE_CLASSES } from "@/lib/apps";

const TONES: AppTone[] = ["mustard", "orange", "charcoal", "paper"];

interface FormState {
  id?: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  icon: string;
  tone: AppTone;
  keywords: string;
  repos: string;
  openInNewTab: boolean;
  visible: boolean;
  order: string;
}

const blank: FormState = {
  name: "",
  tagline: "",
  description: "",
  url: "https://",
  icon: "layout-grid",
  tone: "mustard",
  keywords: "",
  repos: "",
  openInNewTab: false,
  visible: true,
  order: "100",
};

const fromApp = (a: AdminApp): FormState => ({
  id: a.id,
  name: a.name,
  tagline: a.tagline,
  description: a.description,
  url: a.url,
  icon: a.icon,
  tone: a.tone,
  keywords: a.keywords.join(", "),
  repos: a.repos.join(", "),
  openInNewTab: a.openInNewTab,
  visible: a.visible,
  order: String(a.order),
});

export default function AdminAppsPage() {
  const [apps, setApps] = useState<AdminApp[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setApps(await getAllApps());
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) setDenied(e.status);
      else setError(e instanceof Error ? e.message : "Failed to load apps.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    const input: AppInput = {
      name: form.name,
      tagline: form.tagline,
      description: form.description,
      url: form.url,
      icon: form.icon,
      tone: form.tone,
      keywords: form.keywords,
      repos: form.repos,
      openInNewTab: form.openInNewTab,
      visible: form.visible,
      order: Number(form.order) || 100,
    };
    if (await run(() => (form.id ? updateApp(form.id, input) : createApp(input)))) setForm(null);
  }

  const label = "kicker mb-1.5 block";
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  return (
    <main>
      <Header />
      <div className="page">
        <PageTitle
          kicker="Section 05 / Control room"
          title="Products"
          subtitle="Your own products, presented as Nexa features. They appear on the home page, in the Apps menu and in search results."
        >
          {!denied && (
            <button className="btn-primary !py-3" onClick={() => setForm({ ...blank })}>
              <Plus size={16} strokeWidth={3} /> Add product
            </button>
          )}
        </PageTitle>

        {denied ? (
          <div className="card max-w-xl border-4 p-6">
            <p className="kicker mb-2 text-danger">Restricted</p>
            <h2 className="display text-4xl">Admin only</h2>
            <p className="mt-3 text-sm font-medium">
              {denied === 401 ? "Sign in with an admin account to manage products." : "This account doesn't have admin access."}
            </p>
            {denied === 401 && (
              <Link href="/login" className="btn-primary mt-4">
                Sign in
              </Link>
            )}
          </div>
        ) : (
          <>
            <AdminNav />
            {error && <p className="mb-4 border-2 border-danger bg-surface px-3 py-2 text-sm font-bold text-danger">{error}</p>}

            {apps.length === 0 && !error && (
              <p className="border-2 border-line bg-surface px-4 py-8 text-sm font-semibold">No products yet. Add one with the button above.</p>
            )}

            <ul className="border-2 border-line bg-surface">
              {apps.map((a) => {
                const Icon = iconFor(a.icon);
                return (
                  <li key={a.id} className={`flex flex-wrap items-center gap-4 border-b-2 border-line px-4 py-3 last:border-b-0 ${a.visible ? "" : "bg-surface2/70"}`}>
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center border-2 border-line ${TONE_CLASSES[a.tone]}`}>
                      <Icon size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="display text-2xl">
                        {a.name}
                        {!a.visible && <span className="kicker ml-3 bg-ink px-2 py-0.5 align-middle text-canvas">Hidden</span>}
                      </p>
                      <p className="truncate text-xs font-semibold text-mute">{a.url}</p>
                    </div>
                    <div className="flex">
                      <button
                        className="icon-btn"
                        title={a.visible ? "Hide from Nexa" : "Show in Nexa"}
                        disabled={busy}
                        onClick={() => run(() => updateApp(a.id, { visible: !a.visible }))}
                      >
                        {a.visible ? <Eye size={17} /> : <EyeOff size={17} />}
                      </button>
                      <button className="icon-btn" title="Edit" onClick={() => setForm(fromApp(a))}>
                        <Pencil size={17} />
                      </button>
                      <button
                        className="icon-btn !text-danger"
                        title="Delete"
                        disabled={busy}
                        onClick={() => window.confirm(`Delete "${a.name}" from Nexa?`) && run(() => deleteApp(a.id))}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/60 p-4 sm:p-8" onMouseDown={() => setForm(null)}>
          <form onSubmit={onSubmit} onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-xl border-4 border-line bg-surface">
            <div className="border-b-4 border-line bg-mustard px-5 py-3">
              <h2 className="display text-3xl">{form.id ? "Edit product" : "Add product"}</h2>
            </div>
            <div className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label}>Name</label>
                  <input className="input" value={form.name} required maxLength={40} onChange={(e) => set("name", e.target.value)} />
                </div>
                <div>
                  <label className={label}>Order (low first)</label>
                  <input className="input" type="number" value={form.order} onChange={(e) => set("order", e.target.value)} />
                </div>
              </div>
              <div>
                <label className={label}>Link (where a click goes)</label>
                <input className="input" type="url" value={form.url} required placeholder="https://" onChange={(e) => set("url", e.target.value)} />
              </div>
              <div>
                <label className={label}>Tagline</label>
                <input className="input" value={form.tagline} maxLength={90} onChange={(e) => set("tagline", e.target.value)} />
              </div>
              <div>
                <label className={label}>Description</label>
                <textarea className="input" rows={2} value={form.description} maxLength={400} onChange={(e) => set("description", e.target.value)} />
              </div>
              <div>
                <label className={label}>Search keywords (comma separated)</label>
                <input className="input" value={form.keywords} placeholder="so searches for these words find the app" onChange={(e) => set("keywords", e.target.value)} />
              </div>

              <div>
                <label className={label}>Public GitHub repos for News (owner/name, comma separated)</label>
                <input className="input" value={form.repos} placeholder="namitkumarsingh97/PA_WFMS" onChange={(e) => set("repos", e.target.value)} />
                <p className="mt-1 text-xs font-medium text-mute">New commits in these repos show up automatically under News.</p>
              </div>

              <div>
                <label className={label}>Icon</label>
                <div className="flex flex-wrap gap-1.5">
                  {ICON_NAMES.map((n) => {
                    const I = iconFor(n);
                    return (
                      <button
                        key={n}
                        type="button"
                        title={n}
                        onClick={() => set("icon", n)}
                        className={`flex h-10 w-10 items-center justify-center border-2 border-line ${form.icon === n ? "bg-ink text-canvas" : "bg-surface hover:bg-mustard"}`}
                      >
                        <I size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={label}>Color block</label>
                <div className="flex flex-wrap gap-1.5">
                  {TONES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set("tone", t)}
                      className={`kicker border-2 px-3 py-2 ${TONE_CLASSES[t]} ${form.tone === t ? "border-accent outline outline-2 outline-ink" : "border-line"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-6 text-sm font-bold">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={form.openInNewTab} onChange={(e) => set("openInNewTab", e.target.checked)} />
                  Open in a new tab
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={form.visible} onChange={(e) => set("visible", e.target.checked)} />
                  Visible in Nexa
                </label>
              </div>

              {error && <p className="border-2 border-danger px-3 py-2 text-sm font-bold text-danger">{error}</p>}

              <div className="flex gap-2 border-t-2 border-line pt-4">
                <button type="submit" disabled={busy} className="btn-primary">
                  {form.id ? "Save changes" : "Add product"}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setForm(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
