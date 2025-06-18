"use client";

import useSWR from "swr";
import { useState } from "react";
import { Input, Button, Card, Avatar, Badge, Textarea } from "@/components/ui";
import { toast } from "sonner";
import { useTags } from "@/components/tags-context";
import { TagManager } from "@/components/tag-manager";
import {
  Edit3,
  Trash,
  Mail,
  Phone,
  MessageCircle,
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
  const { tags } = useTags();
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
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
          <Button
            type="button"
            onClick={() => setShowTags(true)}
            className="hover:bg-gray-100"
          >
            Manage Tags
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <span className="text-sm text-gray-600">
            Total: {filtered.length}
          </span>
          <Button onClick={exportCSV} className="whitespace-nowrap">
            Export CSV
          </Button>
          <Button
            onClick={openAdd}
            className="whitespace-nowrap border-green-700 bg-green-600 text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
          >
            Add Client
          </Button>
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
          <Button
            onClick={openAdd}
            className="border-green-700 bg-green-600 text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
          >
            Add your first client
          </Button>
        </div>
      )}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paged.map((c) => (
            <Card
              key={c.id}
              className="space-y-1 rounded-lg shadow-sm transition-transform hover:scale-[1.02] hover:shadow-md"
              onClick={() => {
                setDetail(c);
                setForm((f) => ({ ...f, notes: c.notes ?? "" }));
              }}
            >
              <div className="flex items-start gap-2">
                <Avatar
                  src={c.avatar ?? undefined}
                  label={(c.name || c.email || "?").slice(0, 2).toUpperCase()}
                />
                <div className="flex-1">
                  <div className="font-semibold">{c.name || "Unnamed"}</div>
                  <div className="text-xs text-gray-600">{c.email || "-"}</div>
                  <div className="text-xs text-gray-600">{c.phone || "-"}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {c.tag && (
                      <Badge
                        style={{
                          background: tags.find((t) => t.name === c.tag)?.color,
                          color: "#fff",
                        }}
                      >
                        {c.tag}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 pt-1 text-gray-600">
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Email client"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  )}
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Call client"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                  {c.phone && (
                    <a
                      href={`https://wa.me/${c.phone.replace(/\D/g, "")}`}
                      onClick={(e) => e.stopPropagation()}
                      aria-label="WhatsApp client"
                      className="text-green-600 hover:text-green-800"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  )}
                  <span className="mx-1 h-4 border-l border-gray-300" />
                  <button
                    title="Edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(c);
                    }}
                    className="hover:text-blue-700"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(c.id);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash className="h-4 w-4" />
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
              <Button
                type="submit"
                className="border-green-700 bg-green-600 text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
              >
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
              const list = deals?.deals?.filter(
                (d) => d.contactId === detail.id,
              ) ?? [];
              const total = list.reduce(
                (sum, d) => sum + (d.value ?? 0),
                0,
              );
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
                          <span>
                            {d.value != null ? `$${d.value}` : "N/A"}
                          </span>
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
              <Button
                type="button"
                className="border-green-700 bg-green-600 text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
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
        </div>
      )}

      {confirmDelete && (
        <dialog
          open
          className="fixed inset-0 flex items-center justify-center bg-black/50"
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
        </dialog>
      )}

      <TagManager open={showTags} onClose={() => setShowTags(false)} />
    </div>
  );
}
