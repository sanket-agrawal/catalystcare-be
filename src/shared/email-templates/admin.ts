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
    ? `${serverConfig.baseFrontendUrl}/therapist-dashboard`
    : `${serverConfig.baseFrontendUrl}/therapist-dashboard/therapist-profile`;

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
            <table width="500" cellpadding="0" cellspacing="0" border="0"
              style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              
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
                  <h3 style="color: ${approve ? "#28a745" : "#dc3545"}; margin-bottom: 15px;">
                    ${heading}
                  </h3>

                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                    ${message}
                  </p>

                  ${
                    approve
                      ? `
                        <div style="margin-top: 20px; text-align: left;">
                          <h4 style="color: #333; margin-bottom: 10px;">Next Steps</h4>
                          <ol style="color: #555; font-size: 14px; line-height: 1.6; padding-left: 18px;">
                            <li>
                              <strong>Connect your Google Calendar</strong><br/>
                              This allows us to sync your sessions automatically and avoid scheduling conflicts.
                            </li>
                            <li style="margin-top: 8px;">
                              <strong>Add your availability</strong><br/>
                              Set your available days and time slots so clients can start booking sessions with you.
                            </li>
                          </ol>
                        </div>
                      `
                      : `
                        <p style="color: #555; font-size: 15px; margin-top: 10px;">
                          Our support team will be happy to help if you need clarification or guidance.
                        </p>
                      `
                  }

                  <a href="${buttonLink}" 
                     style="display:inline-block; margin-top:20px; padding:10px 20px;
                            background-color:${buttonColor}; color:#fff;
                            border-radius:6px; text-decoration:none; font-size:14px;">
                     ${buttonText}
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center"
                    style="background-color: #f3f4f6; padding: 12px; font-size: 13px; color: #555;">
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

export const therapistProfileHoldRemovedTemplate = (
  firstName: string
) => {
  const heading = `Your Profile Is Active Again`;

  const message = `
    We’re happy to inform you that the review of your therapist profile on Catalyst Care has been completed.
    Your profile is no longer on hold and is now <strong>active and visible to clients</strong>.
  `;

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Therapist Profile Active</title>
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

                  <h3 style="color: #28a745; margin-bottom: 15px;">
                    ${heading}
                  </h3>

                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                    ${message}
                  </p>

                  <p style="color: #555; font-size: 15px; margin-top: 15px;">
                    You can now continue accepting bookings and connecting with clients on the platform.
                  </p>

                  <a href="${serverConfig.baseFrontendUrl}/dashboard"
                     style="display:inline-block; margin-top:20px; padding:10px 20px; background-color:#ffffff; color:#333; border-radius:6px; text-decoration:none; font-size:14px; border:1px solid #ccc; cursor:pointer;">
                     Go to Dashboard
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

export const adminTherapistProfileSubmissionTemplate = (
  therapistName: string,
  therapistEmail: string
) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Therapist Profile Submission</title>
</head>
<body style="margin:0; padding:0; font-family: Roboto, Arial, sans-serif; background-color:#f7f7f7;">

<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f7f7; padding:30px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05);">

        <tr>
          <td align="center" style="padding:20px;">
            <img src="${serverConfig.baseFrontendUrl}/assets/favicon.ico" alt="Catalyst Care" width="120" />
          </td>
        </tr>

        <tr>
          <td align="center" style="background-color:#4f46e5; padding:20px;">
            <h2 style="color:#ffffff; margin:0;">Therapist Profile Submitted</h2>
          </td>
        </tr>

        <tr>
          <td style="padding:30px;">

            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb; border-radius:6px; margin:24px 0;">
              <tr style="background:#f9fafb;">
                <td style="padding:12px 16px; font-size:14px; width:35%;">
                  <strong>Name</strong>
                </td>
                <td style="padding:12px 16px; font-size:14px;">
                  ${therapistName}
                </td>
              </tr>
              <tr>
                <td style="padding:12px 16px; font-size:14px;">
                  <strong>Email</strong>
                </td>
                <td style="padding:12px 16px; font-size:14px;">
                  ${therapistEmail}
                </td>
              </tr>
            </table>

            <p style="font-size:15px; color:#444; margin-top:24px;">
              CatalystCare System
            </p>
          </td>
        </tr>

        <tr>
          <td align="center" style="background:#f3f4f6; padding:12px; font-size:13px; color:#555;">
            © CatalystCare Admin Panel
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


export const adminTherapistResubmissionTemplate = (
  therapistName: string,
  therapistEmail: string
) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Therapist Profile Resubmitted</title>
</head>
<body style="margin:0; padding:0; font-family: Roboto, Arial, sans-serif; background-color:#f7f7f7;">

<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f7f7; padding:30px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05);">

        <tr>
          <td align="center" style="padding:20px;">
            <img src="${serverConfig.baseFrontendUrl}/assets/favicon.ico" alt="Catalyst Care" width="120" />
          </td>
        </tr>

        <tr>
          <td align="center" style="background-color:#4f46e5; padding:20px;">
            <h2 style="color:#ffffff; margin:0;">Therapist Profile Resubmitted</h2>
          </td>
        </tr>

        <tr>
          <td style="padding:30px;">
            <p style="font-size:15px; color:#333;">
              A therapist has resubmitted their profile after making the requested updates.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb; border-radius:6px; margin:24px 0;">
              <tr style="background:#f9fafb;">
                <td style="padding:12px 16px; font-size:14px; width:35%;">
                  <strong>Name</strong>
                </td>
                <td style="padding:12px 16px; font-size:14px;">
                  ${therapistName}
                </td>
              </tr>
              <tr>
                <td style="padding:12px 16px; font-size:14px;">
                  <strong>Email</strong>
                </td>
                <td style="padding:12px 16px; font-size:14px;">
                  ${therapistEmail}
                </td>
              </tr>
              <tr>
                <td style="padding:12px 16px; font-size:14px;">
                  <strong>Status</strong>
                </td>
                <td style="padding:12px 16px; font-size:14px;">
                  Pending Review
                </td>
              </tr>
            </table>

            <p style="font-size:15px; color:#444;">
              Please review the updated profile and take the appropriate action.
            </p>

            <p style="font-size:15px; color:#444; margin-top:24px;">
              CatalystCare System
            </p>
          </td>
        </tr>

        <tr>
          <td align="center" style="background:#f3f4f6; padding:12px; font-size:13px; color:#555;">
            © CatalystCare Admin Panel
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


export const adminTherapistRescheduleRequestTemplate = (
  therapistName: string,
  clientName: string,
  startDateTime: string,
  reason: string
) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Therapist Reschedule Request</title>
</head>

<body style="margin:0; padding:0; font-family: Roboto, Arial, sans-serif; background-color:#f7f7f7;">

<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f7f7; padding:30px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05);">

        <!-- Logo -->
        <tr>
          <td align="center" style="padding:20px;">
            <img src="${serverConfig.baseFrontendUrl}/assets/favicon.ico" alt="CatalystCare" width="120" />
          </td>
        </tr>

        <!-- Header -->
        <tr>
          <td align="center" style="background-color:#4f46e5; padding:20px;">
            <h2 style="color:#ffffff; margin:0;">
              Therapist Reschedule Request
            </h2>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:30px;">

            <p style="font-size:15px; color:#444; margin-bottom:20px;">
              A therapist has requested to reschedule a confirmed therapy session.
              Please review the details below and take the necessary action from the admin dashboard.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb; border-radius:6px; margin:24px 0;">
              
              <tr style="background:#f9fafb;">
                <td style="padding:12px 16px; font-size:14px; width:35%;">
                  <strong>Therapist</strong>
                </td>
                <td style="padding:12px 16px; font-size:14px;">
                  ${therapistName}
                </td>
              </tr>

              <tr>
                <td style="padding:12px 16px; font-size:14px;">
                  <strong>Client</strong>
                </td>
                <td style="padding:12px 16px; font-size:14px;">
                  ${clientName}
                </td>
              </tr>

              <tr style="background:#f9fafb;">
                <td style="padding:12px 16px; font-size:14px;">
                  <strong>Scheduled Date & Time</strong>
                </td>
                <td style="padding:12px 16px; font-size:14px;">
                  ${startDateTime}
                </td>
              </tr>

              <tr>
                <td style="padding:12px 16px; font-size:14px;">
                  <strong>Reschedule Reason</strong>
                </td>
                <td style="padding:12px 16px; font-size:14px; color:#374151;">
                  ${reason || "Not specified"}
                </td>
              </tr>

            </table>

            <!-- CTA -->
            <div style="text-align:center; margin-top:30px;">
                Go to Admin Dashboard
            </div>

            <p style="font-size:15px; color:#444; margin-top:32px;">
              CatalystCare System
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="background:#f3f4f6; padding:12px; font-size:13px; color:#555;">
            © CatalystCare Admin Panel
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
