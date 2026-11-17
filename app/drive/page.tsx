"use client";

import {
  Download,
  File as FileIcon,
  FileText,
  Film,
  Folder,
  FolderPlus,
  Image as ImageIcon,
  Link2,
  Pencil,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import PageTitle from "@/components/PageTitle";
import {
  createFolder,
  deletePermanently,
  downloadItem,
  DriveItem,
  DriveListing,
  emptyTrash,
  formatSize,
  getItem,
  listFolder,
  listTrash,
  renameItem,
  restoreItem,
  shareUrl,
  toggleShare,
  trashItem,
  uploadFiles,
} from "@/lib/drive";

function ItemIcon({ item }: { item: DriveItem }) {
  if (item.kind === "folder") {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-line bg-mustard text-ink">
        <Folder size={20} />
      </span>
    );
  }
  const mime = item.mimeType;
  const Icon = mime.startsWith("image/") ? ImageIcon : mime.startsWith("video/") ? Film
    : mime.startsWith("text/") || mime === "application/pdf" ? FileText : FileIcon;
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-line bg-surface2 text-ink">
      <Icon size={20} />
    </span>
  );
}

function DriveView() {
  const router = useRouter();
  const params = useSearchParams();
  const view = params.get("view") === "trash" ? "trash" : "files";
  const folderId = params.get("folder");
  const openId = params.get("open");

  const [listing, setListing] = useState<DriveListing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setListing(view === "trash" ? await listTrash() : await listFolder(folderId));
    } catch (e) {
      setListing(null);
      setError(e instanceof Error ? e.message : "Failed to load Drive.");
    }
  }, [view, folderId]);

  useEffect(() => {
    load();
  }, [load]);

  // A search hit links to /drive?open=<id>: jump to the folder that holds it.
  useEffect(() => {
    if (!openId) return;
    getItem(openId)
      .then((item) => {
        const target = item.kind === "folder" ? item.id : item.parentId;
        router.replace(target ? `/drive?folder=${target}` : "/drive");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't open that item."));
  }, [openId, router]);

  async function run(action: () => Promise<unknown>, done?: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      if (done) setNotice(done);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function onUpload(files: FileList | File[] | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    run(() => uploadFiles(list, folderId), `Uploaded ${list.length} file${list.length === 1 ? "" : "s"}.`);
    if (fileInput.current) fileInput.current.value = "";
  }

  function onNewFolder() {
    const name = window.prompt("Folder name");
    if (name?.trim()) run(() => createFolder(name.trim(), folderId));
  }

  function onRename(item: DriveItem) {
    const name = window.prompt("New name", item.name);
    if (name?.trim() && name.trim() !== item.name) run(() => renameItem(item.id, name.trim()));
  }

  async function onShare(item: DriveItem) {
    await run(async () => {
      const updated = await toggleShare(item.id);
      if (updated.shareToken) {
        const link = shareUrl(updated.shareToken);
        await navigator.clipboard?.writeText(link).catch(() => undefined);
        setNotice(`Public link copied: ${link}`);
      } else {
        setNotice("Public link turned off.");
      }
    });
  }

  function onDeleteForever(item: DriveItem) {
    if (window.confirm(`Permanently delete "${item.name}"? This can't be undone.`)) {
      run(() => deletePermanently(item.id));
    }
  }

  function onEmptyTrash() {
    if (window.confirm("Permanently delete everything in the trash? This can't be undone.")) {
      run(() => emptyTrash(), "Trash emptied.");
    }
  }

  const tab = (active: boolean) =>
    `kicker border-2 border-line px-4 py-2.5 transition-colors ${active ? "bg-ink text-canvas" : "bg-surface hover:bg-mustard"}`;

  return (
    <main>
      <Header />
      <div className="page">
        <PageTitle kicker="Section 01 / Storage" title="Drive" subtitle="Your private files, searchable from the main search box.">
          <Link href="/drive" className={tab(view === "files")}>My files</Link>
          <Link href="/drive?view=trash" className={tab(view === "trash")}>Trash</Link>
        </PageTitle>

        {view === "files" ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <nav className="flex flex-wrap items-center gap-1 text-sm text-mute">
              <Link href="/drive" className="hover:text-ink">My files</Link>
              {listing?.breadcrumbs.map((c) => (
                <span key={c.id} className="flex items-center gap-1">
                  <span>/</span>
                  <Link href={`/drive?folder=${c.id}`} className="hover:text-ink">{c.name}</Link>
                </span>
              ))}
            </nav>
            <div className="flex gap-2">
              <button onClick={onNewFolder} disabled={busy} className="btn-ghost">
                <FolderPlus size={16} /> New folder
              </button>
              <button onClick={() => fileInput.current?.click()} disabled={busy} className="btn-primary">
                <Upload size={16} /> Upload
              </button>
              <input ref={fileInput} type="file" multiple hidden onChange={(e) => onUpload(e.target.files)} />
            </div>
          </div>
        ) : (
          <div className="mb-4 flex items-center justify-between text-sm text-mute">
            <span>Items in the trash are hidden from search.</span>
            <button onClick={onEmptyTrash} disabled={busy || !listing?.items.length} className="btn-danger">
              Empty trash
            </button>
          </div>
        )}

        {error && (
          <p className="mb-3 border-2 border-danger bg-surface px-3 py-2 text-sm font-bold text-danger">
            {error}{" "}
            {error.toLowerCase().includes("sign in") && <Link href="/login" className="underline">Sign in</Link>}
          </p>
        )}
        {notice && (
          <p className="mb-3 break-all border-2 border-ok bg-surface px-3 py-2 text-sm font-bold text-ok">{notice}</p>
        )}

        <div
          onDragOver={(e) => { if (view === "files") { e.preventDefault(); setDragging(true); } }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (view === "files") onUpload(e.dataTransfer.files);
          }}
          className={`card overflow-hidden transition-colors ${dragging ? "!border-accent bg-mustard/30" : ""}`}
        >
          {listing && listing.items.length === 0 && (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center bg-surface2 text-mute">
                {view === "trash" ? <Trash2 size={22} /> : <Upload size={22} />}
              </span>
              <p className="font-medium">{view === "trash" ? "Trash is empty" : "This folder is empty"}</p>
              {view === "files" && <p className="mt-1 text-sm text-mute">Drag files here or use Upload.</p>}
            </div>
          )}

          <ul className="divide-y-2 divide-line">
            {listing?.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-mustard">
                <ItemIcon item={item} />
                <div className="min-w-0 flex-1">
                  {item.kind === "folder" && view === "files" ? (
                    <Link href={`/drive?folder=${item.id}`} className="block truncate font-bold hover:text-accent-fg">
                      {item.name}
                    </Link>
                  ) : (
                    <span className="block truncate font-bold">{item.name}</span>
                  )}
                  {item.shareToken && <span className="text-xs text-ok">Shared via public link</span>}
                </div>
                <span className="hidden w-20 text-right text-xs text-mute sm:block">
                  {item.kind === "file" ? formatSize(item.size) : ""}
                </span>
                <span className="hidden w-24 text-right text-xs text-mute sm:block">
                  {new Date(item.updatedAt).toLocaleDateString()}
                </span>
                <div className="flex">
                  {view === "files" ? (
                    <>
                      {item.kind === "file" && (
                        <>
                          <button title="Download" className="icon-btn" disabled={busy}
                            onClick={() => run(() => downloadItem(item))}><Download size={16} /></button>
                          <button title={item.shareToken ? "Stop sharing" : "Get public link"}
                            className={`icon-btn ${item.shareToken ? "!text-ok" : ""}`} disabled={busy}
                            onClick={() => onShare(item)}><Link2 size={16} /></button>
                        </>
                      )}
                      <button title="Rename" className="icon-btn" disabled={busy}
                        onClick={() => onRename(item)}><Pencil size={16} /></button>
                      <button title="Move to trash" className="icon-btn" disabled={busy}
                        onClick={() => run(() => trashItem(item.id))}><Trash2 size={16} /></button>
                    </>
                  ) : (
                    <>
                      <button title="Restore" className="icon-btn" disabled={busy}
                        onClick={() => run(() => restoreItem(item.id))}><RotateCcw size={16} /></button>
                      <button title="Delete forever" className="icon-btn !text-danger" disabled={busy}
                        onClick={() => onDeleteForever(item)}><Trash2 size={16} /></button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}

export default function DrivePage() {
  // useSearchParams needs a Suspense boundary for static prerendering.
  return (
    <Suspense fallback={null}>
      <DriveView />
    </Suspense>
  );
}
