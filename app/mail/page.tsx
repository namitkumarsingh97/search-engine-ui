"use client";

import { ArrowLeft, Download, FolderInput, Paperclip, Pencil, Star } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import Header from "@/components/Header";
import SignInLink from "@/components/SignInLink";
import MailCompose, { ComposeInitial } from "@/components/MailCompose";
import PageTitle from "@/components/PageTitle";
import { parseUserCookie, USER_COOKIE } from "@/lib/auth";
import { formatSize } from "@/lib/drive";
import {
  deleteMessage,
  downloadAttachment,
  emptyTrash,
  FolderCounts,
  formatMailDate,
  getFolders,
  getMessage,
  getThread,
  listMail,
  MailDetail,
  MailFolder,
  MailSummary,
  personLabel,
  personShort,
  restoreMessage,
  saveAttachmentToDrive,
  setRead,
  setStarred,
  trashMessage,
} from "@/lib/mail";

const FOLDERS: { id: MailFolder; label: string }[] = [
  { id: "inbox", label: "Inbox" },
  { id: "starred", label: "Starred" },
  { id: "sent", label: "Sent" },
  { id: "draft", label: "Drafts" },
  { id: "trash", label: "Trash" },
];

function myEmail(): string {
  const m = document.cookie.split("; ").find((c) => c.startsWith(`${USER_COOKIE}=`));
  return parseUserCookie(m?.slice(USER_COOKIE.length + 1))?.email ?? "";
}

const quote = (m: MailDetail) =>
  `\n\nOn ${new Date(m.date).toLocaleString()}, ${personLabel(m.from)} wrote:\n` +
  m.body
    .split("\n")
    .map((l) => `> ${l}`)
    .join("\n");

function MailView() {
  const router = useRouter();
  const params = useSearchParams();
  const folder = (FOLDERS.some((f) => f.id === params.get("folder")) ? params.get("folder") : "inbox") as MailFolder;
  const itemId = params.get("item");

  const [counts, setCounts] = useState<FolderCounts | null>(null);
  const [list, setList] = useState<MailSummary[]>([]);
  const [thread, setThread] = useState<MailDetail[]>([]);
  const [compose, setCompose] = useState<ComposeInitial | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshCounts = useCallback(() => getFolders().then(setCounts).catch(() => undefined), []);

  const loadList = useCallback(async () => {
    try {
      setError(null);
      setList((await listMail(folder)).items);
      refreshCounts();
    } catch (e) {
      setList([]);
      setError(e instanceof Error ? e.message : "Failed to load mail.");
    }
  }, [folder, refreshCounts]);

  const loadThread = useCallback(async () => {
    if (!itemId) return;
    try {
      setError(null);
      const opened = await getMessage(itemId); // marks it read
      if (opened.folder === "draft") {
        // Drafts reopen in the editor rather than the reader.
        setCompose({
          draftId: opened.id,
          to: opened.to.map((p) => p.email).join(", "),
          cc: opened.cc.map((p) => p.email).join(", "),
          subject: opened.subject,
          body: opened.body,
          attachments: opened.attachments,
        });
        router.replace(`/mail?folder=draft`);
        return;
      }
      setThread(await getThread(opened.threadId));
      refreshCounts();
    } catch (e) {
      setThread([]);
      setError(e instanceof Error ? e.message : "Couldn't open that message.");
    }
  }, [itemId, refreshCounts, router]);

  useEffect(() => {
    if (itemId) loadThread();
    else {
      setThread([]);
      loadList();
    }
  }, [itemId, loadThread, loadList]);

  async function run(action: () => Promise<unknown>, done?: string, after?: () => void) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      if (done) setNotice(done);
      after ? after() : itemId ? await loadThread() : await loadList();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const backToList = () => router.push(`/mail?folder=${folder}`);
  const current = thread.find((m) => m.id === itemId) ?? thread[thread.length - 1];

  function openReply(m: MailDetail, all: boolean) {
    const me = myEmail();
    const others = (people: { email: string }[]) => people.map((p) => p.email).filter((e) => e !== me);
    const toList = m.from.email === me ? others(m.to) : [m.from.email, ...(all ? others(m.to) : [])];
    setCompose({
      replyTo: m.id,
      to: [...new Set(toList)].join(", "),
      cc: all ? others(m.cc).join(", ") : "",
      subject: /^re:/i.test(m.subject) ? m.subject : `Re: ${m.subject}`,
      body: quote(m),
      attachments: [],
    });
  }

  function openForward(m: MailDetail) {
    setCompose({
      to: "",
      cc: "",
      subject: /^fwd:/i.test(m.subject) ? m.subject : `Fwd: ${m.subject}`,
      body: `\n\n---------- Forwarded message ----------\nFrom: ${personLabel(m.from)}\nTo: ${m.to.map(personLabel).join(", ")}\nDate: ${new Date(m.date).toLocaleString()}\nSubject: ${m.subject}\n\n${m.body}`,
      attachments: [],
    });
  }

  async function openDraft(m: MailSummary) {
    try {
      const d = await getMessage(m.id);
      setCompose({
        draftId: d.id,
        to: d.to.map((p) => p.email).join(", "),
        cc: d.cc.map((p) => p.email).join(", "),
        subject: d.subject,
        body: d.body,
        attachments: d.attachments,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't open that draft.");
    }
  }

  const folderLink = (active: boolean) =>
    `flex items-center justify-between border-2 border-line px-3.5 py-2.5 -mt-0.5 first:mt-0 kicker transition-colors ${
      active ? "bg-ink text-canvas" : "bg-surface hover:bg-mustard"
    }`;

  return (
    <main>
      <Header />
      <div className="page">
        <PageTitle kicker="Section 04 / Correspondence" title="Mail" subtitle="Write to other Nexa users. Every message is searchable by you, and only you.">
          <button className="btn-primary !py-3" onClick={() => setCompose({ to: "", cc: "", subject: "", body: "", attachments: [] })}>
            <Pencil size={15} strokeWidth={3} /> Compose
          </button>
        </PageTitle>

        <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
          <nav aria-label="Folders" className="flex flex-row flex-wrap lg:flex-col">
            {FOLDERS.map((f) => {
              const c = counts?.[f.id];
              const badge = f.id === "inbox" ? c?.unread : f.id === "draft" ? c?.total : undefined;
              return (
                <Link key={f.id} href={`/mail?folder=${f.id}`} className={folderLink(f.id === folder && !itemId ? true : f.id === folder)}>
                  <span>{f.label}</span>
                  {badge ? <span className="min-w-5 bg-accent px-1.5 text-center text-[11px] text-white">{badge}</span> : null}
                </Link>
              );
            })}
          </nav>

          <section className="min-w-0">
            {error && (
              <p className="mb-4 border-2 border-danger bg-surface px-3 py-2 text-sm font-bold text-danger">
                {error} {error.toLowerCase().includes("sign in") && <SignInLink className="underline">Sign in</SignInLink>}
              </p>
            )}
            {notice && <p className="mb-4 border-2 border-ok bg-surface px-3 py-2 text-sm font-bold text-ok">{notice}</p>}

            {!itemId ? (
              <>
                {folder === "trash" && (
                  <div className="mb-3 flex items-center justify-between text-sm font-semibold">
                    <span>Trashed mail is hidden from search.</span>
                    <button
                      className="btn-danger"
                      disabled={busy || list.length === 0}
                      onClick={() => window.confirm("Permanently delete everything in the trash?") && run(() => emptyTrash(), "Trash emptied.")}
                    >
                      Empty trash
                    </button>
                  </div>
                )}

                {list.length === 0 && !error ? (
                  <div className="card px-6 py-16 text-center">
                    <p className="display text-3xl">Nothing here</p>
                    <p className="mt-2 text-sm font-medium text-mute">
                      {folder === "inbox" ? "New messages from other Nexa users land in your inbox." : "This folder is empty."}
                    </p>
                  </div>
                ) : (
                  <ul className="card">
                    {list.map((m) => {
                      const unread = !m.read && m.folder !== "sent" && m.folder !== "draft";
                      const who =
                        m.folder === "sent" || m.folder === "draft"
                          ? `To: ${m.to.map(personShort).join(", ") || "(no recipient)"}`
                          : personShort(m.from);
                      const row = (
                        <>
                          <span className={`w-40 shrink-0 truncate sm:w-52 ${unread ? "font-black" : "font-semibold"}`}>{who}</span>
                          <span className="min-w-0 flex-1 truncate">
                            <span className={unread ? "font-black" : "font-bold"}>{m.subject || "(no subject)"}</span>
                            <span className="font-medium text-mute"> — {m.snippet}</span>
                          </span>
                          {m.hasAttachments && <Paperclip size={14} className="shrink-0" />}
                          <span className="w-16 shrink-0 text-right text-xs font-bold">{formatMailDate(m.date)}</span>
                        </>
                      );
                      return (
                        <li key={m.id} className={`flex items-center border-b-2 border-line last:border-b-0 ${unread ? "border-l-8 border-l-accent bg-surface" : "bg-surface2/50"}`}>
                          <button
                            className="icon-btn ml-1"
                            aria-label={m.starred ? "Remove star" : "Star"}
                            onClick={() => run(() => setStarred(m.id, !m.starred))}
                          >
                            <Star size={17} fill={m.starred ? "currentColor" : "none"} className={m.starred ? "text-accent" : ""} />
                          </button>
                          {m.folder === "draft" ? (
                            <button onClick={() => openDraft(m)} className="flex min-w-0 flex-1 items-center gap-3 px-2 py-3.5 text-left text-sm transition-colors hover:bg-mustard">
                              {row}
                            </button>
                          ) : (
                            <Link href={`/mail?folder=${folder}&item=${m.id}`} className="flex min-w-0 flex-1 items-center gap-3 px-2 py-3.5 text-sm transition-colors hover:bg-mustard">
                              {row}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            ) : (
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <button className="btn-ghost" onClick={backToList}>
                    <ArrowLeft size={15} strokeWidth={3} /> Back
                  </button>
                  {current && (
                    <>
                      <button className="btn-ghost" disabled={busy} onClick={() => openReply(current, false)}>Reply</button>
                      <button className="btn-ghost" disabled={busy} onClick={() => openReply(current, true)}>Reply all</button>
                      <button className="btn-ghost" disabled={busy} onClick={() => openForward(current)}>Forward</button>
                      <button className="btn-ghost" disabled={busy} onClick={() => run(() => setStarred(current.id, !current.starred))}>
                        {current.starred ? "Unstar" : "Star"}
                      </button>
                      <button className="btn-ghost" disabled={busy} onClick={() => run(() => setRead(current.id, false), undefined, backToList)}>
                        Mark unread
                      </button>
                      {current.folder === "trash" ? (
                        <>
                          <button className="btn-ghost" disabled={busy} onClick={() => run(() => restoreMessage(current.id), "Restored.", backToList)}>Restore</button>
                          <button
                            className="btn-danger"
                            disabled={busy}
                            onClick={() => window.confirm("Delete permanently?") && run(() => deleteMessage(current.id), undefined, backToList)}
                          >
                            Delete forever
                          </button>
                        </>
                      ) : (
                        <button className="btn-danger" disabled={busy} onClick={() => run(() => trashMessage(current.id), "Moved to trash.", backToList)}>
                          Trash
                        </button>
                      )}
                    </>
                  )}
                </div>

                {current && (
                  <h2 className="display mb-5 border-b-4 border-line pb-3 text-4xl sm:text-5xl">{current.subject || "(no subject)"}</h2>
                )}

                <div className="space-y-4">
                  {thread.map((m) => (
                    <article key={m.id} className={`card ${m.id === itemId ? "border-4" : ""}`}>
                      <header className="flex flex-wrap items-start justify-between gap-2 border-b-2 border-line bg-surface2 px-4 py-3">
                        <div className="min-w-0 text-sm">
                          <p className="font-black uppercase tracking-tight">{personLabel(m.from)}</p>
                          <p className="truncate font-medium text-mute">
                            To: {m.to.map(personShort).join(", ")}
                            {m.cc.length > 0 && ` · Cc: ${m.cc.map(personShort).join(", ")}`}
                          </p>
                        </div>
                        <span className="kicker">{new Date(m.date).toLocaleString()}</span>
                      </header>
                      <div className="whitespace-pre-wrap break-words px-4 py-5 text-[15px] font-medium leading-relaxed">{m.body || "(no text)"}</div>
                      {m.attachments.length > 0 && (
                        <ul className="space-y-2 border-t-2 border-line p-4">
                          {m.attachments.map((a) => (
                            <li key={a.id} className="flex flex-wrap items-center gap-2 border-2 border-line bg-surface2 px-3 py-2 text-sm font-semibold">
                              <Paperclip size={14} />
                              <span className="min-w-0 flex-1 truncate">{a.name}</span>
                              <span className="text-xs text-mute">{formatSize(a.size)}</span>
                              <button className="btn-ghost !px-2.5 !py-1" disabled={busy} onClick={() => run(() => downloadAttachment(m.id, a), undefined, () => undefined)}>
                                <Download size={13} /> Download
                              </button>
                              <button
                                className="btn-ghost !px-2.5 !py-1"
                                disabled={busy}
                                onClick={() => run(() => saveAttachmentToDrive(m.id, a.id), `Saved "${a.name}" to your Drive.`, () => undefined)}
                              >
                                <FolderInput size={13} /> Save to Drive
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {compose && (
        <MailCompose
          key={compose.draftId ?? compose.replyTo ?? `new-${compose.subject}`}
          initial={compose}
          onClose={() => setCompose(null)}
          onDone={(sent) => {
            setCompose(null);
            setNotice(sent ? "Message sent." : "Draft saved.");
            if (itemId) loadThread();
            else loadList();
          }}
        />
      )}
    </main>
  );
}

export default function MailPage() {
  // useSearchParams needs a Suspense boundary for static prerendering.
  return (
    <Suspense fallback={null}>
      <MailView />
    </Suspense>
  );
}
