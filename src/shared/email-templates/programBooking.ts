import { serverConfig } from "../config/server.config";

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
