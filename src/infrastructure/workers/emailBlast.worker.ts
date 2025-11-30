import { Worker } from "bullmq";
import {prisma} from "../prisma/client";
import { sendEmail } from "../email/index";
import { redisConnection } from "../redis/index";
import { emailFromAddress } from "../../shared/config/email.config";

interface BlastData {
  reason : string;
  adminId? : string;
  target: string;
  subject: string;
  content: string;
  singleEmail? : string;
  csvEmails: string[];
}

export const emailBlastWorker = new Worker(
  "email-blast-queue",
  async (job) => {
    const { target, subject, content, csvEmails, reason, singleEmail, adminId } = job.data as BlastData;

    let recipients: string[] = [];

    if (target === "ALL_USERS") {
      const users = await prisma.user.findMany({
        where : {isEmailVerified : true},
        select: { email: true },
      });
      recipients = users.map((u : {email : string}) => u.email);
    }

    if (target === "ALL_THERAPISTS") {
      const therapists = await prisma.therapistProfile.findMany({
        where : { user : { isEmailVerified : true } },
        select: { user: { select: { email: true } } },
      });
      recipients = therapists.map((t : { user : {email : string}}) => t.user.email);
    }

    if (target === "INACTIVE_USERS") {
      const users = await prisma.user.findMany({
        where: {
          isEmailVerified: true,
          lastLogin: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: { email: true },
      });
      recipients = users.map((u : {email : string}) => u.email);
    }

    if (target === "CUSTOM_CSV") {
      recipients = csvEmails;
    }

    if(target === "TEST_EMAILS"){
      recipients = ["mailsanketagrawal@gmail.com"]
    }

    if(target === "SINGLE_EMAIL"){
        recipients.push(singleEmail!)
    }
    // ----- Send emails -----
    for (const email of recipients) {
      await sendEmail(
        email,
        subject,
        content,
        emailFromAddress().infoEmail
      );
    }

    await prisma.emailBlastLog.create({
  data: {
    reason,
    carriedFor: target,
    totalEmailSent: recipients.length,
    subject,
    content,
    initiatedAt: new Date(),
    singleEmail: singleEmail ?? null,
    admin: {
      connect: { id: adminId }   // THIS IS REQUIRED
    }
  },
});


    return { sent: recipients.length };
  },
  { connection: redisConnection }
);
