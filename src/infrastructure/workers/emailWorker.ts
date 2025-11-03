import { Worker } from 'bullmq';
import { redisConnection } from '../redis/index';
import { sendEmail } from '../email/index';

new Worker(
  'emailQueue',
  async job => {
    console.log(job.data)
    const { to, subject, html, sender } = job.data;
    try{
         await sendEmail(to,subject,html,sender);

    console.log(`✅ Email sent to ${to}`);
    }catch(error){
        throw error
    }

   
  },
  { connection: redisConnection }
);
