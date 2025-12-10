import { serverConfig } from "../../shared/config/server.config";

export const registrationTemplate = (therapistName: string) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Therapist Registration Submitted</title>
  </head>
  <body style="margin:0; padding:0; font-family: Roboto, Arial, sans-serif; background-color:#f7f7f7;">

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f7f7f7; padding:30px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
          <tr>
                <td align="center" style="padding: 20px;">
                  <img src="${serverConfig.baseFrontendUrl}/assets/favicon.ico" alt="Catalyst Care" width="120" style="display:block;">
                </td>
              </tr>
            <tr>
              <td align="center" style="background-color:#4f46e5; padding:20px 0;">
                <h2 style="color:#ffffff; margin:0;">Therapist Registration Received</h2>
              </td>
            </tr>

            <tr>
              <td style="padding:30px;">
                <p style="font-size:16px; color:#333333; margin-bottom:16px;">
                  Dear <strong>${therapistName}</strong>,
                </p>

                <p style="font-size:15px; color:#444444; line-height:1.6; margin-bottom:20px;">
                  Thank you for submitting your registration details as a therapist on our platform.
                  We have successfully received your profile and documents. Our verification team will
                  review your submission and get back to you within a few business days.
                </p>

                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e5e7eb; border-radius:6px; margin-bottom:25px;">
                  <tr style="background-color:#f9fafb;">
                    <td style="padding:12px 16px; font-size:14px; color:#555555; width:35%; border-bottom:1px solid #e5e7eb;">
                      <strong>Submission Date</strong>
                    </td>
                    <td style="padding:12px 16px; font-size:14px; color:#333333; border-bottom:1px solid #e5e7eb;">
                      ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px; font-size:14px; color:#555555; width:35%;">
                      <strong>Status</strong>
                    </td>
                    <td style="padding:12px 16px; font-size:14px; color:#333333;">
                      Pending Review
                    </td>
                  </tr>
                </table>

                <p style="font-size:15px; color:#444444; line-height:1.6;">
                  You’ll receive an update by email once your profile has been reviewed and approved.
                  In the meantime, please ensure your documents are valid and readable.
                </p>

                <p style="font-size:15px; color:#444444; line-height:1.6; margin-top:20px;">
                  Thank you for your patience and for choosing to be part of our therapist community.
                </p>

                <p style="font-size:15px; color:#444444; margin-top:25px;">
                  Warm regards,<br />
                  <strong>Catalystcare Support Team</strong><br/>
                  <span style="color:#6b7280;">Catalystcare</span>
                </p>
              </td>
            </tr>

                        <tr>
                <td align="center" style="background-color: #f3f4f6; padding: 12px; font-size: 13px; color: #555;">
                  © Catalyst Care | <a href="${serverConfig.baseFrontendUrl}" style="color: #007bff; text-decoration: none;">${serverConfig.baseFrontendUrl}</a>
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
