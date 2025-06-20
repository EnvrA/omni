"use client";
import { useState, useEffect } from "react";
import { v4 as uuid } from "uuid";
import { Input, Button, Card } from "@/components/ui";
import useSWR from "swr";

interface Segment {
  id: string;
  name: string;
  field: string;
  value?: string;
}

interface Client {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  tag: string | null;
}

interface Deal {
  id: string;
  contact: { id: string };
}

interface Appointment {
  id: string;
  clientId?: string;
}

interface Criterion {
  id: string;
  field: string;
  value: string;
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

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [name, setName] = useState("");
  const [field, setField] = useState("phone");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Segment | null>(null);
  const { data: clients } = useSWR<{ clients: Client[] }>("/api/clients", fetcher);
  const { data: deals } = useSWR<{ deals: Deal[] }>("/api/deals", fetcher);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setSegments(JSON.parse(localStorage.getItem("segments") || "[]"));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setAppointments(JSON.parse(localStorage.getItem("appointments") || "[]"));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("segments", JSON.stringify(segments));
    }
  }, [segments]);

  function clientsForSegment(seg: Segment): Client[] {
    const list = clients?.clients || [];
    switch (seg.field) {
      case "phone":
        return seg.value
          ? list.filter((c) => c.phone?.includes(seg.value || ""))
          : list.filter((c) => c.phone);
      case "email":
        return seg.value
          ? list.filter((c) => c.email?.includes(seg.value))
          : list.filter((c) => c.email);
      case "company":
        return seg.value
          ? list.filter((c) => c.company?.toLowerCase().includes(seg.value!.toLowerCase()))
          : list.filter((c) => c.company);
      case "tag":
        return seg.value
          ? list.filter((c) => c.tag === seg.value)
          : list.filter((c) => c.tag);
      case "notes":
        return seg.value
          ? list.filter((c) => c.notes?.toLowerCase().includes(seg.value!.toLowerCase()))
          : list.filter((c) => c.notes);
      case "deal": {
        const dealIds = new Set((deals?.deals || []).map((d) => d.contact.id));
        const hasDeal = list.filter((c) => dealIds.has(c.id));
        return seg.value
          ? hasDeal.filter((c) =>
              c.name?.toLowerCase().includes(seg.value!.toLowerCase()),
            )
          : hasDeal;
      }
      case "appointment": {
        const appIds = new Set(
          appointments.map((a) => a.clientId).filter(Boolean) as string[],
        );
        const hasApp = list.filter((c) => appIds.has(c.id));
        return seg.value
          ? hasApp.filter((c) =>
              c.name?.toLowerCase().includes(seg.value!.toLowerCase()),
            )
          : hasApp;
      }
      default:
        return list;
    }
  }

  function clientsByCriteria(): Client[] {
    const list = clients?.clients || [];
    return criteria.reduce((acc, cr) => {
      return acc.filter((c) => {
        const val = (c as any)[cr.field] as string | null | undefined;
        return val ? val.toLowerCase().includes(cr.value.toLowerCase()) : false;
      });
    }, list);
  }

  function addSegment(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    setSegments((s) => [...s, { id: uuid(), name, field }]);
    setName("");
    setField("phone");
    setShowModal(false);
  }

  function deleteSegment(id: string) {
    setSegments((s) => s.filter((seg) => seg.id !== id));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Segments</h1>
      <Button
        type="button"
        onClick={() => setShowModal(true)}
        className="bg-green-600 text-white"
      >
        Create segment
      </Button>
      <div className="space-y-2 rounded border p-3">
        <h2 className="font-semibold">Filter Clients</h2>
        {criteria.map((cr) => (
          <div key={cr.id} className="flex items-center gap-2">
            <select
              className="rounded border p-1"
              value={cr.field}
              onChange={(e) =>
                setCriteria((c) =>
                  c.map((cc) =>
                    cc.id === cr.id ? { ...cc, field: e.target.value } : cc,
                  ),
                )
              }
            >
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="company">Company</option>
              <option value="tag">Tag</option>
              <option value="notes">Notes</option>
            </select>
            <Input
              value={cr.value}
              onChange={(e) =>
                setCriteria((c) =>
                  c.map((cc) =>
                    cc.id === cr.id ? { ...cc, value: e.target.value } : cc,
                  ),
                )
              }
              className="flex-1"
            />
            <Button
              type="button"
              onClick={() => setCriteria((c) => c.filter((cc) => cc.id !== cr.id))}
            >
              Remove
            </Button>
          </div>
        ))}
        <div className="flex justify-between">
          <Button
            type="button"
            onClick={() =>
              setCriteria((c) => [...c, { id: uuid(), field: "name", value: "" }])
            }
          >
            Add criteria
          </Button>
          {criteria.length > 0 && (
            <span className="text-sm text-gray-600">Matches: {clientsByCriteria().length}</span>
          )}
        </div>
      </div>
      {criteria.length > 0 && (
        <div className="space-y-1">
          {clientsByCriteria().map((c) => (
            <div key={c.id} className="text-sm">
              {c.name || c.id}
            </div>
          ))}
          {clientsByCriteria().length === 0 && (
            <div className="text-sm text-gray-500">No matching clients</div>
          )}
        </div>
      )}
      <div className="space-y-2">
        {segments.map((s) => (
          <Card
            key={s.id}
            onClick={() => setSelected(s)}
            className="flex cursor-pointer items-center justify-between"
          >
            <span>
              {s.name}
              <span className="ml-1 text-xs text-gray-500">
                ({s.field})
              </span>
              <span className="ml-1 text-xs text-gray-500">
                {clientsForSegment(s).length}
              </span>
            </span>
            <Button
              type="button"
              className="text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                deleteSegment(s.id);
              }}
            >
              Delete
            </Button>
          </Card>
        ))}
        {segments.length === 0 && <p>No segments</p>}
      </div>

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-80 space-y-2 rounded bg-white p-4 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold">{selected.name}</h2>
            <ul className="max-h-60 space-y-1 overflow-auto text-sm">
              {clientsForSegment(selected).map((c) => (
                <li key={c.id} className="border-b py-1">
                  {c.name || c.id}
                </li>
              ))}
              {clientsForSegment(selected).length === 0 && (
                <li className="text-gray-500">No clients</li>
              )}
            </ul>
            <div className="flex justify-end">
              <Button type="button" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur"
          onClick={() => setShowModal(false)}
        >
          <form
            onSubmit={addSegment}
            className="w-80 space-y-2 rounded bg-white p-4 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold">New Segment</h2>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Segment name"
            />
            <select
              className="w-full rounded border p-1"
              value={field}
              onChange={(e) => setField(e.target.value)}
            >
              <option value="phone">Has phone number</option>
              <option value="email">Has email address</option>
              <option value="company">Has company</option>
              <option value="tag">Has tag</option>
              <option value="notes">Has notes</option>
              <option value="deal">Has deal</option>
              <option value="appointment">Has appointment</option>
            </select>
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
