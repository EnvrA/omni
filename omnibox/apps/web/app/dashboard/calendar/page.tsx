"use client";
import useSWR from "swr";
import { useState, useEffect } from "react";
import { v4 as uuid } from "uuid";
import { Input, Button, Card } from "@/components/ui";

interface Deal {
  id: string;
  contact: { id: string; name: string | null };
}
interface DealExtra {
  title?: string;
  hasDeadline?: boolean;
  deadline?: string;
}
interface Appointment {
  id: string;
  title: string;
  date: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
};

export default function CalendarPage() {
  const { data } = useSWR<{ deals: Deal[] }>("/api/deals", fetcher);
  const [extras, setExtras] = useState<Record<string, DealExtra>>({});
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState<"week" | "month">("week");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setExtras(JSON.parse(localStorage.getItem("dealExtras") || "{}"));
    } catch {}
    try {
      setAppointments(JSON.parse(localStorage.getItem("appointments") || "[]"));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("appointments", JSON.stringify(appointments));
    }
  }, [appointments]);

  const events = [
    ...appointments.map((a) => ({
      type: "Appointment" as const,
      title: a.title,
      date: a.date,
    })),
    ...(data?.deals || [])
      .filter((d) => extras[d.id]?.hasDeadline && extras[d.id]?.deadline)
      .map((d) => ({
        type: "Deal Deadline" as const,
        title: extras[d.id]?.title || d.contact.name || "Deal",
        date: extras[d.id].deadline!,
      })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const filteredEvents = events.filter((ev) => {
    const d = new Date(ev.date);
    if (view === "week") {
      return d >= startOfWeek && d < endOfWeek;
    }
    return d >= startOfMonth && d <= endOfMonth;
  });

  function isSameDay(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const monthDays = (() => {
    const start = new Date(startOfMonth);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 42 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  })();

  function addAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !date) return;
    setAppointments((a) => [...a, { id: uuid(), title, date }]);
    setTitle("");
    setDate("");
    setShowModal(false);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Calendar</h1>
      <div
        className="flex items-center gap-2"
        aria-label="Select calendar view"
      >
        <Button
          type="button"
          onClick={() => setView("week")}
          aria-pressed={view === "week"}
          className={`${
            view === "week" ? "bg-blue-600 text-white" : "bg-white"
          }`}
        >
          Week
        </Button>
        <Button
          type="button"
          onClick={() => setView("month")}
          aria-pressed={view === "month"}
          className={`${
            view === "month" ? "bg-blue-600 text-white" : "bg-white"
          }`}
        >
          Month
        </Button>
      </div>
      <Button
        type="button"
        onClick={() => setShowModal(true)}
        className="bg-green-600 text-white"
      >
        Add appointment
      </Button>
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-px bg-gray-200 text-sm">
          {(view === "week" ? weekDays : monthDays).map((day, idx) => (
            <div key={idx} className="min-h-[80px] space-y-1 bg-white p-1">
              <div className="text-right text-xs text-gray-500">
                {day.getDate()}
              </div>
              {filteredEvents
                .filter((ev) => isSameDay(new Date(ev.date), day))
                .map((ev, i) => (
                  <div key={i} className="rounded bg-blue-100 px-1 text-xs">
                    {ev.title}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur"
          onClick={() => setShowModal(false)}
        >
          <form
            onSubmit={addAppointment}
            className="w-80 space-y-2 rounded bg-white p-4 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold">New Appointment</h2>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
            />
            <Input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 text-white">
                Save
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
