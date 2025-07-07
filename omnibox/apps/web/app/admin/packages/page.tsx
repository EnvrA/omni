"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button, Input } from "@/components/ui";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PackagesPage() {
  const { data, mutate } = useSWR("/api/admin/packages", fetcher);
  const [editing, setEditing] = useState<Record<string, any>>({});

  if (!data) return null;

  const pkgs = data.packages as any[];

  function handleChange(id: string, field: string, value: string) {
    setEditing((e) => ({ ...e, [id]: { ...e[id], [field]: value } }));
  }

  async function save(pkg: any) {
    await fetch("/api/admin/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...pkg, ...editing[pkg.id] }),
    });
    setEditing((e) => ({ ...e, [pkg.id]: undefined }));
    mutate();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Packages</h1>
      <p className="text-sm text-gray-500">
        Manage subscription packages here.
      </p>
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
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {pkgs.map((p) => {
              const edit = editing[p.id] || {};
              return (
                <tr key={p.id} className="border-t">
                  <td className="p-2">
                    <Input
                      value={edit.name ?? p.name}
                      onChange={(e) =>
                        handleChange(p.id, "name", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={edit.contactsLimit ?? p.contactsLimit}
                      onChange={(e) =>
                        handleChange(p.id, "contactsLimit", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={edit.dealsLimit ?? p.dealsLimit}
                      onChange={(e) =>
                        handleChange(p.id, "dealsLimit", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={edit.messagingLimit ?? p.messagingLimit}
                      onChange={(e) =>
                        handleChange(p.id, "messagingLimit", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={edit.invoicingLimit ?? p.invoicingLimit}
                      onChange={(e) =>
                        handleChange(p.id, "invoicingLimit", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={
                        edit.revenueReportingLimit ?? p.revenueReportingLimit
                      }
                      onChange={(e) =>
                        handleChange(
                          p.id,
                          "revenueReportingLimit",
                          e.target.value,
                        )
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={edit.segmentingLimit ?? p.segmentingLimit}
                      onChange={(e) =>
                        handleChange(p.id, "segmentingLimit", e.target.value)
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
