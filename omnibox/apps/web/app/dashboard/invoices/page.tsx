"use client";
import useSWR from "swr";
import { useState } from "react";
import { Input, Button, Card } from "@/components/ui";
import { toast } from "sonner";

interface Invoice {
  id: string;
  contactId: string;
  amount: number;
  dueDate: string;
  status: string;
  pdfUrl?: string;
  contact: { name: string | null; email: string | null };
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

export default function InvoicesPage() {
  const { data, mutate } = useSWR<{ invoices: Invoice[] }>("/api/invoices", fetcher);
  const { data: clients } = useSWR<{ clients: { id: string; name: string }[] }>(
    "/api/clients",
    fetcher,
  );
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ contactId: "", amount: "", dueDate: "" });

  async function saveInvoice(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId: form.contactId,
        amount: parseFloat(form.amount),
        dueDate: form.dueDate,
      }),
    });
    if (!res.ok) {
      toast.error("Failed to create invoice");
    } else {
      toast.success("Invoice created");
      mutate();
      setShowModal(false);
    }
  }

  async function action(id: string, act: string) {
    const res = await fetch(`/api/invoice/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: act }),
    });
    if (!res.ok) {
      toast.error("Action failed");
    } else {
      mutate();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowModal(true)}>New Invoice</Button>
      </div>
      {data && data.invoices.length === 0 && (
        <p className="text-center text-gray-500">No invoices.</p>
      )}
      {data && data.invoices.length > 0 && (
        <div className="space-y-2">
          {data.invoices.map((inv) => (
            <Card key={inv.id} className="flex justify-between p-2">
              <div>
                <div className="font-semibold">{inv.contact.name || "Unnamed"}</div>
                <div className="text-sm text-gray-600">
                  ${inv.amount} due {new Date(inv.dueDate).toLocaleDateString()}
                </div>
                <div className="text-sm">Status: {inv.status}</div>
              </div>
              <div className="flex items-center gap-2">
                {inv.status !== "PAID" && (
                  <Button onClick={() => action(inv.id, "markPaid")}>Mark Paid</Button>
                )}
                {inv.status === "DRAFT" && (
                  <Button onClick={() => action(inv.id, "send")}>Send</Button>
                )}
                {inv.pdfUrl && (
                  <a href={inv.pdfUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                    PDF
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowModal(false)}
        >
          <form
            onSubmit={saveInvoice}
            className="w-80 space-y-2 rounded bg-white p-4 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold">New Invoice</h2>
            <select
              className="w-full rounded border p-1"
              value={form.contactId}
              onChange={(e) => setForm({ ...form, contactId: e.target.value })}
            >
              <option value="">Select client</option>
              {clients?.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Input
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
