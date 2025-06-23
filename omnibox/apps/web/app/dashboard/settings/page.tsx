"use client";

import useSWR from "swr";
import { Input, Button } from "@/components/ui";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SettingsPage() {
  const { data } = useSWR<{
    user: { name?: string | null; email?: string | null };
  }>("/api/profile", fetcher);
  const { data: billing } = useSWR<{ plan: string }>("/api/billing", fetcher);

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h2 className="mb-2 text-lg font-semibold">Profile</h2>
        <div className="space-y-2">
          <Input placeholder="Name" defaultValue={data?.user.name ?? ""} />
          <Input
            placeholder="Email"
            defaultValue={data?.user.email ?? ""}
            disabled
          />
          <Button>Save</Button>
        </div>
      </div>
      <div>
        <h2 className="mb-2 text-lg font-semibold">Billing</h2>
        <p>Current plan: {billing?.plan ?? "loading"}</p>
      </div>
    </div>
  );
}
