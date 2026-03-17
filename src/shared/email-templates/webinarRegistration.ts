import { companyWhatsappDetails } from "../config/whatsapp.config";
import { serverConfig } from "../config/server.config";

export const clientWebinarConfirmationTemplate = (
  clientFirstName: string,
  webinarTitle: string,
  webinarDate: string,
  webinarTime: string,
  therapistName: string,
  meetingLink: string
) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Webinar Registration Confirmed</title>
    </head>
    <body style="font-family: Roboto, Arial, sans-serif; background-color:#f9f9f9; margin:0; padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
        style="background-color:#f9f9f9; padding:30px 0;">
        <tr>
          <td align="center">

            <table width="500" cellpadding="0" cellspacing="0" border="0"
              style="background-color:#ffffff; border-radius:10px; overflow:hidden;
              box-shadow:0 2px 8px rgba(0,0,0,0.05);">

              <!-- Header -->
              <tr>
                <td align="center" style="padding:20px;">
                  <img src="${serverConfig.baseFrontendUrl}/assets/favicon.ico"
                    alt="Catalyst Care" width="120" style="display:block;">
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:25px; text-align:center;">

                  <h2 style="color:#333; margin-bottom:10px;">
                    Hi ${clientFirstName},
                  </h2>

                  <h3 style="color:#007bff; margin-bottom:15px;">
                    Your Webinar Registration Is Confirmed 🎉
                  </h3>

                  <p style="color:#555; font-size:15px; line-height:1.6; margin:0;">
                    You have successfully registered for the webinar:
                  </p>

                  <p style="font-size:18px; font-weight:bold; margin:10px 0; color:#333;">
                    ${webinarTitle}
                  </p>

                  <p style="color:#555; font-size:15px;">
                    Hosted by <strong>${therapistName}</strong>
                  </p>

                  <table align="center"
                    style="margin-top:15px; font-size:15px; color:#555;">
                    <tr>
                      <td><strong>Date:</strong></td>
                      <td>&nbsp;${webinarDate}</td>
                    </tr>
                    <tr>
                      <td><strong>Time:</strong></td>
                      <td>&nbsp;${webinarTime}</td>
                    </tr>
                  </table>

                  <p style="color:#555; margin-top:15px; font-size:15px;">
                    Join the webinar using the link below.
                  </p>

                  <a href="${meetingLink}"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="display:inline-block; margin-top:20px; padding:10px 20px;
                    background-color:#007bff; color:#fff; border-radius:6px;
                    text-decoration:none; font-size:14px;">
                    Join Webinar
                  </a>

                  <p style="font-size:13px; color:#777; margin-top:15px;">
                    Please join 5 minutes before the webinar begins.
                  </p>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center"
                  style="background-color:#f3f4f6; padding:12px; font-size:13px; color:#555;">
                  © Catalyst Care |
                  <a href="${serverConfig.baseFrontendUrl}"
                  target="_blank"
                                     rel="noopener noreferrer"
                    style="color:#007bff; text-decoration:none;">
                    ${serverConfig.baseFrontendUrl}
                  </a>
                  <a href="${companyWhatsappDetails().contactWhatsappLink}?text=${companyWhatsappDetails().message}" 
                                     target="_blank"
                                     rel="noopener noreferrer"
                  
                         style="color: #25D366; text-decoration: none;">
                         WhatsApp Support
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

export const therapistWebinarRegistrationTemplate = (
  therapistFirstName: string,
  webinarTitle: string,
  webinarDate: string,
  webinarTime: string,
  attendeeName: string,
  attendeeEmail: string
) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>New Webinar Registration</title>
    </head>

    <body style="font-family: Roboto, Arial, sans-serif; background-color:#f9f9f9; margin:0; padding:0;">

      <table width="100%" cellpadding="0" cellspacing="0" border="0"
        style="background-color:#f9f9f9; padding:30px 0;">
        <tr>
          <td align="center">

            <table width="500" cellpadding="0" cellspacing="0" border="0"
              style="background-color:#ffffff; border-radius:10px; overflow:hidden;
              box-shadow:0 2px 8px rgba(0,0,0,0.05);">

              <!-- Header -->
              <tr>
                <td align="center" style="padding:20px;">
                  <img src="${serverConfig.baseFrontendUrl}/assets/favicon.ico"
                    alt="Catalyst Care" width="120" style="display:block;">
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:25px; text-align:center;">

                  <h2 style="color:#333; margin-bottom:10px;">
                    Hi ${therapistFirstName},
                  </h2>

                  <h3 style="color:#28a745; margin-bottom:15px;">
                    New Webinar Registration
                  </h3>

                  <p style="color:#555; font-size:15px; line-height:1.6;">
                    Someone has registered for your webinar:
                  </p>

                  <p style="font-size:18px; font-weight:bold; margin:10px 0; color:#333;">
                    ${webinarTitle}
                  </p>

                  <table align="center"
                    style="margin-top:15px; font-size:15px; color:#555;">
                    <tr>
                      <td><strong>Date:</strong></td>
                      <td>&nbsp;${webinarDate}</td>
                    </tr>
                    <tr>
                      <td><strong>Time:</strong></td>
                      <td>&nbsp;${webinarTime}</td>
                    </tr>
                  </table>

                  <div style="margin-top:20px; font-size:15px; color:#555;">
                    <p><strong>Attendee Details</strong></p>
                    <p>${attendeeName}</p>
                    <p>${attendeeEmail}</p>
                  </div>

                  <a href="${serverConfig.baseFrontendUrl}/therapist-dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="display:inline-block; margin-top:20px; padding:10px 20px;
                    background-color:#28a745; color:#fff; border-radius:6px;
                    text-decoration:none; font-size:14px;">
                    View Registrations
                  </a>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center"
                  style="background-color:#f3f4f6; padding:12px; font-size:13px; color:#555;">
                  © Catalyst Care |
                  <a href="${serverConfig.baseFrontendUrl}"
                    style="color:#28a745; text-decoration:none;">
                    ${serverConfig.baseFrontendUrl}
                  </a>
                   <a href="${companyWhatsappDetails().contactWhatsappLink}?text=${companyWhatsappDetails().message}" 
                                     target="_blank"
                                     rel="noopener noreferrer"
                  
                         style="color: #25D366; text-decoration: none;">
                         WhatsApp Support
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