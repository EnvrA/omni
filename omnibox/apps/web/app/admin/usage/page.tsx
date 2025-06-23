"use client";
import { useState } from "react";
import useSWR from "swr";
import { Spinner } from "@/components/ui";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UsageMetrics() {
  const [channel, setChannel] = useState("ALL");
  const [range, setRange] = useState("30");
  const { data } = useSWR(
    `/api/admin/usage?channel=${channel}&range=${range}`,
    fetcher,
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select
          className="border rounded p-1"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
        <select
          className="border rounded p-1"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
        >
          <option value="ALL">All</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="SMS">SMS</option>
          <option value="EMAIL">Email</option>
        </select>
      </div>

      {!data && <Spinner />}
      {data && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Date</th>
              <th className="p-2">Messages</th>
              <th className="p-2">Avg Response</th>
              <th className="p-2">Deals Closed</th>
            </tr>
          </thead>
          <tbody>
            {data.metrics.map((m: any) => (
              <tr key={m.date} className="border-t">
                <td className="p-2">{m.date}</td>
                <td className="p-2">{m.messages}</td>
                <td className="p-2">{m.response} ms</td>
                <td className="p-2">{m.deals}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
