"use client";

import useSWR from "swr";
import { Input, Button } from "shadcn-ui-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SettingsPage() {
  const { data } = useSWR<{ user: { name?: string | null; email?: string | null } }>("/api/profile", fetcher);
  const { data: billing } = useSWR<{ plan: string }>("/api/billing", fetcher);

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h2 className="mb-2 text-lg font-semibold">Profile</h2>
        <div className="space-y-2">
          <Input placeholder="Name" defaultValue={data?.user.name ?? ""} />
          <Input placeholder="Email" defaultValue={data?.user.email ?? ""} disabled />
          <Button>Save</Button>
        </div>
      </div>
      <div>
        <h2 className="mb-2 text-lg font-semibold">Billing</h2>
        <p>Current plan: {billing?.plan ?? "loading"}</p>
      </div>
      <div>
        <h2 className="mb-2 text-lg font-semibold">Webhook URLs</h2>
        <ul className="space-y-2">
          {[
            "/api/webhook/email",
            "/api/webhook/sms",
            "/api/webhook/whatsapp",
          ].map(url => (
            <li key={url} className="flex items-center gap-2">
              <span className="font-mono text-sm">{url}</span>
              <Button
                size="sm"
                onClick={() => navigator.clipboard.writeText(location.origin + url)}
              >
                Copy
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
