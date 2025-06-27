"use client";
import useSWR from "swr";
import { useState, useEffect } from "react";
import { Input, Button } from "@/components/ui";
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
    emailSubject: "",
    emailBody: "",
  });

  useEffect(() => {
    if (data?.template) {
      setForm({
        logoUrl: data.template.logoUrl || "",
        header: data.template.header || "",
        body: data.template.body || "",
        footer: data.template.footer || "",
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

  return (
    <div className="space-y-2">
      <Input
        placeholder="Logo URL"
        value={form.logoUrl}
        onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
      />
      <Input
        placeholder="Header"
        value={form.header}
        onChange={(e) => setForm({ ...form, header: e.target.value })}
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
      <Input
        placeholder="Email Subject"
        value={form.emailSubject}
        onChange={(e) => setForm({ ...form, emailSubject: e.target.value })}
      />
      <textarea
        className="w-full rounded border p-1"
        placeholder="Email Body"
        value={form.emailBody}
        onChange={(e) => setForm({ ...form, emailBody: e.target.value })}
      />
      <Button onClick={save}>Save Template</Button>
    </div>
  );
}
