import prisma from "@/lib/prisma";

export default async function TenantPlanPage({ params }: any) {
  const { id } = (await params) as { id: string };
  const tenant = await prisma.user.findUnique({
    where: { id },
    select: { name: true, email: true },
  });
  if (!tenant) return <p>Tenant not found.</p>;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Change Plan</h1>
      <p>Manage subscription for {tenant.name ?? tenant.email}.</p>
    </div>
  );
}
