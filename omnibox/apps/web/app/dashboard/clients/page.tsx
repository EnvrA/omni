"use client";

import useSWR from "swr";
import { useState } from "react";
import { Input, Button, Card, Avatar, Badge, Textarea } from "@/components/ui";

const tagColors: Record<string, string> = {
  VIP: "bg-yellow-100 text-yellow-800",
  "New Client": "bg-blue-100 text-blue-800",
};
import { toast } from "sonner";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
};

interface Client {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  tag: string | null;
  createdAt: string;
  lastActivity: string;
}

export default function ClientsPage() {
  const { data, error, mutate } = useSWR<{ clients: Client[] }>(
    "/api/clients",
    fetcher,
  );
  const [showModal, setShowModal] = useState(false);
  const [detail, setDetail] = useState<Client | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
    tag: "",
  });
  const [editId, setEditId] = useState<string>();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "date" | "activity">("name");
  const [tagFilter, setTagFilter] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkTagValue, setBulkTagValue] = useState("");
  const [fading, setFading] = useState<string[]>([]);
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);

  const tags = Array.from(
    new Set((data?.clients ?? []).map((c) => c.tag).filter(Boolean)),
  ) as string[];

  const openAdd = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      company: "",
      notes: "",
      tag: "",
    });
    setEditId(undefined);
    setShowModal(true);
  };

  const openEdit = (c: Client) => {
    setForm({
      name: c.name ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      company: c.company ?? "",
      notes: c.notes ?? "",
      tag: c.tag ?? "",
    });
    setEditId(c.id);
    setShowModal(true);
  };

  const filtered = (data?.clients ?? [])
    .filter((c) => tagFilter === "all" || c.tag === tagFilter)
    .filter((c) => {
      const q = search.toLowerCase();
      return (
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.notes?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sort === "name") return (a.name || "").localeCompare(b.name || "");
      if (sort === "date")
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      if (sort === "activity")
        return (
          new Date(b.lastActivity).getTime() -
          new Date(a.lastActivity).getTime()
        );
      return 0;
    });

  const paged = filtered.slice(0, page * PAGE_SIZE);

  async function saveClient(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(editId ? `/api/client/${editId}` : "/api/clients", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      toast.error("Failed to save client");
      return;
    }
    toast.success(editId ? "Client updated" : "Client added");
    setShowModal(false);
    mutate();
  }

  async function deleteClient(id: string) {
    const res = await fetch(`/api/client/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete");
    } else {
      toast.success("Client deleted");
      setFading((f) => [...f, id]);
      setTimeout(() => {
        setFading((f) => f.filter((v) => v !== id));
        mutate();
      }, 300);
    }
  }

  function exportCSV() {
    const rows = [
      ["Name", "Email", "Phone", "Company", "Tag"],
      ...paged.map((c) => [c.name, c.email, c.phone, c.company, c.tag]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${v ?? ""}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clients.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function bulkDelete() {
    setFading((f) => [...f, ...selected]);
    await Promise.all(
      selected.map((id) => fetch(`/api/client/${id}`, { method: "DELETE" })),
    );
    const removed = selected;
    setSelected([]);
    setTimeout(() => {
      setFading((f) => f.filter((id) => !removed.includes(id)));
      mutate();
    }, 300);
  }

  async function applyTag() {
    await Promise.all(
      selected.map((id) =>
        fetch(`/api/client/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tag: bulkTagValue }),
        }),
      ),
    );
    setSelected([]);
    mutate();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-wrap items-end gap-2">
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />
          <select
            className="rounded border p-1"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
          >
            <option value="name">Name</option>
            <option value="date">Date Added</option>
            <option value="activity">Last Activity</option>
          </select>
          <select
            className="rounded border p-1"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          >
            <option value="all">All Tags</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <span className="text-sm text-gray-600">
            Total: {filtered.length}
          </span>
          <Button onClick={exportCSV} className="whitespace-nowrap">
            Export CSV
          </Button>
          <Button onClick={openAdd} className="whitespace-nowrap">
            Add Client
          </Button>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm">{selected.length} selected</span>
          <select
            className="rounded border p-1"
            value={bulkTagValue}
            onChange={(e) => setBulkTagValue(e.target.value)}
          >
            <option value="">Tag...</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <Button onClick={applyTag}>Apply Tag</Button>
          <Button onClick={bulkDelete}>Delete</Button>
        </div>
      )}

      {paged.length < filtered.length && (
        <div className="flex justify-center">
          <Button onClick={() => setPage((p) => p + 1)}>Load more</Button>
        </div>
      )}

      {error && (
        <div className="text-red-500">
          Error loading clients: {error.message || String(error)}
        </div>
      )}
      {!data && !error && (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}
      {data && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-10 text-gray-500">
          <img src="/globe.svg" alt="empty" className="h-20 w-20" />
          <span>No clients yet. Add your first one!</span>
        </div>
      )}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {paged.map((c) => (
            <Card
              key={c.id}
              className={`space-y-1 transition-opacity duration-300 fade-in ${fading.includes(c.id) ? "opacity-0" : ""}`}
              onClick={() => {
                setDetail(c);
                setForm((f) => ({ ...f, notes: c.notes ?? "" }));
              }}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.includes(c.id)}
                  onChange={(e) =>
                    setSelected((s) =>
                      e.target.checked
                        ? [...s, c.id]
                        : s.filter((id) => id !== c.id),
                    )
                  }
                />
                <Avatar
                  label={(c.name || c.email || "?").slice(0, 2).toUpperCase()}
                />
                <div className="flex-1 font-semibold">
                  {c.name || "Unnamed"}
                </div>
                {c.tag && (
                  <Badge className={tagColors[c.tag] || ""}>{c.tag}</Badge>
                )}
              </div>
              <div className="text-sm text-gray-600">{c.company || "-"}</div>
              <div className="text-sm text-gray-600">{c.email || "-"}</div>
              <div className="text-sm text-gray-600">{c.phone || "-"}</div>
              <div className="mt-2 flex justify-end gap-2 text-sm">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(c);
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteClient(c.id);
                  }}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <dialog
          open
          className="fixed inset-0 flex items-center justify-center bg-black/50"
        >
          <form
            onSubmit={saveClient}
            className="w-80 space-y-2 rounded bg-white p-4 shadow"
          >
            <h2 className="font-semibold">
              {editId ? "Edit Client" : "New Client"}
            </h2>
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              placeholder="Company"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
            <select
              className="w-full rounded border p-1"
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
            >
              <option value="">No Tag</option>
              <option value="VIP">VIP</option>
              <option value="New Client">New Client</option>
            </select>
            <Textarea
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </dialog>
      )}

      {detail && (
        <dialog
          open
          className="fixed inset-0 flex items-center justify-center bg-black/50"
          onClick={() => setDetail(null)}
        >
          <div
            className="w-96 space-y-2 rounded bg-white p-4 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold">{detail.name}</h2>
            <p className="text-sm text-gray-600">{detail.email}</p>
            <p className="text-sm text-gray-600">{detail.phone}</p>
            <p className="text-sm text-gray-600">{detail.company}</p>
            <p className="text-sm text-gray-600">
              Last activity: {new Date(detail.lastActivity).toLocaleString()}
            </p>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-2"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" onClick={() => setDetail(null)}>
                Close
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  await fetch(`/api/client/${detail.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ notes: form.notes }),
                  });
                  mutate();
                  setDetail(null);
                }}
              >
                Save Notes
              </Button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
