import { emailFromAddress } from "../../config/email.config";
import { serverTempConfig } from "../../config/server.config";
import { companyWhatsappDetails } from "../../config/whatsapp.config";

export const orgAdminInviteTemplate = ({
  orgName,
  inviteToken,
}: {
  orgName: string;
  inviteToken: string;
}) => {
  const inviteUrl = `${serverTempConfig.baseFrontendUrl}/accept-invite?token=${inviteToken}`;

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>You’ve Been Invited</title>
    </head>
    <body style="font-family: Roboto, Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9f9f9; padding: 30px 0;">
        <tr>
          <td align="center">
            <table width="500" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              
              <!-- Header -->
              <tr>
                <td align="center" style="padding: 20px;">
                  <img src="${serverTempConfig.baseFrontendUrl}/assets/favicon.ico" alt="Catalyst Care" width="120" style="display:block;">
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 25px; text-align: center;">
                  <h2 style="color: #333; margin-bottom: 10px;">You're Invited 🎉</h2>

                  <p style="color: #555; font-size: 15px; margin: 0;">
                    You’ve been invited to join <strong>${orgName}</strong> as an admin.
                  </p>

                  <p style="color: #555; font-size: 15px; margin-top: 15px;">
                    Click the button below to accept your invitation and get started.
                  </p>

                  <a href="${inviteUrl}" 
                     target="_blank"
                     style="display:inline-block; margin-top:20px; padding:10px 20px; background-color:#ffffff; color:#333; border:1px solid #ddd; border-radius:6px; text-decoration:none; font-size:14px; cursor:pointer;">
                     Accept Invitation
                  </a>

                  <p style="color: #999; font-size: 13px; margin-top: 20px;">
                    If you did not expect this invitation, you can safely ignore this email.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="background-color: #f3f4f6; padding: 12px; font-size: 13px; color: #555;">
                  © Catalyst Care |
                  <a href="${serverTempConfig.baseFrontendUrl}"
                     target="_blank"
                     rel="noopener noreferrer"
                     style="color: #28a745; text-decoration: none;">
                    ${serverTempConfig.baseFrontendUrl}
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