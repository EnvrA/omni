"use client";

import useSWR from "swr";
import { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Card, Button, Input, Textarea } from "@/components/ui";
import { toast } from "sonner";
import { useTags, TagManager } from "@/components";
import { GripVertical, Layers, Search, Filter } from "lucide-react";

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
  contact: { id: string; name: string | null };
}

interface DealExtra {
  title: string;
  value: number;
  probability: number;
  closeDate: string;
  hasDeadline: boolean;
  deadline: string;
  notes: string;
  tag: string;
  log: { time: number; action: string }[];
}

interface Stage {
  id: string;
  name: string;
  color?: string;
}

interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}

function slugify(name: string) {
  return name.trim().toUpperCase().replace(/\s+/g, "_");
}

function uniqBy<T>(arr: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  return arr.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const defaultStageColors: Record<string, string> = {
  NEW: "#28A745",
  IN_PROGRESS: "#17A2B8",
  WAITING: "#FFC107",
  DONE: "#6C757D",
};

function DraggableCard({
  deal,
  selected,
  onSelect,
  onOpen,
  extra,
  updateTitle,
  isOpen,
}: {
  deal: Deal;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onOpen: () => void;
  extra: DealExtra;
  updateTitle: (title: string) => void;
  isOpen: boolean;
}) {
  const { tags } = useTags("deals");
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: deal.id,
    data: { stage: deal.stage, type: "deal" },
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  const [editing, setEditing] = useState(false);
  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onOpen}
      className={`relative mb-2 space-y-1 rounded-lg border border-[#EEE] bg-white p-3 transition-shadow hover:shadow-[0_2px_4px_rgba(0,0,0,0.08)] ${
        isOpen ? "filter-none brightness-100 z-50" : ""
      }`}
    >
      <GripVertical
        {...listeners}
        {...attributes}
        className="absolute left-1 top-1 h-4 w-4 cursor-move text-gray-400"
        onClick={(e) => e.stopPropagation()}
        aria-hidden="true"
      />
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => onSelect(e.target.checked)}
        className="absolute right-1 top-1"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex items-center gap-1 text-base font-bold">
        {editing ? (
          <Input
            autoFocus
            value={extra?.title}
            onChange={(e) => updateTitle(e.target.value)}
            onBlur={() => setEditing(false)}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <span>{extra?.title || `Deal ${deal.id.slice(0, 4)}`}</span>
            <button
              type="button"
              className="ml-1 text-xs text-gray-500"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              aria-label="Edit title"
            >
              ✎
            </button>
          </>
        )}
      </div>
      <div className="text-sm text-[#555]">
        {deal.contact.name || "Unnamed"}
      </div>
      <div className="text-sm text-[#1F8A70]">
        ${extra?.value ?? 0}
      </div>
      {extra?.hasDeadline && extra.deadline && (
        <div className="text-xs text-red-600">Due: {extra.deadline}</div>
      )}
      {extra?.tag && (
        <span
          className="inline-block rounded-full px-2 py-0.5 text-[10px] text-white"
          style={{
            background: tags.find((t) => t.name === extra.tag)?.color || "#888",
          }}
        >
          {extra.tag}
        </span>
      )}
    </div>
  );
}

function StageColumn({
  stage,
  name,
  color,
  onRename,
  onDelete,
  deals,
  extras,
  selected,
  toggleSelect,
  openDeal,
  drawerDeal,
}: {
  stage: string;
  name: string;
  color?: string;
  onRename: (name: string, color: string) => void;
  onDelete: () => void;
  deals: Deal[];
  extras: Record<string, DealExtra>;
  selected: Set<string>;
  toggleSelect: (id: string, checked: boolean) => void;
  openDeal: (d: Deal) => void;
  drawerDeal: Deal | null;
}) {
  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: stage,
    data: { stage, column: stage },
  });
  const {
    attributes: colAttributes,
    listeners: colListeners,
    setNodeRef: setDragRef,
    transform: colTransform,
  } = useDraggable({
    id: `column-${stage}`,
    data: { column: stage, type: "column" },
  });
  const ref = (node: HTMLElement | null) => {
    setDropRef(node);
    setDragRef(node);
  };
  const style = colTransform
    ? {
        transform: `translate3d(${colTransform.x}px, ${colTransform.y}px, 0)`,
      }
    : undefined;
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(name);
  const [tempColor, setTempColor] = useState(color || defaultStageColors[stage]);
  return (
    <div
      ref={ref}
      style={style}
      className={`space-y-2 rounded border p-2 ${isOver ? "bg-blue-50" : "bg-gray-50"}`}
    >
      <div
        className="mb-1 flex h-12 items-center gap-1 px-4 text-sm font-bold uppercase text-white"
        style={{ background: color || defaultStageColors[stage] }}
      >
        {editing ? (
          <>
            <Input
              autoFocus
              className="flex-1 text-black"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
            />
            <input
              type="color"
              value={tempColor}
              onChange={(e) => setTempColor(e.target.value)}
              aria-label="Column color"
            />
            <button
              type="button"
              onClick={() => {
                onRename(tempName, tempColor);
                setEditing(false);
              }}
              aria-label="Confirm column name"
              className="text-xs text-green-600"
            >
              ✓
            </button>
          </>
        ) : (
          <>
            <span className="flex-1 text-sm font-semibold">{name}</span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs text-gray-500"
              aria-label="Edit column"
            >
              ✎
            </button>
            <button
              type="button"
              className="cursor-move text-xs text-gray-500"
              aria-label="Drag column"
              {...colListeners}
              {...colAttributes}
            >
              ☰
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete column"
          className="rounded px-1 text-xs text-gray-500 hover:text-red-600"
        >
          ✕
        </button>
      </div>
      {deals.length === 0 && (
        <div className="text-sm text-gray-500">No deals</div>
      )}
      {deals.map((d) => (
        <DraggableCard
          key={d.id}
          deal={d}
          selected={selected.has(d.id)}
          onSelect={(c) => toggleSelect(d.id, c)}
          onOpen={() => openDeal(d)}
          extra={extras[d.id]}
          updateTitle={(t) =>
            setExtras((ex) => ({
              ...ex,
              [d.id]: {
                ...ex[d.id],
                title: t,
              },
            }))
          }
          isOpen={drawerDeal?.id === d.id}
        />
      ))}
    </div>
  );
}

const defaultStages: Stage[] = [
  { id: "NEW", name: "NEW", color: defaultStageColors.NEW },
  { id: "IN_PROGRESS", name: "IN_PROGRESS", color: defaultStageColors.IN_PROGRESS },
  { id: "WAITING", name: "WAITING", color: defaultStageColors.WAITING },
  { id: "DONE", name: "DONE", color: defaultStageColors.DONE },
];

export default function DealsPage() {
  const { data, error, mutate } = useSWR<{ deals: Deal[] }>(
    "/api/deals",
    fetcher,
  );
  const { tags } = useTags("deals");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const [pipelines, setPipelines] = useState<Record<string, Pipeline>>(() => {
    if (typeof window === "undefined") {
      return {
        default: { id: "default", name: "Default", stages: defaultStages },
      };
    }
    try {
      const stored = JSON.parse(
        localStorage.getItem("dealPipelines") || "null",
      );
      if (stored?.pipelines) return stored.pipelines;
    } catch {}
    return {
      default: { id: "default", name: "Default", stages: defaultStages },
    };
  });
  const [currentPipeline, setCurrentPipeline] = useState<string>(() => {
    if (typeof window === "undefined") return "default";
    try {
      const stored = JSON.parse(
        localStorage.getItem("dealPipelines") || "null",
      );
      if (stored?.current) return stored.current;
    } catch {}
    return "default";
  });

  const stages = pipelines[currentPipeline]?.stages || defaultStages;
  const stageList = useMemo(() => uniqBy(stages, (s) => s.id), [stages]);

  function updateStages(newStages: Stage[]) {
    setPipelines((p) => ({
      ...p,
      [currentPipeline]: {
        ...p[currentPipeline],
        stages: uniqBy(newStages, (s) => s.id),
      },
    }));
  }

  const [showAdd, setShowAdd] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [drawerDeal, setDrawerDeal] = useState<Deal | null>(null);
  const { data: contacts } = useSWR<{
    contacts: { id: string; name: string | null }[];
  }>(showAdd || drawerDeal ? "/api/contacts" : null, fetcher);
  const [contactId, setContactId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [contactName, setContactName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [extras, setExtras] = useState<Record<string, DealExtra>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = JSON.parse(localStorage.getItem("dealExtras") || "{}");
      Object.keys(stored).forEach((k) => {
        stored[k] = {
          title: "",
          value: 0,
          probability: 50,
          closeDate: "",
          hasDeadline: false,
          deadline: "",
          notes: "",
          tag: "",
          log: [],
          ...stored[k],
        };
      });
      return stored;
    } catch {
      return {};
    }
  });
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [lastMove, setLastMove] = useState<{
    id: string;
    from: string;
    to: string;
  } | null>(null);

  useEffect(() => {
    if (!data?.deals) return;
    setExtras((ex) => {
      const copy = { ...ex };
      data.deals.forEach((d) => {
        if (!copy[d.id]) {
          copy[d.id] = {
            title: "",
            value: 0,
            probability: 50,
            closeDate: "",
            hasDeadline: false,
            deadline: "",
            notes: "",
            tag: "",
            log: [],
          };
        }
      });
      return copy;
    });
  }, [data]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("dealExtras", JSON.stringify(extras));
    }
  }, [extras]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "dealPipelines",
        JSON.stringify({ pipelines, current: currentPipeline }),
      );
    }
  }, [pipelines, currentPipeline]);

  useEffect(() => {
    if (drawerDeal) {
      setContactName(drawerDeal.contact.name || "");
    }
  }, [drawerDeal]);

  const filteredDeals = (data?.deals || []).filter((d) => {
    const ext = extras[d.id];
    if (search && !d.contact.name?.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (tagFilter !== "all" && ext?.tag !== tagFilter) return false;
    return true;
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const type = active.data.current?.type;
    if (type === "deal") {
      const newStage = over.data.current?.stage;
      const oldStage = active.data.current?.stage;
      if (!newStage || newStage === oldStage) return;
      await moveDeal(String(active.id), newStage, oldStage);
      setLastMove({ id: String(active.id), from: oldStage, to: newStage });
      mutate();
      toast.success(`Moved to ${newStage.replace(/_/g, " ")}`, {
        action: {
          label: "Undo",
          onClick: async () => {
            if (lastMove) {
              await moveDeal(lastMove.id, lastMove.from, lastMove.to);
              mutate();
            }
          },
        },
      });
    } else if (type === "column") {
      const activeId = active.data.current?.column as string;
      const overId = over.data.current?.column as string;
      if (!activeId || !overId || activeId === overId) return;
      const oldIndex = stages.findIndex((s) => s.id === activeId);
      const newIndex = stages.findIndex((s) => s.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;
      const newStages = arrayMove(stages, oldIndex, newIndex);
      updateStages(newStages);
    }
  };

  const dealsByStage: Record<string, Deal[]> = {};
  stageList.forEach((s) => {
    dealsByStage[s.id] = [];
  });
  filteredDeals.forEach((d) => {
    dealsByStage[d.stage].push(d);
  });

  const totalDeals = filteredDeals.length;
  const lastStage = stageList[stageList.length - 1]?.id || "";
  const winRate =
    totalDeals && lastStage
      ? Math.round((dealsByStage[lastStage].length / totalDeals) * 100)
      : 0;

  async function addDeal(e: React.FormEvent) {
    e.preventDefault();
    if (!contactId || !newTitle) return;
    const res = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId }),
    });
    const json = await res.json();
    if (json.deal) {
      setExtras((ex) => ({
        ...ex,
        [json.deal.id]: {
          title: newTitle,
          value: 0,
          probability: 50,
          closeDate: "",
          hasDeadline: false,
          deadline: "",
          notes: "",
          tag: "",
          log: [{ time: Date.now(), action: "Deal added" }],
        },
      }));
    }
    setShowAdd(false);
    setContactId("");
    setNewTitle("");
    mutate();
  }

  async function moveDeal(id: string, stage: string, from?: string) {
    await fetch(`/api/deal/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    setExtras((ex) => ({
      ...ex,
      [id]: {
        ...ex[id],
        log: [
          ...(ex[id]?.log || []),
          {
            time: Date.now(),
            action: from
              ? `Moved from ${from} to ${stage}`
              : `Moved to ${stage}`,
          },
        ],
      },
    }));
  }

  async function moveSelected(stage: string) {
    await Promise.all(Array.from(selectedIds).map((id) => moveDeal(id, stage)));
    setSelectedIds(new Set());
    mutate();
  }

  async function deleteSelected() {
    if (!confirm("Delete selected deals?")) return;
    const deleted = data?.deals.filter((d) => selectedIds.has(d.id)) || [];
    await Promise.all(
      deleted.map((d) => fetch(`/api/deal/${d.id}`, { method: "DELETE" })),
    );
    setExtras((ex) => {
      const copy = { ...ex };
      deleted.forEach((d) => delete copy[d.id]);
      return copy;
    });
    setSelectedIds(new Set());
    mutate();
    toast.success("Deal deleted", {
      duration: 3000,
      action: {
        label: "Undo",
        onClick: async () => {
          for (const d of deleted) {
            const res = await fetch("/api/deals", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contactId: d.contact.id }),
            });
            const json = await res.json();
            if (json.deal) {
              if (d.stage !== "NEW") {
                await fetch(`/api/deal/${json.deal.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ stage: d.stage }),
                });
              }
              setExtras((ex) => ({
                ...ex,
                [json.deal.id]: extras[d.id],
              }));
            }
          }
          mutate();
        },
      },
    });
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
      if (d)
        rows.push([
          d.id,
          d.contact.name || "",
          d.stage,
          String(extras[id]?.value ?? 0),
        ]);
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

  function handleSave() {
    toast.success("Deal saved");
    setDrawerDeal(null);
  }

  async function handleDeleteDeal(id: string) {
    if (!confirm("Delete this deal?")) return;
    const deal = data?.deals.find((d) => d.id === id);
    if (!deal) return;
    await fetch(`/api/deal/${id}`, { method: "DELETE" });
    setExtras((ex) => {
      const copy = { ...ex };
      delete copy[id];
      return copy;
    });
    mutate();
    toast.success("Deal deleted", {
      duration: 3000,
      action: {
        label: "Undo",
        onClick: async () => {
          const res = await fetch("/api/deals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contactId: deal.contact.id }),
          });
          const json = await res.json();
          if (json.deal) {
            if (deal.stage !== "NEW") {
              await fetch(`/api/deal/${json.deal.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stage: deal.stage }),
              });
            }
            setExtras((ex) => ({
              ...ex,
              [json.deal.id]: extras[id],
            }));
            mutate();
          }
        },
      },
    });
    setDrawerDeal(null);
  }

  function handleDeleteColumn(id: string) {
    if (!confirm("Delete this column?")) return;
    const index = stages.findIndex((s) => s.id === id);
    if (index === -1) return;
    const removed = stages[index];
    updateStages(stages.filter((s) => s.id !== id));
    toast.success("Column deleted", {
      duration: 3000,
      action: {
        label: "Undo",
        onClick: () => {
          const copy = [...stages];
          copy.splice(index, 0, removed);
          updateStages(copy);
        },
      },
    });
  }

  async function saveClientName() {
    if (!drawerDeal) return;
    await fetch(`/api/client/${drawerDeal.contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: contactName }),
    });
    mutate();
    setDrawerDeal((d) =>
      d ? { ...d, contact: { ...d.contact, name: contactName } } : d,
    );
  }

  if (!mounted) return null;

  return (
    <div className="relative space-y-4">
      {drawerDeal && (
        <div className="pointer-events-none fixed inset-0 z-40 bg-white/50 backdrop-blur-sm" />
      )}
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#DDD] bg-white p-4">
        <div className="flex items-center gap-2">
          <select
            className="rounded border p-1"
            value={currentPipeline}
            onChange={(e) => setCurrentPipeline(e.target.value)}
          >
            {Object.values(pipelines).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button
            type="button"
            onClick={() => {
              const name = prompt("Pipeline name?");
              if (name) {
                const id = slugify(name);
                setPipelines((pl) => ({
                  ...pl,
                  [id]: { id, name, stages: defaultStages },
                }));
                setCurrentPipeline(id);
              }
            }}
            className="flex items-center gap-1 hover:bg-gray-100"
          >
            <Layers className="h-4 w-4" aria-hidden="true" />
            Add Pipeline
          </Button>
        </div>
        <div className="flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <Input
              placeholder="Search deals…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <select
              className="rounded border p-1 pl-8"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
            >
              <option value="all">Filter</option>
              {tags.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-end gap-2">
        <Button
          type="button"
          onClick={() => setShowTags(true)}
          className="hover:bg-gray-100"
        >
          Manage Tags
        </Button>
        <Button
          type="button"
          onClick={() => {
            const name = prompt("Column name?");
            if (name) {
              const id = slugify(name);
              updateStages([
                ...stages,
                { id, name, color: defaultStageColors.DONE },
              ]);
            }
          }}
          className="hover:bg-gray-100"
        >
          Add Column
        </Button>
        <button
          onClick={() => setShowAdd(true)}
          className="whitespace-nowrap rounded border border-green-700 bg-green-600 px-3 py-1 text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
        >
          Add Deal
        </button>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <span>Total: {totalDeals}</span>
        {stageList.map((s) => (
          <span key={s.id}>
            {s.name}: {dealsByStage[s.id].length}
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
            {stageList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
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
          <Button
            type="button"
            onClick={exportCSV}
            className="whitespace-nowrap"
          >
            Export CSV
          </Button>
        </div>
      )}

      {error && (
        <div className="text-red-500">
          Error loading deals: {error.message || String(error)}
        </div>
      )}
      {!data && !error && (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}
      {data && (
        <DndContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              {stageList.map((stage) => (
                <StageColumn
                  key={stage.id}
                  stage={stage.id}
                  name={stage.name}
                  color={stage.color}
                  onRename={(name, color) =>
                    updateStages(
                      stages.map((s) =>
                        s.id === stage.id ? { ...s, name, color } : s,
                      ),
                    )
                  }
                onDelete={() => handleDeleteColumn(stage.id)}
                deals={dealsByStage[stage.id]}
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
                drawerDeal={drawerDeal}
              />
            ))}
          </div>
        </DndContext>
      )}

      {showAdd && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowAdd(false)}
        >
          <form
            onSubmit={addDeal}
            className="space-y-2 rounded bg-white p-4 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold">New Deal</h2>
            <Input
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
            <select
              className="w-full rounded border p-1"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
            >
              <option value="">Select contact</option>
              {contacts?.contacts?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.id}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <Button type="button" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!contactId || !newTitle}>
                Save
              </Button>
            </div>
          </form>
        </div>
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
            <Input
              placeholder="Title"
              value={extras[drawerDeal.id]?.title || ""}
              onChange={(e) =>
                setExtras((ex) => ({
                  ...ex,
                  [drawerDeal.id]: {
                    ...ex[drawerDeal.id],
                    title: e.target.value,
                  },
                }))
              }
            />
            <div className="flex gap-2">
              <Input
                list="client-options"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="flex-1"
                placeholder="Client name"
              />
              <datalist id="client-options">
                {contacts?.contacts?.map((c) => (
                  <option key={c.id} value={c.name || c.id} />
                ))}
              </datalist>
              <Button
                type="button"
                onClick={saveClientName}
                aria-label="Save client name"
              >
                Save
              </Button>
            </div>
            <label className="flex flex-col text-sm">
              <span>Deal Value</span>
              <Input
                type="number"
                value={extras[drawerDeal.id]?.value ?? 0}
                onChange={(e) =>
                  setExtras((ex) => ({
                    ...ex,
                    [drawerDeal.id]: {
                      ...ex[drawerDeal.id],
                      value: Number(e.target.value),
                    },
                  }))
                }
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={extras[drawerDeal.id]?.hasDeadline || false}
                onChange={(e) =>
                  setExtras((ex) => ({
                    ...ex,
                    [drawerDeal.id]: {
                      ...ex[drawerDeal.id],
                      hasDeadline: e.target.checked,
                    },
                  }))
                }
              />
              Set deadline
            </label>
            {extras[drawerDeal.id]?.hasDeadline && (
              <Input
                type="date"
                value={extras[drawerDeal.id]?.deadline || ""}
                onChange={(e) =>
                  setExtras((ex) => ({
                    ...ex,
                    [drawerDeal.id]: {
                      ...ex[drawerDeal.id],
                      deadline: e.target.value,
                    },
                  }))
                }
              />
            )}
            <select
              className="w-full rounded border p-1"
              value={extras[drawerDeal.id]?.tag || ""}
              onChange={(e) =>
                setExtras((ex) => ({
                  ...ex,
                  [drawerDeal.id]: {
                    ...ex[drawerDeal.id],
                    tag: e.target.value,
                  },
                }))
              }
            >
              <option value="">No Tag</option>
              {tags.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
            <Textarea
              value={extras[drawerDeal.id]?.notes || ""}
              onChange={(e) =>
                setExtras((ex) => ({
                  ...ex,
                  [drawerDeal.id]: {
                    ...ex[drawerDeal.id],
                    notes: e.target.value,
                  },
                }))
              }
            />
            <div className="mt-2 space-y-1">
              <h3 className="text-sm font-semibold">Activity Log</h3>
              <ul className="max-h-32 overflow-auto text-xs">
                {extras[drawerDeal.id]?.log?.map((l, idx) => (
                  <li key={idx}>
                    {new Date(l.time).toLocaleString()}: {l.action}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2">
              <Button type="button">Add Next Activity</Button>
              <Button type="button">Attach File</Button>
              <Button type="button">Send Email</Button>
            </div>
            <hr className="my-2" />
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" onClick={() => setDrawerDeal(null)}>
                Close
              </Button>
              <Button
                type="button"
                onClick={() => handleDeleteDeal(drawerDeal.id)}
                className="text-red-600"
              >
                Delete
              </Button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded border border-green-700 bg-green-600 px-3 py-1 text-white shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <TagManager
        type="deals"
        open={showTags}
        onClose={() => setShowTags(false)}
      />
    </div>
  );
}
