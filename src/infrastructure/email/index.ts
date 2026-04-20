import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

type senderObj = {
  name : string;
  email : string
}

export const sendEmail = async (to: string, subject: string, body: string,sender : senderObj, cc? : string) => {
  try{
    const result = await resend.emails.send({
    from: `${sender.name} <${sender.email}>`,
    to,
    subject,
    html: body,
     ...(cc && { cc }),
  });
  return result;
  }catch(error){
    throw error;
  }
};

