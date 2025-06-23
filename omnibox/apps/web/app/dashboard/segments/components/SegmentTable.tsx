"use client";
import InlineNameEditor from "./InlineNameEditor";
import SegmentRowMenu from "./SegmentRowMenu";
import BulkToolbar from "./BulkToolbar";
import { Segment } from "../types";
import { Input } from "@/components/ui";
import { useState } from "react";

interface Props {
  segments: Segment[];
  countFor: (seg: Segment) => number;
  onRun: (seg: Segment) => void;
  onExport: (seg: Segment) => void;
  onEdit: (seg: Segment, name: string) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkExport: (ids: string[]) => void;
}

export default function SegmentTable({
  segments,
  countFor,
  onRun,
  onExport,
  onEdit,
  onDelete,
  onBulkDelete,
  onBulkExport,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const filtered = segments.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Search segments"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-60"
        />
        <BulkToolbar
          count={selectedIds.length}
          onDelete={() => {
            onBulkDelete(selectedIds);
            setSelectedIds([]);
          }}
          onExport={() => onBulkExport(selectedIds)}
        />
      </div>
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
          {filtered.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="p-2">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(s.id)}
                  onChange={(e) =>
                    setSelectedIds((ids) =>
                      e.target.checked ? [...ids, s.id] : ids.filter((i) => i !== s.id),
                    )
                  }
                />
              </td>
              <td className="p-2">
                <InlineNameEditor value={s.name} onChange={(name) => onEdit(s, name)} />
              </td>
              <td className="p-2">{countFor(s)}</td>
              <td className="p-2">{new Date(s.createdAt).toLocaleDateString()}</td>
              <td className="p-2 text-right">
                <SegmentRowMenu
                  onRun={() => onRun(s)}
                  onExport={() => onExport(s)}
                  onEdit={() => onEdit(s, s.name)}
                  onDelete={() => onDelete(s.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
