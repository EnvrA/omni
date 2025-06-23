"use client";
import { useState } from "react";
import { Input } from "@/components/ui";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function InlineNameEditor({ value, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(value);

  if (editing) {
    return (
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (name !== value) onChange(name);
        }}
        autoFocus
        className="w-full"
      />
    );
  }

  return (
    <span onDoubleClick={() => setEditing(true)} className="cursor-text">
      {value}
    </span>
  );
}
