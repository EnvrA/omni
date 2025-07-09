"use client";
import { useState, useEffect } from "react";
import { Button, Textarea } from "@/components/ui";
import { Users, MessageSquare, Mail } from "lucide-react";

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

  function addSegment(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    if (!id) return;
    setSelected((prev) => (prev.includes(id) ? prev : [...prev, id]));
    e.target.value = "";
  }

  function removeSegment(id: string) {
    setSelected((sel) => sel.filter((s) => s !== id));
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
        <div className="relative">
          <Users
            className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
            aria-hidden="true"
          />
          <select
            value=""
            onChange={addSegment}
            className="w-full appearance-none rounded border py-2 pl-8 pr-4"
          >
            <option value="" disabled>
              Select segments…
            </option>
            {segments
              .filter((s) => !selected.includes(s.id))
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </div>
        {selected.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selected.map((id) => {
              const seg = segments.find((s) => s.id === id);
              if (!seg) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => removeSegment(id)}
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                  style={{ background: "#17A2B8", color: "#fff" }}
                >
                  <span>{seg.name}</span>
                  <span aria-hidden="true">×</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="relative">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message…"
          maxLength={1600}
          style={{ height: 120 }}
          className="rounded-lg p-4 pr-16"
        />
        <span className="absolute bottom-2 right-2 text-xs text-[#999]">
          {message.length}/1600
        </span>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={() => send("WhatsApp")}
          disabled={selected.length === 0 || !message.trim()}
          className="flex items-center gap-1 text-white disabled:opacity-50"
          style={{ background: "#25D366", borderColor: "#25D366" }}
        >
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          WhatsApp
        </Button>
        <Button
          type="button"
          onClick={() => send("Email")}
          disabled={selected.length === 0 || !message.trim()}
          className="flex items-center gap-1 text-white disabled:opacity-50"
          style={{ background: "#007BFF", borderColor: "#007BFF" }}
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          Email
        </Button>
      </div>
    </div>
  );
}
