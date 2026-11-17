import { getToken } from "./auth";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export interface DriveItem {
  id: string;
  parentId: string | null;
  kind: "file" | "folder";
  name: string;
  mimeType: string;
  size: number;
  trashedAt: string | null;
  shareToken: string | null;
  updatedAt: string;
}

export interface DriveListing {
  folder: DriveItem | null;
  breadcrumbs: { id: string; name: string }[];
  items: DriveItem[];
}

export class UnauthorizedError extends Error {}

async function driveFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  if (!token) throw new UnauthorizedError("Please sign in to use Drive.");

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  // Let the browser set the multipart boundary itself for FormData bodies.
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_URL}/drive${path}`, { ...init, headers });
  if (res.status === 401) throw new UnauthorizedError("Your session expired. Please sign in again.");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return res;
}

const json = async <T>(p: Promise<Response>): Promise<T> => (await p).json() as Promise<T>;

export const listFolder = (parentId: string | null) =>
  json<DriveListing>(driveFetch(`?parent=${parentId ?? "root"}`));

export const listTrash = () => json<DriveListing>(driveFetch("?trash=1"));

export const getItem = (id: string) => json<DriveItem>(driveFetch(`/${id}`));

export const createFolder = (name: string, parentId: string | null) =>
  json<DriveItem>(driveFetch("/folders", { method: "POST", body: JSON.stringify({ name, parentId }) }));

export function uploadFiles(files: File[], parentId: string | null) {
  const form = new FormData();
  if (parentId) form.append("parentId", parentId);
  files.forEach((f) => form.append("files", f));
  return json<{ items: DriveItem[] }>(driveFetch("/upload", { method: "POST", body: form }));
}

export const renameItem = (id: string, name: string) =>
  json<DriveItem>(driveFetch(`/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }));

export const toggleShare = (id: string) => json<DriveItem>(driveFetch(`/${id}/share`, { method: "POST" }));

export const trashItem = (id: string) => driveFetch(`/${id}`, { method: "DELETE" });
export const restoreItem = (id: string) => driveFetch(`/${id}/restore`, { method: "POST" });
export const deletePermanently = (id: string) => driveFetch(`/${id}/permanent`, { method: "DELETE" });
export const emptyTrash = () => driveFetch("/trash/all", { method: "DELETE" });

/** Downloads through fetch so the Authorization header can be sent, then saves the blob. */
export async function downloadItem(item: DriveItem): Promise<void> {
  const res = await driveFetch(`/${item.id}/download`);
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = item.name;
  a.click();
  URL.revokeObjectURL(url);
}

export const shareUrl = (token: string) => `${API_URL}/drive/shared/${token}`;

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
