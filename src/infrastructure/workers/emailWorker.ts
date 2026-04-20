import { Worker, Job } from "bullmq";
import dotenv from "dotenv";
import { redisConnection } from "../redis/index";
import { sendEmail } from "../email/index";

dotenv.config();

console.log("🚀 Email Worker Started...");
console.log("Resend key loaded?", !!process.env.RESEND_API_KEY);

const worker = new Worker(
  "emailQueue",
  async (job: Job) => {
    const { to, subject, html, sender, cc } = job.data;
    console.log("⚡ Processing job", job.id, "for", to);
    await sendEmail(to, subject, html, sender, cc);
    return { success: true };
  },
  { connection: redisConnection, concurrency: 5 }
);

worker.on("completed", (job) => console.log(`✅ Job ${job.id} completed`));
worker.on("failed", (job, err) => console.error(`❌ Job ${job ? job.id : "not defined"} failed:`, err));
