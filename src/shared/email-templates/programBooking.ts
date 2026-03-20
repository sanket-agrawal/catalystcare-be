import { companyWhatsappDetails } from "../config/whatsapp.config";
import { serverConfig } from "../config/server.config";
import { emailFromAddress } from "../config/email.config";

export const clientProgramBookingConfirmationTemplate = (
  clientFirstName: string,
  therapistName: string,
  planName: string,
  programTitle: string
) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Your Program Is Confirmed</title>
    </head>
    <body style="font-family: Roboto, Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
        style="background-color: #f9f9f9; padding: 30px 0;">
        <tr>
          <td align="center">

            <table width="500" cellpadding="0" cellspacing="0" border="0"
              style="background-color: #ffffff; border-radius: 10px; overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.05);">

              <!-- Header -->
              <tr>
                <td align="center" style="padding: 20px;">
                  <img src="${serverConfig.baseFrontendUrl}/assets/favicon.ico"
                       alt="Catalyst Care" width="120" style="display:block;">
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 25px; text-align: center;">
                  <h2 style="color: #333; margin-bottom: 10px;">Hi ${clientFirstName},</h2>
                  <h3 style="color: #007bff; margin-bottom: 15px;">
                    Your Program Is Successfully Booked
                  </h3>

                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                    You have successfully enrolled in the program
                    <strong>${programTitle}</strong>.
                  </p>

                  <table align="center" style="margin-top: 15px; font-size: 15px; color: #555;">
                    <tr>
                      <td><strong>Plan:</strong></td>
                      <td>&nbsp;${planName}</td>
                    </tr>
                    <tr>
                      <td><strong>Therapist:</strong></td>
                      <td>&nbsp;${therapistName}</td>
                    </tr>
                  </table>

                  <p style="color:#555; margin-top:15px; font-size:15px;">
                    Your therapist will guide you through the program and share
                    session details with you shortly.
                  </p>

                  <p style="font-size:13px; color:#777; margin-top:15px;">
                    We’re excited to be part of your wellness journey.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="background-color: #f3f4f6; padding: 12px;
                    font-size: 13px; color: #555;">
                  © Catalyst Care |
                  <a href="${serverConfig.baseFrontendUrl}"
                  target="_blank"
                                     rel="noopener noreferrer"
                     style="color: #007bff; text-decoration: none;">
                    ${serverConfig.baseFrontendUrl}
                  </a>

<a href="${companyWhatsappDetails().contactWhatsappLink}?text=${companyWhatsappDetails().message}" 
target="_blank"
rel="noopener noreferrer"
style="margin-left:10px;">
<img src="https://cdn-icons-png.flaticon.com/24/733/733585.png" 
     width="20" height="20" 
     alt="WhatsApp" style="vertical-align:middle;">
</a>

<a href="mailto:${emailFromAddress().infoEmail.email}"
target="_blank"
rel="noopener noreferrer"
style="margin-left:10px;">
<img src="https://cdn-icons-png.flaticon.com/24/732/732200.png" 
     width="20" height="20" 
     alt="Email" style="vertical-align:middle;">
</a>

                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
};

export const therapistProgramBookingConfirmationTemplate = (
  therapistFirstName: string,
  clientName: string,
  planName: string,
  programTitle: string
) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>New Program Booking</title>
    </head>
    <body style="font-family: Roboto, Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
        style="background-color: #f9f9f9; padding: 30px 0;">
        <tr>
          <td align="center">

            <table width="500" cellpadding="0" cellspacing="0" border="0"
              style="background-color: #ffffff; border-radius: 10px; overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.05);">

              <!-- Header -->
              <tr>
                <td align="center" style="padding: 20px;">
                  <img src="${serverConfig.baseFrontendUrl}/assets/favicon.ico"
                       alt="Catalyst Care" width="120" style="display:block;">
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 25px; text-align: center;">
                  <h2 style="color: #333; margin-bottom: 10px;">Hi ${therapistFirstName},</h2>
                  <h3 style="color: #28a745; margin-bottom: 15px;">
                    New Program Booking Received
                  </h3>

                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                    <strong>${clientName}</strong> has enrolled in your program
                    <strong>${programTitle}</strong>.
                  </p>

                  <table align="center" style="margin-top: 15px; font-size: 15px; color: #555;">
                    <tr>
                      <td><strong>Plan:</strong></td>
                      <td>&nbsp;${planName}</td>
                    </tr>
                  </table>

                  <p style="color:#555; margin-top:15px; font-size:15px;">
                    Please coordinate the next steps and session schedule with the client.
                  </p>

                  <p style="font-size:13px; color:#777; margin-top:15px;">
                    Thank you for being part of Catalyst Care.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="background-color: #f3f4f6; padding: 12px;
                    font-size: 13px; color: #555;">
                  © Catalyst Care |
                  <a href="${serverConfig.baseFrontendUrl}"
                  target="_blank"
                                     rel="noopener noreferrer"
                     style="color: #28a745; text-decoration: none;">
                    ${serverConfig.baseFrontendUrl}
                  </a>
                                     <a href="${companyWhatsappDetails().contactWhatsappLink}?text=${companyWhatsappDetails().message}" 
target="_blank"
rel="noopener noreferrer"
style="margin-left:10px;">
<img src="https://cdn-icons-png.flaticon.com/24/733/733585.png" 
     width="20" height="20" 
     alt="WhatsApp" style="vertical-align:middle;">
</a>

<a href="mailto:${emailFromAddress().infoEmail.email}"
target="_blank"
rel="noopener noreferrer"
style="margin-left:10px;">
<img src="https://cdn-icons-png.flaticon.com/24/732/732200.png" 
     width="20" height="20" 
     alt="Email" style="vertical-align:middle;">
</a>                
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
};

export const clientProgramSessionSlotBookedTemplate = (
  clientFirstName: string,
  therapistName: string,
  programTitle: string,
  sessionNumber: number,
  sessionDate: string,
  sessionTime: string,
  meetingLink : string
) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Session Slot Confirmed</title>
    </head>
    <body style="font-family: Roboto, Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
        style="background-color: #f9f9f9; padding: 30px 0;">
        <tr>
          <td align="center">
            <table width="500" cellpadding="0" cellspacing="0" border="0"
              style="background-color: #ffffff; border-radius: 10px; overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.05);">

              <!-- Header -->
              <tr>
                <td align="center" style="padding: 20px;">
                  <img src="${serverConfig.baseFrontendUrl}/assets/favicon.ico"
                       alt="Catalyst Care" width="120" style="display:block;">
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 25px; text-align: center;">
                  <h2 style="color: #333; margin-bottom: 10px;">
                    Hi ${clientFirstName},
                  </h2>

                  <h3 style="color: #007bff; margin-bottom: 15px;">
                    Session ${sessionNumber} Is Confirmed
                  </h3>

                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                    Your <strong>Session ${sessionNumber}</strong> for the program
                    <strong>${programTitle}</strong> has been successfully scheduled.
                  </p>

                  <table align="center" style="margin-top: 15px; font-size: 15px; color: #555;">
                    <tr>
                      <td><strong>Session:</strong></td>
                      <td>&nbsp;${sessionNumber}</td>
                    </tr>
                    <tr>
                      <td><strong>Therapist:</strong></td>
                      <td>&nbsp;${therapistName}</td>
                    </tr>
                    <tr>
                      <td><strong>Date:</strong></td>
                      <td>&nbsp;${sessionDate}</td>
                    </tr>
                    <tr>
                      <td><strong>Time:</strong></td>
                      <td>&nbsp;${sessionTime}</td>
                    </tr>
                  </table>

                  <p style="color:#555; margin-top:15px; font-size:15px;">
                    Please ensure you are available a few minutes before the session begins.
                  </p>

                  <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
  <tr>
    <td align="center"
        style="border: 1px solid #007bff; border-radius: 6px;">
      <a href="${serverConfig.baseFrontendUrl}/dashboard"
         target="_blank"
         style="
           display: inline-block;
           padding: 10px 18px;
           font-size: 14px;
           color: #007bff;
           text-decoration: none;
           font-weight: 500;
           cursor: pointer;
         ">
        Join Session
      </a>
    </td>
  </tr>
</table>


                  <p style="font-size:13px; color:#777; margin-top:15px;">
                    We’re here to support you on your wellness journey.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="background-color: #f3f4f6; padding: 12px;
                    font-size: 13px; color: #555;">
                  © Catalyst Care |
                  <a href="${serverConfig.baseFrontendUrl}"
                  target="_blank"
                                     rel="noopener noreferrer"
                     style="color: #007bff; text-decoration: none;">
                    ${serverConfig.baseFrontendUrl}
                  </a>
                                   <a href="${companyWhatsappDetails().contactWhatsappLink}?text=${companyWhatsappDetails().message}" 
target="_blank"
rel="noopener noreferrer"
style="margin-left:10px;">
<img src="https://cdn-icons-png.flaticon.com/24/733/733585.png" 
     width="20" height="20" 
     alt="WhatsApp" style="vertical-align:middle;">
</a>

<a href="mailto:${emailFromAddress().infoEmail.email}"
target="_blank"
rel="noopener noreferrer"
style="margin-left:10px;">
<img src="https://cdn-icons-png.flaticon.com/24/732/732200.png" 
     width="20" height="20" 
     alt="Email" style="vertical-align:middle;">
</a>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
};


export const therapistProgramSessionSlotBookedTemplate = (
  therapistFirstName: string,
  clientName: string,
  programTitle: string,
  sessionNumber: number,
  sessionDate: string,
  sessionTime: string, 
  meetingLink : string
) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Session Slot Booked</title>
    </head>
    <body style="font-family: Roboto, Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
        style="background-color: #f9f9f9; padding: 30px 0;">
        <tr>
          <td align="center">
            <table width="500" cellpadding="0" cellspacing="0" border="0"
              style="background-color: #ffffff; border-radius: 10px; overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.05);">

              <!-- Header -->
              <tr>
                <td align="center" style="padding: 20px;">
                  <img src="${serverConfig.baseFrontendUrl}/assets/favicon.ico"
                       alt="Catalyst Care" width="120" style="display:block;">
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 25px; text-align: center;">
                  <h2 style="color: #333; margin-bottom: 10px;">
                    Hi ${therapistFirstName},
                  </h2>

                  <h3 style="color: #28a745; margin-bottom: 15px;">
                    Session ${sessionNumber} Booked
                  </h3>

                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                    <strong>${clientName}</strong> has booked
                    <strong>Session ${sessionNumber}</strong> under your program
                    <strong>${programTitle}</strong>.
                  </p>

                  <table align="center" style="margin-top: 15px; font-size: 15px; color: #555;">
                    <tr>
                      <td><strong>Session:</strong></td>
                      <td>&nbsp;${sessionNumber}</td>
                    </tr>
                    <tr>
                      <td><strong>Date:</strong></td>
                      <td>&nbsp;${sessionDate}</td>
                    </tr>
                    <tr>
                      <td><strong>Time:</strong></td>
                      <td>&nbsp;${sessionTime}</td>
                    </tr>
                  </table>

                  <p style="color:#555; margin-top:15px; font-size:15px;">
                    Please be prepared for the scheduled session.
                  </p>

                  <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
  <tr>
    <td align="center"
        style="border: 1px solid #28a745; border-radius: 6px;">
      <a href="${serverConfig.baseFrontendUrl}/therapist-dashboard"
         target="_blank"
         style="
           display: inline-block;
           padding: 10px 18px;
           font-size: 14px;
           color: #28a745;
           text-decoration: none;
           font-weight: 500;
           cursor: pointer;
         ">
        Join Session
      </a>
    </td>
  </tr>
</table>


                  <p style="font-size:13px; color:#777; margin-top:15px;">
                    Thank you for supporting our clients at Catalyst Care.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="background-color: #f3f4f6; padding: 12px;
                    font-size: 13px; color: #555;">
                  © Catalyst Care |
                  <a href="${serverConfig.baseFrontendUrl}"
                     style="color: #28a745; text-decoration: none;">
                    ${serverConfig.baseFrontendUrl}
                  </a>
                                    <a href="${companyWhatsappDetails().contactWhatsappLink}?text=${companyWhatsappDetails().message}" 
                  target="_blank"
                  rel="noopener noreferrer"
                  style="margin-left:10px;">
                  <img src="https://cdn-icons-png.flaticon.com/24/733/733585.png" 
                       width="20" height="20" 
                       alt="WhatsApp" style="vertical-align:middle;">
                  </a>
                  
                  <a href="mailto:${emailFromAddress().infoEmail.email}"
                  target="_blank"
                  rel="noopener noreferrer"
                  style="margin-left:10px;">
                  <img src="https://cdn-icons-png.flaticon.com/24/732/732200.png" 
                       width="20" height="20" 
                       alt="Email" style="vertical-align:middle;">
                  </a>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
};
