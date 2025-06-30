"use client";
import useSWR from "swr";
import { useState, useEffect, useRef } from "react";
import { Input, Button, Textarea } from "@/components/ui";
import {
  DndContext,
  useDraggable,
  useDroppable,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  restrictToParentElement,
  snapCenterToCursor,
} from "@dnd-kit/modifiers";
import { toast } from "sonner";

const defaultLayout: Record<string, { zone: string; x: number; y: number }> = {
  logo: { zone: "header", x: 0, y: 0 },
  header: { zone: "header", x: 50, y: 0 },
  companyName: { zone: "header", x: 0, y: 20 },
  companyAddress: { zone: "header", x: 0, y: 40 },
  billTo: { zone: "billing", x: 0, y: 0 },
  amount: { zone: "totals", x: 0, y: 0 },
  dueDate: { zone: "totals", x: 120, y: 0 },
  body: { zone: "items", x: 0, y: 40 },
  notes: { zone: "notes", x: 0, y: 0 },
  footer: { zone: "footer", x: 0, y: 0 },
  terms: { zone: "footer", x: 0, y: 20 },
};

function toNewLayout(data: any) {
  const layout: Record<string, { zone: string; x: number; y: number }> = {};
  if (!data) return defaultLayout;
  for (const key of Object.keys(defaultLayout)) {
    const item = (data as any)[key];
    if (item) {
      let zone = item.zone || (defaultLayout as any)[key].zone;
      if (zone === "body") zone = "billing";
      if (zone === "terms") zone = "footer";
      layout[key] = {
        zone,
        x: item.x ?? (defaultLayout as any)[key].x,
        y: item.y ?? (defaultLayout as any)[key].y,
      };
    } else {
      layout[key] = (defaultLayout as any)[key];
    }
  }
  return layout;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
};

export default function InvoiceTemplatePage() {
  const { data, mutate } = useSWR<{ template: any }>(
    "/api/invoice/template",
    fetcher,
  );
  const [form, setForm] = useState({
    logoUrl: "",
    header: "",
    body: "",
    footer: "",
    companyName: "",
    companyAddress: "",
    notes: "",
    terms: "",
    accentColor: "",
    emailSubject: "",
    emailBody: "",
    layout: defaultLayout,
  });
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  useEffect(() => {
    if (data?.template) {
      setForm({
        logoUrl: data.template.logoUrl || "",
        header: data.template.header || "",
        body: data.template.body || "",
        footer: data.template.footer || "",
        companyName: data.template.companyName || "",
        companyAddress: data.template.companyAddress || "",
        notes: data.template.notes || "",
        terms: data.template.terms || "",
        accentColor: data.template.accentColor || "",
        emailSubject: data.template.emailSubject || "",
        emailBody: data.template.emailBody || "",
        layout: toNewLayout(data.template.layout),
      });
    }
  }, [data]);

  async function save() {
    const res = await fetch("/api/invoice/template", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      toast.error("Failed to save template");
    } else {
      toast.success("Template saved");
      mutate();
    }
  }

  async function previewPdf() {
    const res = await fetch("/api/invoice/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: 0,
        dueDate: new Date().toISOString(),
        clientName: "Client",
      }),
    });
    const j = await res.json();
    if (j.pdfBase64) {
      const binary = atob(j.pdfBase64);
      const len = binary.length;
      const arr = new Uint8Array(len);
      for (let i = 0; i < len; i++) arr[i] = binary.charCodeAt(i);
      const blob = new Blob([arr], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  function DraggableItem({
    id,
    children,
  }: {
    id: string;
    children: React.ReactNode;
  }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
      id,
    });
    const pos = form.layout[id] || { x: 0, y: 0 };
    const style = {
      position: "absolute" as const,
      left: pos.x + (transform?.x ?? 0),
      top: pos.y + (transform?.y ?? 0),
      cursor: "move",
      touchAction: "none" as const,
    };
    return (
      <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
        {children}
      </div>
    );
  }

  function TemplateEditor() {
    const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));
    const [overZone, setOverZone] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);

    const zones = [
      "header",
      "billing",
      "items",
      "totals",
      "notes",
      "footer",
    ] as const;
    const refs: Record<
      string,
      React.RefObject<HTMLDivElement>
    > = Object.fromEntries(zones.map((z) => [z, useRef<HTMLDivElement>(null)]));

    const handleDragEnd = (e: DragEndEvent) => {
      setDragging(false);
      setOverZone(null);
      const { active, over } = e;
      if (!over) return;
      const zone = over.id as string;
      const zoneRef = refs[zone];
      if (!zoneRef?.current) return;
      const zoneRect = zoneRef.current.getBoundingClientRect();
      const activeRect = e.active.rect.current.translated;
      const grid = 10;
      const x = Math.round((activeRect.left - zoneRect.left) / grid) * grid;
      const y = Math.round((activeRect.top - zoneRect.top) / grid) * grid;
      setForm((f) => ({
        ...f,
        layout: {
          ...f.layout,
          [active.id]: { zone, x, y },
        },
      }));
    };

    function Zone({ id, children }: { id: string; children: React.ReactNode }) {
      const { isOver, setNodeRef } = useDroppable({ id });
      const highlight = dragging && (isOver || overZone === id);
      return (
        <div
          ref={(el) => {
            setNodeRef(el);
            refs[id].current = el;
          }}
          id={id}
          className={`relative border border-dashed ${highlight ? "bg-blue-50" : ""}`}
          style={{ minHeight: 60 }}
          aria-label={`${id} drop zone`}
        >
          {children}
        </div>
      );
    }

    function Items({ zone }: { zone: string }) {
      return (
        <>
          {Object.keys(form.layout)
            .filter((key) => form.layout[key].zone === zone)
            .map((key) => (
              <DraggableItem key={key} id={key}>
                {renderItem(key)}
              </DraggableItem>
            ))}
        </>
      );
    }

    function renderItem(id: string) {
      switch (id) {
        case "logo":
          return form.logoUrl ? (
            <img
              src={form.logoUrl}
              alt="Logo"
              className="h-12 w-24 object-contain"
            />
          ) : (
            <div className="flex h-12 w-24 items-center justify-center bg-gray-200 text-xs">
              Logo
            </div>
          );
        case "header":
          return (
            <div className="text-sm font-semibold">
              {form.header || "Header"}
            </div>
          );
        case "companyName":
          return <div className="text-sm">{form.companyName || "Company"}</div>;
        case "companyAddress":
          return (
            <div className="text-xs">{form.companyAddress || "Address"}</div>
          );
        case "billTo":
          return <div className="text-sm">Bill To</div>;
        case "amount":
          return <div className="text-sm">Amount</div>;
        case "dueDate":
          return <div className="text-sm">Due Date</div>;
        case "body":
          return <div className="text-sm">{form.body || "Body"}</div>;
        case "notes":
          return <div className="text-xs">{form.notes || "Notes"}</div>;
        case "footer":
          return <div className="text-xs">{form.footer || "Footer"}</div>;
        case "terms":
          return <div className="text-[10px]">{form.terms || "Terms"}</div>;
        default:
          return id;
      }
    }

    return (
      <DndContext
        sensors={sensors}
        modifiers={[restrictToParentElement, snapCenterToCursor]}
        onDragStart={() => setDragging(true)}
        onDragOver={(e) => setOverZone(e.over?.id as string)}
        onDragEnd={handleDragEnd}
      >
        <div
          className="mx-auto mt-4 space-y-1 rounded border bg-white p-1"
          aria-label="Invoice layout editor"
        >
          {zones.map((z) => (
            <Zone key={z} id={z}>
              <Items zone={z} />
            </Zone>
          ))}
        </div>
      </DndContext>
    );
  }

  return (
    <div className="space-y-2">
      {form.logoUrl && (
        <img
          src={form.logoUrl}
          alt="Company logo"
          className="h-16 w-16 object-contain"
        />
      )}
      <Input
        type="file"
        aria-label="Company logo"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) =>
            setForm((f) => ({ ...f, logoUrl: ev.target?.result as string }));
          reader.readAsDataURL(file);
        }}
      />
      <Input
        placeholder="Header"
        value={form.header}
        onChange={(e) => setForm({ ...form, header: e.target.value })}
      />
      <Input
        placeholder="Company Name"
        value={form.companyName}
        onChange={(e) => setForm({ ...form, companyName: e.target.value })}
      />
      <Input
        placeholder="Company Address"
        value={form.companyAddress}
        onChange={(e) => setForm({ ...form, companyAddress: e.target.value })}
      />
      <Input
        placeholder="Body"
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
      />
      <Input
        placeholder="Footer"
        value={form.footer}
        onChange={(e) => setForm({ ...form, footer: e.target.value })}
      />
      <Textarea
        placeholder="Notes"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />
      <Textarea
        placeholder="Terms"
        value={form.terms}
        onChange={(e) => setForm({ ...form, terms: e.target.value })}
      />
      <Input
        placeholder="Accent Color (hex)"
        value={form.accentColor}
        onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
      />
      <Input
        placeholder="Email Subject"
        value={form.emailSubject}
        onChange={(e) => setForm({ ...form, emailSubject: e.target.value })}
      />
      <Textarea
        placeholder="Email Body"
        value={form.emailBody}
        onChange={(e) => setForm({ ...form, emailBody: e.target.value })}
      />
      <TemplateEditor />
      <div className="flex flex-wrap gap-2">
        <Button onClick={save}>Save Template</Button>
        <Button type="button" onClick={previewPdf}>
          Preview PDF
        </Button>
        <Button type="button" onClick={() => setShowEmailPreview(true)}>
          Preview Email
        </Button>
      </div>
      <div className="text-sm text-gray-600">
        Available shortcodes:{" "}
        {"{{invoiceNumber}}, {{clientName}}, {{amount}}, {{dueDate}}"}
      </div>
      {showEmailPreview && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowEmailPreview(false)}
        >
          <div
            className="w-80 space-y-2 rounded bg-white p-4 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold">
              {form.emailSubject || "(no subject)"}
            </h2>
            <p className="whitespace-pre-wrap text-sm">{form.emailBody}</p>
            <div className="flex justify-end">
              <Button type="button" onClick={() => setShowEmailPreview(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
