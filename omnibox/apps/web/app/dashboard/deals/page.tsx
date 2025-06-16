"use client";

import useSWR from "swr";
import { DndContext, useDraggable, useDroppable, DragEndEvent } from "@dnd-kit/core";
import { Card } from "@/components/ui";

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Deal {
  id: string;
  stage: string;
  contact: { name: string | null };
}

const stages = ["NEW", "IN_PROGRESS", "WAITING", "DONE"] as const;

function DraggableCard({ deal }: { deal: Deal }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: deal.id, data: { stage: deal.stage } });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <Card ref={setNodeRef} style={style} {...listeners} {...attributes} className="mb-2 p-2 bg-white shadow cursor-move">
      {deal.contact.name || "Unnamed"}
    </Card>
  );
}

function StageColumn({ stage, deals }: { stage: string; deals: Deal[] }) {
  const { isOver, setNodeRef } = useDroppable({ id: stage, data: { stage } });
  return (
    <div ref={setNodeRef} className={`flex-1 p-2 ${isOver ? "bg-muted" : ""}`}>
      <h2 className="mb-2 font-semibold">{stage.replace(/_/g, " ")}</h2>
      {deals.map(d => (
        <DraggableCard key={d.id} deal={d} />
      ))}
    </div>
  );
}

export default function DealsPage() {
  const { data, mutate } = useSWR<{ deals: Deal[] }>("/api/deals", fetcher);

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

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4">
        {stages.map(stage => (
          <StageColumn key={stage} stage={stage} deals={dealsByStage[stage]} />
        ))}
      </div>
    </DndContext>
  );
}
