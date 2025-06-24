"use client";

import useSWR from "swr";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, Button } from "@/components/ui";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
};

const stageColors: Record<string, string> = {
  NEW: "#60a5fa",
  IN_PROGRESS: "#4ade80",
  WAITING: "#facc15",
  DONE: "#a3a3a3",
};

function DonutChart({ counts }: { counts: Record<string, number> }) {
  const stages = ["NEW", "IN_PROGRESS", "WAITING", "DONE"];
  const total = stages.reduce((s, k) => s + (counts[k] || 0), 0) || 1;
  let current = 0;
  const segments = stages
    .map((stage) => {
      const val = ((counts[stage] || 0) / total) * 100;
      const seg = `${stageColors[stage]} ${current}% ${current + val}%`;
      current += val;
      return seg;
    })
    .join(", ");
  return (
    <div className="relative flex items-center justify-center">
      <div
        className="h-24 w-24 rounded-full"
        style={{ background: `conic-gradient(${segments})` }}
      />
      <div className="absolute text-sm font-semibold">{total}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: contacts } = useSWR<{ contacts: any[] }>("/api/contacts", fetcher);
  const { data: deals } = useSWR<{ deals: any[] }>("/api/deals", fetcher);
  const { data: billing } = useSWR<{ plan: string }>("/api/billing", fetcher);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [extras, setExtras] = useState<Record<string, any>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setAppointments(JSON.parse(localStorage.getItem("appointments") || "[]"));
    } catch {}
    try {
      setExtras(JSON.parse(localStorage.getItem("dealExtras") || "{}"));
    } catch {}
  }, []);

  const unreadCount =
    contacts?.contacts?.filter((c) => c.lastMessageDirection === "IN").length ?? 0;
  const dealsInProgress = deals?.deals?.filter((d) => d.stage !== "DONE").length ?? 0;
  const remindersCount =
    deals?.deals?.filter((d) => d.reminderAt && new Date(d.reminderAt) > new Date()).length ?? 0;

  const pipelineCounts: Record<string, number> = {};
  deals?.deals?.forEach((d) => {
    pipelineCounts[d.stage] = (pipelineCounts[d.stage] || 0) + 1;
  });

  let pipelineValue = 0;
  deals?.deals?.forEach((d) => {
    const val = extras[d.id]?.value;
    if (val) pipelineValue += Number(val);
  });

  const upcoming = [
    ...appointments.map((a) => ({
      date: a.date,
      contactId: a.clientId,
      title: a.title,
    })),
    ...(deals?.deals || [])
      .filter((d) => extras[d.id]?.hasDeadline && extras[d.id]?.deadline)
      .map((d) => ({
        date: extras[d.id].deadline,
        contactId: d.contact.id,
        title: extras[d.id].title || d.contact.name || "Deal",
      })),
  ]
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const contactsMap = new Map((contacts?.contacts || []).map((c) => [c.id, c]));

  const contactsUsed = contacts?.contacts?.length ?? 0;
  const freeLimit = 100;
  const percent = Math.min(100, (contactsUsed / freeLimit) * 100);
  const plan = billing?.plan ?? "loading";

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/dashboard/inbox" className="block focus:outline-none">
          <Card className="text-center hover:bg-gray-50">
            <p className="text-sm text-gray-500">Unread Messages</p>
            <p className="text-2xl font-semibold" data-testid="unread-count">
              {unreadCount}
            </p>
          </Card>
        </Link>
        <Link href="/dashboard/deals" className="block focus:outline-none">
          <Card className="text-center hover:bg-gray-50">
            <p className="text-sm text-gray-500">Deals in Progress</p>
            <p className="text-2xl font-semibold">{dealsInProgress}</p>
          </Card>
        </Link>
        <Link href="/dashboard/calendar" className="block focus:outline-none">
          <Card className="text-center hover:bg-gray-50">
            <p className="text-sm text-gray-500">Upcoming Reminders</p>
            <p className="text-2xl font-semibold">{remindersCount}</p>
          </Card>
        </Link>
      </div>

      {/* Today schedule */}
      <div>
        <h2 className="mb-2 text-lg font-semibold">Today&apos;s Schedule</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming items</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {upcoming.map((e, i) => {
              const contact = contactsMap.get(e.contactId || "");
              const d = new Date(e.date);
              return (
                <li key={i} className="flex justify-between gap-2">
                  <span className="whitespace-nowrap">
                    {d.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="flex-1 truncate">
                    {contact?.name || "Unknown"}
                  </span>
                  {e.contactId && (
                    <Link href={`/dashboard/inbox?contact=${e.contactId}`}>
                      <Button className="bg-blue-600 text-white hover:bg-blue-700">Open</Button>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pipeline snapshot */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Pipeline Snapshot</h2>
        <div className="flex items-center gap-4">
          <DonutChart counts={pipelineCounts} />
          <div className="space-y-1 text-sm">
            <p>Total Value: ${pipelineValue}</p>
            {Object.entries(pipelineCounts).map(([stage, count]) => (
              <p key={stage} className="flex items-center gap-1">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ background: stageColors[stage] }}
                />
                {stage}: {count}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="mb-2 text-lg font-semibold">Recent Activity</h2>
        {(() => {
          const activities: { time: number; action: string }[] = [];
          Object.values(extras).forEach((ex: any) => {
            if (Array.isArray(ex.log)) activities.push(...ex.log);
          });
          activities.sort((a, b) => b.time - a.time);
          const recent = activities.slice(0, 5);
          return recent.length === 0 ? (
            <p className="text-sm text-gray-500">No recent activity</p>
          ) : (
            <ul className="space-y-1 text-sm overflow-y-auto max-h-40">
              {recent.map((a, i) => {
                const diff = Date.now() - a.time;
                const minutes = Math.round(diff / 60000);
                const timeAgo =
                  minutes >= 1440
                    ? `${Math.round(minutes / 1440)}d ago`
                    : minutes >= 60
                    ? `${Math.round(minutes / 60)}h ago`
                    : `${minutes}m ago`;
                return (
                  <li key={i} className="flex justify-between gap-2">
                    <span>{a.action}</span>
                    <span className="text-gray-500">{timeAgo}</span>
                  </li>
                );
              })}
            </ul>
          );
        })()}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard/clients">
          <Button className="bg-green-600 text-white hover:bg-green-700">New Contact</Button>
        </Link>
        <Link href="/dashboard/deals">
          <Button className="bg-blue-600 text-white hover:bg-blue-700">New Deal</Button>
        </Link>
        <Link href="/dashboard/inbox">
          <Button className="bg-indigo-600 text-white hover:bg-indigo-700">Send Message</Button>
        </Link>
      </div>

      {/* Usage & billing */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Usage &amp; Billing</h2>
        <div className="space-y-1">
          <div className="h-2 w-full rounded bg-gray-200" aria-label="Contacts usage">
            <div
              className="h-2 rounded bg-blue-600"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            {contactsUsed} / {freeLimit} contacts used
          </p>
        </div>
        <Card className="flex items-center justify-between">
          <span>Plan: {plan}</span>
          <Link href="/dashboard/settings">
            <Button>Manage Subscription</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
