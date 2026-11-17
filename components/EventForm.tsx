"use client";

import { X } from "lucide-react";
import { FormEvent, useState } from "react";
import {
  CalendarEvent,
  createEvent,
  deleteEvent,
  deleteOccurrence,
  EventInput,
  fromInputValue,
  RepeatFreq,
  toInputValue,
  updateEvent,
} from "@/lib/calendar";

const REMINDERS = [
  { value: "", label: "No reminder" },
  { value: "0", label: "At start" },
  { value: "10", label: "10 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "1440", label: "1 day before" },
];

interface Props {
  /** The event being edited, or null to create. */
  initial: CalendarEvent | null;
  /** Start of the clicked occurrence (ISO), for "delete just this one". */
  occurrenceStart?: string;
  /** Day the new event should start on. */
  defaultDate: Date;
  onClose: () => void;
  onChanged: () => void;
}

export default function EventForm({ initial, occurrenceStart, defaultDate, onClose, onChanged }: Props) {
  const startDefault = new Date(defaultDate);
  if (!initial) startDefault.setHours(9, 0, 0, 0);
  const endDefault = new Date(startDefault.getTime() + 3_600_000);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [allDay, setAllDay] = useState(initial?.allDay ?? false);
  const [startVal, setStartVal] = useState(
    toInputValue(initial?.start ?? startDefault.toISOString(), initial?.allDay ?? false),
  );
  const [endVal, setEndVal] = useState(toInputValue(initial?.end ?? endDefault.toISOString(), initial?.allDay ?? false));
  const [repeat, setRepeat] = useState<"none" | RepeatFreq>(initial?.recurrence?.freq ?? "none");
  const [interval, setIntervalVal] = useState(String(initial?.recurrence?.interval ?? 1));
  const [endsMode, setEndsMode] = useState<"never" | "until" | "count">(
    initial?.recurrence?.until ? "until" : initial?.recurrence?.count ? "count" : "never",
  );
  const [untilVal, setUntilVal] = useState(initial?.recurrence?.until ? toInputValue(initial.recurrence.until, true) : "");
  const [countVal, setCountVal] = useState(String(initial?.recurrence?.count ?? 10));
  const [reminder, setReminder] = useState(initial?.reminderMinutes != null ? String(initial.reminderMinutes) : "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggleAllDay(next: boolean) {
    setAllDay(next);
    if (next) {
      setStartVal(startVal.slice(0, 10));
      setEndVal(endVal.slice(0, 10));
    } else {
      setStartVal(`${startVal.slice(0, 10)}T09:00`);
      setEndVal(`${endVal.slice(0, 10)}T10:00`);
    }
  }

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const input: EventInput = {
      title: title.trim(),
      description,
      location,
      allDay,
      start: fromInputValue(startVal, allDay),
      // An all-day event covers its whole last day.
      end: allDay ? new Date(`${endVal}T23:59:00`).toISOString() : fromInputValue(endVal, false),
      recurrence:
        repeat === "none"
          ? null
          : {
              freq: repeat,
              interval: Math.max(1, Number(interval) || 1),
              until: endsMode === "until" && untilVal ? new Date(`${untilVal}T23:59:59`).toISOString() : null,
              count: endsMode === "count" ? Math.max(1, Number(countVal) || 1) : null,
            },
      reminderMinutes: reminder === "" ? null : Number(reminder),
    };
    run(() => (initial ? updateEvent(initial.id, input) : createEvent(input)));
  }

  const label = "kicker mb-1.5 block";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/60 p-4 sm:p-8" onMouseDown={onClose}>
      <form
        onSubmit={onSubmit}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-xl border-4 border-line bg-surface"
      >
        <div className="flex items-center justify-between border-b-4 border-line bg-mustard px-5 py-3">
          <h2 className="display text-3xl">{initial ? "Edit event" : "New event"}</h2>
          <button type="button" onClick={onClose} className="icon-btn" aria-label="Close">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className={label}>Title</label>
            <input className="input" value={title} required maxLength={150} autoFocus onChange={(e) => setTitle(e.target.value)} />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={allDay} onChange={(e) => toggleAllDay(e.target.checked)} className="h-4 w-4 accent-[rgb(200,80,30)]" />
            All day
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Starts</label>
              <input className="input" type={allDay ? "date" : "datetime-local"} value={startVal} required onChange={(e) => setStartVal(e.target.value)} />
            </div>
            <div>
              <label className={label}>Ends</label>
              <input className="input" type={allDay ? "date" : "datetime-local"} value={endVal} required onChange={(e) => setEndVal(e.target.value)} />
            </div>
          </div>

          <div>
            <label className={label}>Location</label>
            <input className="input" value={location} maxLength={200} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div>
            <label className={label}>Notes (searchable)</label>
            <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Repeat</label>
              <select className="input" value={repeat} onChange={(e) => setRepeat(e.target.value as "none" | RepeatFreq)}>
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className={label}>Reminder</label>
              <select className="input" value={reminder} onChange={(e) => setReminder(e.target.value)}>
                {REMINDERS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {repeat !== "none" && (
            <div className="grid gap-4 border-2 border-line bg-surface2 p-4 sm:grid-cols-3">
              <div>
                <label className={label}>Every</label>
                <input className="input" type="number" min={1} max={99} value={interval} onChange={(e) => setIntervalVal(e.target.value)} />
              </div>
              <div>
                <label className={label}>Ends</label>
                <select className="input" value={endsMode} onChange={(e) => setEndsMode(e.target.value as typeof endsMode)}>
                  <option value="never">Never</option>
                  <option value="until">On date</option>
                  <option value="count">After N times</option>
                </select>
              </div>
              {endsMode === "until" && (
                <div>
                  <label className={label}>Last day</label>
                  <input className="input" type="date" value={untilVal} required onChange={(e) => setUntilVal(e.target.value)} />
                </div>
              )}
              {endsMode === "count" && (
                <div>
                  <label className={label}>Times</label>
                  <input className="input" type="number" min={1} max={500} value={countVal} onChange={(e) => setCountVal(e.target.value)} />
                </div>
              )}
              {initial && <p className="text-xs font-semibold sm:col-span-3">Changes apply to the whole series.</p>}
            </div>
          )}

          {error && <p className="border-2 border-danger px-3 py-2 text-sm font-bold text-danger">{error}</p>}

          <div className="flex flex-wrap items-center gap-2 border-t-2 border-line pt-4">
            <button type="submit" disabled={busy} className="btn-primary">
              {initial ? "Save changes" : "Create event"}
            </button>
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            {initial && (
              <div className="ml-auto flex flex-wrap gap-2">
                {initial.recurrence && occurrenceStart && (
                  <button type="button" disabled={busy} className="btn-danger" onClick={() => run(() => deleteOccurrence(initial.id, occurrenceStart))}>
                    Delete this one
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  className="btn-danger"
                  onClick={() => {
                    if (window.confirm(initial.recurrence ? "Delete the whole series?" : "Delete this event?")) {
                      run(() => deleteEvent(initial.id));
                    }
                  }}
                >
                  {initial.recurrence ? "Delete series" : "Delete"}
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
