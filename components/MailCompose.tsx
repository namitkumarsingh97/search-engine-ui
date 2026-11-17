"use client";

import { Paperclip, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { formatSize } from "@/lib/drive";
import { MailAttachment, searchContacts, submitMessage } from "@/lib/mail";

export interface ComposeInitial {
  draftId?: string;
  replyTo?: string;
  to: string;
  cc: string;
  subject: string;
  body: string;
  attachments: MailAttachment[];
}

interface Props {
  initial: ComposeInitial;
  onClose: () => void;
  /** Called after a successful send or draft save. */
  onDone: (sent: boolean) => void;
}

export default function MailCompose({ initial, onClose, onDone }: Props) {
  const [to, setTo] = useState(initial.to);
  const [cc, setCc] = useState(initial.cc);
  const [showCc, setShowCc] = useState(Boolean(initial.cc));
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  const [kept, setKept] = useState<MailAttachment[]>(initial.attachments);
  const [files, setFiles] = useState<File[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Suggest registered users for whatever address is being typed in To.
  useEffect(() => {
    const last = to.split(/[,;\s]+/).pop()?.trim() ?? "";
    if (last.length < 2) return setSuggestions([]);
    const t = setTimeout(() => {
      searchContacts(last)
        .then((people) => setSuggestions(people.map((p) => p.email)))
        .catch(() => setSuggestions([]));
    }, 200);
    return () => clearTimeout(t);
  }, [to]);

  function pickSuggestion(email: string) {
    const parts = to.split(/([,;\s]+)/);
    parts[parts.length - 1] = email;
    setTo(`${parts.join("")}, `);
    setSuggestions([]);
  }

  async function submit(send: boolean) {
    setBusy(true);
    setError(null);
    try {
      await submitMessage({
        draftId: initial.draftId,
        replyTo: initial.replyTo,
        to,
        cc,
        subject,
        body,
        send,
        keep: kept.map((a) => a.id),
        files,
      });
      onDone(send);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  const label = "kicker mb-1.5 block";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/60 p-4 sm:p-8" onMouseDown={onClose}>
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          submit(true);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-2xl border-4 border-line bg-surface"
      >
        <div className="flex items-center justify-between border-b-4 border-line bg-accent px-5 py-3 text-white">
          <h2 className="display text-3xl">{initial.replyTo ? "Reply" : "New message"}</h2>
          <button type="button" onClick={onClose} className="icon-btn !text-white hover:!bg-ink" aria-label="Close">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="relative">
            <div className="flex items-end justify-between">
              <label className={label}>To</label>
              {!showCc && (
                <button type="button" className="kicker mb-1.5 underline" onClick={() => setShowCc(true)}>
                  Add Cc
                </button>
              )}
            </div>
            <input
              className="input"
              value={to}
              placeholder="name@example.com, another@example.com"
              autoFocus={!initial.to}
              onChange={(e) => setTo(e.target.value)}
            />
            {suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 z-10 border-2 border-t-0 border-line bg-surface">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button type="button" className="block w-full px-3 py-2 text-left text-sm font-semibold hover:bg-mustard" onMouseDown={(e) => e.preventDefault()} onClick={() => pickSuggestion(s)}>
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {showCc && (
            <div>
              <label className={label}>Cc</label>
              <input className="input" value={cc} onChange={(e) => setCc(e.target.value)} />
            </div>
          )}

          <div>
            <label className={label}>Subject</label>
            <input className="input" value={subject} maxLength={200} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div>
            <label className={label}>Message</label>
            <textarea className="input min-h-[12rem] font-[inherit]" value={body} autoFocus={Boolean(initial.to)} onChange={(e) => setBody(e.target.value)} />
          </div>

          {(kept.length > 0 || files.length > 0) && (
            <ul className="space-y-1.5">
              {kept.map((a) => (
                <li key={a.id} className="flex items-center gap-2 border-2 border-line bg-surface2 px-3 py-1.5 text-sm font-semibold">
                  <Paperclip size={14} />
                  <span className="flex-1 truncate">{a.name}</span>
                  <span className="text-xs text-mute">{formatSize(a.size)}</span>
                  <button type="button" className="icon-btn !p-1" aria-label="Remove attachment" onClick={() => setKept(kept.filter((k) => k.id !== a.id))}>
                    <X size={14} strokeWidth={3} />
                  </button>
                </li>
              ))}
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center gap-2 border-2 border-line bg-mustard px-3 py-1.5 text-sm font-semibold">
                  <Paperclip size={14} />
                  <span className="flex-1 truncate">{f.name}</span>
                  <span className="text-xs">{formatSize(f.size)}</span>
                  <button type="button" className="icon-btn !p-1" aria-label="Remove attachment" onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                    <X size={14} strokeWidth={3} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="border-2 border-danger px-3 py-2 text-sm font-bold text-danger">{error}</p>}

          <div className="flex flex-wrap items-center gap-2 border-t-2 border-line pt-4">
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? "Working…" : "Send"}
            </button>
            <button type="button" disabled={busy} className="btn-ghost" onClick={() => submit(false)}>
              Save draft
            </button>
            <button type="button" disabled={busy || kept.length + files.length >= 5} className="btn-ghost" onClick={() => fileInput.current?.click()}>
              <Paperclip size={14} /> Attach
            </button>
            <input
              ref={fileInput}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                setFiles([...files, ...Array.from(e.target.files ?? [])].slice(0, 5 - kept.length));
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
