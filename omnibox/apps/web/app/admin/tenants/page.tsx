"use client";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Button, Input, Badge } from "@/components/ui";
import {
  MoreVertical,
  User,
  CreditCard,
  Trash,
  ArrowUp,
  ArrowDown,
  Pencil,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Tenant = {
  id: string;
  email: string;
  name: string | null;
  stripeCustomer: { plan: string } | null;
};

export default function TenantsPage() {
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<{ field: string; dir: "asc" | "desc" }>({ field: "", dir: "asc" });
  const [selected, setSelected] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [planTenant, setPlanTenant] = useState<Tenant | null>(null);
  const [editTenant, setEditTenant] = useState<(Tenant & { status: string }) | null>(null);
  const { data: packages } = useSWR("/api/admin/packages", fetcher);
  const { data, mutate } = useSWR(`/api/admin/tenants?q=${query}&plan=${plan}&status=${status}`, fetcher);

  async function saveTenant(form: FormData) {
    await fetch("/api/admin/tenants", {
      method: "POST",
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        plan: form.get("plan"),
      }),
      headers: { "Content-Type": "application/json" },
    });
    setAddOpen(false);
    mutate();
  }

  async function changePlan(id: string, newPlan: string) {
    await fetch(`/api/admin/tenants/${id}/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: newPlan }),
    });
    setPlanTenant(null);
    mutate();
  }

  async function changeStatus(id: string, newStatus: string) {
    await fetch(`/api/admin/tenants/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    mutate();
  }

  async function saveInfo(id: string, form: FormData) {
    await fetch(`/api/admin/tenants/${id}/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
      }),
    });
    setEditTenant(null);
    mutate();
  }

  const tenants = data ? [...data.tenants] : [];
  if (sort.field) {
    tenants.sort((a: any, b: any) => {
      const aVal = a[sort.field] ?? "";
      const bVal = b[sort.field] ?? "";
      if (aVal < bVal) return sort.dir === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-6">
        <Input
          className="border-b focus:outline-none"
          placeholder="Search tenants"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="border-b focus:outline-none"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
        >
          <option value="">All Plans</option>
          {packages?.packages.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          className="border-b focus:outline-none"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-blue-600 text-white rounded-full px-4 py-1"
        >
          + Add Tenant
        </Button>
      </div>

      <div className="overflow-x-auto">
        {selected.length > 0 && (
          <div className="p-2 flex gap-4 items-center text-sm">
            <span>{selected.length} selected</span>
            <Button
              onClick={() => {
                selected.forEach((id) => changeStatus(id, "inactive"));
                setSelected([]);
              }}
            >
              Deactivate
            </Button>
          </div>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">
                <input
                  type="checkbox"
                  checked={data && selected.length === data.tenants.length}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked ? tenants.map((t: any) => t.id) : []
                    )
                  }
                />
              </th>
              <th className="p-2 cursor-pointer" onClick={() => setSort({ field: "name", dir: sort.dir === "asc" ? "desc" : "asc" })}>
                Company {sort.field === "name" && (sort.dir === "asc" ? <ArrowUp className="inline h-3" /> : <ArrowDown className="inline h-3" />)}
              </th>
              <th className="p-2 cursor-pointer" onClick={() => setSort({ field: "plan", dir: sort.dir === "asc" ? "desc" : "asc" })}>
                Plan {sort.field === "plan" && (sort.dir === "asc" ? <ArrowUp className="inline h-3" /> : <ArrowDown className="inline h-3" />)}
              </th>
              <th className="p-2 cursor-pointer" onClick={() => setSort({ field: "status", dir: sort.dir === "asc" ? "desc" : "asc" })}>
                Status {sort.field === "status" && (sort.dir === "asc" ? <ArrowUp className="inline h-3" /> : <ArrowDown className="inline h-3" />)}
              </th>
              <th className="p-2">Users</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((u: any) => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(u.id)}
                    onChange={(e) =>
                      setSelected((s) =>
                        e.target.checked ? [...s, u.id] : s.filter((i) => i !== u.id)
                      )
                    }
                    className="mr-2"
                  />
                  {u.name ?? u.email}
                </td>
                <td className="p-2">
                  <Badge className={u.stripeCustomer?.plan === "pro" ? "bg-green-100" : "bg-gray-100"}>
                    {u.stripeCustomer?.plan ?? "starter"}
                  </Badge>
                </td>
                <td className="p-2">{u.status}</td>
                <td className="p-2">1</td>
                <td className="p-2 text-right">
                  <details className="relative">
                    <summary className="cursor-pointer p-1 inline-block rounded hover:bg-gray-100">
                      <MoreVertical className="h-4 w-4" />
                    </summary>
                    <div className="absolute right-0 mt-1 w-40 rounded border bg-white shadow-lg z-10">
                      <Link
                        href={`/admin/tenants/${u.id}/impersonate`}
                        className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100"
                      >
                        <User className="h-4 w-4" /> Impersonate
                      </Link>
                      <button
                        onClick={() => setPlanTenant(u)}
                        className="flex w-full items-center gap-2 px-2 py-1 hover:bg-gray-100"
                      >
                        <CreditCard className="h-4 w-4" /> Change Plan
                      </button>
                      <button
                        onClick={() => changeStatus(u.id, u.status === "active" ? "inactive" : "active")}
                        className="flex w-full items-center gap-2 px-2 py-1 hover:bg-gray-100"
                      >
                        <Pencil className="h-4 w-4" /> Toggle Status
                      </button>
                      <button
                        onClick={() => setEditTenant(u)}
                        className="flex w-full items-center gap-2 px-2 py-1 hover:bg-gray-100"
                      >
                        <Pencil className="h-4 w-4" /> Edit Info
                      </button>
                      <button className="flex w-full items-center gap-2 px-2 py-1 text-red-600 hover:bg-gray-100">
                        <Trash className="h-4 w-4" /> Cancel
                      </button>
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {addOpen && (
        <dialog open className="fixed inset-0 flex items-center justify-center bg-black/50" onClick={() => setAddOpen(false)}>
          <form
            className="w-80 space-y-2 rounded bg-white p-4 shadow"
            onClick={(e) => e.stopPropagation()}
            action={async (formData) => {
              await saveTenant(formData);
            }}
          >
            <h2 className="text-lg font-semibold">Add Tenant</h2>
            <Input name="name" placeholder="Company name" className="w-full" />
            <Input name="email" type="email" placeholder="Admin email" className="w-full" />
            <select name="plan" className="border-b w-full">
              {packages?.packages.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 text-white">
                Save
              </Button>
            </div>
          </form>
        </dialog>
      )}

      {planTenant && (
        <dialog open className="fixed inset-0 flex items-center justify-center bg-black/50" onClick={() => setPlanTenant(null)}>
          <div className="w-60 space-y-2 rounded bg-white p-4 shadow" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Change Plan</h2>
            <select
              defaultValue={planTenant.stripeCustomer?.plan ?? ""}
              className="border-b w-full"
              onChange={(e) => changePlan(planTenant.id, e.target.value)}
            >
              {packages?.packages.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end">
              <Button type="button" onClick={() => setPlanTenant(null)}>Close</Button>
            </div>
          </div>
        </dialog>
      )}

      {editTenant && (
        <dialog open className="fixed inset-0 flex items-center justify-center bg-black/50" onClick={() => setEditTenant(null)}>
          <form
            className="w-80 space-y-2 rounded bg-white p-4 shadow"
            onClick={(e) => e.stopPropagation()}
            action={async (formData) => {
              await saveInfo(editTenant.id, formData);
            }}
          >
            <h2 className="text-lg font-semibold">Edit Tenant</h2>
            <Input name="name" defaultValue={editTenant.name ?? ""} className="w-full" />
            <Input name="email" type="email" defaultValue={editTenant.email} className="w-full" />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" onClick={() => setEditTenant(null)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 text-white">Save</Button>
            </div>
          </form>
        </dialog>
      )}
    </div>
  );
}
