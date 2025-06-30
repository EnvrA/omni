"use client";
import useSWR from "swr";
import { useState, useEffect } from "react";
import { Input, Button, Textarea } from "@/components/ui";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";

interface LineItem {
  id: string;
  item: string;
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

export default function InvoiceTemplatePage() {
  const { data, mutate } = useSWR<{ template: any }>(
    "/api/invoice/template",
    fetcher,
  );

  const [form, setForm] = useState({
    logoUrl: "",
    sellerAddress: "",
    buyerAddress: "",
    invoiceNumber: "",
    invoiceDate: "",
    dueDate: "",
    notes: "",
    terms: "",
    footer: "",
    items: [] as LineItem[],
    showTax: true,
  });

  useEffect(() => {
    if (data?.template) {
      const t = data.template;
      setForm({
        logoUrl: t.logoUrl || "",
        sellerAddress: t.companyAddress || "",
        buyerAddress:
          typeof t.layout?.buyerAddress === "string" ? t.layout.buyerAddress : "",
        invoiceNumber:
          typeof t.layout?.invoiceNumber === "string"
            ? t.layout.invoiceNumber
            : "",
        invoiceDate:
          typeof t.layout?.invoiceDate === "string" ? t.layout.invoiceDate : "",
        dueDate:
          typeof t.layout?.dueDate === "string" ? t.layout.dueDate : "",
        notes: t.notes || "",
        terms: t.terms || "",
        footer: t.footer || "",
        items:
          Array.isArray(t.layout?.items)
            ? t.layout.items.map((it: any) => ({
                id: it.id || uuid(),
                item: it.item || "",
                quantity: it.quantity || "1",
                rate: it.rate || "",
                tax: it.tax || "",
              }))
            : [
                { id: uuid(), item: "", quantity: "1", rate: "", tax: "" },
              ],
        showTax: t.layout?.columns?.tax !== false,
      });
    } else if (!form.items.length) {
      setForm((f) => ({
        ...f,
        items: [{ id: uuid(), item: "", quantity: "1", rate: "", tax: "" }],
      }));
    }
  }, [data]);

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
        { id: uuid(), item: "", quantity: "1", rate: "", tax: "" },
      ],
    }));
  }
  function removeItem(id: string) {
    setForm((f) => ({ ...f, items: f.items.filter((it) => it.id !== id) }));
  }

  const subtotal = form.items.reduce(
    (sum, it) => sum + (parseFloat(it.rate) || 0) * (parseFloat(it.quantity) || 0),
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

  async function save() {
    const payload = {
      logoUrl: form.logoUrl,
      companyAddress: form.sellerAddress,
      notes: form.notes,
      terms: form.terms,
      footer: form.footer,
      layout: {
        buyerAddress: form.buyerAddress,
        invoiceNumber: form.invoiceNumber,
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate,
        items: form.items,
        columns: { tax: form.showTax },
      },
    };
    const res = await fetch("/api/invoice/template", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      toast.error("Failed to save template");
    } else {
      toast.success("Template saved");
      mutate();
    }
  }

  async function previewPdf() {
    const res = await fetch("/api/invoice/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        logoUrl: form.logoUrl,
        companyAddress: form.sellerAddress,
        clientAddress: form.buyerAddress,
        invoiceNumber: form.invoiceNumber,
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate,
        notes: form.notes,
        terms: form.terms,
        footer: form.footer,
        items: form.items,
        columns: { tax: form.showTax },
      }),
    });
    const j = await res.json();
    if (j.pdfBase64) {
      const binary = atob(j.pdfBase64);
      const len = binary.length;
      const arr = new Uint8Array(len);
      for (let i = 0; i < len; i++) arr[i] = binary.charCodeAt(i);
      const blob = new Blob([arr], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  function Preview() {
    return (
      <div className="mx-auto w-full max-w-lg space-y-2 rounded border bg-white p-4">
        <div className="flex justify-between">
          <div>
            {form.logoUrl && (
              <img src={form.logoUrl} alt="Logo" className="h-16 object-contain" />
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
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-1">Item</th>
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
                  <td className="py-1 text-right">{it.quantity}</td>
                  <td className="py-1 text-right">{it.rate}</td>
                  {form.showTax && <td className="py-1 text-right">{it.tax}</td>}
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
        {form.footer && (
          <div className="pt-4 text-center text-xs text-gray-500">
            {form.footer}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 md:flex md:gap-4">
      <div className="flex-1 space-y-2">
        {form.logoUrl && (
          <img
            src={form.logoUrl}
            alt="Company logo"
            className="h-16 w-16 object-contain"
          />
        )}
        <Input
          type="file"
          aria-label="Company logo"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) =>
              setForm((f) => ({ ...f, logoUrl: ev.target?.result as string }));
            reader.readAsDataURL(file);
          }}
        />
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
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Item</th>
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
                      <Input
                        value={it.quantity}
                        onChange={(e) =>
                          updateItem(it.id, "quantity", e.target.value)
                        }
                        className="w-16"
                      />
                    </td>
                    <td>
                      <Input
                        value={it.rate}
                        onChange={(e) =>
                          updateItem(it.id, "rate", e.target.value)
                        }
                        className="w-20"
                      />
                    </td>
                    {form.showTax && (
                      <td>
                        <Input
                          value={it.tax}
                          onChange={(e) =>
                            updateItem(it.id, "tax", e.target.value)
                          }
                          className="w-16"
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
            + Add Row
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
        <Textarea
          placeholder="Footer"
          value={form.footer}
          onChange={(e) => setForm((f) => ({ ...f, footer: e.target.value }))}
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={save}>Save Template</Button>
          <Button type="button" onClick={previewPdf}>
            Preview PDF
          </Button>
        </div>
      </div>
      <div className="flex-1 pt-2">
        <Preview />
      </div>
    </div>
  );
}

