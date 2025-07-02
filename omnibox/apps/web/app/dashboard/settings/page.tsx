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
          {company.logoUrl && (
            <img
              src={company.logoUrl}
              alt="Company logo"
              className="h-16 w-16 object-contain"
            />
          )}
          <Input
            type="file"
            accept="image/*"
            aria-label="Company logo"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) =>
                setCompany({ ...company, logoUrl: ev.target?.result as string });
              reader.readAsDataURL(file);
            }}
          />
          <label className="block" htmlFor="company-name">
            Company Name<span className="text-red-600">*</span>
          </label>
          <Input
            id="company-name"
            required
            placeholder="Company Name"
            value={company.companyName}
            onChange={(e) =>
              setCompany({ ...company, companyName: e.target.value })
            }
          />
          <label className="block" htmlFor="company-address">
            Address and Number<span className="text-red-600">*</span>
          </label>
          <Input
            id="company-address"
            required
            placeholder="Address and Number"
            value={company.companyAddress}
            onChange={(e) =>
              setCompany({ ...company, companyAddress: e.target.value })
            }
          />
          <label className="block" htmlFor="contact-email">
            Contact Email<span className="text-red-600">*</span>
          </label>
          <Input
            id="contact-email"
            required
            placeholder="Contact Email"
            value={company.contactEmail}
            onChange={(e) =>
              setCompany({ ...company, contactEmail: e.target.value })
            }
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block" htmlFor="zip-code">
                Zip Code<span className="text-red-600">*</span>
              </label>
              <Input
                id="zip-code"
                required
                placeholder="Zip Code"
                value={company.zipCode}
                onChange={(e) =>
                  setCompany({ ...company, zipCode: e.target.value })
                }
              />
            </div>
            <div className="flex-1">
              <label className="block" htmlFor="city">
                City<span className="text-red-600">*</span>
              </label>
              <Input
                id="city"
                required
                placeholder="City"
                value={company.city}
                onChange={(e) =>
                  setCompany({ ...company, city: e.target.value })
                }
              />
            </div>
          </div>
          <label className="block" htmlFor="phone">Phone</label>
          <Input
            id="phone"
            placeholder="Phone"
            value={company.phone}
            onChange={(e) => setCompany({ ...company, phone: e.target.value })}
          />
          <Button
            onClick={saveCompany}
            className="border-green-700 bg-green-600 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
          >
            Save Company
          </Button>
        </div>
      </div>
    </div>
  );
}
