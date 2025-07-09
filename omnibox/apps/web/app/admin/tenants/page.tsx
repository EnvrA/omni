"use client";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Button, Input, Badge } from "@/components/ui";
import {
  MoreVertical,
  User,
  CreditCard,
  Trash2,
  UserPlus,
  PlusCircle,
  ArrowUp,
  ArrowDown,
  Pencil,
  Search,
  Layers,
  Bell,
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
  const [openActions, setOpenActions] = useState<string | null>(null);
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

  async function deleteTenant(id: string) {
    if (!confirm("Delete this user?")) return;
    await fetch(`/api/admin/tenants/${id}`, { method: "DELETE" });
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
        <div className="relative w-72">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            className="border-b focus:outline-none pl-7 w-full"
            placeholder="Search users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="relative w-48">
          <Layers className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <select
            className="border-b focus:outline-none pl-7 w-full"
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
        </div>
        <div className="relative w-48">
          <Bell className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <select
            className="border-b focus:outline-none pl-7 w-full"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 h-10 px-4 bg-[#1F8A70] text-white rounded-lg hover:bg-[#166653]"
        >
          <PlusCircle className="h-5 w-5" /> Add User
        </Button>
      </div>
      {(plan || status) && (
        <div className="flex gap-2 mt-2">
          {plan && (
            <span className="text-xs px-2 py-1 rounded-full bg-[#E3F2FD] text-[#0D47A1] flex items-center gap-1">
              {packages?.packages.find((p: any) => p.id === plan)?.name || plan}
              <button onClick={() => setPlan("")}>×</button>
            </span>
          )}
          {status && (
            <span className="text-xs px-2 py-1 rounded-full bg-[#E3F2FD] text-[#0D47A1] flex items-center gap-1">
              {status}
              <button onClick={() => setStatus("")}>×</button>
            </span>
          )}
        </div>
      )}

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
          <thead className="sticky top-0 bg-white border-b">
            <tr className="text-left border-b">
              <th className="p-2 w-12 text-center">
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
              <th className="p-2">Users</th>
              <th className="p-2 w-12 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((u: any) => (
              <tr key={u.id} className="border-t odd:bg-[#FCFCFC] even:bg-white hover:bg-[#F5F5F5]">
                <td className="p-2 w-12 text-center">
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
                  <span className="font-bold text-base">{u.name ?? u.email}</span>
                  {" "}
                  <Badge className="ml-2 bg-gray-100">{u.stripeCustomer?.plan ?? "starter"}</Badge>
                </td>
                  <td className="p-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs text-white"
                      style={{
                        backgroundColor:
                          u.status === "active"
                            ? "#28A745"
                            : u.status === "suspended"
                            ? "#DC3545"
                            : "#6C757D",
                      }}
                    >
                      {u.status}
                    </span>
                  </td>
                <td className="p-2">1</td>
                <td className="p-2 w-12 text-right relative">
                  <button
                    className="p-1 rounded hover:bg-[#F5F5F5]"
                    onClick={() =>
                      setOpenActions(openActions === u.id ? null : u.id)
                    }
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {openActions === u.id && (
                    <div
                      className="absolute right-0 mt-1 z-[100] bg-white rounded-lg shadow-lg border w-max py-2 px-0 max-h-60 overflow-y-auto"
                    >
                      <Link
                        href={`/admin/tenants/${u.id}/impersonate`}
                        className="flex items-center gap-2 px-2 h-10 text-base hover:bg-[#F5F5F5] active:bg-[#E0E0E0]"
                      >
                        <User className="h-4 w-4" /> Impersonate User
                      </Link>
                      <button
                        onClick={() => {
                          setPlanTenant(u);
                          setOpenActions(null);
                        }}
                        className="flex w-full items-center gap-2 px-2 h-10 text-base hover:bg-[#F5F5F5] active:bg-[#E0E0E0]"
                      >
                        <CreditCard className="h-4 w-4" /> Change Plan
                      </button>
                      <button
                        onClick={() => {
                          setAddOpen(true);
                          setOpenActions(null);
                        }}
                        className="flex w-full items-center gap-2 px-2 h-10 text-base hover:bg-[#F5F5F5] active:bg-[#E0E0E0]"
                      >
                        <UserPlus className="h-4 w-4" /> Add User
                      </button>
                      <button
                        onClick={() => {
                          deleteTenant(u.id);
                          setOpenActions(null);
                        }}
                        className="flex w-full items-center gap-2 px-2 h-10 text-base text-[#DC3545] hover:bg-[#F5F5F5] active:bg-[#E0E0E0]"
                      >
                        <Trash2 className="h-4 w-4" /> Delete User
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-center gap-2 mt-4">
        <button className="px-3 py-1 rounded bg-[#F0F0F0] text-[#555]">‹ Prev</button>
        {[1, 2, 3].map((p) => (
          <button
            key={p}
            className={`px-3 py-1 rounded-full ${p === 1 ? 'bg-[#1F8A70] text-white' : 'bg-[#F0F0F0] text-[#555]'}`}
          >
            {p}
          </button>
        ))}
        <button className="px-3 py-1 rounded bg-[#F0F0F0] text-[#555]">Next ›</button>
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
            <h2 className="text-lg font-semibold">Add User</h2>
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
            <h2 className="text-lg font-semibold">Edit User</h2>
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
