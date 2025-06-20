"use client";
import { useState, useEffect } from "react";
import { v4 as uuid } from "uuid";
import { Input, Button, Card } from "@/components/ui";

interface Segment {
  id: string;
  name: string;
  field: string;
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [name, setName] = useState("");
  const [field, setField] = useState("phone");
  const [showModal, setShowModal] = useState(false);

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
    setSegments((s) => [...s, { id: uuid(), name, field }]);
    setName("");
    setField("phone");
    setShowModal(false);
  }

  function deleteSegment(id: string) {
    setSegments((s) => s.filter((seg) => seg.id !== id));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Segments</h1>
      <Button
        type="button"
        onClick={() => setShowModal(true)}
        className="bg-green-600 text-white"
      >
        Create segment
      </Button>
      <div className="space-y-2">
        {segments.map((s) => (
          <Card key={s.id} className="flex items-center justify-between">
            <span>
              {s.name}
              <span className="ml-1 text-xs text-gray-500">({s.field})</span>
            </span>
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

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur"
          onClick={() => setShowModal(false)}
        >
          <form
            onSubmit={addSegment}
            className="w-80 space-y-2 rounded bg-white p-4 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold">New Segment</h2>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Segment name"
            />
            <select
              className="w-full rounded border p-1"
              value={field}
              onChange={(e) => setField(e.target.value)}
            >
              <option value="phone">Has phone number</option>
              <option value="email">Has email address</option>
              <option value="company">Has company</option>
              <option value="tag">Has tag</option>
              <option value="notes">Has notes</option>
            </select>
            <div className="flex justify-end gap-2">
              <Button type="button" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 text-white">
                Save
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
