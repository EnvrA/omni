import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { serverSession } from '@/lib/auth';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
const EMAIL_FROM = process.env.EMAIL_FROM!;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await serverSession();
  let email = session?.user?.email ?? 'ee.altuntas@gmail.com';
  const user = await prisma.user.findFirst({ where: { email }, select: { id: true } });
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, userId: user.id },
    include: { contact: { select: { name: true } } },
  });
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ invoice });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await serverSession();
  let email = session?.user?.email ?? 'ee.altuntas@gmail.com';
  const user = await prisma.user.findFirst({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action, contactId, amount, dueDate, pdfBase64, invoiceNumber } = body as {
    action?: string;
    contactId?: string;
    amount?: number;
    dueDate?: string;
    pdfBase64?: string;
    invoiceNumber?: string;
  };
  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, userId: user.id },
    include: { contact: true },
  });
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (action === 'markPaid') {
    const updated = await prisma.invoice.update({
      where: { id: params.id },
      data: { status: 'PAID' },
    });
    return NextResponse.json({ invoice: updated });
  }

  if (action === 'archive') {
    const updated = await prisma.invoice.update({
      where: { id: params.id },
      data: { status: 'ARCHIVED' },
    });
    return NextResponse.json({ invoice: updated });
  }

  if (action === 'unarchive') {
    const updated = await prisma.invoice.update({
      where: { id: params.id },
      data: { status: 'SENT' },
    });
    return NextResponse.json({ invoice: updated });
  }

  if (action === 'send') {
    if (!invoice.contact.email) {
      return NextResponse.json({ error: 'Contact has no email' }, { status: 400 });
    }
    const template = await prisma.invoiceTemplate.findFirst({ where: { userId: user.id } });
    let subject = template?.emailSubject || 'Invoice';
    let text = template?.emailBody || 'Please see attached invoice.';
    const number = invoice.invoiceNumber || invoice.id;
    subject = subject.replace(/{{invoiceNumber}}/g, number);
    text = text.replace(/{{invoiceNumber}}/g, number);
    await sgMail.send({
      to: invoice.contact.email,
      from: EMAIL_FROM,
      subject,
      text,
      attachments: [
        {
          content: invoice.pdfUrl?.split(',')[1] || '',
          type: 'application/pdf',
          filename: 'invoice.pdf',
          disposition: 'attachment',
        },
      ],
    });
    const updated = await prisma.invoice.update({
      where: { id: params.id },
      data: { status: 'SENT' },
    });
    return NextResponse.json({ invoice: updated });
  }

  if (!action) {
    const data: any = {};
    if (contactId) data.contactId = contactId;
    if (invoiceNumber !== undefined) data.invoiceNumber = invoiceNumber;
    if (amount != null) data.amount = amount;
    if (dueDate) data.dueDate = new Date(dueDate);
    if (pdfBase64 !== undefined) {
      data.pdfUrl = pdfBase64.startsWith('data:') ? pdfBase64 : `data:application/pdf;base64,${pdfBase64}`;
    }
    const updated = await prisma.invoice.update({ where: { id: params.id }, data });
    return NextResponse.json({ invoice: updated });
  }

  return NextResponse.json({ invoice });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await serverSession();
  let email = session?.user?.email ?? 'ee.altuntas@gmail.com';
  const user = await prisma.user.findFirst({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.invoice.delete({ where: { id: params.id, userId: user.id } });
  return NextResponse.json({});
}
