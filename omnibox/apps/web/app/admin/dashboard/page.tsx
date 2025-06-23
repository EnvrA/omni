import prisma from "@/lib/prisma";

export default async function AdminDashboard() {
  const totalCustomers = await prisma.user.count();
  const proCount = await prisma.stripeCustomer.count({
    where: { plan: "PRO" },
  });
  const mrr = proCount * 10; // assume $10 per PRO subscription
  const churnRate = 0; // placeholder
  const webhookSuccess = 100; // placeholder

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const messages = await prisma.message.findMany({
    where: { sentAt: { gte: since } },
    select: { sentAt: true },
  });
  const perDay: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    perDay[key] = 0;
  }
  for (const m of messages) {
    const key = m.sentAt.toISOString().slice(0, 10);
    if (perDay[key] !== undefined) perDay[key]++;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4 bg-white shadow-sm">
          <h3 className="text-sm text-gray-500">MRR</h3>
          <p className="text-xl font-semibold">{`$${mrr}`}</p>
        </div>
        <div className="rounded-lg border p-4 bg-white shadow-sm">
          <h3 className="text-sm text-gray-500">Customers</h3>
          <p className="text-xl font-semibold">{totalCustomers}</p>
        </div>
        <div className="rounded-lg border p-4 bg-white shadow-sm">
          <h3 className="text-sm text-gray-500">Churn Rate</h3>
          <p className="text-xl font-semibold">{churnRate}%</p>
        </div>
        <div className="rounded-lg border p-4 bg-white shadow-sm">
          <h3 className="text-sm text-gray-500">Webhook Success</h3>
          <p className="text-xl font-semibold">{webhookSuccess}%</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold">Messages per day</h3>
        <div className="flex items-end gap-1 h-40">
          {Object.entries(perDay)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, count]) => (
              <div
                key={date}
                className="flex flex-col items-center justify-end text-xs flex-1"
              >
                <div
                  className="bg-blue-500 w-full"
                  style={{ height: `${count * 4}px` }}
                />
                <span className="mt-1 rotate-90 origin-left hidden md:block">
                  {date.slice(5)}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
