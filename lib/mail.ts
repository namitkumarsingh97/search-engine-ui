import { getToken } from "./auth";

/** The Nexa mail service (search-engine-mail). It has its own address, separate from the main API. */
export const MAIL_URL = (process.env.NEXT_PUBLIC_MAIL_URL ?? "http://localhost:4200").replace(/\/$/, "");

export type MailFolder = "inbox" | "starred" | "sent" | "draft" | "trash";

/** A person on a message. `email` holds their full Nexa address, e.g. ada@nexa.com. */
export interface Person {
  name: string;
  email: string;
}

export interface Mailbox {
  name: string;
  handle: string;
  address: string;
}

export interface MailSummary {
  id: string;
  folder: "inbox" | "sent" | "draft" | "trash";
  read: boolean;
  starred: boolean;
  date: string;
  threadId: string;
  from: Person;
  to: Person[];
  subject: string;
  snippet: string;
}

export interface MailDetail extends MailSummary {
  messageId: string;
  cc: Person[];
  body: string;
  sentAt: string | null;
}

export type FolderCounts = Record<MailFolder, { total: number; unread: number }>;

async function rawFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  if (!token) throw new Error("Please sign in to use Mail.");

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body) headers.set("Content-Type", "application/json");

  let res: Response;
  try {
    res = await fetch(`${MAIL_URL}${path}`, { ...init, headers });
  } catch {
    throw new Error("Couldn't reach the mail service. Check your connection and try again.");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(res.status === 401 ? "Your session expired. Please sign in again." : (data.error ?? `Request failed (${res.status})`));
  }
  return res;
}

const json = async <T>(p: Promise<Response>): Promise<T> => (await p).json() as Promise<T>;

/** The signed-in person's address. Asking for it also sets the mailbox up (and sends the welcome mail) the first time. */
export const getMailbox = () => json<Mailbox>(rawFetch("/mailbox"));
export const getFolders = () => json<FolderCounts>(rawFetch("/folders"));

export const listMail = (folder: MailFolder, page = 1) =>
  json<{ items: MailSummary[]; total: number; page: number; pageSize: number }>(rawFetch(`/messages?folder=${folder}&page=${page}`));

export const getMessage = (id: string) => json<MailDetail>(rawFetch(`/messages/${id}`));
export const getThread = (threadId: string) => json<MailDetail[]>(rawFetch(`/threads/${encodeURIComponent(threadId)}`));

export const setStarred = (id: string, starred: boolean) =>
  json<MailSummary>(rawFetch(`/messages/${id}`, { method: "PATCH", body: JSON.stringify({ starred }) }));
export const setRead = (id: string, read: boolean) =>
  json<MailSummary>(rawFetch(`/messages/${id}`, { method: "PATCH", body: JSON.stringify({ read }) }));

export const trashMessage = (id: string) => rawFetch(`/messages/${id}/trash`, { method: "POST" });
export const restoreMessage = (id: string) => rawFetch(`/messages/${id}/restore`, { method: "POST" });
export const deleteMessage = (id: string) => rawFetch(`/messages/${id}`, { method: "DELETE" });
export const emptyTrash = () => rawFetch("/trash", { method: "DELETE" });

export const searchContacts = (q: string) => json<Person[]>(rawFetch(`/contacts?q=${encodeURIComponent(q)}`));

export interface ComposeInput {
  draftId?: string;
  replyTo?: string;
  to: string;
  cc: string;
  subject: string;
  body: string;
  send: boolean;
}

export const submitMessage = (input: ComposeInput) =>
  json<MailDetail>(rawFetch("/messages", { method: "POST", body: JSON.stringify(input) }));

export function formatMailDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString([], sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" });
}

export const personLabel = (p: Person) => (p.name ? `${p.name} <${p.email}>` : p.email);
export const personShort = (p: Person) => p.name || p.email;
