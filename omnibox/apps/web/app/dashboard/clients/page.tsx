"use client";

import useSWR from "swr";
import { useState } from "react";
import { Input, Button, Card, Avatar } from "@/components/ui";
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
}

export default function ClientsPage() {
  const { data, error, mutate } = useSWR<{ clients: Client[] }>("/api/clients", fetcher);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [editId, setEditId] = useState<string>();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "email" | "phone">("name");

  const openAdd = () => {
    setForm({ name: "", email: "", phone: "" });
    setEditId(undefined);
    setShowModal(true);
  };

  const openEdit = (c: Client) => {
    setForm({ name: c.name ?? "", email: c.email ?? "", phone: c.phone ?? "" });
    setEditId(c.id);
    setShowModal(true);
  };

  const filtered = (data?.clients ?? [])
    .filter(c => {
      const q = search.toLowerCase();
      return (
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const va = (a[sort] || "").toLowerCase();
      const vb = (b[sort] || "").toLowerCase();
      return va.localeCompare(vb);
    });

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-48"
          />
          <select
            className="rounded border p-1"
            value={sort}
            onChange={e => setSort(e.target.value as "name" | "email" | "phone")}
          >
            <option value="name">Name</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
          </select>
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <span className="text-sm text-gray-600">Total: {filtered.length}</span>
          <Button onClick={openAdd} className="whitespace-nowrap">
            Add Client
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-red-500">Error loading clients: {error.message || String(error)}</div>
      )}
      {!data && !error && (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}
      {data && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-10 text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="h-16 w-16"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="2" className="stroke-gray-300" />
            <path d="M8 12h8" strokeWidth="2" className="stroke-gray-300" />
            <path d="M12 8v8" strokeWidth="2" className="stroke-gray-300" />
          </svg>
          <span>No clients found.</span>
        </div>
      )}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map(c => (
            <Card key={c.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <Avatar label={(c.name || c.email || "?").slice(0, 2).toUpperCase()} />
                <div className="font-semibold">{c.name || "Unnamed"}</div>
              </div>
              <div className="text-sm text-gray-600">{c.email || "-"}</div>
              <div className="text-sm text-gray-600">{c.phone || "-"}</div>
              <div className="mt-2 flex justify-end gap-2 text-sm">
                <button onClick={() => openEdit(c)} className="text-blue-600 hover:underline">
                  Edit
                </button>
                <button onClick={() => deleteClient(c.id)} className="text-red-600 hover:underline">
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <dialog open className="fixed inset-0 flex items-center justify-center bg-black/50">
          <form onSubmit={saveClient} className="w-72 space-y-2 rounded bg-white p-4 shadow">
            <h2 className="font-semibold">{editId ? "Edit Client" : "New Client"}</h2>
            <Input
              placeholder="Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
            <Input
              placeholder="Phone"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
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
    </div>
  );
}
