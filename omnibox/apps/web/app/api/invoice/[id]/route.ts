import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { serverSession } from '@/lib/auth';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
const EMAIL_FROM = process.env.EMAIL_FROM!;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await serverSession();
  let email = session?.user?.email ?? 'ee.altuntas@gmail.com';
  const user = await prisma.user.findFirst({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action } = body as { action?: string };
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

  if (action === 'send') {
    if (!invoice.contact.email) {
      return NextResponse.json({ error: 'Contact has no email' }, { status: 400 });
    }
    await sgMail.send({
      to: invoice.contact.email,
      from: EMAIL_FROM,
      subject: 'Invoice',
      text: 'Please see attached invoice.',
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

  return NextResponse.json({ invoice });
}
