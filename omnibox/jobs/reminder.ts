import Agenda from "agenda";
import prisma from "../apps/web/lib/prisma";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const mongoUrl = process.env.MONGODB_URL || "mongodb://localhost/agenda";
const agenda = new Agenda({ db: { address: mongoUrl } });

agenda.define("send-reminders", async () => {
  const deals = await prisma.deal.findMany({
    where: {
      reminderAt: { lte: new Date() },
      stage: { not: "DONE" },
    },
    include: { contact: { select: { name: true } }, user: { select: { email: true } } },
  });

  for (const d of deals) {
    if (!d.user?.email) continue;
    const contactName = d.contact?.name || "a contact";
    await sgMail.send({
      to: d.user.email,
      from: process.env.EMAIL_FROM!,
      subject: "Reminder",
      text: `Don't forget to reply to ${contactName}`,
    });
  }
});

(async function () {
  await agenda.start();
  await agenda.every("1 hour", "send-reminders");
})();
