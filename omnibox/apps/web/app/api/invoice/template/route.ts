import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { serverSession } from '@/lib/auth';

export async function GET() {
  const session = await serverSession();
  let email = session?.user?.email ?? 'ee.altuntas@gmail.com';
  const user = await prisma.user.findFirst({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ template: null });

  const template = await prisma.invoiceTemplate.findFirst({ where: { userId: user.id } });
  return NextResponse.json({ template });
}

export async function PATCH(req: NextRequest) {
  const session = await serverSession();
  let email = session?.user?.email ?? 'ee.altuntas@gmail.com';
  const user = await prisma.user.findFirst({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const data = {
    logoUrl: body.logoUrl as string | undefined,
    header: body.header as string | undefined,
    body: body.body as string | undefined,
    footer: body.footer as string | undefined,
    companyName: body.companyName as string | undefined,
    companyAddress: body.companyAddress as string | undefined,
    notes: body.notes as string | undefined,
    terms: body.terms as string | undefined,
    accentColor: body.accentColor as string | undefined,
    emailSubject: body.emailSubject as string | undefined,
    emailBody: body.emailBody as string | undefined,
  };

  const existing = await prisma.invoiceTemplate.findFirst({ where: { userId: user.id } });
  let template;
  if (existing) {
    template = await prisma.invoiceTemplate.update({ where: { id: existing.id }, data });
  } else {
    template = await prisma.invoiceTemplate.create({ data: { ...data, userId: user.id } });
  }

  return NextResponse.json({ template });
}
