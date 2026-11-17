import { getToken } from "./auth";
import { API_URL } from "./drive";

export interface VideoDto {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  description: string;
  visibility: "public" | "private";
  mimeType: string;
  size: number;
  duration: number | null;
  hasThumbnail: boolean;
  views: number;
  likeCount: number;
  liked: boolean;
  commentCount: number;
  createdAt: string;
}

export interface VideoComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
  canDelete: boolean;
}

/** Works signed in or out: sends the token when there is one. */
async function videoFetch<T>(path: string, init: RequestInit = {}, authRequired = false): Promise<T> {
  const token = getToken();
  if (authRequired && !token) throw new Error("Please sign in first.");

  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_URL}/videos${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(res.status === 401 ? "Please sign in first." : (data.error ?? `Request failed (${res.status})`));
  }
  return data as T;
}

export const listVideos = (mine: boolean, page = 1) =>
  videoFetch<{ videos: VideoDto[]; total: number; page: number; pageSize: number }>(
    `?page=${page}${mine ? "&mine=1" : ""}`,
    {},
    mine,
  );

export const getVideo = (id: string) => videoFetch<VideoDto>(`/${id}`);

export function uploadVideo(file: File, title: string, description: string, visibility: string) {
  const form = new FormData();
  form.append("title", title);
  form.append("description", description);
  form.append("visibility", visibility);
  form.append("video", file); // file last: fields are available before the stream ends
  return videoFetch<VideoDto>("", { method: "POST", body: form }, true);
}

export const recordView = (id: string) => videoFetch<{ views: number }>(`/${id}/view`, { method: "POST" });
export const toggleLike = (id: string) =>
  videoFetch<{ liked: boolean; likeCount: number }>(`/${id}/like`, { method: "POST" }, true);
export const updateVideo = (id: string, patch: Partial<Pick<VideoDto, "title" | "description" | "visibility">>) =>
  videoFetch<VideoDto>(`/${id}`, { method: "PATCH", body: JSON.stringify(patch) }, true);
export const deleteVideo = (id: string) => videoFetch<{ deleted: true }>(`/${id}`, { method: "DELETE" }, true);

export const listComments = (id: string) => videoFetch<VideoComment[]>(`/${id}/comments`);
export const addComment = (id: string, text: string) =>
  videoFetch<VideoComment>(`/${id}/comments`, { method: "POST", body: JSON.stringify({ text }) }, true);
export const deleteComment = (id: string, commentId: string) =>
  videoFetch<{ deleted: true }>(`/${id}/comments/${commentId}`, { method: "DELETE" }, true);

/** <video>/<img> can't send headers, so private media carries the token in the URL. */
function mediaUrl(id: string, kind: "stream" | "thumbnail", isPrivate: boolean): string {
  const token = isPrivate ? getToken() : null;
  return `${API_URL}/videos/${id}/${kind}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}
export const streamUrl = (v: Pick<VideoDto, "id" | "visibility">) => mediaUrl(v.id, "stream", v.visibility === "private");
export const thumbnailUrl = (v: Pick<VideoDto, "id" | "visibility">) =>
  mediaUrl(v.id, "thumbnail", v.visibility === "private");

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "";
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}
