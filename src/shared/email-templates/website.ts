import { serverConfig } from "../config/server.config";

export const contactFormAdminTemplate = (
  name: string,
  email: string,
  phone: string,
  message: string,
  source: string
) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>New Contact Submission</title>
    </head>
    <body style="font-family: Roboto, Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px 0;">
        <tr>
          <td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              
              <!-- Header -->
              <tr>
                <td align="center" style="padding: 20px;">
                  <img src="${serverConfig.baseFrontendUrl}/assets/favicon.ico" alt="Catalyst Care" width="120" />
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 25px;">
                  <h2 style="color: #333; margin-bottom: 15px;">New Contact Form Submission</h2>

                  <table width="100%" cellpadding="8" cellspacing="0" style="font-size: 14px; color: #333;">
                    <tr>
                      <td width="120"><strong>Name:</strong></td>
                      <td>${name}</td>
                    </tr>
                    <tr>
                      <td><strong>Email:</strong></td>
                      <td>${email}</td>
                    </tr>
                    <tr>
                      <td><strong>Phone:</strong></td>
                      <td>${phone || "N/A"}</td>
                    </tr>
                    <tr>
                      <td><strong>Source:</strong></td>
                      <td>${source}</td>
                    </tr>
                  </table>

                  <div style="margin-top: 15px; padding: 12px; background-color: #f3f4f6; border-radius: 6px;">
                    <p style="margin: 0; font-size: 14px;">
                      <strong>Message:</strong><br />
                      ${message}
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="background-color: #f3f4f6; padding: 12px; font-size: 13px; color: #555;">
                  © Catalyst Care
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


export const contactFormClientTemplate = (
  name: string
) => {
  const message = `
    Thank you for reaching out to Catalyst Care. We’ve received your message and our team will review it shortly.
    If your query requires a response, we’ll get back to you as soon as possible.
  `;

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Message Received</title>
    </head>
    <body style="font-family: Roboto, Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px 0;">
        <tr>
          <td align="center">
            <table width="500" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">

              <!-- Header -->
              <tr>
                <td align="center" style="padding: 20px;">
                  <img src="${serverConfig.baseFrontendUrl}/assets/favicon.ico" alt="Catalyst Care" width="120" />
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 25px; text-align: center;">
                  <h2 style="color: #333;">Hi ${name},</h2>

                  <p style="color: #555; font-size: 15px; line-height: 1.6;">
                    ${message}
                  </p>

                  <a href="${serverConfig.baseFrontendUrl}"
                     style="display:inline-block; margin-top:20px; padding:10px 20px; background-color:#ffffff; color:#333; border-radius:6px; text-decoration:none; font-size:14px; border:1px solid #ccc; cursor:pointer;">
                     Visit Catalyst Care
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="background-color: #f3f4f6; padding: 12px; font-size: 13px; color: #555;">
                  © Catalyst Care | 
                  <a href="${serverConfig.baseFrontendUrl}" style="color: #007bff; text-decoration: none;">
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
