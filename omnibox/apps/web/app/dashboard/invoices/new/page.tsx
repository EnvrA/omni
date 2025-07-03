"use client";
import useSWR from "swr";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input, Button, Textarea } from "@/components/ui";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";

interface LineItem {
  id: string;
  item: string;
  description: string;
  quantity: string;
  rate: string;
  tax: string;
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

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("id");
  const { data: template } = useSWR<{ template: any }>(
    "/api/invoice/template",
    fetcher,
  );
  const { data: clients } = useSWR<{
    clients: { id: string; name: string; company?: string }[];
  }>("/api/clients", fetcher);
  const { data: existing } = useSWR<{ invoice: any }>(
    invoiceId ? `/api/invoice/${invoiceId}` : null,
    fetcher,
  );

  const [form, setForm] = useState({
    clientName: "",
    clientId: "",
    buyerAddress: "",
    logoUrl: "",
    sellerAddress: "",
    invoiceNumber: "",
    invoiceDate: "",
    dueDate: "",
    notes: "",
    terms: "",
    showTax: true,
    items: [] as LineItem[],
  });

  useEffect(() => {
    if (template?.template) {
      const t = template.template;
      setForm((f) => ({
        ...f,
        logoUrl: t.logoUrl || "",
        sellerAddress: [
          t.companyName,
          t.companyAddress,
          [t.zipCode, t.city].filter(Boolean).join(" "),
          t.contactEmail,
          t.phone,
        ]
          .filter(Boolean)
          .join("\n"),
        buyerAddress:
          typeof t.layout?.buyerAddress === "string"
            ? t.layout.buyerAddress
            : "",
        invoiceNumber:
          typeof t.layout?.invoiceNumber === "string"
            ? t.layout.invoiceNumber
            : `INV-${Date.now()}`,
        invoiceDate:
          typeof t.layout?.invoiceDate === "string"
            ? t.layout.invoiceDate
            : new Date().toISOString().split("T")[0],
        dueDate: typeof t.layout?.dueDate === "string" ? t.layout.dueDate : "",
        notes: t.notes || "",
        terms: t.terms || "",
        items: Array.isArray(t.layout?.items)
          ? t.layout.items.map((it: any) => ({
              id: it.id || uuid(),
              item: it.item || "",
              description: it.description || "",
              quantity: it.quantity || "1",
              rate: it.rate || "",
              tax: it.tax || "",
            }))
          : [
              {
                id: uuid(),
                item: "",
                description: "",
                quantity: "1",
                rate: "",
                tax: "",
              },
            ],
        showTax: t.layout?.columns?.tax !== false,
      }));
    } else if (form.items.length === 0) {
      setForm((f) => ({
        ...f,
        invoiceNumber: `INV-${Date.now()}`,
        invoiceDate: new Date().toISOString().split("T")[0],
        items: [
          {
            id: uuid(),
            item: "",
            description: "",
            quantity: "1",
            rate: "",
            tax: "",
          },
        ],
      }));
    }
  }, [template]);

  useEffect(() => {
    if (existing?.invoice) {
      const inv = existing.invoice;
      const client = clients?.clients.find((c) => c.id === inv.contactId);
      const name = client?.name || inv.contact?.name;
      const buyerInfo = client
        ? [client.name, client.company, client.email, client.phone]
            .filter(Boolean)
            .join("\n")
        : undefined;
      setForm((f) => ({
        ...f,
        clientId: inv.contactId,
        clientName: name || f.clientName,
        buyerAddress: buyerInfo ?? f.buyerAddress,
        invoiceNumber: inv.invoiceNumber || f.invoiceNumber,
        dueDate: inv.dueDate.split("T")[0],
      }));
    }
  }, [existing, clients]);

  const idMap = clients?.clients.reduce((acc, c) => {
    acc[c.name] = c.id;
    return acc;
  }, {} as Record<string, string>);

  const infoMap = clients?.clients.reduce((acc, c) => {
    const parts = [c.name, c.company, c.email, c.phone].filter(Boolean);
    acc[c.name] = parts.join("\n");
    return acc;
  }, {} as Record<string, string>);

  function updateItem(id: string, field: keyof LineItem, value: string) {
    setForm((f) => ({
      ...f,
      items: f.items.map((it) =>
        it.id === id ? { ...it, [field]: value } : it,
      ),
    }));
  }
  function addItem() {
    setForm((f) => ({
      ...f,
      items: [
        ...f.items,
        {
          id: uuid(),
          item: "",
          description: "",
          quantity: "1",
          rate: "",
          tax: "",
        },
      ],
    }));
  }
  function removeItem(id: string) {
    setForm((f) => ({ ...f, items: f.items.filter((it) => it.id !== id) }));
  }

  const subtotal = form.items.reduce(
    (sum, it) =>
      sum + (parseFloat(it.rate) || 0) * (parseFloat(it.quantity) || 0),
    0,
  );
  const taxTotal = form.items.reduce(
    (sum, it) =>
      sum +
      (parseFloat(it.rate) || 0) *
        (parseFloat(it.quantity) || 0) *
        ((parseFloat(it.tax) || 0) / 100),
    0,
  );
  const total = subtotal + taxTotal;
  const smallColWidth = 40 / (form.showTax ? 4 : 3);

  async function saveInvoice(e: React.FormEvent) {
    e.preventDefault();
    const url = invoiceId ? `/api/invoice/${invoiceId}` : "/api/invoices";
    const method = invoiceId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId: form.clientId,
        invoiceNumber: form.invoiceNumber || undefined,
        amount: total,
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate,
        logoUrl: form.logoUrl,
        companyAddress: form.sellerAddress,
        clientAddress: form.buyerAddress,
        items: form.items,
        columns: { tax: form.showTax },
        notes: form.notes,
        terms: form.terms,
      }),
    });
    if (!res.ok) {
      toast.error(invoiceId ? "Failed to update invoice" : "Failed to create invoice");
      return;
    }
    toast.success(invoiceId ? "Invoice updated" : "Invoice created");
    router.push("/dashboard/invoices");
  }

  function Preview() {
    return (
      <div className="mx-auto w-full max-w-lg space-y-2 rounded border bg-white p-4">
        <div className="flex justify-between">
          <div>
            {form.logoUrl && (
              <img
                src={form.logoUrl}
                alt="Logo"
                className="h-16 object-contain"
              />
            )}
            <div className="whitespace-pre-wrap text-sm">
              {form.sellerAddress}
            </div>
          </div>
        </div>
        <div className="pt-2 text-sm">
          <div className="font-semibold">Bill To</div>
          <div className="whitespace-pre-wrap">{form.buyerAddress}</div>
        </div>
        <div className="flex flex-wrap gap-4 pt-2 text-sm">
          <div>Invoice #: {form.invoiceNumber}</div>
          <div>Invoice Date: {form.invoiceDate}</div>
          <div>Due Date: {form.dueDate}</div>
        </div>
        <table className="mt-2 w-full text-sm table-fixed">
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '40%' }} />
            <col style={{ width: `${smallColWidth}%` }} />
            <col style={{ width: `${smallColWidth}%` }} />
            {form.showTax && <col style={{ width: `${smallColWidth}%` }} />}
            <col style={{ width: `${smallColWidth}%` }} />
          </colgroup>
          <thead>
            <tr className="border-b text-left">
              <th className="py-1">Item</th>
              <th className="py-1">Description</th>
              <th className="py-1">Qty</th>
              <th className="py-1">Rate</th>
              {form.showTax && <th className="py-1">Tax %</th>}
              <th className="py-1 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {form.items.map((it) => {
              const sub =
                (parseFloat(it.rate) || 0) * (parseFloat(it.quantity) || 0);
              return (
                <tr key={it.id} className="border-b align-top">
                  <td className="py-1">{it.item}</td>
                  <td className="py-1 whitespace-pre-wrap break-words">
                    {it.description}
                  </td>
                  <td className="py-1 text-right">{it.quantity}</td>
                  <td className="py-1 text-right">{it.rate}</td>
                  {form.showTax && (
                    <td className="py-1 text-right">{it.tax}</td>
                  )}
                  <td className="py-1 text-right">{sub.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex justify-end pt-2 text-sm">
          <div className="w-40 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{subtotal.toFixed(2)}</span>
            </div>
            {form.showTax && (
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{taxTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        {form.notes && (
          <div className="whitespace-pre-wrap pt-2 text-sm">{form.notes}</div>
        )}
        {form.terms && (
          <div className="whitespace-pre-wrap pt-2 text-xs text-gray-500">
            {form.terms}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 md:flex md:gap-4">
      <form onSubmit={saveInvoice} className="flex-1 space-y-2">
        <div>
          <label className="text-sm font-medium" htmlFor="client-field">
            Client
          </label>
          <Input
            id="client-field"
            list="client-list"
            placeholder="Search client"
            value={form.clientName}
            onChange={(e) => {
              const name = e.target.value;
              setForm((f) => ({
                ...f,
                clientName: name,
                clientId: idMap?.[name] || "",
                buyerAddress: infoMap?.[name] || f.buyerAddress,
              }));
            }}
          />
          <datalist id="client-list">
            {clients?.clients.map((c) => <option key={c.id} value={c.name} />)}
          </datalist>
        </div>
        {form.logoUrl && (
          <img
            src={form.logoUrl}
            alt="Company logo"
            className="h-16 w-16 object-contain"
          />
        )}
        <Textarea
          placeholder="Seller Address"
          value={form.sellerAddress}
          onChange={(e) =>
            setForm((f) => ({ ...f, sellerAddress: e.target.value }))
          }
        />
        <Textarea
          placeholder="Buyer Address"
          value={form.buyerAddress}
          onChange={(e) =>
            setForm((f) => ({ ...f, buyerAddress: e.target.value }))
          }
        />
        <Input
          placeholder="Invoice Number"
          value={form.invoiceNumber}
          onChange={(e) =>
            setForm((f) => ({ ...f, invoiceNumber: e.target.value }))
          }
        />
        <Input
          type="date"
          placeholder="Invoice Date"
          value={form.invoiceDate}
          onChange={(e) =>
            setForm((f) => ({ ...f, invoiceDate: e.target.value }))
          }
        />
        <Input
          type="date"
          placeholder="Due Date"
          value={form.dueDate}
          onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
        />
        <div className="space-y-2 pt-2">
          <div className="font-semibold">Line Items</div>
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col style={{ width: '20%' }} />
              <col style={{ width: '40%' }} />
              <col style={{ width: `${smallColWidth}%` }} />
              <col style={{ width: `${smallColWidth}%` }} />
              {form.showTax && <col style={{ width: `${smallColWidth}%` }} />}
              <col style={{ width: `${smallColWidth}%` }} />
            </colgroup>
            <thead>
              <tr>
                <th className="text-left">Item</th>
                <th className="text-left">Description</th>
                <th>Qty</th>
                <th>Rate</th>
                {form.showTax && <th>Tax %</th>}
                <th className="text-right">Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((it) => {
                const sub =
                  (parseFloat(it.rate) || 0) * (parseFloat(it.quantity) || 0);
                return (
                  <tr key={it.id} className="align-top">
                    <td>
                      <Input
                        value={it.item}
                        onChange={(e) =>
                          updateItem(it.id, "item", e.target.value)
                        }
                        className="w-full"
                      />
                    </td>
                    <td>
                      <Textarea
                        rows={2}
                        value={it.description}
                        onChange={(e) =>
                          updateItem(it.id, "description", e.target.value)
                        }
                        className="w-full resize-none"
                      />
                    </td>
                    <td>
                      <Input
                        value={it.quantity}
                        onChange={(e) =>
                          updateItem(it.id, "quantity", e.target.value)
                        }
                        className="w-full"
                      />
                    </td>
                    <td>
                      <Input
                        value={it.rate}
                        onChange={(e) =>
                          updateItem(it.id, "rate", e.target.value)
                        }
                        className="w-full"
                      />
                    </td>
                    {form.showTax && (
                      <td>
                        <Input
                          value={it.tax}
                          onChange={(e) =>
                            updateItem(it.id, "tax", e.target.value)
                          }
                          className="w-full"
                        />
                      </td>
                    )}
                    <td className="p-1 text-right">{sub.toFixed(2)}</td>
                    <td>
                      <Button type="button" onClick={() => removeItem(it.id)}>
                        Remove
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Button type="button" onClick={addItem} className="mt-1">
            + Add Line
          </Button>
          <label className="flex items-center gap-2 pt-2 text-sm">
            <input
              type="checkbox"
              checked={form.showTax}
              onChange={(e) =>
                setForm((f) => ({ ...f, showTax: e.target.checked }))
              }
            />
            Show Tax Column
          </label>
        </div>
        <Textarea
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
        <Textarea
          placeholder="Terms"
          value={form.terms}
          onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit">Save Invoice</Button>
        </div>
      </form>
      <div className="flex-1 pt-2">
        <Preview />
      </div>
    </div>
  );
}
