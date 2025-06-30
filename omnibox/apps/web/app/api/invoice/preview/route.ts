import { NextRequest, NextResponse } from 'next/server';
import { generateInvoicePdf } from '@/lib/invoice';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const pdfBase64 = await generateInvoicePdf(body as any);
  return NextResponse.json({ pdfBase64 });
}

