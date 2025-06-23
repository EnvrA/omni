"use client";
import { useState } from "react";
import useSWR from "swr";
import { Spinner, Button } from "@/components/ui";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LogsPage() {
  const [query, setQuery] = useState("");
  const { data, mutate } = useSWR(`/api/admin/logs?q=${query}`, fetcher);

  async function resolve(id: string) {
    await fetch(`/api/admin/logs/${id}`, { method: "POST" });
    mutate();
  }

  return (
    <div className="space-y-4">
      <input
        className="border rounded p-1"
        placeholder="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {!data && <Spinner />}
      {data && (
        <ul className="space-y-2">
          {data.logs.map((l: any) => (
            <li key={l.id} className="border rounded p-2 flex justify-between">
              <span>
                {l.timestamp} – {l.message}
              </span>
              <label className="inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={l.resolved}
                  onChange={() => resolve(l.id)}
                />
                Resolved
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
