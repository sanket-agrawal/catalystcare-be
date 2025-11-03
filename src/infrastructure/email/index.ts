import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY || "re_hnqBBfk3_Ks8uYMqiJKqNXu8T3CqNjdMW");

type senderObj = {
  name : string;
  email : string
}

export const sendEmail = async (to: string, subject: string, body: string,sender : senderObj) => {
  try{
     await resend.emails.send({
    from: `<${sender.name}> ${sender.email}`,
    to,
    subject,
    html: `<p>${body}</p>`,
  });
  }catch(error){
    throw error;
  }
};
