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

  function addAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !date) return;
    setAppointments((a) => [...a, { id: uuid(), title, date }]);
    setTitle("");
    setDate("");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Calendar</h1>
      <form onSubmit={addAppointment} className="flex flex-wrap items-end gap-2">
        <Input
          className="flex-1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Appointment title"
        />
        <Input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Button type="submit" disabled={!title || !date}
          >Add</Button>
      </form>
      <div className="space-y-2">
        {events.map((ev, idx) => (
          <Card key={idx} className="flex items-center justify-between gap-2">
            <span>{new Date(ev.date).toLocaleString()} – {ev.title}</span>
            <span className="text-xs text-gray-500">{ev.type}</span>
          </Card>
        ))}
        {events.length === 0 && <p>No events</p>}
      </div>
    </div>
  );
}
