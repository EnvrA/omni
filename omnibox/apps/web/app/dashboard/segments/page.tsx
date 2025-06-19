"use client";
import { useState, useEffect } from "react";
import { v4 as uuid } from "uuid";
import { Input, Button, Card } from "@/components/ui";

interface Segment {
  id: string;
  name: string;
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setSegments(JSON.parse(localStorage.getItem("segments") || "[]"));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("segments", JSON.stringify(segments));
    }
  }, [segments]);

  function addSegment(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    setSegments((s) => [...s, { id: uuid(), name }]);
    setName("");
  }

  function deleteSegment(id: string) {
    setSegments((s) => s.filter((seg) => seg.id !== id));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Segments</h1>
      <form onSubmit={addSegment} className="flex gap-2">
        <Input
          className="flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Segment name"
        />
        <Button type="submit" className="bg-green-600 text-white">
          Create segment
        </Button>
      </form>
      <div className="space-y-2">
        {segments.map((s) => (
          <Card key={s.id} className="flex items-center justify-between">
            <span>{s.name}</span>
            <Button
              type="button"
              className="text-red-600"
              onClick={() => deleteSegment(s.id)}
            >
              Delete
            </Button>
          </Card>
        ))}
        {segments.length === 0 && <p>No segments</p>}
      </div>
    </div>
  );
}
