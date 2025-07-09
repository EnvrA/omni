"use client";
import InlineNameEditor from "./InlineNameEditor";
import BulkToolbar from "./BulkToolbar";
import { Segment } from "../types";
import { useState } from "react";
import { Edit2, Trash2 } from "lucide-react";

interface Props {
  segments: Segment[];
  countFor: (seg: Segment) => number;
  onEdit: (seg: Segment, name: string) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkExport: (ids: string[]) => void;
}

export default function SegmentTable({
  segments,
  countFor,
  onEdit,
  onDelete,
  onBulkDelete,
  onBulkExport,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  return (
    <div className="space-y-2">
      <BulkToolbar
        count={selectedIds.length}
        onDelete={() => {
          onBulkDelete(selectedIds);
          setSelectedIds([]);
        }}
        onExport={() => onBulkExport(selectedIds)}
      />
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="w-4 p-2" />
            <th className="p-2">Name</th>
            <th className="p-2"># Members</th>
            <th className="p-2">Created</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {segments.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="p-2">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(s.id)}
                  onChange={(e) =>
                    setSelectedIds((ids) =>
                      e.target.checked
                        ? [...ids, s.id]
                        : ids.filter((i) => i !== s.id),
                    )
                  }
                />
              </td>
              <td className="p-2">
                <InlineNameEditor
                  value={s.name}
                  onChange={(name) => onEdit(s, name)}
                />
              </td>
              <td className="p-2">{countFor(s)}</td>
              <td className="p-2">
                {new Date(s.createdAt).toLocaleDateString()}
              </td>
              <td className="p-2 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    title="Edit"
                    aria-label="Edit"
                    onClick={() => onEdit(s, s.name)}
                  >
                    <Edit2 className="h-4 w-4 text-[#888] hover:text-[#555]" />
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    aria-label="Delete"
                    onClick={() => onDelete(s.id)}
                  >
                    <Trash2 className="h-4 w-4 text-[#888] hover:text-[#555]" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
