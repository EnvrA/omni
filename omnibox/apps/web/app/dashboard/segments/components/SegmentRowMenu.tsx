"use client";
import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui";

interface Props {
  onRun: () => void;
  onExport: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function SegmentRowMenu({ onRun, onExport, onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Actions">
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <ul className="absolute right-0 z-10 w-28 rounded border bg-white shadow">
          <li>
            <Button type="button" className="w-full text-left" onClick={() => {setOpen(false); onRun();}}>
              Run
            </Button>
          </li>
          <li>
            <Button type="button" className="w-full text-left" onClick={() => {setOpen(false); onExport();}}>
              Export
            </Button>
          </li>
          <li>
            <Button type="button" className="w-full text-left" onClick={() => {setOpen(false); onEdit();}}>
              Edit
            </Button>
          </li>
          <li>
            <Button type="button" className="w-full text-left text-red-600" onClick={() => {setOpen(false); onDelete();}}>
              Delete
            </Button>
          </li>
        </ul>
      )}
    </div>
  );
}
