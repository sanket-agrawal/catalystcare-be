import { serverConfig } from "../config/server.config";

export const therapyRecommendationTemplate = (firstName: string) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>We're Here for You</title>
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
                  <h2 style="color: #333; margin-bottom: 15px;">Hi ${firstName},</h2>
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                    We noticed you’ve been carrying some heavy feelings lately. Please remember that you don’t have to navigate this alone.
                  </p>
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin-top: 15px;">
                    CatalystCare has a network of compassionate, certified therapists who can support you through this. Talking to a professional can help bring clarity and peace of mind.
                  </p>
                  <a href="${serverConfig.baseFrontendUrl}" 
                     style="display:inline-block; margin-top:20px; padding:12px 24px; background-color:#28a745; color:#fff; border-radius:6px; text-decoration:none; font-size:14px; font-weight:bold;">
                     Connect with a Therapist
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

export const proactiveCheckInTemplate = (firstName: string) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Checking In on You</title>
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
                  <h2 style="color: #333; margin-bottom: 15px;">Hi ${firstName},</h2>
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                    We noticed you haven't checked in with our venting space recently, and wanted to reach out to see how you are doing.
                  </p>
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin-top: 15px;">
                    Your emotional well-being is our priority. If you've been feeling overwhelmed or just need someone to talk to, CatalystCare's certified therapists are here to support you.
                  </p>
                  <a href="${serverConfig.baseFrontendUrl}" 
                     style="display:inline-block; margin-top:20px; padding:12px 24px; background-color:#28a745; color:#fff; border-radius:6px; text-decoration:none; font-size:14px; font-weight:bold;">
                     Connect with a Therapist
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

export const professionalWellbeingTemplate = (firstName: string) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Taking Care of Yourself</title>
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
                  <h2 style="color: #333; margin-bottom: 15px;">Hi ${firstName},</h2>
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                    We noticed you’ve been carrying some heavy feelings lately. Please remember to take a moment for yourself.
                  </p>
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin-top: 15px;">
                    Practicing self-care, box breathing, or mindful reflection can bring clarity and help restore your energy. We are here to support your personal wellness journey.
                  </p>
                  <a href="${serverConfig.baseFrontendUrl}" 
                     style="display:inline-block; margin-top:20px; padding:12px 24px; background-color:#28a745; color:#fff; border-radius:6px; text-decoration:none; font-size:14px; font-weight:bold;">
                     Explore Wellness Tools
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

export const professionalProactiveCheckInTemplate = (firstName: string) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Checking In on You</title>
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
                  <h2 style="color: #333; margin-bottom: 15px;">Hi ${firstName},</h2>
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                    We noticed you haven't checked in with our venting space recently, and wanted to reach out to see how you are doing.
                  </p>
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin-top: 15px;">
                    Your well-being is incredibly important. Taking a pause for self-compassion and breathing exercises can help you ground yourself. We are always here to support you.
                  </p>
                  <a href="${serverConfig.baseFrontendUrl}" 
                     style="display:inline-block; margin-top:20px; padding:12px 24px; background-color:#28a745; color:#fff; border-radius:6px; text-decoration:none; font-size:14px; font-weight:bold;">
                     Explore Wellness Tools
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

export const weeklyBookingRetentionTemplate = (firstName: string) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Checking In on Your Well-being - Catalyst Care</title>
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
                  <h2 style="color: #333; margin-bottom: 15px;">Hi ${firstName},</h2>
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                    We hope you are having a peaceful week. 
                  </p>
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin-top: 15px; margin-bottom: 15px;">
                    At Catalyst Care, we are committed to supporting you on your mental health journey. We noticed that you do not have any sessions scheduled for the upcoming week. Consistency is a vital part of the therapeutic process, and continuing your progress can help you stay aligned with your well-being goals.
                  </p>
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                    If you would like to schedule your next session, please use the link below:
                  </p>
                  <a href="${serverConfig.baseFrontendUrl}/therapists" 
                     style="display:inline-block; padding:12px 24px; background-color:#007bff; color:#fff; border-radius:6px; text-decoration:none; font-size:14px; font-weight:bold;">
                     Book Next Session
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

export const nonRepeatClientTemplate = (firstName: string) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Continue Your Wellness Journey - Catalyst Care</title>
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
                  <h2 style="color: #333; margin-bottom: 15px;">Hi ${firstName},</h2>
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                    We hope you found your initial therapy session helpful. Healing and self-growth are ongoing journeys that benefit greatly from consistency.
                  </p>
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin-top: 15px; margin-bottom: 20px;">
                    If you are ready to continue your progress or would like to try a session with another specialist, we are here to support you every step of the way.
                  </p>
                  <a href="${serverConfig.baseFrontendUrl}/therapists" 
                     style="display:inline-block; padding:12px 24px; background-color:#007bff; color:#fff; border-radius:6px; text-decoration:none; font-size:14px; font-weight:bold;">
                     Book Your Next Session
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

export const inactiveClientTemplate = (firstName: string) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>We'd Love to Help You Get Started - Catalyst Care</title>
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
                  <h2 style="color: #333; margin-bottom: 15px;">Hi ${firstName},</h2>
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                    It has been a while since we last saw you on Catalyst Care. Your mental health and emotional well-being are incredibly important, and taking the first step to schedule a session can make all the difference.
                  </p>
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin-top: 15px; margin-bottom: 20px;">
                    Whether you are dealing with daily stress, seeking guidance, or simply want someone to listen, our network of certified therapists is ready to assist you.
                  </p>
                  <a href="${serverConfig.baseFrontendUrl}/therapists" 
                     style="display:inline-block; padding:12px 24px; background-color:#007bff; color:#fff; border-radius:6px; text-decoration:none; font-size:14px; font-weight:bold;">
                     Browse Therapists
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
