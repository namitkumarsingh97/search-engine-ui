import { getToken } from "./auth";
import { API_URL } from "./drive";

export type MailFolder = "inbox" | "starred" | "sent" | "draft" | "trash";

export interface Person {
  name: string;
  email: string;
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
  hasAttachments: boolean;
}

export interface MailAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
}

export interface MailDetail extends MailSummary {
  messageId: string;
  cc: Person[];
  body: string;
  sentAt: string | null;
  attachments: MailAttachment[];
}

export type FolderCounts = Record<MailFolder, { total: number; unread: number }>;

async function rawFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  if (!token) throw new Error("Please sign in to use Mail.");

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_URL}/mail${path}`, { ...init, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(res.status === 401 ? "Your session expired. Please sign in again." : (data.error ?? `Request failed (${res.status})`));
  }
  return res;
}

const json = async <T>(p: Promise<Response>): Promise<T> => (await p).json() as Promise<T>;

export const getFolders = () => json<FolderCounts>(rawFetch("/folders"));

export const listMail = (folder: MailFolder, page = 1) =>
  json<{ items: MailSummary[]; total: number; page: number; pageSize: number }>(rawFetch(`?folder=${folder}&page=${page}`));

export const getMessage = (id: string) => json<MailDetail>(rawFetch(`/items/${id}`));
export const getThread = (threadId: string) => json<MailDetail[]>(rawFetch(`/threads/${threadId}`));

export const setStarred = (id: string, starred: boolean) =>
  json<MailSummary>(rawFetch(`/items/${id}`, { method: "PATCH", body: JSON.stringify({ starred }) }));
export const setRead = (id: string, read: boolean) =>
  json<MailSummary>(rawFetch(`/items/${id}`, { method: "PATCH", body: JSON.stringify({ read }) }));

export const trashMessage = (id: string) => rawFetch(`/items/${id}/trash`, { method: "POST" });
export const restoreMessage = (id: string) => rawFetch(`/items/${id}/restore`, { method: "POST" });
export const deleteMessage = (id: string) => rawFetch(`/items/${id}`, { method: "DELETE" });
export const emptyTrash = () => rawFetch("/trash/all", { method: "DELETE" });

export const searchContacts = (q: string) => json<Person[]>(rawFetch(`/contacts?q=${encodeURIComponent(q)}`));

export const saveAttachmentToDrive = (itemId: string, attId: string) =>
  json<{ driveItemId: string }>(rawFetch(`/items/${itemId}/attachments/${attId}/save-to-drive`, { method: "POST" }));

/** Downloads through fetch so the Authorization header can be sent, then saves the blob. */
export async function downloadAttachment(itemId: string, att: MailAttachment): Promise<void> {
  const res = await rawFetch(`/items/${itemId}/attachments/${att.id}`);
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = att.name;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ComposeInput {
  draftId?: string;
  replyTo?: string;
  to: string;
  cc: string;
  subject: string;
  body: string;
  send: boolean;
  /** Ids of attachments from the existing draft to keep. */
  keep: string[];
  files: File[];
}

export function submitMessage(input: ComposeInput) {
  const form = new FormData();
  if (input.draftId) form.append("draftId", input.draftId);
  if (input.replyTo) form.append("replyTo", input.replyTo);
  form.append("to", input.to);
  form.append("cc", input.cc);
  form.append("subject", input.subject);
  form.append("body", input.body);
  form.append("keep", JSON.stringify(input.keep));
  if (input.send) form.append("send", "1");
  input.files.forEach((f) => form.append("files", f)); // files last so fields arrive first
  return json<MailDetail>(rawFetch("/messages", { method: "POST", body: form }));
}

export function formatMailDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString([], sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" });
}

export const personLabel = (p: Person) => (p.name ? `${p.name} <${p.email}>` : p.email);
export const personShort = (p: Person) => p.name || p.email;
