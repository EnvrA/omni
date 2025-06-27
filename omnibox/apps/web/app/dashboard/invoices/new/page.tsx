"use client";
import useSWR from "swr";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Button, Textarea } from "@/components/ui";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
};

interface LineItem {
  id: string;
  service: string;
  description: string;
  quantity: string;
  rate: string;
}
interface Section {
  id: string;
  heading: string;
  tax: string;
  items: LineItem[];
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { data: clients } = useSWR<{ clients: { id: string; name: string }[] }>(
    "/api/clients",
    fetcher,
  );

  const [form, setForm] = useState({
    title: "Invoice",
    invoiceNumber: "",
    issueDate: "",
    dueDate: "",
    clientName: "",
    clientId: "",
    notes: "",
  });
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    setForm((f) => ({
      ...f,
      invoiceNumber: `INV-${Date.now()}`,
      issueDate: new Date().toISOString().split("T")[0],
    }));
    setSections([
      {
        id: uuid(),
        heading: "Items",
        tax: "0",
        items: [
          { id: uuid(), service: "", description: "", quantity: "1", rate: "" },
        ],
      },
    ]);
  }, []);

  const idMap = clients?.clients.reduce(
    (acc, c) => {
      acc[c.name] = c.id;
      return acc;
    },
    {} as Record<string, string>,
  );

  const subtotal = sections.reduce((sum, sec) => {
    const sectionTotal = sec.items.reduce(
      (s, it) =>
        s + (parseFloat(it.rate) || 0) * (parseFloat(it.quantity) || 0),
      0,
    );
    return sum + sectionTotal;
  }, 0);
  const taxTotal = sections.reduce((sum, sec) => {
    const sectionTotal = sec.items.reduce(
      (s, it) =>
        s + (parseFloat(it.rate) || 0) * (parseFloat(it.quantity) || 0),
      0,
    );
    return sum + (sectionTotal * (parseFloat(sec.tax) || 0)) / 100;
  }, 0);
  const total = subtotal + taxTotal;

  function updateSection(
    id: string,
    field: keyof Section,
    value: string | LineItem[],
  ) {
    setSections((secs) =>
      secs.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  }

  function addSection() {
    setSections((secs) => [
      ...secs,
      {
        id: uuid(),
        heading: "",
        tax: "0",
        items: [
          { id: uuid(), service: "", description: "", quantity: "1", rate: "" },
        ],
      },
    ]);
  }

  function removeSection(id: string) {
    setSections((secs) => secs.filter((s) => s.id !== id));
  }

  function addLine(sectionId: string) {
    setSections((secs) =>
      secs.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: [
                ...s.items,
                {
                  id: uuid(),
                  service: "",
                  description: "",
                  quantity: "1",
                  rate: "",
                },
              ],
            }
          : s,
      ),
    );
  }

  function updateLine(
    sectionId: string,
    lineId: string,
    field: keyof LineItem,
    value: string,
  ) {
    setSections((secs) =>
      secs.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items.map((it) =>
                it.id === lineId ? { ...it, [field]: value } : it,
              ),
            }
          : s,
      ),
    );
  }

  function removeLine(sectionId: string, lineId: string) {
    setSections((secs) =>
      secs.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.filter((it) => it.id !== lineId) }
          : s,
      ),
    );
  }

  async function saveInvoice(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId: form.clientId,
        invoiceNumber: form.invoiceNumber || undefined,
        amount: parseFloat(total.toFixed(2)),
        dueDate: form.dueDate,
      }),
    });
    if (!res.ok) {
      toast.error("Failed to create invoice");
      return;
    }
    toast.success("Invoice created");
    router.push("/dashboard/invoices");
  }

  return (
    <form onSubmit={saveInvoice} className="space-y-6 p-4">
      <div className="space-y-2 rounded border p-3">
        <h2 className="font-semibold">Header</h2>
        <Input
          aria-label="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <Input
          aria-label="Invoice Number"
          value={form.invoiceNumber}
          onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
        />
        <div className="flex flex-wrap gap-2">
          <Input
            type="date"
            aria-label="Issue Date"
            value={form.issueDate}
            onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
          />
          <Input
            type="date"
            aria-label="Due Date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2 rounded border p-3">
        <h2 className="font-semibold">Client</h2>
        <Input
          list="client-list"
          placeholder="Search client"
          value={form.clientName}
          onChange={(e) => {
            const name = e.target.value;
            setForm((f) => ({
              ...f,
              clientName: name,
              clientId: idMap?.[name] || "",
            }));
          }}
        />
        <datalist id="client-list">
          {clients?.clients.map((c) => <option key={c.id} value={c.name} />)}
        </datalist>
      </div>

      {sections.map((sec) => (
        <div key={sec.id} className="space-y-2 rounded border p-3">
          <div className="flex items-center justify-between gap-2">
            <Input
              aria-label="Section Heading"
              value={sec.heading}
              onChange={(e) => updateSection(sec.id, "heading", e.target.value)}
              className="flex-1"
            />
            <Button type="button" onClick={() => removeSection(sec.id)}>
              Remove Section
            </Button>
          </div>
          {sec.items.map((li) => (
            <div key={li.id} className="flex flex-wrap items-end gap-2">
              <Input
                placeholder="Service"
                value={li.service}
                onChange={(e) =>
                  updateLine(sec.id, li.id, "service", e.target.value)
                }
                className="flex-1"
              />
              <Input
                placeholder="Description"
                value={li.description}
                onChange={(e) =>
                  updateLine(sec.id, li.id, "description", e.target.value)
                }
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Qty"
                value={li.quantity}
                onChange={(e) =>
                  updateLine(sec.id, li.id, "quantity", e.target.value)
                }
                className="w-16"
              />
              <Input
                type="number"
                placeholder="Rate"
                value={li.rate}
                onChange={(e) =>
                  updateLine(sec.id, li.id, "rate", e.target.value)
                }
                className="w-20"
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
                onClick={() => removeLine(sec.id, li.id)}
                className="self-start"
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            onClick={() => addLine(sec.id)}
            className="mt-1"
          >
            + Add Line
          </Button>
          <div className="flex items-center gap-2 pt-2">
            <label className="text-sm" htmlFor={`tax-${sec.id}`}>
              Tax %
            </label>
            <Input
              id={`tax-${sec.id}`}
              type="number"
              value={sec.tax}
              onChange={(e) => updateSection(sec.id, "tax", e.target.value)}
              className="w-20"
            />
          </div>
        </div>
      ))}

      <Button type="button" onClick={addSection} className="mt-2">
        + Add Section
      </Button>

      <div className="space-y-2 rounded border p-3">
        <h2 className="font-semibold">Totals & Notes</h2>
        <div className="flex flex-wrap gap-2">
          <Input
            aria-label="Subtotal"
            value={subtotal.toFixed(2)}
            disabled
            className="w-24 bg-gray-100"
          />
          <Input
            aria-label="Tax"
            value={taxTotal.toFixed(2)}
            disabled
            className="w-24 bg-gray-100"
          />
          <Input
            aria-label="Total"
            value={total.toFixed(2)}
            disabled
            className="w-24 bg-gray-100"
          />
        </div>
        <Textarea
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit">Save Invoice</Button>
      </div>
    </form>
  );
}
