"use client";
import useSWR from "swr";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input, Button, Badge } from "@/components/ui";
import InvoiceRowMenu from "./InvoiceRowMenu";
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
  const router = useRouter();
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
    // Decode the base64 data and open using a Blob to improve compatibility
    const base64 = url.includes(',') ? url.split(',')[1] : url;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blobUrl = URL.createObjectURL(
      new Blob([bytes], { type: "application/pdf" }),
    );
    window.open(blobUrl, "_blank");
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8F9FA] text-[14px] font-bold text-[#333] text-left">
                <th className="p-2">Client</th>
                <th className="p-2">Invoice #</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Due Date</th>
                <th className="p-2">Status</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices?.map((inv) => {
                const status = inv.status.toUpperCase();
                let bg = "#6C757D";
                let color = "#fff";
                if (status === "PAID") {
                  bg = "#28A745";
                } else if (status === "ARCHIVED") {
                  bg = "#E0E0E0";
                  color = "#333";
                }
                return (
                  <tr key={inv.id} className="border-b border-[#EEE]">
                    <td className="p-4">{inv.contact.name || "Unnamed"}</td>
                    <td className="p-4">{inv.invoiceNumber ? `#${inv.invoiceNumber}` : "-"}</td>
                    <td className="p-4">${inv.amount}</td>
                    <td className="p-4">{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      <Badge className="text-[10px]" style={{ background: bg, color }}>
                        {status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <InvoiceRowMenu
                        onEdit={() => router.push(`/dashboard/invoices/new?id=${inv.id}`)}
                        onMarkPaid={() => action(inv.id, "markPaid")}
                        onSend={() => action(inv.id, "send")}
                        onDelete={() => deleteInvoice(inv.id)}
                        onPdf={() => inv.pdfUrl && openPdf(inv.pdfUrl)}
                        showMarkPaid={inv.status !== "PAID"}
                        showSend={inv.status === "DRAFT"}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
