import { Provider, Direction } from "@prisma/client";
import prisma from "./prisma";

export async function upsertContactAndMessage(
  provider: Provider,
  from: string,
  body: string,
  email?: string,
  sentAt: Date = new Date(),
) {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found");

  let contact = await prisma.contact.findFirst({
    where:
      provider === Provider.EMAIL
        ? { email: from }
        : { phone: from },
  });

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        userId: user.id,
        name: from,
        phone: provider === Provider.EMAIL ? undefined : from,
        email: provider === Provider.EMAIL ? from : email,
      },
    });
  } else {
    const data: { phone?: string; email?: string } = {};
    if (!contact.phone && provider !== Provider.EMAIL) data.phone = from;
    if (!contact.email && email) data.email = email;
    if (Object.keys(data).length) {
      contact = await prisma.contact.update({ where: { id: contact.id }, data });
    }
  }

  const message = await prisma.message.create({
    data: {
      userId: user.id,
      contactId: contact.id,
      provider,
      body,
      direction: Direction.IN,
      sentAt,
    },
  });

  return { contact, message };
}

export interface WhatsAppWebhook {
  entry: Array<{
    changes: Array<{
      value: {
        messages: Array<{
          from: string;
          text: { body: string };
          timestamp: string;
        }>;
      };
    }>;
  }>;
}

export interface SmsWebhook {
  From: string;
  Body: string;
}

export interface EmailWebhook {
  from: string;
  subject: string;
  text: string;
}
