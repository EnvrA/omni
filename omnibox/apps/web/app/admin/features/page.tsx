"use client";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function FeaturesPage() {
  const { data, mutate } = useSWR("/api/admin/features", fetcher);
  const [template, setTemplate] = useState("");

  async function toggle(id: string) {
    await fetch(`/api/admin/features/${id}`, { method: "POST" });
    mutate();
  }

  async function addTemplate() {
    await fetch("/api/admin/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: template }),
    });
    setTemplate("");
    mutate();
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {data.flags.map((f: any) => (
          <label key={f.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={f.enabled}
              onChange={() => toggle(f.id)}
            />
            {f.name}
          </label>
        ))}
      </div>

      <div>
        <h3 className="font-semibold mb-2">Quick Reply Templates</h3>
        <ul className="space-y-1 mb-2">
          {data.templates.map((t: any) => (
            <li key={t.id}>{t.text}</li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            className="border rounded p-1 flex-1"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          />
          <Button onClick={addTemplate}>Add</Button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Webhook URLs</h3>
        <ul className="space-y-1">
          {[
            "/api/webhook/email",
            "/api/webhook/sms",
            "/api/webhook/whatsapp",
          ].map((url) => (
            <li key={url} className="flex items-center gap-2">
              <span className="font-mono text-sm">{url}</span>
              <Button
                onClick={() =>
                  navigator.clipboard.writeText(location.origin + url)
                }
              >
                Copy
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
