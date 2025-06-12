import { PrismaClient, Provider, Direction } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 🔄  create-or-reuse demo user
 const DEMO_EMAIL = process.env.SEED_EMAIL ?? "demo@example.com";

// 🔄  create-or-reuse demo user
const user = await prisma.user.upsert({
  where: { email: DEMO_EMAIL },
  update: {},                            // nothing to change if it exists
  create: {
    email: DEMO_EMAIL,
    name: "Demo User",
  },
});

  // ------------------------------------------------------------------
  // Clear existing demo data (order matters → messages first, then contacts)
  // ------------------------------------------------------------------
  await prisma.message.deleteMany({
    where: { contact: { userId: user.id } },
  });
  await prisma.contact.deleteMany({ where: { userId: user.id } });

  // ------------------------------------------------------------------
  // Fresh demo contacts + messages
  // ------------------------------------------------------------------

  const contact1 = await prisma.contact.create({
    data: {
      userId: user.id,
      name: "Alice",
      phone: "123-456-7890",
      email: "alice@example.com",
    },
  });

  await prisma.message.create({
    data: {
      contactId: contact1.id,
      provider: Provider.EMAIL,
      body: "Hello Alice!",
      direction: Direction.OUT,
      sentAt: new Date(),
    },
  });

  const contact2 = await prisma.contact.create({
    data: {
      userId: user.id,
      name: "Bob",
      phone: "987-654-3210",
      email: "bob@example.com",
    },
  });

  await prisma.message.create({
    data: {
      contactId: contact2.id,
      provider: Provider.SMS,
      body: "Hi Bob!",
      direction: Direction.OUT,
      sentAt: new Date(),
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
