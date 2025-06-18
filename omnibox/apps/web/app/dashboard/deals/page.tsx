"use client";

import useSWR from "swr";
import { useState, useEffect } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
} from "@dnd-kit/core";
import { Card, Button, Input, Textarea } from "@/components/ui";
import { toast } from "sonner";
import { useTags } from "@/components/tags-context";
import { TagManager } from "@/components/tag-manager";

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

interface DealExtra {
  value: number;
  probability: number;
  closeDate: string;
  notes: string;
  tag: string;
}

const stages = ["NEW", "IN_PROGRESS", "WAITING", "DONE"] as const;

function DraggableCard({
  deal,
  selected,
  onSelect,
  onOpen,
  extra,
}: {
  deal: Deal;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onOpen: () => void;
  extra: DealExtra;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: deal.id,
    data: { stage: deal.stage },
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onOpen}
      className="relative mb-2 cursor-move space-y-1 rounded bg-white p-2 shadow transition-transform"
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => onSelect(e.target.checked)}
        className="absolute left-1 top-1"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="text-sm font-semibold">Deal {deal.id.slice(0, 4)}</div>
      <div className="text-xs text-gray-600">{deal.contact.name || "Unnamed"}</div>
      <div className="text-xs text-gray-500">Value: ${extra?.value ?? 0}</div>
    </Card>
  );
}

function StageColumn({
  stage,
  deals,
  extras,
  selected,
  toggleSelect,
  openDeal,
}: {
  stage: string;
  deals: Deal[];
  extras: Record<string, DealExtra>;
  selected: Set<string>;
  toggleSelect: (id: string, checked: boolean) => void;
  openDeal: (d: Deal) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: stage, data: { stage } });
  return (
    <div
      ref={setNodeRef}
      className={`space-y-2 rounded border p-2 ${isOver ? "bg-blue-50" : "bg-gray-50"}`}
    >
      <h2 className="mb-1 text-sm font-semibold">{stage.replace(/_/g, " ")}</h2>
      {deals.length === 0 && <div className="text-sm text-gray-500">No deals</div>}
      {deals.map((d) => (
        <DraggableCard
          key={d.id}
          deal={d}
          selected={selected.has(d.id)}
          onSelect={(c) => toggleSelect(d.id, c)}
          onOpen={() => openDeal(d)}
          extra={extras[d.id]}
        />
      ))}
    </div>
  );
}

export default function DealsPage() {
  const { data, error, mutate } = useSWR<{ deals: Deal[] }>("/api/deals", fetcher);
  const { tags } = useTags();
  const [showAdd, setShowAdd] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const { data: contacts } = useSWR<{ contacts: { id: string; name: string | null }[] }>(
    showAdd ? "/api/contacts" : null,
    fetcher,
  );
  const [contactId, setContactId] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerDeal, setDrawerDeal] = useState<Deal | null>(null);
  const [extras, setExtras] = useState<Record<string, DealExtra>>({});
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minValue, setMinValue] = useState(0);
  const [tagFilter, setTagFilter] = useState("all");
  const [lastMove, setLastMove] = useState<{ id: string; from: string; to: string } | null>(null);

  useEffect(() => {
    if (!data?.deals) return;
    setExtras((ex) => {
      const copy = { ...ex };
      data.deals.forEach((d) => {
        if (!copy[d.id]) {
          copy[d.id] = { value: 0, probability: 50, closeDate: "", notes: "", tag: "" };
        }
      });
      return copy;
    });
  }, [data]);

  const filteredDeals = (data?.deals || []).filter((d) => {
    const ext = extras[d.id];
    if (search && !d.contact.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (tagFilter !== "all" && ext?.tag !== tagFilter) return false;
    if (startDate && (!ext?.closeDate || new Date(ext.closeDate) < new Date(startDate))) return false;
    if (endDate && (!ext?.closeDate || new Date(ext.closeDate) > new Date(endDate))) return false;
    if (ext && ext.value < minValue) return false;
    return true;
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const newStage = over.data.current?.stage;
    const oldStage = active.data.current?.stage;
    if (!newStage || newStage === oldStage) return;
    await moveDeal(String(active.id), newStage);
    setLastMove({ id: String(active.id), from: oldStage, to: newStage });
    mutate();
    toast.success(`Moved to ${newStage.replace(/_/g, " ")}`, {
      action: {
        label: "Undo",
        onClick: async () => {
          if (lastMove) {
            await moveDeal(lastMove.id, lastMove.from);
            mutate();
          }
        },
      },
    });
  };

  const dealsByStage: Record<string, Deal[]> = { NEW: [], IN_PROGRESS: [], WAITING: [], DONE: [] };
  filteredDeals.forEach((d) => {
    dealsByStage[d.stage].push(d);
  });

  const totalDeals = filteredDeals.length;
  const winRate = totalDeals
    ? Math.round((dealsByStage["DONE"].length / totalDeals) * 100)
    : 0;

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


  async function moveDeal(id: string, stage: string) {
    await fetch(`/api/deal/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
  }

  async function moveSelected(stage: string) {
    await Promise.all(Array.from(selectedIds).map((id) => moveDeal(id, stage)));
    setSelectedIds(new Set());
    mutate();
  }

  async function deleteSelected() {
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        fetch(`/api/deal/${id}`, { method: "DELETE" })
      )
    );
    setSelectedIds(new Set());
    mutate();
  }

  function addTagSelected(tag: string) {
    setExtras((ex) => {
      const copy = { ...ex };
      selectedIds.forEach((id) => {
        if (copy[id]) copy[id].tag = tag;
      });
      return copy;
    });
    setSelectedIds(new Set());
  }

  function exportCSV() {
    const rows = [["ID", "Contact", "Stage", "Value"]];
    selectedIds.forEach((id) => {
      const d = data?.deals.find((dd) => dd.id === id);
      if (d) rows.push([d.id, d.contact.name || "", d.stage, String(extras[id]?.value ?? 0)]);
    });
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deals.csv";
    a.click();
    URL.revokeObjectURL(url);
    setSelectedIds(new Set());
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-wrap items-end gap-2">
          <Input
            placeholder="Search by contact"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-40"
          />
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <input
            type="range"
            min={0}
            max={1000}
            value={minValue}
            onChange={(e) => setMinValue(Number(e.target.value))}
          />
          <select
            className="rounded border p-1"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          >
            <option value="all">All Tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
          <Button type="button" onClick={() => setShowTags(true)} className="hover:bg-gray-100">
            Manage Tags
          </Button>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="whitespace-nowrap rounded border border-green-700 bg-green-600 px-3 py-1 text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
        >
          Add Deal
        </button>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <span>Total: {totalDeals}</span>
        {stages.map((s) => (
          <span key={s}>
            {s.replace(/_/g, " ")}: {dealsByStage[s].length}
          </span>
        ))}
        <span>Win Rate: {winRate}%</span>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded bg-gray-100 p-2">
          <select
            className="rounded border p-1"
            onChange={(e) => {
              if (e.target.value) {
                moveSelected(e.target.value);
                e.target.value = "";
              }
            }}
          >
            <option value="">Move to stage</option>
            {stages.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <Button type="button" onClick={deleteSelected}>
            Delete
          </Button>
          <select
            className="rounded border p-1"
            onChange={(e) => {
              if (e.target.value) {
                addTagSelected(e.target.value);
                e.target.value = "";
              }
            }}
          >
            <option value="">Add tag</option>
            {tags.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
          <Button type="button" onClick={exportCSV} className="whitespace-nowrap">
            Export CSV
          </Button>
        </div>
      )}

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
            {stages.map((stage) => (
              <StageColumn
                key={stage}
                stage={stage}
                deals={dealsByStage[stage]}
                extras={extras}
                selected={selectedIds}
                toggleSelect={(id, c) =>
                  setSelectedIds((prev) => {
                    const s = new Set(prev);
                    if (c) s.add(id);
                    else s.delete(id);
                    return s;
                  })
                }
                openDeal={(d) => setDrawerDeal(d)}
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

      {drawerDeal && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          onClick={() => setDrawerDeal(null)}
        >
          <div
            className="h-full w-80 space-y-2 overflow-y-auto bg-white p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold">Deal {drawerDeal.id.slice(0, 4)}</h2>
            <p className="text-sm text-gray-600">{drawerDeal.contact.name}</p>
            <Input
              type="number"
              value={extras[drawerDeal.id]?.value ?? 0}
              onChange={(e) =>
                setExtras((ex) => ({
                  ...ex,
                  [drawerDeal.id]: { ...ex[drawerDeal.id], value: Number(e.target.value) },
                }))
              }
            />
            <input
              type="range"
              min={0}
              max={100}
              value={extras[drawerDeal.id]?.probability ?? 50}
              onChange={(e) =>
                setExtras((ex) => ({
                  ...ex,
                  [drawerDeal.id]: { ...ex[drawerDeal.id], probability: Number(e.target.value) },
                }))
              }
            />
            <Input
              type="date"
              value={extras[drawerDeal.id]?.closeDate || ""}
              onChange={(e) =>
                setExtras((ex) => ({
                  ...ex,
                  [drawerDeal.id]: { ...ex[drawerDeal.id], closeDate: e.target.value },
                }))
              }
            />
            <Textarea
              value={extras[drawerDeal.id]?.notes || ""}
              onChange={(e) =>
                setExtras((ex) => ({
                  ...ex,
                  [drawerDeal.id]: { ...ex[drawerDeal.id], notes: e.target.value },
                }))
              }
            />
            <div className="flex gap-2">
              <Button type="button">Add Next Activity</Button>
              <Button type="button">Attach File</Button>
              <Button type="button">Send Email</Button>
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={() => setDrawerDeal(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <TagManager open={showTags} onClose={() => setShowTags(false)} />
    </div>
  );
}
