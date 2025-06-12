"use client";

import { useState } from "react";
import useSWR from "swr";

interface Contact {
  id: string;
  name: string;
  lastMessageAt: string | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface InboxListProps {
  onSelect: (contactId: string) => void;
}

export default function InboxList({ onSelect }: InboxListProps) {
  const { data } = useSWR<Contact[]>("/api/contacts", fetcher);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="fixed w-64 overflow-y-auto flex flex-col">
      {data?.map((c) => (
        <button
          key={c.id}
          onClick={() => {
            setSelectedId(c.id);
            onSelect(c.id);
          }}
          className={`text-left p-2 hover:bg-gray-100 ${
            selectedId === c.id ? "bg-blue-100" : ""
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
