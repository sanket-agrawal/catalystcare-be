export const therapistCalendarConnectedTemplate = (firstName: string) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Google Calendar Connected</title>
    </head>
    <body style="font-family: Roboto, Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9f9f9; padding: 30px 0;">
        <tr>
          <td align="center">
            <table width="500" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">

              <!-- Header -->
              <tr>
                <td align="center" style="padding: 20px;">
                  <img src="https://catalystcare.in/assets/favicon.ico" alt="Catalyst Care" width="120" style="display:block;">
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 25px; text-align: center;">
                  <h2 style="color: #333; margin-bottom: 10px;">Hi ${firstName},</h2>
                  <h3 style="color: #007bff; margin-bottom: 15px;">Google Calendar Connected Successfully!</h3>

                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                    Your Google Calendar has been securely connected to your Catalyst Care therapist account.
                  </p>

                  <p style="color: #555; font-size: 15px; margin-top: 10px; line-height: 1.6;">
                    From now on, all confirmed therapy bookings will automatically:
                  </p>

                  <ul style="text-align:left; display:inline-block; margin: 15px auto; padding-left:20px; color:#555; font-size:15px; line-height:1.6;">
                    <li>Be added to your Google Calendar instantly</li>
                    <li>Include a Google Meet link for the session</li>
                    <li>Block the session time to avoid double-bookings</li>
                    <li>Send invites to your clients automatically</li>
                  </ul>

                  <p style="color:#555; font-size:15px; margin-top:10px;">
                    You can manage or disconnect your calendar anytime from your Dashboard.
                  </p>

                  <a href="https://catalystcare.in/dashboard"
                     style="display:inline-block; margin-top:20px; padding:10px 20px; background-color:#007bff; color:#fff; border-radius:6px; text-decoration:none; font-size:14px;">
                    Go to Dashboard
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="background-color: #f3f4f6; padding: 12px; font-size: 13px; color: #555;">
                  © Catalyst Care | 
                  <a href="https://catalystcare.in" style="color: #007bff; text-decoration: none;">catalystcare.in</a>
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
