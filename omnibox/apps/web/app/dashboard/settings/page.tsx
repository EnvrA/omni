"use client";

import useSWR from "swr";
import { Input, Button } from "@/components/ui";
import { useState, useEffect } from "react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SettingsPage() {
  const { data } = useSWR<{
    user: { name?: string | null; email?: string | null };
  }>("/api/profile", fetcher);
  const { data: billing } = useSWR<{ plan: string }>("/api/billing", fetcher);
  const { data: template, mutate } = useSWR<{ template: any }>(
    "/api/invoice/template",
    fetcher,
  );

  const [company, setCompany] = useState({
    logoUrl: "",
    companyName: "",
    companyAddress: "",
    contactEmail: "",
    zipCode: "",
    city: "",
    phone: "",
  });

  useEffect(() => {
    if (template?.template) {
      const t = template.template;
      setCompany({
        logoUrl: t.logoUrl || "",
        companyName: t.companyName || "",
        companyAddress: t.companyAddress || "",
        contactEmail: t.contactEmail || "",
        zipCode: t.zipCode || "",
        city: t.city || "",
        phone: t.phone || "",
      });
    }
  }, [template]);

  async function saveCompany() {
    const res = await fetch("/api/invoice/template", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(company),
    });
    if (res.ok) mutate();
  }

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
      <div>
        <h2 className="mb-2 text-lg font-semibold">Company Details</h2>
        <div className="space-y-2">
          <Input
            placeholder="Logo URL"
            value={company.logoUrl}
            onChange={(e) => setCompany({ ...company, logoUrl: e.target.value })}
          />
          <Input
            placeholder="Company Name"
            value={company.companyName}
            onChange={(e) =>
              setCompany({ ...company, companyName: e.target.value })
            }
          />
          <Input
            placeholder="Address and Number"
            value={company.companyAddress}
            onChange={(e) =>
              setCompany({ ...company, companyAddress: e.target.value })
            }
          />
          <Input
            placeholder="Contact Email"
            value={company.contactEmail}
            onChange={(e) =>
              setCompany({ ...company, contactEmail: e.target.value })
            }
          />
          <div className="flex gap-2">
            <Input
              placeholder="Zip Code"
              value={company.zipCode}
              onChange={(e) =>
                setCompany({ ...company, zipCode: e.target.value })
              }
              className="flex-1"
            />
            <Input
              placeholder="City"
              value={company.city}
              onChange={(e) => setCompany({ ...company, city: e.target.value })}
              className="flex-1"
            />
          </div>
          <Input
            placeholder="Phone"
            value={company.phone}
            onChange={(e) => setCompany({ ...company, phone: e.target.value })}
          />
          <Button onClick={saveCompany}>Save Company</Button>
        </div>
      </div>
    </div>
  );
}
