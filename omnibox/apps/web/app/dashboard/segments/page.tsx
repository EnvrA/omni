"use client";
import { useState } from "react";
import { v4 as uuid } from "uuid";
import { Button, Input } from "@/components/ui";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import useSWR from "swr";
import SegmentTable from "./components/SegmentTable";
import { Segment, Rule, Client } from "./types";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
};

function Segments() {
  const { data: clients } = useSWR<{ clients: Client[] }>("/api/clients", fetcher);

  const queryClient = useQueryClient();
  const segmentsQuery = useQuery<Segment[]>({
    queryKey: ["segments"],
    queryFn: () => {
      if (typeof window === "undefined") return [];
      try {
        return JSON.parse(localStorage.getItem("segments") || "[]");
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  const updateSegments = useMutation({
    mutationFn: async (list: Segment[]) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("segments", JSON.stringify(list));
      }
      return list;
    },
    onSuccess: (data) => queryClient.setQueryData(["segments"], data),
  });

  const [showModal, setShowModal] = useState(false);
  const [editSeg, setEditSeg] = useState<Segment | null>(null);
  const [name, setName] = useState("");
  const [logic, setLogic] = useState<"AND" | "OR">("AND");
  const [criteria, setCriteria] = useState<Rule[]>([]);
  const [selected, setSelected] = useState<Segment | null>(null);

  const segments = segmentsQuery.data || [];

  function clientsForSegment(seg: Segment): Client[] {
    const list = clients?.clients || [];
    return list.filter((c) => {
      if (seg.match === "AND") {
        return seg.rules.every((r) => matchRule(c, r));
      }
      return seg.rules.some((r) => matchRule(c, r));
    });
  }

  function matchRule(c: Client, r: Rule): boolean {
    const val = (c as any)[r.field] as string | null | undefined;
    if (r.op === "exists") return Boolean(val);
    if (r.op === "not_exists") return !val;
    if (!val) return r.op === "not_equals" || r.op === "not_contains";
    if (r.op === "equals") return val.toLowerCase() === (r.value || "").toLowerCase();
    if (r.op === "not_equals") return val.toLowerCase() !== (r.value || "").toLowerCase();
    if (r.op === "contains") return val.toLowerCase().includes((r.value || "").toLowerCase());
    if (r.op === "not_contains") return !val.toLowerCase().includes((r.value || "").toLowerCase());
    return false;
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

  function saveSegment(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    let list = segments;
    if (editSeg) {
      list = list.map((seg) =>
        seg.id === editSeg.id ? { ...seg, name, rules: criteria, match: logic } : seg,
      );
    } else {
      const newSeg: Segment = {
        id: uuid(),
        name,
        rules: criteria,
        match: logic,
        createdAt: new Date().toISOString(),
      };
      list = [...list, newSeg];
    }
    updateSegments.mutate(list);
    setShowModal(false);
  }

  function deleteSegment(id: string) {
    const seg = segments.find((s) => s.id === id);
    if (!seg) return;
    if (!confirm("Delete this segment?")) return;
    const list = segments.filter((s) => s.id !== id);
    updateSegments.mutate(list);
    toast.success("Segment deleted", {
      action: {
        label: "Undo",
        onClick: () => updateSegments.mutate([...segments, seg]),
      },
    });
  }

  function bulkDelete(ids: string[]) {
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} segment(s)?`)) return;
    const removed = segments.filter((s) => ids.includes(s.id));
    updateSegments.mutate(segments.filter((s) => !ids.includes(s.id)));
    toast.success(`Deleted ${removed.length} segment${removed.length > 1 ? "s" : ""}`, {
      action: {
        label: "Undo",
        onClick: () => updateSegments.mutate([...segments, ...removed]),
      },
    });
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

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Segments</h1>
      <Button type="button" onClick={openNew} className="bg-blue-600 text-white">
        Create segment
      </Button>
      <SegmentTable
        segments={segments}
        countFor={(seg) => clientsForSegment(seg).length}
        onRun={(seg) => setSelected(seg)}
        onExport={(seg) => exportCSV(clientsForSegment(seg))}
        onEdit={(seg, newName) => {
          updateSegments.mutate(
            segments.map((s) => (s.id === seg.id ? { ...s, name: newName } : s)),
          );
        }}
        onDelete={deleteSegment}
        onBulkDelete={bulkDelete}
        onBulkExport={(ids) =>
          ids.forEach((id) => {
            const seg = segments.find((s) => s.id === id);
            if (seg) exportCSV(clientsForSegment(seg));
          })
        }
      />

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur"
          onClick={() => setSelected(null)}
        >
          <div className="w-80 space-y-2 rounded bg-white p-4 shadow" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold">{selected.name}</h2>
            <ul className="max-h-60 space-y-1 overflow-auto text-sm">
              {clientsForSegment(selected).map((c) => (
                <li key={c.id} className="border-b py-1">
                  {c.name || c.id}
                </li>
              ))}
              {clientsForSegment(selected).length === 0 && <li className="text-gray-500">No clients</li>}
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
            onSubmit={saveSegment}
            className="w-96 space-y-4 rounded-lg bg-white p-4 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="font-semibold">{editSeg ? "Edit Segment" : "New Segment"}</h2>
              <button type="button" onClick={() => setShowModal(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Segment name" />
            {criteria.map((cr) => (
              <div
                key={cr.id}
                className="mb-4 flex flex-col items-start gap-2 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center"
              >
                <select
                  className="rounded border p-1"
                  value={cr.field}
                  onChange={(e) =>
                    setCriteria((c) => c.map((cc) => (cc.id === cr.id ? { ...cc, field: e.target.value } : cc)))
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
                    setCriteria((c) => c.map((cc) => (cc.id === cr.id ? { ...cc, op: e.target.value as any } : cc)))
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
                      setCriteria((c) => c.map((cc) => (cc.id === cr.id ? { ...cc, value: e.target.value } : cc)))
                    }
                    className="flex-1"
                  />
                )}
                <Button
                  type="button"
                  onClick={() => setCriteria((c) => c.filter((cc) => cc.id !== cr.id))}
                  className="self-start sm:self-auto"
                >
                  Remove
                </Button>
              </div>
            ))}
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm">Match</span>
              <select className="rounded border p-1" value={logic} onChange={(e) => setLogic(e.target.value as any)}>
                <option value="AND">All rules</option>
                <option value="OR">Any rule</option>
              </select>
            </div>
            <div className="flex justify-between">
              <Button
                type="button"
                onClick={() => setCriteria((c) => [...c, { id: uuid(), field: "name", op: "contains", value: "" }])}
              >
                + Add rule
              </Button>
              {criteria.length > 0 && (
                <span className="text-sm text-gray-600">{clientsForSegment({ id: "tmp", name: name || "", rules: criteria, match: logic, createdAt: "" }).length} clients match this segment</span>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t pt-2">
              <Button type="button" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 text-white">
                Save
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function SegmentsPage() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <Segments />
    </QueryClientProvider>
  );
}
