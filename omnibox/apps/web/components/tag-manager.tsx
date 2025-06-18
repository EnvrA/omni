"use client";
import { useState } from "react";
import { useTags, Tag } from "./tags-context";
import { Button, Input } from "./ui";

export function TagManager({
  open,
  onClose,
  type = "clients",
}: {
  open: boolean;
  onClose: () => void;
  type?: "clients" | "deals";
}) {
  const { tags, addTag, updateTag, deleteTag } = useTags(type);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#60a5fa");
  if (!open) return null;
  return (
    <dialog
      open
      className="fixed inset-0 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-80 space-y-2 rounded bg-white p-4 shadow"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-semibold">Manage Tags</h2>
        {tags.map((t) => (
          <div key={t.id} className="flex items-center gap-2">
            <span
              className="h-4 w-4 rounded-full"
              style={{ background: t.color }}
            />
            <Input
              className="flex-1"
              value={t.name}
              onChange={(e) => updateTag(t.id, { name: e.target.value })}
            />
            <input
              type="color"
              value={t.color}
              onChange={(e) => updateTag(t.id, { color: e.target.value })}
            />
            <button
              onClick={() => {
                if (confirm(`Delete tag '${t.name}'?`)) deleteTag(t.id);
              }}
              className="text-red-600"
              aria-label={`Delete tag ${t.name}`}
            >
              ✕
            </button>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New tag"
            className="flex-1"
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          <Button
            type="button"
            onClick={() => {
              addTag(name, color);
              setName("");
            }}
            disabled={!name}
          >
            Add
          </Button>
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </dialog>
  );
}
