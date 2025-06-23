"use client";
import { Button } from "@/components/ui";

interface Props {
  count: number;
  onDelete: () => void;
  onExport: () => void;
}

export default function BulkToolbar({ count, onDelete, onExport }: Props) {
  if (count === 0) return null;
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-white p-2 shadow">
      <span>{count} selected</span>
      <div className="flex gap-2">
        <Button type="button" className="bg-red-600 text-white" onClick={onDelete}>
          Delete Selected
        </Button>
        <Button type="button" className="bg-blue-600 text-white" onClick={onExport}>
          Export CSV
        </Button>
      </div>
    </div>
  );
}
