"use client";
import { useState, useEffect } from "react";
import { v4 as uuid } from "uuid";
import { Input, Button, Card } from "@/components/ui";
import { X } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

interface Rule {
  id: string;
  field: string;
  op:
    | "equals"
    | "contains"
    | "exists"
    | "not_equals"
    | "not_contains"
    | "not_exists";
  value?: string;
}

interface Segment {
  id: string;
  name: string;
  rules: Rule[];
  match: "AND" | "OR";
  createdAt: string;
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

// Additional interfaces reserved for future expansion

interface Criterion {
  id: string;
  field: string;
  op:
    | "equals"
    | "contains"
    | "exists"
    | "not_equals"
    | "not_contains"
    | "not_exists";
  value?: string;
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
  const [segments, setSegments] = useState<Segment[] | null>(null);
  const [name, setName] = useState("");
  const [logic, setLogic] = useState<"AND" | "OR">("AND");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Segment | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editSeg, setEditSeg] = useState<Segment | null>(null);
  const { data: clients } = useSWR<{ clients: Client[] }>("/api/clients", fetcher);
  const [criteria, setCriteria] = useState<Criterion[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setSegments(JSON.parse(localStorage.getItem("segments") || "[]"));
    } catch {
      setSegments([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && segments) {
      localStorage.setItem("segments", JSON.stringify(segments));
    }
  }, [segments]);

  function matchRule(c: Client, r: Rule): boolean {
    const val = (c as any)[r.field] as string | null | undefined;
    if (r.op === "exists") return Boolean(val);
    if (r.op === "not_exists") return !val;
    if (!val) return r.op === "not_equals" || r.op === "not_contains";
    if (r.op === "equals")
      return val.toLowerCase() === (r.value || "").toLowerCase();
    if (r.op === "not_equals")
      return val.toLowerCase() !== (r.value || "").toLowerCase();
    if (r.op === "contains")
      return val.toLowerCase().includes((r.value || "").toLowerCase());
    if (r.op === "not_contains")
      return !val.toLowerCase().includes((r.value || "").toLowerCase());
    return false;
  }

  function clientsForSegment(seg: Segment): Client[] {
    const list = clients?.clients || [];
    return list.filter((c) => {
      if (seg.match === "AND") {
        return seg.rules.every((r) => matchRule(c, r));
      }
      return seg.rules.some((r) => matchRule(c, r));
    });
  }

  function clientsByCriteria(): Client[] {
    const list = clients?.clients || [];
    if (criteria.length === 0) return list;
    return list.filter((c) => {
      if (logic === "AND") {
        return criteria.every((cr) => matchRule(c, cr));
      }
      return criteria.some((cr) => matchRule(c, cr));
    });
  }

  function openEdit(seg: Segment) {
    setEditSeg(seg);
    setName(seg.name);
    setLogic(seg.match);
    setCriteria(seg.rules);
    setShowModal(true);
  }

  function openNew() {
    setEditSeg(null);
    setName("");
    setLogic("AND");
    setCriteria([]);
    setShowModal(true);
  }

  function exportCSV(list: Client[]) {
    const rows = [
      ["Name", "Email", "Phone", "Company", "Tag"],
      ...list.map((c) => [c.name, c.email, c.phone, c.company, c.tag]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "segment.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function addSegment(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    if (editSeg) {
      setSegments((s) =>
        s.map((seg) =>
          seg.id === editSeg.id
            ? { ...seg, name, rules: criteria, match: logic }
            : seg,
        ),
      );
    } else {
      const newSeg: Segment = {
        id: uuid(),
        name,
        rules: criteria,
        match: logic,
        createdAt: new Date().toISOString(),
      };
      setSegments((s) => [...s, newSeg]);
    }
    setName("");
    setCriteria([]);
    setLogic("AND");
    setEditSeg(null);
    setShowModal(false);
  }

  function deleteSegment(id: string) {
    if (!segments) return;
    const seg = segments.find((s) => s.id === id);
    if (!seg) return;
    if (!confirm("Delete this segment?")) return;
    setSegments((s) => s.filter((seg) => seg.id !== id));
    toast.success("Segment deleted", {
      action: {
        label: "Undo",
        onClick: () => {
          setSegments((s) => [...(s || []), seg]);
        },
      },
    });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Segments</h1>
      <Button
        type="button"
        onClick={openNew}
        className="bg-green-600 text-white"
      >
        Create segment
      </Button>
      <div className="space-y-2">
        {segments === null && (
          <div className="space-y-2 animate-pulse">
            <div className="h-6 w-full rounded bg-gray-200" />
            <div className="h-6 w-full rounded bg-gray-200" />
            <div className="h-6 w-full rounded bg-gray-200" />
          </div>
        )}
        {segments && segments.length > 0 && (
          <>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => {
                  if (!segments || selectedIds.length === 0) return;
                  if (!confirm(`Delete ${selectedIds.length} segment(s)?`)) return;
                  const removed = segments.filter((seg) => selectedIds.includes(seg.id));
                  setSegments((s) => s!.filter((seg) => !selectedIds.includes(seg.id)));
                  setSelectedIds([]);
                  toast.success(`Deleted ${removed.length} segment${removed.length > 1 ? "s" : ""}`, {
                    action: {
                      label: "Undo",
                      onClick: () => {
                        setSegments((s) => [...(s || []), ...removed]);
                      },
                    },
                  });
                }}
                disabled={selectedIds.length === 0}
              >
                Delete Selected
              </Button>
              <Button
                type="button"
                onClick={() => {
                  segments &&
                    selectedIds.forEach((id) => {
                      const seg = segments.find((s) => s.id === id);
                      if (seg) exportCSV(clientsForSegment(seg));
                    });
                }}
                disabled={selectedIds.length === 0}
              >
                Export CSV
              </Button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="w-4 p-2" />
                  <th className="p-2">Name</th>
                  <th className="p-2"># Members</th>
                  <th className="p-2">Created</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {segments?.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(s.id)}
                        onChange={(e) => {
                          setSelectedIds((ids) =>
                            e.target.checked ? [...ids, s.id] : ids.filter((i) => i !== s.id),
                          );
                        }}
                      />
                    </td>
                    <td className="p-2">{s.name}</td>
                    <td className="p-2">{clientsForSegment(s).length}</td>
                    <td className="p-2">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="p-2 text-right space-x-2">
                      <Button type="button" onClick={() => setSelected(s)}>Run</Button>
                      <Button type="button" onClick={() => exportCSV(clientsForSegment(s))}>Export</Button>
                      <Button type="button" onClick={() => openEdit(s)}>Edit</Button>
                      <Button
                        type="button"
                        className="text-red-600"
                        onClick={() => deleteSegment(s.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {segments && segments.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-10 text-gray-500">
            <img src="/globe.svg" alt="empty" className="h-24 w-24 opacity-75" />
            <span>No segments yet</span>
            <Button type="button" onClick={openNew} className="bg-green-600 text-white">
              Create your first segment
            </Button>
          </div>
        )}
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
          onClick={() => {
            setShowModal(false);
            setEditSeg(null);
          }}
        >
          <form
            onSubmit={addSegment}
            className="w-96 space-y-4 rounded-lg bg-white p-4 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="font-semibold">
                {editSeg ? "Edit Segment" : "New Segment"}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Segment name"
            />
            {/* Builder */}
            {criteria.map((cr) => (
              <div
                key={cr.id}
                className="mb-4 flex flex-col items-start gap-2 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center"
              >
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
                  <option value="tag">Tag</option>
                </select>
                <select
                  className="rounded border p-1"
                  value={cr.op}
                  onChange={(e) =>
                    setCriteria((c) =>
                      c.map((cc) =>
                        cc.id === cr.id ? { ...cc, op: e.target.value as any } : cc,
                      ),
                    )
                  }
                >
                  <option value="equals">equals</option>
                  <option value="not_equals">doesn't equal</option>
                  <option value="contains">contains</option>
                  <option value="not_contains">doesn't contain</option>
                  <option value="exists">exists</option>
                  <option value="not_exists">doesn't exist</option>
                </select>
                {cr.op !== "exists" && cr.op !== "not_exists" && (
                  <Input
                    value={cr.value || ""}
                    onChange={(e) =>
                      setCriteria((c) =>
                        c.map((cc) =>
                          cc.id === cr.id ? { ...cc, value: e.target.value } : cc,
                        ),
                      )
                    }
                    className="flex-1"
                  />
                )}
                <Button
                  type="button"
                  onClick={() =>
                    setCriteria((c) => c.filter((cc) => cc.id !== cr.id))
                  }
                  className="self-start sm:self-auto"
                >
                  Remove
                </Button>
              </div>
            ))}
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm">Match</span>
              <select
                className="rounded border p-1"
                value={logic}
                onChange={(e) => setLogic(e.target.value as any)}
              >
                <option value="AND">All rules</option>
                <option value="OR">Any rule</option>
              </select>
            </div>
            <div className="flex justify-between">
              <Button
                type="button"
                onClick={() =>
                  setCriteria((c) => [
                    ...c,
                    { id: uuid(), field: "name", op: "contains", value: "" },
                  ])
                }
              >
                + Add rule
              </Button>
              {criteria.length > 0 && (
                <span className="text-sm text-gray-600">
                  {clientsByCriteria().length} clients match this segment
                </span>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t pt-2">
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
