"use client";
import { useState, useEffect } from "react";
import { Button, Textarea } from "@/components/ui";

interface Segment {
  id: string;
  name: string;
}

export default function MessageCenterPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setSegments(JSON.parse(localStorage.getItem("segments") || "[]"));
    } catch {}
  }, []);

  function handleSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
    setSelected(opts);
  }

  function send(channel: string) {
    alert(`Sending ${channel} to ${selected.length} segment(s)`);
    setMessage("");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Message Center</h1>
      <div>
        <label className="mb-1 block font-medium">Segments</label>
        <select
          multiple
          value={selected}
          onChange={handleSelect}
          className="w-full rounded border p-2"
        >
          {segments.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Message…"
      />
      <div className="flex gap-2">
        <Button type="button" onClick={() => send("WhatsApp")}
          disabled={!message}
        >
          Send WhatsApp
        </Button>
        <Button type="button" onClick={() => send("Email")}
          disabled={!message}
        >
          Send Email
        </Button>
      </div>
    </div>
  );
}
