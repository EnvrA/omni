import { PrismaClient, Provider, Direction } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      name: 'Demo User',
    },
  })

  const contact1 = await prisma.contact.create({
    data: {
      userId: user.id,
      name: 'Alice',
      phone: '123-456-7890',
      email: 'alice@example.com',
    },
  })

  await prisma.message.create({
    data: {
      contactId: contact1.id,
      provider: Provider.EMAIL,
      body: 'Hello Alice!',
      direction: Direction.OUT,
      sentAt: new Date(),
    },
  })

  const contact2 = await prisma.contact.create({
    data: {
      userId: user.id,
      name: 'Bob',
      phone: '987-654-3210',
      email: 'bob@example.com',
    },
  })

  await prisma.message.create({
    data: {
      contactId: contact2.id,
      provider: Provider.SMS,
      body: 'Hi Bob!',
      direction: Direction.OUT,
      sentAt: new Date(),
    },
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
