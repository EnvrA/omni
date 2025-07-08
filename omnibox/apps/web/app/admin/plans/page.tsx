"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { v4 as uuidv4 } from "uuid";
import { Button, Input } from "@/components/ui";
import { ArrowUp, ArrowDown, Trash } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PlansPage() {
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

  async function saveOrder(newPkgs: any[]) {
    setPkgs(newPkgs);
    await fetch("/api/admin/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packages: newPkgs }),
    });
    mutate();
  }

  function move(id: string, dir: "up" | "down") {
    const index = pkgs.findIndex((p) => p.id === id);
    const newIndex = dir === "up" ? index - 1 : index + 1;
    if (index === -1 || newIndex < 0 || newIndex >= pkgs.length) return;
    const copy = [...pkgs];
    const [removed] = copy.splice(index, 1);
    copy.splice(newIndex, 0, removed);
    saveOrder(copy);
  }

  async function deletePackage(id: string) {
    if (!confirm("Delete this plan?")) return;
    await fetch(`/api/admin/packages/${id}`, { method: "DELETE" });
    setPkgs((p) => p.filter((pkg) => pkg.id !== id));
    mutate();
  }

  function addPackage() {
    const pkg = {
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
    };
    setPkgs((p) => [...p, pkg]);
    save(pkg);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Plans</h1>
      <p className="text-sm text-gray-500">
        Manage subscription plans here.
      </p>
      <Button onClick={addPackage}>Add Plan</Button>
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
                  <td className="p-2 flex items-center gap-1">
                    <button
                      onClick={() => move(p.id, "up")}
                      className="p-1 hover:text-blue-600"
                    >
                      <ArrowUp className="h-4 w-4" />
                      <span className="sr-only">Move up</span>
                    </button>
                    <button
                      onClick={() => move(p.id, "down")}
                      className="p-1 hover:text-blue-600"
                    >
                      <ArrowDown className="h-4 w-4" />
                      <span className="sr-only">Move down</span>
                    </button>
                    <Button onClick={() => save(p)}>Save</Button>
                    <button
                      onClick={() => deletePackage(p.id)}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </button>
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
