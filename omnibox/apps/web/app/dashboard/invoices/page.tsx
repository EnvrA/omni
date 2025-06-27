"use client";
import useSWR from "swr";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Input, Button, Card } from "@/components/ui";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";

interface Invoice {
  id: string;
  contactId: string;
  invoiceNumber?: string | null;
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
  const { data, mutate } = useSWR<{ invoices: Invoice[] }>(
    "/api/invoices",
    fetcher,
  );
  const { data: clients } = useSWR<{ clients: { id: string; name: string }[] }>(
    "/api/clients",
    fetcher,
  );
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    contactId: "",
    invoiceNumber: "",
    amount: "",
    dueDate: "",
    pdfBase64: "",
  });
  interface LineItem {
    id: string;
    service: string;
    description: string;
    rate: string;
    quantity: string;
  }
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [autoAmount, setAutoAmount] = useState(true);

  // New invoices are created on a dedicated page

  function openEdit(inv: Invoice) {
    setForm({
      contactId: inv.contactId,
      invoiceNumber: inv.invoiceNumber || "",
      amount: inv.amount.toString(),
      dueDate: inv.dueDate.split("T")[0],
      pdfBase64: inv.pdfUrl || "",
    });
    setLineItems([]);
    setAutoAmount(false);
    setEditId(inv.id);
    setShowModal(true);
  }

  useEffect(() => {
    if (!autoAmount) return;
    const total = lineItems.reduce(
      (sum, li) =>
        sum + (parseFloat(li.rate) || 0) * (parseFloat(li.quantity) || 0),
      0,
    );
    setForm((f) => ({ ...f, amount: total ? total.toFixed(2) : "" }));
  }, [lineItems, autoAmount]);

  function addLine() {
    setLineItems((i) => [
      ...i,
      { id: uuid(), service: "", description: "", rate: "", quantity: "" },
    ]);
  }

  function updateLine(id: string, field: keyof LineItem, value: string) {
    setLineItems((items) =>
      items.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    );
  }

  function removeLine(id: string) {
    setLineItems((items) => items.filter((it) => it.id !== id));
  }

  async function saveInvoice(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      contactId: form.contactId,
      invoiceNumber: form.invoiceNumber || undefined,
      amount: parseFloat(form.amount),
      dueDate: form.dueDate,
      pdfBase64: form.pdfBase64 || undefined,
    };
    const url = editId ? `/api/invoice/${editId}` : "/api/invoices";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      toast.error(
        editId ? "Failed to update invoice" : "Failed to create invoice",
      );
    } else {
      toast.success(editId ? "Invoice updated" : "Invoice created");
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

  const filteredInvoices = data?.invoices.filter((inv) => {
    const q = search.toLowerCase();
    const searchMatch =
      !search ||
      inv.status.toLowerCase().includes(q) ||
      (q.includes("mark paid") && inv.status !== "PAID") ||
      ((q.includes("to send") || q.includes("send")) && inv.status === "DRAFT");
    const filterMatch =
      filter === "all" ||
      (filter === "draft" && inv.status === "DRAFT") ||
      (filter === "sent" && inv.status === "SENT") ||
      (filter === "paid" && inv.status === "PAID") ||
      (filter === "markPaid" && inv.status !== "PAID") ||
      (filter === "toSend" && inv.status === "DRAFT");
    return searchMatch && filterMatch;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex-1 flex justify-center gap-2">
          <Input
            aria-label="Search invoices"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs"
          />
          <select
            aria-label="Filter invoices"
            className="rounded border p-1"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="markPaid">Mark Paid</option>
            <option value="toSend">To Send</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/invoices/template"
            className="rounded border bg-white px-3 py-1 shadow-sm"
            role="button"
          >
            Edit Template
          </Link>
          <Link
            href="/dashboard/invoices/email-template"
            className="rounded border bg-white px-3 py-1 shadow-sm"
            role="button"
          >
            Email Template
          </Link>
          <Link
            href="/dashboard/invoices/new"
            className="rounded border bg-white px-3 py-1 shadow-sm"
            role="button"
          >
            New Invoice
          </Link>
        </div>
      </div>
      {data && "error" in data && (
        <p className="text-center text-red-500">{(data as any).error}</p>
      )}
      {data &&
        Array.isArray(data.invoices) &&
        filteredInvoices?.length === 0 && (
          <p className="text-center text-gray-500">No invoices.</p>
        )}
      {data && Array.isArray(data.invoices) && data.invoices.length > 0 && (
        <div className="space-y-2">
          {filteredInvoices?.map((inv) => (
            <Card key={inv.id} className="flex justify-between p-2">
              <div>
                <div className="font-semibold">
                  {inv.contact.name || "Unnamed"}
                </div>
                {inv.invoiceNumber && (
                  <div className="text-sm text-gray-500">
                    #{inv.invoiceNumber}
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  ${inv.amount} due {new Date(inv.dueDate).toLocaleDateString()}
                </div>
                <div className="text-sm">Status: {inv.status}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => openEdit(inv)}>Edit</Button>
                {inv.status !== "PAID" && (
                  <Button onClick={() => action(inv.id, "markPaid")}>
                    Mark Paid
                  </Button>
                )}
                {inv.status === "DRAFT" && (
                  <Button onClick={() => action(inv.id, "send")}>Send</Button>
                )}
                {inv.pdfUrl && (
                  <a
                    href={inv.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
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
          onClick={() => {
            setShowModal(false);
            setEditId(null);
          }}
        >
          <form
            onSubmit={saveInvoice}
            className="w-80 space-y-2 rounded bg-white p-4 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold">
              {editId ? "Edit Invoice" : "New Invoice"}
            </h2>
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
              placeholder="Invoice Number"
              value={form.invoiceNumber}
              onChange={(e) =>
                setForm({ ...form, invoiceNumber: e.target.value })
              }
            />
            {lineItems.map((li) => (
              <div key={li.id} className="flex flex-wrap items-end gap-2">
                <Input
                  placeholder="Service"
                  value={li.service}
                  onChange={(e) => updateLine(li.id, "service", e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Description"
                  value={li.description}
                  onChange={(e) =>
                    updateLine(li.id, "description", e.target.value)
                  }
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Rate"
                  value={li.rate}
                  onChange={(e) => updateLine(li.id, "rate", e.target.value)}
                  className="w-20"
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  value={li.quantity}
                  onChange={(e) =>
                    updateLine(li.id, "quantity", e.target.value)
                  }
                  className="w-16"
                />
                <Input
                  disabled
                  aria-label="Total"
                  value={(
                    (parseFloat(li.rate) || 0) * (parseFloat(li.quantity) || 0)
                  ).toFixed(2)}
                  className="w-20 bg-gray-100"
                />
                <Button
                  type="button"
                  onClick={() => removeLine(li.id)}
                  className="self-start"
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button type="button" onClick={addLine} className="mt-1">
              + Add line
            </Button>
            <Input
              type="number"
              placeholder="Total Amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              readOnly={autoAmount}
            />
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
            <Input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) =>
                  setForm((f) => ({
                    ...f,
                    pdfBase64: ev.target?.result as string,
                  }));
                reader.readAsDataURL(file);
              }}
            />
            {form.pdfBase64 && (
              <a
                href={form.pdfBase64}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 underline"
              >
                View PDF
              </a>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditId(null);
                }}
              >
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
