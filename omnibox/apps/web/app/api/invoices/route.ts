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
  try {
    const session = await serverSession();
    let email = session?.user?.email ?? 'ee.altuntas@gmail.com';
    const user = await prisma.user.findFirst({ where: { email }, select: { id: true } });
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      contactId,
      amount,
      dueDate,
      pdfBase64,
      invoiceNumber,
      invoiceDate,
      logoUrl,
      companyAddress,
      clientAddress,
      items,
      columns,
      notes,
      terms,
    } = body as {
      contactId: string;
      amount: number;
      dueDate: string;
      pdfBase64?: string;
      invoiceNumber?: string;
      invoiceDate?: string;
      logoUrl?: string;
      companyAddress?: string;
      clientAddress?: string;
      items?: any[];
      columns?: { tax: boolean };
      notes?: string;
      terms?: string;
    };
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, userId: user.id },
      select: { name: true },
    });
    if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

    let pdf = pdfBase64;
    if (!pdf) {
      const template = await prisma.invoiceTemplate.findFirst({
        where: { userId: user.id },
      });
      pdf = await generateInvoicePdf({
        logoUrl: logoUrl ?? template?.logoUrl ?? undefined,
        header: template?.header || undefined,
        body: template?.body || undefined,
        footer: template?.footer || undefined,
        companyName: template?.companyName || undefined,
        companyAddress: companyAddress ?? template?.companyAddress ?? undefined,
        clientAddress: clientAddress ?? undefined,
        invoiceNumber: invoiceNumber || undefined,
        invoiceDate: invoiceDate || undefined,
        notes: notes ?? template?.notes ?? undefined,
        terms: terms ?? template?.terms ?? undefined,
        accentColor: template?.accentColor || undefined,
        items: Array.isArray(items) ? items : undefined,
        columns: columns ?? undefined,
        amount,
        dueDate,
        clientName: contact.name || 'Client',
      });
    }

    const invoice = await prisma.invoice.create({
      data: {
        userId: user.id,
        contactId,
        invoiceNumber: invoiceNumber || undefined,
        amount,
        dueDate: new Date(dueDate),
        pdfUrl: pdf ? (pdf.startsWith('data:') ? pdf : `data:application/pdf;base64,${pdf}`) : undefined,
      },
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error('POST /api/invoices error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
