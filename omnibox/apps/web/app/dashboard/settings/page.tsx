"use client";

import useSWR from "swr";
import { Input, Button } from "@/components/ui";
import { useState, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

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
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    const errs: Record<string, string> = {};
    if (!company.companyName) errs.companyName = "Company Name is required";
    if (!company.companyAddress) errs.companyAddress = "Address is required";
    if (!company.contactEmail) errs.contactEmail = "Contact Email is required";
    if (!company.zipCode) errs.zipCode = "Zip Code is required";
    if (!company.city) errs.city = "City is required";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const res = await fetch("/api/invoice/template", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(company),
    });
    if (res.ok) mutate();
  }

  return (
    <div className="space-y-6 max-w-md">
      {/* Profile */}
      <details open className="group rounded-lg border" style={{ borderColor: "#DDD" }}>
        <summary className="flex h-12 cursor-pointer items-center justify-between bg-[#F8F9FA] px-4 text-base">
          Profile
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-4 p-4">
          <div className="space-y-1">
            <label htmlFor="profile-name" className="text-sm text-[#333]">
              Name
            </label>
            <Input
              id="profile-name"
              className="w-full rounded-md border p-3"
              style={{ borderColor: "#CCC" }}
              defaultValue={data?.user.name ?? ""}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="profile-email" className="text-sm text-[#333]">
              Email
            </label>
            <Input
              id="profile-email"
              className="w-full rounded-md border p-3"
              style={{ borderColor: "#CCC" }}
              defaultValue={data?.user.email ?? ""}
              disabled
            />
          </div>
          <Button className="bg-blue-600 text-white">Save</Button>
        </div>
      </details>

      {/* Billing */}
      <details open className="group rounded-lg border" style={{ borderColor: "#DDD" }}>
        <summary className="flex h-12 cursor-pointer items-center justify-between bg-[#F8F9FA] px-4 text-base">
          Billing
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="p-4">
          <p>Current plan: {billing?.plan ?? "loading"}</p>
        </div>
      </details>

      {/* Company details */}
      <details open className="group rounded-lg border" style={{ borderColor: "#DDD" }}>
        <summary className="flex h-12 cursor-pointer items-center justify-between bg-[#F8F9FA] px-4 text-base">
          Company Details
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-4 p-4">
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            className="hidden"
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
          <label
            htmlFor="logo-upload"
            className="relative flex h-[100px] w-[200px] cursor-pointer items-center justify-center rounded-md border-2 border-dashed text-sm text-gray-500"
            style={{ borderColor: "#CCC" }}
          >
            {company.logoUrl && (
              <>
                <img
                  src={company.logoUrl}
                  alt="Logo preview"
                  className="absolute left-0 top-0 h-[100px] w-[100px] object-cover"
                />
                <button
                  type="button"
                  onClick={() => setCompany({ ...company, logoUrl: "" })}
                  className="absolute left-1 top-1 rounded bg-white p-0.5"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
            <span className={company.logoUrl ? "invisible" : ""}>Click to upload.</span>
          </label>

          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="company-name" className="text-sm text-[#333]">
                Company Name<span className="text-red-600">*</span>
              </label>
              <Input
                id="company-name"
                className="w-full rounded-md p-3"
                style={{ borderColor: errors.companyName ? "#DC3545" : "#CCC" }}
                value={company.companyName}
                onChange={(e) =>
                  setCompany({ ...company, companyName: e.target.value })
                }
              />
              {errors.companyName && (
                <p className="text-xs text-[#DC3545]">{errors.companyName}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="company-address" className="text-sm text-[#333]">
                Address and Number<span className="text-red-600">*</span>
              </label>
              <Input
                id="company-address"
                className="w-full rounded-md p-3"
                style={{ borderColor: errors.companyAddress ? "#DC3545" : "#CCC" }}
                value={company.companyAddress}
                onChange={(e) =>
                  setCompany({ ...company, companyAddress: e.target.value })
                }
              />
              {errors.companyAddress && (
                <p className="text-xs text-[#DC3545]">{errors.companyAddress}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="contact-email" className="text-sm text-[#333]">
                Contact Email<span className="text-red-600">*</span>
              </label>
              <Input
                id="contact-email"
                className="w-full rounded-md p-3"
                style={{ borderColor: errors.contactEmail ? "#DC3545" : "#CCC" }}
                value={company.contactEmail}
                onChange={(e) =>
                  setCompany({ ...company, contactEmail: e.target.value })
                }
              />
              {errors.contactEmail && (
                <p className="text-xs text-[#DC3545]">{errors.contactEmail}</p>
              )}
            </div>

            <div className="flex gap-4">
              <div className="flex-1 space-y-1">
                <label htmlFor="zip-code" className="text-sm text-[#333]">
                  Zip Code<span className="text-red-600">*</span>
                </label>
                <Input
                  id="zip-code"
                  className="w-full rounded-md p-3"
                  style={{ borderColor: errors.zipCode ? "#DC3545" : "#CCC" }}
                  value={company.zipCode}
                  onChange={(e) =>
                    setCompany({ ...company, zipCode: e.target.value })
                  }
                />
                {errors.zipCode && (
                  <p className="text-xs text-[#DC3545]">{errors.zipCode}</p>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <label htmlFor="city" className="text-sm text-[#333]">
                  City<span className="text-red-600">*</span>
                </label>
                <Input
                  id="city"
                  className="w-full rounded-md p-3"
                  style={{ borderColor: errors.city ? "#DC3545" : "#CCC" }}
                  value={company.city}
                  onChange={(e) =>
                    setCompany({ ...company, city: e.target.value })
                  }
                />
                {errors.city && (
                  <p className="text-xs text-[#DC3545]">{errors.city}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="phone" className="text-sm text-[#333]">
                Phone
              </label>
              <Input
                id="phone"
                className="w-full rounded-md p-3"
                style={{ borderColor: "#CCC" }}
                value={company.phone}
                onChange={(e) => setCompany({ ...company, phone: e.target.value })}
              />
            </div>

            <Button
              onClick={saveCompany}
              className="bg-green-600 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
            >
              Save Company
            </Button>
          </div>
        </div>
      </details>
    </div>
  );
}
