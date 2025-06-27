"use client";
import useSWR from "swr";
import { useState, useEffect } from "react";
import { Input, Button, Textarea } from "@/components/ui";
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

export default function InvoiceTemplatePage() {
  const { data, mutate } = useSWR<{ template: any }>("/api/invoice/template", fetcher);
  const [form, setForm] = useState({
    logoUrl: "",
    header: "",
    body: "",
    footer: "",
    companyName: "",
    companyAddress: "",
    notes: "",
    terms: "",
    accentColor: "",
    emailSubject: "",
    emailBody: "",
  });
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  useEffect(() => {
    if (data?.template) {
      setForm({
        logoUrl: data.template.logoUrl || "",
        header: data.template.header || "",
        body: data.template.body || "",
        footer: data.template.footer || "",
        companyName: data.template.companyName || "",
        companyAddress: data.template.companyAddress || "",
        notes: data.template.notes || "",
        terms: data.template.terms || "",
        accentColor: data.template.accentColor || "",
        emailSubject: data.template.emailSubject || "",
        emailBody: data.template.emailBody || "",
      });
    }
  }, [data]);

  async function save() {
    const res = await fetch("/api/invoice/template", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
        ...form,
        amount: 0,
        dueDate: new Date().toISOString(),
        clientName: "Client",
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

  return (
    <div className="space-y-2">
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
      <Input
        placeholder="Header"
        value={form.header}
        onChange={(e) => setForm({ ...form, header: e.target.value })}
      />
      <Input
        placeholder="Company Name"
        value={form.companyName}
        onChange={(e) => setForm({ ...form, companyName: e.target.value })}
      />
      <Input
        placeholder="Company Address"
        value={form.companyAddress}
        onChange={(e) => setForm({ ...form, companyAddress: e.target.value })}
      />
      <Input
        placeholder="Body"
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
      />
      <Input
        placeholder="Footer"
        value={form.footer}
        onChange={(e) => setForm({ ...form, footer: e.target.value })}
      />
      <Textarea
        placeholder="Notes"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />
      <Textarea
        placeholder="Terms"
        value={form.terms}
        onChange={(e) => setForm({ ...form, terms: e.target.value })}
      />
      <Input
        placeholder="Accent Color (hex)"
        value={form.accentColor}
        onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
      />
      <Input
        placeholder="Email Subject"
        value={form.emailSubject}
        onChange={(e) => setForm({ ...form, emailSubject: e.target.value })}
      />
      <Textarea
        placeholder="Email Body"
        value={form.emailBody}
        onChange={(e) => setForm({ ...form, emailBody: e.target.value })}
      />
      <div className="flex flex-wrap gap-2">
        <Button onClick={save}>Save Template</Button>
        <Button type="button" onClick={previewPdf}>Preview PDF</Button>
        <Button type="button" onClick={() => setShowEmailPreview(true)}>
          Preview Email
        </Button>
      </div>
      <div className="text-sm text-gray-600">
        Available shortcodes: {"{{invoiceNumber}}, {{clientName}}, {{amount}}, {{dueDate}}"}
      </div>
      {showEmailPreview && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowEmailPreview(false)}
        >
          <div
            className="w-80 space-y-2 rounded bg-white p-4 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold">{form.emailSubject || "(no subject)"}</h2>
            <p className="whitespace-pre-wrap text-sm">{form.emailBody}</p>
            <div className="flex justify-end">
              <Button type="button" onClick={() => setShowEmailPreview(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
