import { serverConfig } from "../../shared/config/server.config";

export const clientBookingRescheduledTemplate = (
  clientFirstName: string,
  therapistName: string,
  sessionDate: string,
  sessionTime: string,
  meetLink: string
) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Your Therapy Session Has Been Rescheduled</title>
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
                  <h3 style="color: #ff9800; margin-bottom: 15px;">
                    Your Therapy Session Has Been Rescheduled
                  </h3>

                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                    Your session with <strong>${therapistName}</strong> has been successfully rescheduled.
                  </p>

                  <table align="center" style="margin-top: 15px; font-size: 15px; color: #555;">
                    <tr><td><strong>New Date:</strong></td><td>&nbsp;${sessionDate}</td></tr>
                    <tr><td><strong>New Time:</strong></td><td>&nbsp;${sessionTime}</td></tr>
                  </table>

                  <p style="color:#555; margin-top:15px; font-size:15px;">
                    You can join the session using the same secure meeting link below.
                  </p>

                  <a href="${meetLink}"
                    style="display:inline-block; margin-top:20px; padding:10px 20px; 
                    background-color:#007bff; color:#fff; border-radius:6px; 
                    text-decoration:none; font-size:14px;">
                    Join Google Meet
                  </a>

                  <p style="font-size:13px; color:#777; margin-top:15px;">
                    Please join 2 minutes before the scheduled time.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="background-color: #f3f4f6; padding: 12px; 
                    font-size: 13px; color: #555;">
                  © Catalyst Care |
                  <a href="${serverConfig.baseFrontendUrl}" 
                     style="color: #007bff; text-decoration: none;">
                     ${serverConfig.baseFrontendUrl}
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

export const therapistBookingRescheduledTemplate = (
  therapistFirstName: string,
  clientName: string,
  sessionDate: string,
  sessionTime: string,
  meetLink: string
) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Therapy Session Rescheduled</title>
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
                  <h3 style="color: #ff9800; margin-bottom: 15px;">
                    Therapy Session Rescheduled
                  </h3>

                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                    The therapy session with <strong>${clientName}</strong> has been rescheduled.
                  </p>

                  <table align="center" style="margin-top: 15px; font-size: 15px; color: #555;">
                    <tr><td><strong>New Date:</strong></td><td>&nbsp;${sessionDate}</td></tr>
                    <tr><td><strong>New Time:</strong></td><td>&nbsp;${sessionTime}</td></tr>
                  </table>

                  <p style="color:#555; margin-top:15px; font-size:15px;">
                    Please use the same meeting link below to join the session.
                  </p>

                  <a href="${meetLink}"
                    style="display:inline-block; margin-top:20px; padding:10px 20px; 
                    background-color:#28a745; color:#fff; border-radius:6px; 
                    text-decoration:none; font-size:14px;">
                    Join Google Meet
                  </a>

                  <p style="font-size:13px; color:#777; margin-top:15px;">
                    Thank you for keeping your schedule updated.
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
