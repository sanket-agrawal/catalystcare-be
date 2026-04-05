import { emailFromAddress } from "../../config/email.config";
import { calendlyConfig } from "../../config/calendly.config";
import { serverConfig } from "../../config/server.config";
import { companyWhatsappDetails } from "../../config/whatsapp.config";

export const orgQueryReceivedTemplate = (firstName: string) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>We’ve Received Your Request</title>
    </head>
    <body style="font-family: Roboto, Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9f9f9; padding: 30px 0;">
        <tr>
          <td align="center">
            <table width="500" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              
              <!-- Header -->
              <tr>
                <td align="center" style="padding: 20px;">
                  <img src="${serverConfig.baseFrontendUrl}/assets/favicon.ico" alt="Catalyst Care" width="120" style="display:block;">
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 25px; text-align: center;">
                  <h2 style="color: #333; margin-bottom: 10px;">Hi ${firstName},</h2>
                  
                  <p style="color: #555; font-size: 15px; margin: 0;">
                    We’ve received your request and are currently reviewing your requirements.
                  </p>

                  <p style="color: #555; font-size: 15px; margin-top: 15px;">
                    Let’s connect briefly to understand your needs and explore how we can support your organization.
                  </p>

                  <a href="${calendlyConfig.url}" 
                     style="display:inline-block; margin-top:20px; padding:10px 20px; background-color:#007bff; color:#fff; border-radius:6px; text-decoration:none; font-size:14px; cursor:pointer;">
                     Schedule a Call
                  </a>
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