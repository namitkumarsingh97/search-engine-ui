import { getToken } from "./auth";
import { API_URL } from "./drive";

export type RepeatFreq = "daily" | "weekly" | "monthly" | "yearly";

export interface Recurrence {
  freq: RepeatFreq;
  interval: number;
  until: string | null;
  count: number | null;
}

/** One concrete occurrence on the calendar (repeats are already expanded by the API). */
export interface Occurrence {
  id: string;
  title: string;
  description: string;
  location: string;
  allDay: boolean;
  start: string;
  end: string;
  recurring: boolean;
  reminderMinutes: number | null;
}

/** The stored event / series definition. */
export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  allDay: boolean;
  recurrence: Recurrence | null;
  reminderMinutes: number | null;
}

export type EventInput = Omit<CalendarEvent, "id">;

async function calFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("Please sign in to use Calendar.");

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body) headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_URL}/calendar${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(res.status === 401 ? "Your session expired. Please sign in again." : (data.error ?? `Request failed (${res.status})`));
  }
  return data as T;
}

export const listOccurrences = (from: Date, to: Date) =>
  calFetch<Occurrence[]>(`/events?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`);

export const listUpcoming = (days = 7) => calFetch<Occurrence[]>(`/upcoming?days=${days}`);
export const getEvent = (id: string) => calFetch<CalendarEvent>(`/events/${id}`);
export const createEvent = (input: EventInput) =>
  calFetch<CalendarEvent>("/events", { method: "POST", body: JSON.stringify(input) });
export const updateEvent = (id: string, input: EventInput) =>
  calFetch<CalendarEvent>(`/events/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const deleteEvent = (id: string) => calFetch<{ deleted: string }>(`/events/${id}`, { method: "DELETE" });
export const deleteOccurrence = (id: string, occurrenceStart: string) =>
  calFetch<{ deleted: string }>(`/events/${id}?occurrence=${encodeURIComponent(occurrenceStart)}`, { method: "DELETE" });

// ---- Local-time helpers (the API stores UTC instants; the UI works in local time) ----

const pad = (n: number) => String(n).padStart(2, "0");

export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Value for <input type="date"> / <input type="datetime-local"> in local time. */
export function toInputValue(iso: string, dateOnly: boolean): string {
  const d = new Date(iso);
  const date = dayKey(d);
  return dateOnly ? date : `${date}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Local input value back to an ISO instant. */
export function fromInputValue(value: string, dateOnly: boolean): string {
  return new Date(dateOnly ? `${value}T00:00:00` : value).toISOString();
}

/** 42 cells (6 weeks) starting on the Monday on/before the 1st of the month. */
export function monthGrid(cursor: Date): Date[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), 1 - offset + i));
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function describeRepeat(r: Recurrence | null): string {
  if (!r) return "";
  const unit = { daily: "day", weekly: "week", monthly: "month", yearly: "year" }[r.freq];
  return r.interval === 1 ? `Every ${unit}` : `Every ${r.interval} ${unit}s`;
}
