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

export default function InvoiceEmailTemplatePage() {
  const { data, mutate } = useSWR<{ template: any }>("/api/invoice/template", fetcher);
  const [form, setForm] = useState({ emailSubject: "", emailBody: "" });
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (data?.template) {
      setForm({
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
        <Button type="button" onClick={() => setShowPreview(true)}>
          Preview Email
        </Button>
      </div>
      {showPreview && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="w-80 space-y-2 rounded bg-white p-4 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold">{form.emailSubject || "(no subject)"}</h2>
            <p className="whitespace-pre-wrap text-sm">{form.emailBody}</p>
            <div className="flex justify-end">
              <Button type="button" onClick={() => setShowPreview(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
