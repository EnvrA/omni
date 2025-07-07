import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function TenantsPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      contacts: true,
      stripeCustomer: true,
    },
  });

  return (
    <div className="space-y-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="p-2">Company</th>
            <th className="p-2">Plan</th>
            <th className="p-2">Status</th>
            <th className="p-2">Users</th>
            <th className="p-2">Sign-up</th>
            <th className="p-2">Last Login</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.name ?? u.email}</td>
              <td className="p-2">{u.stripeCustomer?.plan ?? "FREE"}</td>
              <td className="p-2">active</td>
              <td className="p-2">1</td>
              <td className="p-2">N/A</td>
              <td className="p-2">N/A</td>
              <td className="p-2 text-right space-x-2">
                <Link
                  href={`/admin/tenants/${u.id}/impersonate`}
                  className="underline text-blue-600"
                >
                  Impersonate
                </Link>
                <Link
                  href={`/admin/tenants/${u.id}/plan`}
                  className="underline text-blue-600"
                >
                  Change Plan
                </Link>
                <Link href="#" className="underline text-red-600">
                  Cancel
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
