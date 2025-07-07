"use client";
import { useState } from "react";
import useSWR from "swr";
import { Spinner } from "@/components/ui";

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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Timestamp</th>
                <th className="p-2">Tenant</th>
                <th className="p-2">Level</th>
                <th className="p-2">Message</th>
                <th className="p-2">Resolved</th>
              </tr>
            </thead>
            <tbody>
              {data.logs.map((l: any) => (
                <tr key={l.id} className="border-t">
                  <td className="p-2 whitespace-nowrap">
                    {new Date(l.timestamp).toLocaleString()}
                  </td>
                  <td className="p-2">{l.tenant}</td>
                  <td className="p-2">{l.level}</td>
                  <td className="p-2">{l.message}</td>
                  <td className="p-2">
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={l.resolved}
                        onChange={() => resolve(l.id)}
                      />
                      <span className="sr-only">Resolved</span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
