"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { v4 as uuidv4 } from "uuid";
import { Button, Input } from "@/components/ui";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PackagesPage() {
  const { data, mutate } = useSWR("/api/admin/packages", fetcher);
  const [pkgs, setPkgs] = useState<any[]>([]);

  useEffect(() => {
    if (data) setPkgs(data.packages);
  }, [data]);

  function handleChange(id: string, field: string, value: string) {
    setPkgs((p) => p.map((pkg) => (pkg.id === id ? { ...pkg, [field]: value } : pkg)));
  }

  async function save(pkg: any) {
    await fetch("/api/admin/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pkg),
    });
    mutate();
  }

  function addPackage() {
    setPkgs((p) => [
      ...p,
      {
        id: uuidv4(),
        name: "",
        contactsLimit: 0,
        dealsLimit: 0,
        messagingLimit: 0,
        invoicingLimit: 0,
        revenueReportingLimit: 0,
        segmentingLimit: 0,
        monthlyPrice: 0,
        yearlyPrice: 0,
      },
    ]);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Packages</h1>
      <p className="text-sm text-gray-500">
        Manage subscription packages here.
      </p>
      <Button onClick={addPackage}>Add Package</Button>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Contacts</th>
              <th className="p-2">Deals</th>
              <th className="p-2">Messages</th>
              <th className="p-2">Invoices</th>
              <th className="p-2">Revenue</th>
              <th className="p-2">Segments</th>
              <th className="p-2">Monthly</th>
              <th className="p-2">Yearly</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {pkgs.map((p) => {
              return (
                <tr key={p.id} className="border-t">
                  <td className="p-2">
                    <Input
                      value={p.name}
                      onChange={(e) => handleChange(p.id, "name", e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={p.contactsLimit}
                      onChange={(e) =>
                        handleChange(p.id, "contactsLimit", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={p.dealsLimit}
                      onChange={(e) =>
                        handleChange(p.id, "dealsLimit", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={p.messagingLimit}
                      onChange={(e) =>
                        handleChange(p.id, "messagingLimit", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={p.invoicingLimit}
                      onChange={(e) =>
                        handleChange(p.id, "invoicingLimit", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={p.revenueReportingLimit}
                      onChange={(e) =>
                        handleChange(p.id, "revenueReportingLimit", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={p.segmentingLimit}
                      onChange={(e) =>
                        handleChange(p.id, "segmentingLimit", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={p.monthlyPrice}
                      onChange={(e) =>
                        handleChange(p.id, "monthlyPrice", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={p.yearlyPrice}
                      onChange={(e) =>
                        handleChange(p.id, "yearlyPrice", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Button onClick={() => save(p)}>Save</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
