import { serverConfig } from "../../shared/config/server.config";

export const therapistProfileApprovalTemplate = (firstName: string, approve: boolean) => {
  const heading = approve
    ? `Your Profile Has Been Approved!`
    : `Your Profile Review Result`;
  const message = approve
    ? `We’re excited to let you know that your therapist profile has been approved on Catalyst Care. You can now start connecting with clients and offering your services on our platform.`
    : `After reviewing your therapist profile, we’re unable to approve it at this time. Please review the submitted details and make sure all information and documents meet our verification standards before reapplying.`;
  const buttonText = approve ? `Go to Dashboard` : `Review Your Profile`;
  const buttonLink = approve
    ? `${serverConfig.baseFrontendUrl}/dashboard`
    : `${serverConfig.baseFrontendUrl}/profile`;
  const buttonColor = approve ? `#28a745` : `#dc3545`;

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Therapist Profile ${approve ? "Approved" : "Rejected"}</title>
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
                  <h3 style="color: ${approve ? "#28a745" : "#dc3545"}; margin-bottom: 15px;">${heading}</h3>
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                    ${message}
                  </p>
                  ${
                    !approve
                      ? `<p style="color: #555; font-size: 15px; margin-top: 10px;">
                          Our support team will be happy to help if you need clarification or guidance.
                         </p>`
                      : ""
                  }
                  <a href="${buttonLink}" 
                     style="display:inline-block; margin-top:20px; padding:10px 20px; background-color:${buttonColor}; color:#fff; border-radius:6px; text-decoration:none; font-size:14px;">
                     ${buttonText}
                  </a>
                </td>
              </tr>

              <!-- Footer -->
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

export const therapistProfileOnHoldTemplate = (
  firstName: string,
  holdReason: string
) => {
  const heading = `Your Profile Is Currently On Hold`;

const message = `
  We’re writing to inform you that your previously approved therapist profile on Catalyst Care has been temporarily placed <strong>on hold</strong>.
  During this period, your profile will not be visible to clients and new bookings may be paused until the review is completed.
`;

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Therapist Profile On Hold</title>
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

                  <h3 style="color: #f59e0b; margin-bottom: 15px;">
                    ${heading}
                  </h3>

                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                    ${message}
                  </p>

                  <!-- Reason -->
                  <div style="margin-top: 15px; padding: 12px; background-color: #fff7ed; border-left: 4px solid #f59e0b; text-align: left;">
                    <p style="margin: 0; font-size: 14px; color: #333;">
                      <strong>Reason:</strong><br />
                      ${holdReason}
                    </p>
                  </div>

                  <p style="color: #555; font-size: 15px; margin-top: 15px;">
                    Please review and update your profile accordingly. Once updated, our team will re-evaluate it.
                  </p>

                  <a href="${serverConfig.baseFrontendUrl}/profile"
                     style="display:inline-block; margin-top:20px; padding:10px 20px; background-color:#ffffff; color:#333; border-radius:6px; text-decoration:none; font-size:14px; border:1px solid #ccc; cursor:pointer;">
                     Review Your Profile
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
