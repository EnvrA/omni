"use client";

import useSWR from "swr";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, Button } from "@/components/ui";
import {
  Mail,
  Handshake as HandshakeIcon,
  Bell,
  Plus,
  UserPlus,
  Briefcase,
  MessageCircle,
} from "lucide-react";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
};

function DonutChart({
  newCount,
  total,
  totalValue,
}: {
  newCount: number;
  total: number;
  totalValue: number;
}) {
  const percent = total > 0 ? (newCount / total) * 100 : 0;
  const segments = `#1F8A70 0% ${percent}%, #E0E0E0 ${percent}% 100%`;
  return (
    <div
      className="relative flex items-center justify-center"
      title={`Total Value: $${totalValue}`}
    >
      <div
        className="relative h-24 w-24 rounded-full"
        style={{ background: `conic-gradient(${segments})` }}
      >
        <div className="absolute inset-3 rounded-full bg-white" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center text-[14px] text-center">
        New: {newCount} deals
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: contacts } = useSWR<{ contacts: any[] }>("/api/contacts", fetcher);
  const { data: deals } = useSWR<{ deals: any[] }>("/api/deals", fetcher);
  const { data: billing } = useSWR<{ plan: string }>("/api/billing", fetcher);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [extras, setExtras] = useState<Record<string, any>>({});
  const [actionsOpen, setActionsOpen] = useState(false);

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
          <Card className="relative flex items-center justify-center rounded-xl p-4 shadow-[0_4px_8px_rgba(0,0,0,0.05)] hover:bg-gray-50">
            <Mail className="absolute left-4 top-4 h-5 w-5 text-gray-500" />
            <div className="text-center">
              <p className="text-sm leading-4 text-gray-500">Unread Messages</p>
              <p className="text-2xl font-semibold" data-testid="unread-count">{unreadCount}</p>
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/deals" className="block focus:outline-none">
          <Card className="relative flex items-center justify-center rounded-xl p-4 shadow-[0_4px_8px_rgba(0,0,0,0.05)] hover:bg-gray-50">
            <HandshakeIcon className="absolute left-4 top-4 h-5 w-5 text-gray-500" />
            <div className="text-center">
              <p className="text-sm leading-4 text-gray-500">Deals in Progress</p>
              <p className="text-2xl font-semibold">{dealsInProgress}</p>
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/calendar" className="block focus:outline-none">
          <Card className="relative flex items-center justify-center rounded-xl p-4 shadow-[0_4px_8px_rgba(0,0,0,0.05)] hover:bg-gray-50">
            <Bell className="absolute left-4 top-4 h-5 w-5 text-gray-500" />
            <div className="text-center">
              <p className="text-sm leading-4 text-gray-500">Upcoming Reminders</p>
              <p className="text-2xl font-semibold">{remindersCount}</p>
            </div>
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
          <DonutChart
            newCount={pipelineCounts.NEW || 0}
            total={Object.values(pipelineCounts).reduce((s, n) => s + n, 0)}
            totalValue={pipelineValue}
          />
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
      <div className="relative inline-block">
        <Button
          type="button"
          onClick={() => setActionsOpen((o) => !o)}
          className="flex items-center gap-1 bg-[#1F8A70] text-white hover:bg-[#176a55]"
        >
          <Plus className="h-4 w-4" /> Add
        </Button>
        {actionsOpen && (
          <ul className="absolute z-10 mt-2 w-40 rounded-lg border bg-white shadow" role="menu">
            <li>
              <Link
                href="/dashboard/clients"
                className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100"
                onClick={() => setActionsOpen(false)}
              >
                <UserPlus className="h-4 w-4" /> New Contact
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/deals"
                className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100"
                onClick={() => setActionsOpen(false)}
              >
                <Briefcase className="h-4 w-4" /> New Deal
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/inbox"
                className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100"
                onClick={() => setActionsOpen(false)}
              >
                <MessageCircle className="h-4 w-4" /> Send Message
              </Link>
            </li>
          </ul>
        )}
      </div>

      {/* Usage & billing */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Usage &amp; Billing</h2>
        <div className="space-y-1">
          <div className="relative h-3 w-full rounded-md bg-[#E0E0E0]" aria-label="Contacts usage">
            <div
              className="flex h-full items-center justify-center rounded-md bg-[#1F8A70] text-[10px] text-white"
              style={{ width: `${percent}%` }}
            >
              {contactsUsed} / {freeLimit}
            </div>
          </div>
        </div>
        <Card className="flex items-center justify-between p-4">
          <span>Plan: {plan}</span>
          <Link href="/dashboard/settings">
            <Button className="border-[#1F8A70] text-[#1F8A70]">Manage Subscription</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
