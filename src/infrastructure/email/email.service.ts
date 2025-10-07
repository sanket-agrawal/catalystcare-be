import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY || "");

export const sendEmail = async (to: string, subject: string, body: string) => {
  await resend.emails.send({
    from: "no-reply@sanketagrawal.com",
    to,
    subject,
    html: `<p>${body}</p>`,
  });
};
