import { Worker } from "bullmq";
import {prisma} from "../prisma/client";
import { sendEmail } from "../email/index";
import { redisConnection } from "../redis/index";
import { emailFromAddress } from "../../shared/config/email.config";

interface BlastData {
  target: string;
  subject: string;
  content: string;
  csvEmails: string[];
}

export const emailBlastWorker = new Worker(
  "email-blast-queue",
  async (job) => {
    const { target, subject, content, csvEmails } = job.data as BlastData;

    let recipients: string[] = [];

    if (target === "ALL_USERS") {
      const users = await prisma.user.findMany({
        select: { email: true },
      });
      recipients = users.map((u : {email : string}) => u.email);
    }

    if (target === "ALL_THERAPISTS") {
      const therapists = await prisma.therapistProfile.findMany({
        select: { user: { select: { email: true } } },
      });
      recipients = therapists.map((t : { user : {email : string}}) => t.user.email);
    }

    if (target === "INACTIVE_USERS") {
      const users = await prisma.user.findMany({
        where: {
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

    // ----- Send emails -----
    for (const email of recipients) {
      await sendEmail(
        email,
        subject,
        content,
        emailFromAddress().onboarding
      );
    }

    return { sent: recipients.length };
  },
  { connection: redisConnection }
);
