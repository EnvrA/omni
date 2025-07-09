"use client";

import useSWR from "swr";
import { useState } from "react";
import { Input, Button, Card, Badge, Textarea } from "@/components/ui";
import { toast } from "sonner";
import { useTags, TagManager } from "@/components";
import {
  Edit2,
  Trash2,
  Mail,
  Phone,
  Search,
  Tag,
} from "lucide-react";

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
  avatar?: string | null;
  createdAt: string;
  lastActivity: string;
}

interface Deal {
  id: string;
  stage: string;
  contactId: string;
  title?: string | null;
  value?: number | null;
}

interface Message {
  id: string;
  body: string;
  sentAt: string;
}

export default function ClientsPage() {
  const { data, error, mutate } = useSWR<{ clients: Client[] }>(
    "/api/clients",
    fetcher,
  );
  const { tags } = useTags("clients");
  const [showModal, setShowModal] = useState(false);
  const [detail, setDetail] = useState<Client | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
    tag: "",
    avatar: "",
  });
  const [editId, setEditId] = useState<string>();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "date" | "activity">("name");
  const [tagFilter, setTagFilter] = useState("all");
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);
  const [showTags, setShowTags] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const { data: deals } = useSWR<{ deals: Deal[] }>("/api/deals", fetcher);
  const { data: messages } = useSWR<{ messages: Message[] }>(
    detail ? `/api/messages?contactId=${detail.id}` : null,
    fetcher,
  );

  const openAdd = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      company: "",
      notes: "",
      tag: "",
      avatar: "",
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
      avatar: c.avatar ?? "",
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
      mutate();
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

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 space-y-2 bg-white pb-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-7"
            />
          </div>
          <div className="relative">
            <Tag className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <select
              className="rounded border p-2 pl-7"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
            >
              <option value="all">All Tags</option>
              {tags.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {search && (
            <button
              onClick={() => setSearch("")}
              className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs"
            >
              <span>{search}</span>
              <span aria-hidden="true">×</span>
            </button>
          )}
          {tagFilter !== "all" && (
            <button
              onClick={() => setTagFilter("all")}
              className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs"
            >
              <span>{tagFilter}</span>
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 py-2">
        <span className="text-sm text-gray-600">Total: {filtered.length}</span>
        <div className="flex gap-2">
          <Button onClick={exportCSV} className="whitespace-nowrap">
            Export CSV
          </Button>
          <button
            onClick={openAdd}
            className="rounded border border-green-700 bg-green-600 px-3 py-1 text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
          >
            Add Client
          </button>
        </div>
      </div>

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
        <div className="flex flex-col items-center gap-4 py-20 text-gray-500">
          <img src="/globe.svg" alt="empty" className="h-24 w-24 opacity-75" />
          <span>No clients yet.</span>
          <button
            onClick={openAdd}
            className="px-3 py-1 rounded border shadow-sm border-green-700 bg-green-600 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
          >
            Add your first client
          </button>
        </div>
      )}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {paged.map((c) => (
            <Card
              key={c.id}
              className="relative space-y-2 rounded-lg border border-[#EEE] bg-white p-4 shadow-sm"
              onClick={() => {
                setDetail(c);
                setForm((f) => ({ ...f, notes: c.notes ?? "" }));
              }}
            >
              <div className="flex gap-3">
                {c.avatar ? (
                  <img
                    src={c.avatar}
                    alt={c.name || "avatar"}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1F8A70] text-base font-medium text-white">
                    {(c.name || c.email || "?").slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="flex flex-1 flex-col">
                  <div className="text-lg font-bold">{c.name || "Unnamed"}</div>
                  <div className="text-sm text-[#555]">{c.email || "-"}</div>
                  <div className="text-sm text-[#555]">{c.phone || "-"}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {c.tag && (
                      <Badge
                        className="px-2 py-1 text-[10px]"
                        style={{
                          background: tags.find((t) => t.name === c.tag)?.color ||
                            "#DC3545",
                          color: "#fff",
                        }}
                      >
                        {c.tag}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 flex gap-2">
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Email client"
                    >
                      <Mail className="h-6 w-6 text-[#888] hover:text-[#555]" />
                    </a>
                  )}
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Call client"
                    >
                      <Phone className="h-6 w-6 text-[#888] hover:text-[#555]" />
                    </a>
                  )}
                  <button
                    title="Edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(c);
                    }}
                  >
                    <Edit2 className="h-6 w-6 text-[#888] hover:text-[#555]" />
                  </button>
                  <button
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(c.id);
                    }}
                  >
                    <Trash2 className="h-6 w-6 text-[#888] hover:text-[#555]" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600">{c.company || "-"}</div>
            </Card>
          ))}
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
            onSubmit={saveClient}
            className="w-80 space-y-2 rounded bg-white p-4 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold">
              {editId ? "Edit Client" : "New Client"}
            </h2>
            {form.avatar && (
              <img
                src={form.avatar}
                alt="avatar"
                className="h-16 w-16 rounded-full object-cover"
              />
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) =>
                  setForm((f) => ({
                    ...f,
                    avatar: ev.target?.result as string,
                  }));
                reader.readAsDataURL(file);
              }}
            />
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
              {tags.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
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
              <button
                type="submit"
                className="px-3 py-1 rounded border shadow-sm border-green-700 bg-green-600 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
              >
                Save
              </button>
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
            className="w-full max-w-lg space-y-2 rounded-xl bg-white p-4 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            {detail.avatar && (
              <img
                src={detail.avatar}
                alt="avatar"
                className="h-20 w-20 rounded-full object-cover"
              />
            )}
            <h2 className="font-semibold">{detail.name}</h2>
            <p className="text-sm text-gray-600">{detail.email}</p>
            <p className="text-sm text-gray-600">{detail.phone}</p>
            <p className="text-sm text-gray-600">{detail.company}</p>

            {(() => {
              const list =
                deals?.deals?.filter((d) => d.contactId === detail.id) ?? [];
              const total = list.reduce((sum, d) => sum + (d.value ?? 0), 0);
              return (
                <div className="space-y-2">
                  <h3 className="mt-2 font-semibold">Deals</h3>
                  {list.length === 0 && (
                    <p className="text-sm text-gray-500">No deals</p>
                  )}
                  {list.length > 0 && (
                    <ul className="space-y-1 text-sm">
                      {list.map((d) => (
                        <li
                          key={d.id}
                          className="flex justify-between border-b py-1"
                        >
                          <span>{d.title || `Deal ${d.id.slice(0, 4)}`}</span>
                          <span>{d.value != null ? `$${d.value}` : "N/A"}</span>
                        </li>
                      ))}
                      <li className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>${total}</span>
                      </li>
                    </ul>
                  )}
                </div>
              );
            })()}

            {messages && (
              <div className="space-y-1">
                <h3 className="mt-4 font-semibold">Recent Messages</h3>
                <ul className="max-h-40 space-y-1 overflow-auto text-sm">
                  {messages.messages.map((m) => (
                    <li key={m.id} className="border-b py-1">
                      <span className="mr-2 text-gray-500">
                        {new Date(m.sentAt).toLocaleDateString()}
                      </span>
                      {m.body}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-2"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" onClick={() => setDetail(null)}>
                Close
              </Button>
              <button
                type="button"
                className="px-3 py-1 rounded border shadow-sm border-green-700 bg-green-600 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
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
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="space-y-2 rounded bg-white p-4 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm">Type DELETE to confirm</p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={confirmText !== "DELETE"}
                onClick={() => {
                  deleteClient(confirmDelete);
                  setConfirmDelete(null);
                  setConfirmText("");
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <TagManager
        type="clients"
        open={showTags}
        onClose={() => setShowTags(false)}
      />
    </div>
  );
}
