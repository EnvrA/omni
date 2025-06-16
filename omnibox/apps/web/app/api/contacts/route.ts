import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { serverSession } from '@/lib/auth'

export async function GET() {
  const session = await serverSession()

  // ---------- DEV FALLBACK ----------
  let email = session?.user?.email ?? "ee.altuntas@gmail.com"
  // ----------------------------------

  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ contacts: [] })
    
  // latest message timestamp per contact
  const contacts = await prisma.contact.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      messages: {
        orderBy: { sentAt: "desc" },
        take: 1,
        select: { sentAt: true, body: true },
      },
    },
  });

  const result = contacts.map(c => ({
    id: c.id,
    name: c.name,
    lastMessageAt: c.messages[0]?.sentAt ?? null,
    lastMessageBody: c.messages[0]?.body ?? null,
  })).sort((a, b) =>
    (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0)
  );

return NextResponse.json({ contacts: result });
}
