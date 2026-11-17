"use client";

import { BellRing, ChevronLeft, ChevronRight, Plus, Repeat, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import EventForm from "@/components/EventForm";
import Header from "@/components/Header";
import SignInLink from "@/components/SignInLink";
import PageTitle from "@/components/PageTitle";
import {
  CalendarEvent,
  dayKey,
  formatTime,
  getEvent,
  listOccurrences,
  listUpcoming,
  monthGrid,
  Occurrence,
} from "@/lib/calendar";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CHIP_TONES = ["bg-mustard text-ink", "bg-accent text-white", "bg-ink text-canvas"];

const toneFor = (id: string) => CHIP_TONES[id.split("").reduce((n, c) => n + c.charCodeAt(0), 0) % CHIP_TONES.length];

function minutesUntil(iso: string): number {
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000);
}

function humanizeMinutes(m: number): string {
  if (m <= 0) return "now";
  if (m < 60) return `in ${m} min`;
  if (m < 1440) return `in ${Math.round(m / 60)} h`;
  return `in ${Math.round(m / 1440)} d`;
}

interface FormState {
  event: CalendarEvent | null;
  occurrenceStart?: string;
  date: Date;
}

function CalendarView() {
  const params = useSearchParams();
  const openId = params.get("event");

  const [cursor, setCursor] = useState(() => new Date());
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [upcoming, setUpcoming] = useState<Occurrence[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cells = useMemo(() => monthGrid(cursor), [cursor]);
  const todayKey = dayKey(new Date());

  const load = useCallback(async () => {
    try {
      setError(null);
      const [occ, up] = await Promise.all([listOccurrences(cells[0], new Date(cells[41].getTime() + 86_400_000)), listUpcoming(7)]);
      setOccurrences(occ);
      setUpcoming(up);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load calendar.");
    }
  }, [cells]);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh upcoming reminders every minute while the page is open.
  useEffect(() => {
    const t = setInterval(() => listUpcoming(7).then(setUpcoming).catch(() => undefined), 60_000);
    return () => clearInterval(t);
  }, []);

  // A search hit links to /calendar?event=<id>: jump to that event's month and open it.
  useEffect(() => {
    if (!openId) return;
    getEvent(openId)
      .then((ev) => {
        setCursor(new Date(ev.start));
        setForm({ event: ev, date: new Date(ev.start) });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't open that event."));
  }, [openId]);

  // Which occurrences touch each day (multi-day events appear on every day).
  const byDay = useMemo(() => {
    const map = new Map<string, Occurrence[]>();
    for (const o of occurrences) {
      const s = new Date(o.start);
      const e = new Date(Math.max(new Date(o.end).getTime() - 1, s.getTime()));
      for (let d = new Date(s.getFullYear(), s.getMonth(), s.getDate()); d <= e && map.size < 5000; d.setDate(d.getDate() + 1)) {
        const k = dayKey(d);
        map.set(k, [...(map.get(k) ?? []), o]);
      }
    }
    return map;
  }, [occurrences]);

  const reminders = upcoming.filter(
    (o) =>
      o.reminderMinutes !== null &&
      minutesUntil(o.start) <= o.reminderMinutes &&
      !dismissed.has(`${o.id}|${o.start}`),
  );

  async function openOccurrence(o: Occurrence) {
    try {
      const ev = await getEvent(o.id);
      setForm({ event: ev, occurrenceStart: o.start, date: new Date(o.start) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't open that event.");
    }
  }

  const shiftMonth = (n: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1));
  const monthLabel = cursor.toLocaleDateString([], { month: "long", year: "numeric" });

  return (
    <main>
      <Header />
      <div className="page">
        <PageTitle kicker="Section 03 / Time" title="Calendar" subtitle="Events, repeats and reminders. Everything here is searchable too.">
          <button className="btn-primary !py-3" onClick={() => setForm({ event: null, date: new Date() })}>
            <Plus size={16} strokeWidth={3} /> New event
          </button>
        </PageTitle>

        {error && (
          <p className="mb-4 border-2 border-danger bg-surface px-3 py-2 text-sm font-bold text-danger">
            {error} {error.toLowerCase().includes("sign in") && <SignInLink className="underline">Sign in</SignInLink>}
          </p>
        )}

        {reminders.map((o) => (
          <div key={`${o.id}|${o.start}`} className="mb-3 flex items-center gap-3 border-2 border-line bg-mustard px-4 py-3">
            <BellRing size={20} strokeWidth={3} />
            <p className="flex-1 text-sm font-bold">
              <span className="kicker mr-2">Reminder</span>
              {o.title} starts {humanizeMinutes(minutesUntil(o.start))} at {formatTime(o.start)}
              {o.location && ` · ${o.location}`}
            </p>
            <button className="icon-btn" aria-label="Dismiss" onClick={() => setDismissed((s) => new Set(s).add(`${o.id}|${o.start}`))}>
              <X size={18} strokeWidth={3} />
            </button>
          </div>
        ))}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="display text-4xl sm:text-5xl">{monthLabel}</h2>
              <div className="flex">
                <button className="btn-ghost !px-3" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
                  <ChevronLeft size={18} strokeWidth={3} />
                </button>
                <button className="btn-ghost -ml-0.5" onClick={() => setCursor(new Date())}>Today</button>
                <button className="btn-ghost -ml-0.5 !px-3" aria-label="Next month" onClick={() => shiftMonth(1)}>
                  <ChevronRight size={18} strokeWidth={3} />
                </button>
              </div>
            </div>

            <div className="border-2 border-line bg-surface">
              <div className="grid grid-cols-7 bg-ink text-canvas">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="kicker px-2 py-2 text-center">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                  const key = dayKey(day);
                  const inMonth = day.getMonth() === cursor.getMonth();
                  const items = byDay.get(key) ?? [];
                  const isToday = key === todayKey;
                  return (
                    <div
                      key={key}
                      onClick={() => setForm({ event: null, date: day })}
                      className={`min-h-[5.5rem] cursor-pointer border-l-2 border-t-2 border-line p-1.5 transition-colors hover:bg-mustard/40 sm:min-h-[7rem] ${
                        i % 7 === 0 ? "border-l-0" : ""
                      } ${inMonth ? "" : "bg-surface2/70 text-mute"}`}
                    >
                      <span
                        className={`inline-flex h-6 min-w-6 items-center justify-center px-1 text-sm font-black ${
                          isToday ? "bg-accent text-white" : ""
                        }`}
                      >
                        {day.getDate()}
                      </span>
                      <div className="mt-1 space-y-1">
                        {items.slice(0, 3).map((o) => (
                          <button
                            key={`${o.id}|${o.start}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openOccurrence(o);
                            }}
                            title={o.title}
                            className={`flex w-full items-center gap-1 truncate px-1.5 py-0.5 text-left text-[11px] font-bold ${toneFor(o.id)}`}
                          >
                            {o.recurring && <Repeat size={10} strokeWidth={3} className="shrink-0" />}
                            <span className="truncate">
                              {!o.allDay && <span className="mr-1 opacity-80">{formatTime(o.start)}</span>}
                              {o.title}
                            </span>
                          </button>
                        ))}
                        {items.length > 3 && <p className="px-1 text-[11px] font-bold text-mute">+{items.length - 3} more</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <aside>
            <h2 className="display mb-3 border-b-4 border-line pb-2 text-3xl">Next 7 days</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm font-medium text-mute">Nothing coming up.</p>
            ) : (
              <ul className="border-2 border-line bg-surface">
                {upcoming.slice(0, 12).map((o) => (
                  <li key={`${o.id}|${o.start}`} className="border-b-2 border-line last:border-b-0">
                    <button onClick={() => openOccurrence(o)} className="block w-full px-3 py-3 text-left transition-colors hover:bg-mustard">
                      <span className="kicker block text-accent-fg">
                        {new Date(o.start).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}
                        {!o.allDay && ` · ${formatTime(o.start)}`}
                      </span>
                      <span className="mt-0.5 block font-black uppercase leading-tight tracking-tight">{o.title}</span>
                      {o.location && <span className="block text-xs font-medium text-mute">{o.location}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </div>

      {form && (
        <EventForm
          key={form.event ? `${form.event.id}|${form.occurrenceStart ?? ""}` : `new|${form.date.getTime()}`}
          initial={form.event}
          occurrenceStart={form.occurrenceStart}
          defaultDate={form.date}
          onClose={() => setForm(null)}
          onChanged={() => {
            setForm(null);
            load();
          }}
        />
      )}
    </main>
  );
}

export default function CalendarPage() {
  // useSearchParams needs a Suspense boundary for static prerendering.
  return (
    <Suspense fallback={null}>
      <CalendarView />
    </Suspense>
  );
}
