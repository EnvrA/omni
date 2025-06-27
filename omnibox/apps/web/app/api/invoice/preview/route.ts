import { NextRequest, NextResponse } from 'next/server';
import { generateInvoicePdf } from '@/lib/invoice';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const pdfBase64 = await generateInvoicePdf({
    logoUrl: body.logoUrl,
    header: body.header,
    body: body.body,
    footer: body.footer,
    amount: body.amount,
    dueDate: body.dueDate,
    clientName: body.clientName,
  });
  return NextResponse.json({ pdfBase64 });
}

