"use client";

import useSWR from "swr";
import { useState } from "react";
import { DndContext, useDraggable, useDroppable, DragEndEvent } from "@dnd-kit/core";
import { Card, Button } from "@/components/ui";

// Robust fetcher handles non-JSON errors gracefully
const fetcher = async (url: string) => {
  const res = await fetch(url);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
};

interface Deal {
  id: string;
  stage: string;
  contact: { name: string | null };
}

const stages = ["NEW", "IN_PROGRESS", "WAITING", "DONE"] as const;

function DraggableCard({ deal, onEdit, onDone, onDelete }: { deal: Deal; onEdit: () => void; onDone: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: deal.id, data: { stage: deal.stage } });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="relative mb-2 cursor-move space-y-1 rounded bg-white p-2 shadow"
    >
      <div className="text-sm font-semibold">Deal {deal.id.slice(0, 4)}</div>
      <div className="text-xs text-gray-600">{deal.contact.name || "Unnamed"}</div>
      <div className="text-xs text-gray-500">Value: N/A</div>
      <div className="absolute right-1 top-1 flex gap-1 text-xs">
        <button onClick={onEdit} className="hover:text-blue-600">✏</button>
        <button onClick={onDone} className="hover:text-green-600">✔</button>
        <button onClick={onDelete} className="hover:text-red-600">🗑</button>
      </div>
    </Card>
  );
}

function StageColumn({ stage, deals, onEdit, onDone, onDelete }: { stage: string; deals: Deal[]; onEdit: (d: Deal) => void; onDone: (d: Deal) => void; onDelete: (d: Deal) => void }) {
  const { isOver, setNodeRef } = useDroppable({ id: stage, data: { stage } });
  return (
    <div
      ref={setNodeRef}
      className={`space-y-2 rounded border p-2 ${isOver ? "bg-blue-50" : "bg-gray-50"}`}
    >
      <h2 className="mb-1 text-sm font-semibold">{stage.replace(/_/g, " ")}</h2>
      {deals.length === 0 && (
        <div className="text-sm text-gray-500">No deals</div>
      )}
      {deals.map(d => (
        <DraggableCard
          key={d.id}
          deal={d}
          onEdit={() => onEdit(d)}
          onDone={() => onDone(d)}
          onDelete={() => onDelete(d)}
        />
      ))}
    </div>
  );
}

export default function DealsPage() {
  const { data, error, mutate } = useSWR<{ deals: Deal[] }>("/api/deals", fetcher);
  const [showAdd, setShowAdd] = useState(false);
  const { data: contacts } = useSWR<{ contacts: { id: string; name: string | null }[] }>(
    showAdd ? "/api/contacts" : null,
    fetcher,
  );
  const [contactId, setContactId] = useState("");

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const newStage = over.data.current?.stage;
    const oldStage = active.data.current?.stage;
    if (!newStage || newStage === oldStage) return;
    await fetch(`/api/deal/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    });
    mutate();
  };

  const dealsByStage: Record<string, Deal[]> = { NEW: [], IN_PROGRESS: [], WAITING: [], DONE: [] };
  data?.deals.forEach(d => { dealsByStage[d.stage].push(d); });

  async function addDeal(e: React.FormEvent) {
    e.preventDefault();
    if (!contactId) return;
    await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId }),
    });
    setShowAdd(false);
    setContactId("");
    mutate();
  }

  async function markDone(d: Deal) {
    await fetch(`/api/deal/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: "DONE" }),
    });
    mutate();
  }

  async function deleteDeal(d: Deal) {
    await fetch(`/api/deal/${d.id}`, { method: "DELETE" });
    mutate();
  }

  async function editDeal(d: Deal) {
    const newStage = window.prompt("Stage", d.stage);
    if (!newStage) return;
    await fetch(`/api/deal/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    });
    mutate();
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowAdd(true)}>Add Deal</Button>
      {error && (
        <div className="text-red-500">Error loading deals: {error.message || String(error)}</div>
      )}
      {!data && !error && (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}
      {data && (
        <DndContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {stages.map(stage => (
              <StageColumn
                key={stage}
                stage={stage}
                deals={dealsByStage[stage]}
                onEdit={editDeal}
                onDone={markDone}
                onDelete={deleteDeal}
              />
            ))}
          </div>
        </DndContext>
      )}

      {showAdd && (
        <dialog open className="fixed inset-0 flex items-center justify-center bg-black/50">
          <form onSubmit={addDeal} className="space-y-2 rounded bg-white p-4 shadow">
            <h2 className="font-semibold">New Deal</h2>
            <select
              className="w-full rounded border p-1"
              value={contactId}
              onChange={e => setContactId(e.target.value)}
            >
              <option value="">Select contact</option>
              {contacts?.contacts?.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name || c.id}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <Button type="button" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!contactId}>
                Save
              </Button>
            </div>
          </form>
        </dialog>
      )}
    </div>
  );
}
