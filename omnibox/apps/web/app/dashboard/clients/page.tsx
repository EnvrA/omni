"use client";

import useSWR from "swr";
import { useState } from "react";
import { Input, Button } from "@/components/ui";

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

  async function saveClient(e: React.FormEvent) {
    e.preventDefault();
    if (editId) {
      await fetch(`/api/client/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setShowModal(false);
    mutate();
  }

  async function deleteClient(id: string) {
    await fetch(`/api/client/${id}`, { method: "DELETE" });
    mutate();
  }

  return (
    <div className="space-y-4">
      <Button onClick={openAdd}>Add Client</Button>
      {error && (
        <div className="text-red-500">Error loading clients: {error.message || String(error)}</div>
      )}
      {!data && !error && (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}
      {data && data.clients.length === 0 && (
        <div className="text-gray-500">No clients found.</div>
      )}
      {data && data.clients.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1 text-left">Name</th>
                <th className="px-2 py-1 text-left">Email</th>
                <th className="px-2 py-1 text-left">Phone</th>
                <th className="px-2 py-1" />
              </tr>
            </thead>
            <tbody>
              {data.clients.map(c => (
                <tr key={c.id} className="border-t">
                  <td className="px-2 py-1">{c.name || "-"}</td>
                  <td className="px-2 py-1">{c.email || "-"}</td>
                  <td className="px-2 py-1">{c.phone || "-"}</td>
                  <td className="px-2 py-1 space-x-2 text-right">
                    <button onClick={() => openEdit(c)} className="text-blue-600 hover:underline">
                      Edit
                    </button>
                    <button onClick={() => deleteClient(c.id)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <dialog open className="fixed inset-0 flex items-center justify-center bg-black/50">
          <form onSubmit={saveClient} className="space-y-2 rounded bg-white p-4 shadow w-72">
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
