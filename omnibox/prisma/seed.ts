/// <reference types="node" />
const DEMO_EMAIL = process.env.SEED_EMAIL ?? "ee.altuntas@gmail.com"

import { PrismaClient, Provider, Direction } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  /* ------------------------------------------------------------------ *
   * 1 · Resolve configurable bits                                      *
   * ------------------------------------------------------------------ */
  // Use a real Twilio number in E.164 format (or Twilio’s test +15005550006)
  const TWILIO_NUMBER = process.env.SEED_TWILIO_PHONE ?? "+15005550006"

  /* ------------------------------------------------------------------ *
   * 2 · Create-or-reuse the demo SaaS user                             *
   * ------------------------------------------------------------------ */
  const user = await prisma.user.upsert({
    where:  { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, name: "Demo User" },
  })

  /* ------------------------------------------------------------------ *
   * 3 · Register the Twilio number that belongs to this user           *
   *    (model TwilioNumber { phone @id, userId String })               *
   * ------------------------------------------------------------------ */
  await prisma.twilioNumber.upsert({
    where:  { phone: TWILIO_NUMBER },
    update: { userId: user.id },          // keeps it in sync if you change owner
    create: { phone: TWILIO_NUMBER, userId: user.id },
  })

  /* ------------------------------------------------------------------ *
   * 4 · Clear previous demo data (messages → contacts)                 *
   * ------------------------------------------------------------------ */
  await prisma.message.deleteMany({ where: { contact: { userId: user.id } } })
  await prisma.contact.deleteMany({ where: { userId: user.id } })

  /* ------------------------------------------------------------------ *
   * 5 · Clear previous quick replies                                  *
   * ------------------------------------------------------------------ */
  await prisma.quickReply.deleteMany({ where: { userId: user.id } })

  /* ------------------------------------------------------------------ *
   * 6 · Fresh demo contacts + messages                                 *
   * ------------------------------------------------------------------ */
  const contactsData = [
    {
      name: "Alice",
      phone: "+31612345678",
      email: "alice@example.com",
      company: "Wonderland Co.",
      notes: "Met at conference",
      tag: "VIP",
    },
    {
      name: "Bob",
      phone: "+31698765432",
      email: "bob@example.com",
      company: "Builder Inc.",
      notes: "Potential partner",
      tag: "New Client",
    },
  ]

  const [contact1, contact2] = await Promise.all(
    contactsData.map((c) =>
      prisma.contact.create({ data: { userId: user.id, ...c } }),
    ),
  )

  await prisma.message.create({
  data: {
    contactId: contact1.id,
    userId:    user.id,           // 👈  add this line
    provider:  Provider.EMAIL,
    body:      "Hello Alice!",
    direction: Direction.OUT,
    sentAt:    new Date(),
  },
})

  await prisma.message.create({
  data: {
    contactId: contact2.id,
    userId:    user.id,           // 👈  add this line
    provider:  Provider.SMS,
    body:      "Hi Bob!",
    direction: Direction.OUT,
    sentAt:    new Date(),
  },
})

  /* ------------------------------------------------------------------ *
   * 7 · Seed quick replies                                           *
   * ------------------------------------------------------------------ */
  await prisma.quickReply.createMany({
    data: [
      { userId: user.id, label: "Bedankt", text: "Dank je voor je bericht" },
      { userId: user.id, label: "Later", text: "Ik kom er zo bij je op terug" },
      { userId: user.id, label: "Bel", text: "Ik bel je later vandaag" },
    ],
  })

  console.log(
    "🌱  Seed completed – demo user, Twilio number, contacts, messages & quick replies."
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
