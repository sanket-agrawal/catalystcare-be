import { companyWhatsappDetails } from "../config/whatsapp.config";
import { serverConfig } from "../config/server.config";
import { emailFromAddress } from "../config/email.config";

export const clientBookingConfirmationTemplate = (
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
      <title>Your Therapy Session is Confirmed</title>
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
                  <h3 style="color: #007bff; margin-bottom: 15px;">Your Therapy Session Is Confirmed</h3>

                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                    Your session with <strong>${therapistName}</strong> has been successfully booked.
                  </p>

                  <table align="center" style="margin-top: 15px; font-size: 15px; color: #555;">
                    <tr><td><strong>Date:</strong></td><td>&nbsp;${sessionDate}</td></tr>
                    <tr><td><strong>Time:</strong></td><td>&nbsp;${sessionTime}</td></tr>
                  </table>

                  <p style="color:#555; margin-top:15px; font-size:15px;">
                    You can join the session using the secure meeting link below.
                  </p>

                  <a href="${serverConfig.baseFrontendUrl}/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="display:inline-block; margin-top:20px; padding:10px 20px; 
                    background-color:#007bff; color:#fff; border-radius:6px; 
                    text-decoration:none; font-size:14px;">
                    Join Session
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
                  target="_blank"
                   rel="noopener noreferrer"
                     style="color: #007bff; text-decoration: none;">${serverConfig.baseFrontendUrl}</a>

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

export const therapistBookingConfirmationTemplate = (
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
      <title>New Therapy Session Booked</title>
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
                  <h3 style="color: #28a745; margin-bottom: 15px;">New Therapy Session Scheduled</h3>

                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                    A new session has been booked by <strong>${clientName}</strong>.
                  </p>

                  <table align="center" style="margin-top: 15px; font-size: 15px; color: #555;">
                    <tr><td><strong>Date:</strong></td><td>&nbsp;${sessionDate}</td></tr>
                    <tr><td><strong>Time:</strongtd><td>&nbsp;${sessionTime}</td></tr>
                  </table>

                  <p style="color:#555; margin-top:15px; font-size:15px;">
                    Use the link below to join the session at the scheduled time.
                  </p>

                 <a href="${serverConfig.baseFrontendUrl}/therapist-dashboard"
  target="_blank"
  rel="noopener noreferrer"
  style="display:inline-block; margin-top:20px; padding:10px 20px; 
  background-color:#28a745; color:#fff; border-radius:6px; 
  text-decoration:none; font-size:14px;">
  Join Session
</a>

                  <p style="font-size:13px; color:#777; margin-top:15px;">
                    Please ensure you are available and prepared for the session.
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

export const clientSessionReminderTemplate = (
  clientFirstName: string,
  therapistName: string,
  sessionTime: string,
  meetLink: string
) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Reminder: Your Therapy Session Starts in 15 Minutes</title>
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
                  <h3 style="color: #007bff; margin-bottom: 15px;">Your Therapy Session Starts in 15 Minutes</h3>

                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                    This is a reminder that your session with <strong>${therapistName}</strong> is starting soon at <strong>${sessionTime}</strong>.
                  </p>

                  <p style="color:#555; margin-top:15px; font-size:15px;">
                    Please join the session using the button below:
                  </p>

                  <a href="${serverConfig.baseFrontendUrl}/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="display:inline-block; margin-top:20px; padding:10px 20px; 
                    background-color:#007bff; color:#fff; border-radius:6px; 
                    text-decoration:none; font-size:14px; font-weight: bold;">
                    Join Session
                  </a>

                  <p style="font-size:13px; color:#777; margin-top:15px;">
                    Please ensure your camera and microphone are working properly before joining.
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
                     style="color: #007bff; text-decoration: none;">${serverConfig.baseFrontendUrl}</a>

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

export const therapistSessionReminderTemplate = (
  therapistFirstName: string,
  clientName: string,
  sessionTime: string,
  meetLink: string
) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Reminder: Your Therapy Session Starts in 15 Minutes</title>
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
                  <h3 style="color: #28a745; margin-bottom: 15px;">Your Therapy Session Starts in 15 Minutes</h3>

                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                    This is a reminder that your session with <strong>${clientName}</strong> is starting soon at <strong>${sessionTime}</strong>.
                  </p>

                  <p style="color:#555; margin-top:15px; font-size:15px;">
                    Use the button below to join the session:
                  </p>

                  <a href="${serverConfig.baseFrontendUrl}/therapist-dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="display:inline-block; margin-top:20px; padding:10px 20px; 
                    background-color:#28a745; color:#fff; border-radius:6px; 
                    text-decoration:none; font-size:14px; font-weight: bold;">
                    Join Session
                  </a>

                  <p style="font-size:13px; color:#777; margin-top:15px;">
                    Please ensure you are prepared and ready to start the session on time.
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
