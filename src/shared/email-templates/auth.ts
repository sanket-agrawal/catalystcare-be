import { serverConfig } from "../../shared/config/server.config";

export const otpVerificationTemplate = (firstName: string, otp: string) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>OTP Verification</title>
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
                    Use the OTP below to verify your email address:
                  </p>
                  
                  <table align="center" style="margin: 20px auto; background: #f3f4f6; border-radius: 8px;">
                    <tr>
                      <td style="padding: 12px 30px; font-size: 22px; font-weight: bold; letter-spacing: 3px; color: #000;">
                        ${otp}
                      </td>
                    </tr>
                  </table>

                  <p style="color: #777; font-size: 14px; margin-top: 15px;">
                    This OTP is valid for the next 10 minutes.
                  </p>
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

export const welcomeEmailTemplate = (firstName: string) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Welcome to Catalyst Care</title>
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
                  <h2 style="color: #333; margin-bottom: 10px;">Welcome to Catalyst Care, ${firstName}!</h2>
                  <p style="color: #555; font-size: 15px; margin: 0;">
                    Your email has been successfully verified. We’re thrilled to have you join our community.
                  </p>
                  <p style="color: #555; font-size: 15px; margin-top: 15px;">
                    Start exploring personalized care, wellness, and therapy sessions — all in one place.
                  </p>
                  <a href="${serverConfig.baseFrontendUrl}" 
                     style="display:inline-block; margin-top:20px; padding:10px 20px; background-color:#007bff; color:#fff; border-radius:6px; text-decoration:none; font-size:14px;">
                     Visit Website
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

export const forgotPasswordOtpTemplate = (firstName: string, otp: string) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Forgot Password - OTP Verification</title>
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
                    We received a request to reset your password. Use the OTP below to verify your identity:
                  </p>
                  
                  <table align="center" style="margin: 20px auto; background: #f3f4f6; border-radius: 8px;">
                    <tr>
                      <td style="padding: 12px 30px; font-size: 22px; font-weight: bold; letter-spacing: 3px; color: #000;">
                        ${otp}
                      </td>
                    </tr>
                  </table>

                  <p style="color: #777; font-size: 14px; margin-top: 15px;">
                    This OTP is valid for the next 10 minutes. Please do not share it with anyone.
                  </p>

                  <p style="color: #999; font-size: 13px; margin-top: 20px;">
                    If you didn’t request a password reset, you can safely ignore this email.
                  </p>
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
