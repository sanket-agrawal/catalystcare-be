import { Resend } from "resend";
const resend = new Resend("re_GfoWxBFK_DX6e1B6PzsCA4zSUwp5Xwcyw");

console.log("Resend key loaded?", !!process.env.RESEND_API_KEY);

type senderObj = {
  name : string;
  email : string
}

export const sendEmail = async (to: string, subject: string, body: string,sender : senderObj) => {
  try{
    const result = await resend.emails.send({
    from: `${sender.name} <${sender.email}>`,
    to,
    subject,
    html: body,
  });
  return result;
  }catch(error){
    throw error;
  }
};
