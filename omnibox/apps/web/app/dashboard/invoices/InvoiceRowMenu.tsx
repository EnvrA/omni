"use client";
import { useState } from "react";
import {
  MoreVertical,
  Edit2,
  CheckCircle,
  Mail,
  Trash2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui";

interface Props {
  onEdit: () => void;
  onMarkPaid: () => void;
  onSend: () => void;
  onDelete: () => void;
  onPdf: () => void;
  showMarkPaid?: boolean;
  showSend?: boolean;
}

export default function InvoiceRowMenu({
  onEdit,
  onMarkPaid,
  onSend,
  onDelete,
  onPdf,
  showMarkPaid = true,
  showSend = true,
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Actions">
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <ul className="absolute right-0 z-10 w-32 rounded border bg-white shadow">
          <li>
            <Button
              type="button"
              className="flex w-full items-center gap-2 px-2 py-1 text-left hover:bg-gray-100"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            >
              <Edit2 className="h-4 w-4" /> Edit
            </Button>
          </li>
          {showMarkPaid && (
            <li>
              <Button
                type="button"
                className="flex w-full items-center gap-2 px-2 py-1 text-left text-green-600 hover:bg-gray-100"
                onClick={() => {
                  setOpen(false);
                  onMarkPaid();
                }}
              >
                <CheckCircle className="h-4 w-4" /> Mark Paid
              </Button>
            </li>
          )}
          {showSend && (
            <li>
              <Button
                type="button"
                className="flex w-full items-center gap-2 px-2 py-1 text-left text-green-600 hover:bg-gray-100"
                onClick={() => {
                  setOpen(false);
                  onSend();
                }}
              >
                <Mail className="h-4 w-4" /> Send
              </Button>
            </li>
          )}
          <li>
            <Button
              type="button"
              className="flex w-full items-center gap-2 px-2 py-1 text-left text-red-600 hover:bg-gray-100"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </li>
          <li>
            <Button
              type="button"
              className="flex w-full items-center gap-2 px-2 py-1 text-left hover:bg-gray-100"
              onClick={() => {
                setOpen(false);
                onPdf();
              }}
            >
              <FileText className="h-4 w-4" /> PDF
            </Button>
          </li>
        </ul>
      )}
    </div>
  );
}
