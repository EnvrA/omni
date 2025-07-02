"use client";
import useSWR from "swr";
import { useState } from "react";
import Link from "next/link";
import { Input, Button, Card } from "@/components/ui";
import { toast } from "sonner";

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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // New invoices are created on a dedicated page

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

  async function deleteInvoice(id: string) {
    if (!confirm("Delete this invoice?") || !confirm("Are you sure?")) return;
    const res = await fetch(`/api/invoice/${id}`);
    const j = await res.json();
    await fetch(`/api/invoice/${id}`, { method: "DELETE" });
    toast.success("Invoice deleted", {
      action: {
        label: "Undo",
        onClick: async () => {
          await fetch("/api/invoices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contactId: j.invoice.contactId,
              invoiceNumber: j.invoice.invoiceNumber,
              amount: j.invoice.amount,
              dueDate: j.invoice.dueDate,
              pdfBase64: j.invoice.pdfUrl?.split(",")[1],
            }),
          });
          mutate();
        },
      },
    });
    mutate();
  }

  async function archiveInvoice(id: string) {
    if (!confirm("Archive this invoice?") || !confirm("Are you sure?")) return;
    await action(id, "archive");
    toast.success("Invoice archived", {
      action: {
        label: "Undo",
        onClick: async () => {
          await action(id, "unarchive");
        },
      },
    });
  }

  function openPdf(url: string) {
    // The stored PDF is a data URL, so opening it directly is simpler and
    // avoids issues with manual base64 decoding.
    window.open(url, "_blank");
  }

  const filteredInvoices = data?.invoices.filter((inv) => {
    const q = search.toLowerCase();
    const searchMatch =
      !search ||
      inv.status.toLowerCase().includes(q) ||
      (q.includes("mark paid") && inv.status !== "PAID") ||
      ((q.includes("to send") || q.includes("send")) && inv.status === "DRAFT") ||
      (q.includes("archived") && inv.status === "ARCHIVED");
    const filterMatch =
      filter === "all" ||
      (filter === "draft" && inv.status === "DRAFT") ||
      (filter === "sent" && inv.status === "SENT") ||
      (filter === "paid" && inv.status === "PAID") ||
      (filter === "archived" && inv.status === "ARCHIVED") ||
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
            <option value="archived">Archived</option>
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
                <Link href={`/dashboard/invoices/new?id=${inv.id}`}
                  className="inline-block">
                  <Button type="button">Edit</Button>
                </Link>
                {inv.status !== "PAID" && (
                  <Button onClick={() => action(inv.id, "markPaid")}>
                    Mark Paid
                  </Button>
                )}
                {inv.status === "DRAFT" && (
                  <>
                    <Button
                      className="border-green-700 bg-green-600 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                      onClick={() => action(inv.id, "send")}
                    >
                      Send
                    </Button>
                    <Button
                      className="border-red-700 bg-red-600 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      onClick={() => deleteInvoice(inv.id)}
                    >
                      Delete
                    </Button>
                  </>
                )}
                {inv.status === "SENT" && (
                  <Button
                    className="border-orange-700 bg-orange-600 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                    onClick={() => archiveInvoice(inv.id)}
                  >
                    Archive
                  </Button>
                )}
                {inv.pdfUrl && (
                  <Button type="button" onClick={() => openPdf(inv.pdfUrl)}>
                    PDF
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
