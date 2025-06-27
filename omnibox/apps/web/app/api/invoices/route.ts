import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { serverSession } from '@/lib/auth';
import { generateInvoicePdf } from '@/lib/invoice';

export async function GET() {
  const session = await serverSession();
  let email = session?.user?.email ?? 'ee.altuntas@gmail.com';
  const user = await prisma.user.findFirst({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ invoices: [] });

  const invoices = await prisma.invoice.findMany({
    where: { userId: user.id },
    include: { contact: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ invoices });
}

export async function POST(req: NextRequest) {
  const session = await serverSession();
  let email = session?.user?.email ?? 'ee.altuntas@gmail.com';
  const user = await prisma.user.findFirst({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { contactId, amount, dueDate } = body as {
    contactId: string;
    amount: number;
    dueDate: string;
  };
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId: user.id },
    select: { name: true },
  });
  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

  const template = await prisma.invoiceTemplate.findFirst({ where: { userId: user.id } });
  const pdfBase64 = await generateInvoicePdf({
    logoUrl: template?.logoUrl || undefined,
    header: template?.header || undefined,
    body: template?.body || undefined,
    footer: template?.footer || undefined,
    amount,
    dueDate,
    clientName: contact.name || 'Client',
  });

  const invoice = await prisma.invoice.create({
    data: {
      userId: user.id,
      contactId,
      amount,
      dueDate: new Date(dueDate),
      pdfUrl: `data:application/pdf;base64,${pdfBase64}`,
    },
  });

  return NextResponse.json({ invoice }, { status: 201 });
}
