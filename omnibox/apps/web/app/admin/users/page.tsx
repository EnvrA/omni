"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import {
  MoreVertical,
  UserCheck,
  CreditCard,
  UserMinus,
  PlusCircle,
  Search,
  Layers,
  Bell,
  CheckCircle,
  Briefcase,
  Users as UsersIcon,
  UserPlus,
  Pencil,
  ChevronUp,
  ChevronDown,
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
  const { data, mutate } = useSWR(`/api/admin/users?q=${query}&plan=${plan}&status=${status}`, fetcher);

  useEffect(() => {
    if (!openActions) return;
    const close = () => setOpenActions(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [openActions]);

  function toggleSort(field: string) {
    setSort((s) => ({ field, dir: s.field === field && s.dir === "asc" ? "desc" : "asc" }));
  }

  const getValue = (u: any, field: string) => {
    if (field === "plan") return u.stripeCustomer?.plan ?? "";
    if (field === "user") return u.name ?? u.email ?? "";
    return u[field] ?? "";
  };

  async function saveTenant(form: FormData) {
    await fetch("/api/admin/users", {
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
    await fetch(`/api/admin/users/${id}/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: newPlan }),
    });
    setPlanTenant(null);
    mutate();
  }

  async function changeStatus(id: string, newStatus: string) {
    await fetch(`/api/admin/users/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    mutate();
  }

  async function saveInfo(id: string, form: FormData) {
    await fetch(`/api/admin/users/${id}/info`, {
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
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    mutate();
  }

  const tenants = data ? [...data.tenants] : [];
  if (sort.field) {
    tenants.sort((a: any, b: any) => {
      const aVal = getValue(a, sort.field);
      const bVal = getValue(b, sort.field);
      if (aVal < bVal) return sort.dir === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-6">
        <div className="relative w-[280px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            className="border-b focus:outline-none pl-7 w-full"
            placeholder="Search users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="relative w-[200px]">
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
        <div className="relative w-[200px]">
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
          className="ml-auto flex items-center gap-2 h-10 px-4 bg-[#1F8A70] text-white rounded-lg hover:bg-[#166653]"
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
                  className="h-5 w-5"
                />
              </th>
              <th className="p-2 text-[16px] font-bold text-[#333]">
                <button className="flex items-center gap-1" onClick={() => toggleSort('user')}>
                  User
                  {sort.field === 'user' && (
                    sort.dir === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th className="p-2 text-[16px] font-bold">
                <button className="inline-flex items-center gap-1" onClick={() => toggleSort('plan')}>
                  <Layers className="h-4 w-4" /> Plan
                  {sort.field === 'plan' && (
                    sort.dir === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th className="p-2 text-[16px] font-bold">
                <button className="inline-flex items-center gap-1" onClick={() => toggleSort('status')}>
                  <CheckCircle className="h-4 w-4" /> Status
                  {sort.field === 'status' && (
                    sort.dir === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th className="p-2 text-[16px] font-bold">
                <button className="inline-flex items-center gap-1" onClick={() => toggleSort('name')}>
                  <Briefcase className="h-4 w-4" /> Company Name
                  {sort.field === 'name' && (
                    sort.dir === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th className="p-2 text-[16px] font-bold text-center">
                <span className="inline-flex items-center gap-1">
                  <UsersIcon className="h-4 w-4" /> Users (Seats)
                </span>
              </th>
              <th className="p-2 w-12 text-right text-[16px] font-bold">Actions</th>
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
                    className="h-5 w-5"
                  />
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DDEEFF] text-[14px] font-medium">
                      {(u.name ?? u.email).slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[16px] font-medium text-[#111]">{u.name ?? u.email}</span>
                      {u.name && <span className="text-[14px] text-[#666]">{u.email}</span>}
                    </div>
                  </div>
                </td>
                <td className="p-2">
                  <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-[10px]">
                    {u.stripeCustomer?.plan ?? "starter"}
                  </span>
                </td>
                <td className="p-2">
                  <span
                    className="rounded-full px-2 py-1 text-[10px] text-white"
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
                <td className="p-2 align-middle text-[16px] text-[#111]">{u.name ?? "-"}</td>
                <td className="p-2 text-center text-[14px] text-[#111]">1</td>
                <td className="p-2 w-12 text-right relative">
                  <button
                    className="p-1 rounded hover:bg-[#F5F5F5]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenActions(openActions === u.id ? null : u.id);
                    }}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {openActions === u.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 mt-1 z-[100] bg-white rounded-lg shadow-lg border w-max py-2"
                    >
                      <Link
                        href={`/admin/users/${u.id}/impersonate`}
                        className="flex items-center gap-2 px-2 h-10 text-base hover:bg-[#F5F5F5] active:bg-[#E0E0E0]"
                      >
                        <UserCheck className="h-4 w-4" /> Impersonate User
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
                          setEditTenant({ ...u, status: u.status });
                          setOpenActions(null);
                        }}
                        className="flex w-full items-center gap-2 px-2 h-10 text-base hover:bg-[#F5F5F5] active:bg-[#E0E0E0]"
                      >
                        <Pencil className="h-4 w-4" /> Edit User
                      </button>
                      {u.status !== "active" ? (
                        <button
                          onClick={() => {
                            changeStatus(u.id, "active");
                            setOpenActions(null);
                          }}
                          className="flex w-full items-center gap-2 px-2 h-10 text-base hover:bg-[#F5F5F5] active:bg-[#E0E0E0]"
                        >
                          <UserPlus className="h-4 w-4" /> Reactivate User
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            changeStatus(u.id, "inactive");
                            setOpenActions(null);
                          }}
                          className="flex w-full items-center gap-2 px-2 h-10 text-base text-[#DC3545] hover:bg-[#F5F5F5] active:bg-[#E0E0E0]"
                        >
                          <UserMinus className="h-4 w-4" /> Deactivate User
                        </button>
                      )}
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
          <form
            className="w-60 space-y-2 rounded bg-white p-4 shadow"
            onClick={(e) => e.stopPropagation()}
            action={async (formData) => {
              await changePlan(planTenant.id, String(formData.get("plan")));
            }}
          >
            <h2 className="text-lg font-semibold">Change Plan</h2>
            <select
              name="plan"
              defaultValue={planTenant.stripeCustomer?.plan ?? ""}
              className="border-b w-full"
            >
              {packages?.packages.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <Button type="button" onClick={() => setPlanTenant(null)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 text-white">Save</Button>
            </div>
          </form>
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
