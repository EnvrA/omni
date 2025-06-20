"use client";
import useSWR from "swr";
import { useState, useEffect } from "react";
import { v4 as uuid } from "uuid";
import { Input, Button, Card } from "@/components/ui";
import { toast } from "sonner";
import { useTags } from "@/components/tags-context";

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
  clientId?: string;
  service?: string;
  value?: number;
}

interface Client {
  id: string;
  name: string | null;
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
  const { data: clients } = useSWR<{ clients: Client[] }>("/api/clients", fetcher);
  const [extras, setExtras] = useState<Record<string, DealExtra>>({});
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [service, setService] = useState("");
  const [value, setValue] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState<"day" | "week" | "month" | "agenda">("week");
  const [detail, setDetail] = useState<Appointment | null>(null);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const { tags } = useTags("clients");

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
      id: a.id,
      title: a.title,
      date: a.date,
      clientId: a.clientId,
    })),
    ...(data?.deals || [])
      .filter((d) => extras[d.id]?.hasDeadline && extras[d.id]?.deadline)
      .map((d) => ({
        type: "Deal Deadline" as const,
        id: d.id,
        title: extras[d.id]?.title || d.contact.name || "Deal",
        date: extras[d.id].deadline!,
        clientId: d.contact.id,
      })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - ((currentDate.getDay() + 6) % 7));
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const filteredEvents = events.filter((ev) => {
    const d = new Date(ev.date);
    const inView =
      view === "week"
        ? d >= startOfWeek && d < endOfWeek
        : d >= startOfMonth && d <= endOfMonth;
    const inRange =
      (!fromDate || d >= new Date(fromDate)) &&
      (!toDate || d <= new Date(toDate));
    const matchSearch =
      !search || ev.type !== "Deal Deadline"
        ? true
        : ev.title.toLowerCase().includes(search.toLowerCase());
    return inView && inRange && matchSearch;
  });

  function isSameDay(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function eventColor(ev: { type: string; clientId?: string }) {
    if (ev.type === "Appointment") {
      const cl = clients?.clients.find((c) => c.id === ev.clientId);
      const color = tags.find((t) => t.name === cl?.tag)?.color;
      return color || "#bfdbfe";
    }
    return "#fde047";
  }

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const monthDays = (() => {
    const start = new Date(startOfMonth);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return Array.from({ length: 42 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  })();

  function saveAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !date) {
      toast.error("Title and date required");
      return;
    }
    if (editing) {
      setAppointments((a) =>
        a.map((ap) =>
          ap.id === editing.id
            ? {
                ...ap,
                title,
                date,
                clientId: clientId || undefined,
                service,
                value: value ? Number(value) : undefined,
              }
            : ap,
        ),
      );
    } else {
      setAppointments((a) => [
        ...a,
        {
          id: uuid(),
          title,
          date,
          clientId: clientId || undefined,
          service,
          value: value ? Number(value) : undefined,
        },
      ]);
    }
    setTitle("");
    setDate("");
    setClientId("");
    setClientSearch("");
    setService("");
    setValue("");
    setEditing(null);
    setShowModal(false);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Calendar</h1>
      <div className="flex flex-wrap items-center gap-2" aria-label="Calendar toolbar">
        <Button
          type="button"
          onClick={() => setView("day")}
          aria-pressed={view === "day"}
          className={`${view === "day" ? "bg-blue-600 text-white" : "bg-white"}`}
        >
          Day
        </Button>
        <Button
          type="button"
          onClick={() => setView("week")}
          aria-pressed={view === "week"}
          className={`${view === "week" ? "bg-blue-600 text-white" : "bg-white"}`}
        >
          Week
        </Button>
        <Button
          type="button"
          onClick={() => setView("month")}
          aria-pressed={view === "month"}
          className={`${view === "month" ? "bg-blue-600 text-white" : "bg-white"}`}
        >
          Month
        </Button>
        <Button
          type="button"
          onClick={() => setView("agenda")}
          aria-pressed={view === "agenda"}
          className={`${view === "agenda" ? "bg-blue-600 text-white" : "bg-white"}`}
        >
          Agenda
        </Button>
        <Button type="button" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()-1, 1))}>
          ◀
        </Button>
        <span className="mx-1 font-semibold">
          {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
        </span>
        <Button type="button" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1))}>
          ▶
        </Button>
        <Input
          placeholder="Search deals"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-32"
        />
        <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        <Button
          type="button"
          onClick={() => setShowModal(true)}
          className="ml-auto bg-green-600 text-white"
        >
          Add appointment
        </Button>
      </div>
      <div className="overflow-x-auto">
        {view === "agenda" && (
          <ul className="space-y-1">
            {filteredEvents.map((ev) => (
              <li
                key={ev.id}
                className="flex cursor-pointer items-center justify-between rounded border p-2 shadow-sm transition-shadow hover:shadow-md"
                onClick={() => {
                  const a = appointments.find((ap) => ap.id === ev.id);
                  if (a) setDetail(a);
                }}
                title={ev.title}
                style={{ background: eventColor(ev) }}
              >
                <span className="truncate text-sm font-medium text-gray-800">
                  {new Date(ev.date).toLocaleString()} - {ev.title}
                </span>
              </li>
            ))}
            {filteredEvents.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-10 text-gray-500">
                <img src="/window.svg" alt="empty" className="h-20 w-20 opacity-75" />
                <span>No appointments scheduled</span>
              </div>
            )}
          </ul>
        )}
        {view !== "agenda" && (
          <div className="grid grid-cols-7 gap-px bg-gray-200 text-sm">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
              <div key={d} className="bg-gray-50 p-1 text-center font-semibold">
                {d}
              </div>
            ))}
            {(view === "day" ? [currentDate] : view === "week" ? weekDays : monthDays).map((day, idx) => (
              <div key={idx} className="min-h-[80px] space-y-1 bg-white p-1">
                <div className="text-right text-xs text-gray-500">{day.getDate()}</div>
                {filteredEvents
                  .filter((ev) => isSameDay(new Date(ev.date), day))
                  .map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => {
                        const a = appointments.find((ap) => ap.id === ev.id);
                        if (a) setDetail(a);
                      }}
                      title={ev.title}
                      style={{ background: eventColor(ev) }}
                      className="cursor-pointer rounded px-1 text-xs shadow-sm transition-shadow hover:shadow-md"
                    >
                      {ev.title}
                    </div>
                  ))}
                {filteredEvents.filter((ev) => isSameDay(new Date(ev.date), day)).length === 0 && view === "day" && (
                  <div className="flex flex-col items-center gap-4 py-10 text-gray-500">
                    <img src="/window.svg" alt="empty" className="h-20 w-20 opacity-75" />
                    <span>No appointments scheduled</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {view !== "agenda" && filteredEvents.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-10 text-gray-500">
            <img src="/window.svg" alt="empty" className="h-20 w-20 opacity-75" />
            <span>No appointments scheduled</span>
          </div>
        )}
      </div>

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur"
          onClick={() => setShowModal(false)}
        >
          <form
            onSubmit={saveAppointment}
            className="w-80 space-y-2 rounded bg-white p-4 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold">{editing ? "Edit" : "New"} Appointment</h2>
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
            <Input
              list="client-list"
              value={clientSearch}
              onChange={(e) => {
                setClientSearch(e.target.value);
                const c = clients?.clients.find(
                  (cl) => cl.name === e.target.value,
                );
                setClientId(c?.id || "");
              }}
              placeholder="Client"
            />
            <datalist id="client-list">
              {clients?.clients.map((c) => (
                <option key={c.id} value={c.name || "Unnamed"} />
              ))}
            </datalist>
            <Input
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="Service"
            />
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Value"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditing(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 text-white">
                Save
              </Button>
            </div>
          </form>
        </div>
      )}
      {detail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur"
          onClick={() => setDetail(null)}
        >
          <div
            className="w-80 space-y-2 rounded bg-white p-4 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold">{detail.title}</h2>
            <p className="text-sm text-gray-600">
              {new Date(detail.date).toLocaleString()}
            </p>
            {detail.service && <p className="text-sm">Service: {detail.service}</p>}
            {detail.value !== undefined && (
              <p className="text-sm">Value: {detail.value}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                onClick={() => {
                  setEditing(detail);
                  setTitle(detail.title);
                  setDate(detail.date);
                  setClientId(detail.clientId || "");
                  setClientSearch(
                    clients?.clients.find((c) => c.id === detail.clientId)?.name || ""
                  );
                  setService(detail.service || "");
                  setValue(detail.value ? String(detail.value) : "");
                  setDetail(null);
                  setShowModal(true);
                }}
              >
                Edit
              </Button>
              <Button
                type="button"
                className="text-red-600"
                onClick={() => {
                  setAppointments((a) => a.filter((ap) => ap.id !== detail.id));
                  setDetail(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
