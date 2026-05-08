import { emailFromAddress } from "../../config/email.config";
import { serverConfig } from "../../config/server.config";
import { companyWhatsappDetails } from "../../config/whatsapp.config";

export const customPlanPaymentLinkTemplate = ({
  firstName,
  paymentLink,
  sessionsCount,
  maxMembers,
  sessionDuration,
  pricePaise,
  billingCycle,
  currency = "INR",
}: {
  firstName: string;
  paymentLink: string;
  sessionsCount: number;
  maxMembers: number;
  sessionDuration: number;
  pricePaise: number;
  billingCycle: string;
  currency?: string;
}) => {
  const price = (pricePaise / 100).toLocaleString("en-IN");

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Complete Your Payment</title>
    </head>
    <body style="font-family: Roboto, Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 30px 0;">
        <tr>
          <td align="center">
            <table width="500" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              
              <!-- Header -->
              <tr>
                <td align="center" style="padding: 20px;">
                  <img src="${serverConfig.baseFrontendUrl}/assets/favicon.ico" alt="Catalyst Care" width="120" />
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 25px;">
                  <h2 style="color: #333; text-align:center;">Hi ${firstName},</h2>
                  
                  <p style="color: #555; font-size: 15px; text-align:center;">
                    Your custom plan is ready 🎉 Please review the details below and complete your payment.
                  </p>

                  <!-- Plan Details Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px; border:1px solid #eee; border-radius:8px; padding:15px;">
                    <tr>
                      <td style="font-size:14px; color:#333; padding:6px 0;">
                        <strong>Sessions:</strong> ${sessionsCount}
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size:14px; color:#333; padding:6px 0;">
                        <strong>Max Members:</strong> ${maxMembers}
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size:14px; color:#333; padding:6px 0;">
                        <strong>Session Duration:</strong> ${sessionDuration} mins
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size:14px; color:#333; padding:6px 0;">
                        <strong>Billing Cycle:</strong> ${billingCycle}
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size:16px; color:#000; padding:10px 0;">
                        <strong>Total Amount:</strong> ₹${price}
                      </td>
                    </tr>
                  </table>

                  <!-- CTA -->
                  <div style="text-align:center;">
                    <a href="${paymentLink}" 
                       target="_blank"
                       rel="noopener noreferrer"
                       style="display:inline-block; margin-top:20px; padding:10px 20px; background-color:#ffffff; color:#007bff; border:1px solid #007bff; border-radius:6px; text-decoration:none; font-size:14px; cursor:pointer;">
                       Complete Payment
                    </a>
                  </div>

                  <p style="color: #777; font-size: 13px; margin-top: 20px; text-align:center;">
                    Need help? Just reply to this email—we’re happy to assist.
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

export const orgActivationTemplate = ({
  firstName,
  orgName,
  sessionsCount,
  maxMembers,
  validFrom,
  validTill,
  invoiceNumber,
  sessionDuration,
  pricePaise,
  billingCycle,
  currency = "INR",
  setupToken
}: {
  firstName: string;
  orgName: string;
  sessionsCount: number;
  maxMembers: number;
  validFrom: Date;
  validTill: Date;
  invoiceNumber: string;
  sessionDuration: number;
  pricePaise: number;
  billingCycle: string;
  currency?: string;
  setupToken : string;
}) => {
  const price = (pricePaise / 100).toLocaleString("en-IN");
  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Your Plan is Active</title>
    </head>
    <body style="font-family: Roboto, Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 30px 0;">
        <tr>
          <td align="center">
            <table width="500" cellpadding="0" cellspacing="0" border="0"
              style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">

              <!-- Header -->
              <tr>
                <td align="center" style="padding: 20px;">
                  <img src="${serverConfig.baseFrontendUrl}/assets/favicon.ico" alt="Catalyst Care" width="120" />
                </td>
              </tr>

              <!-- Hero Banner -->
              <tr>
                <td align="center"
                  style="background-color: #f0fdf4; padding: 24px 25px; border-top: 3px solid #22c55e;">
                  <p style="font-size: 28px; margin: 0;">🎉</p>
                  <h2 style="color: #15803d; margin: 8px 0 4px;">You're All Set, ${firstName}!</h2>
                  <p style="color: #555; font-size: 14px; margin: 0;">
                    <strong>${orgName}</strong>'s wellness plan is now active.
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 25px;">
                  <p style="color: #555; font-size: 15px; text-align: center; margin-top: 0;">
                    Your payment has been confirmed and your team can now start booking sessions.
                    Here's a summary of your plan.
                  </p>

                  <!-- Plan Summary Card -->
                  <table width="100%" cellpadding="0" cellspacing="0"
                    style="margin-top: 16px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">

                    <tr style="background-color: #f9fafb;">
                      <td style="padding: 10px 14px; font-size: 13px; color: #6b7280; width: 50%;">
                        INVOICE NO.
                      </td>
                      <td style="padding: 10px 14px; font-size: 13px; color: #111827; font-weight: 600;">
                        ${invoiceNumber}
                      </td>
                    </tr>

                    <tr>
                      <td style="padding: 10px 14px; font-size: 13px; color: #6b7280; border-top: 1px solid #f3f4f6;">
                        SESSIONS
                      </td>
                      <td style="padding: 10px 14px; font-size: 13px; color: #111827; font-weight: 600; border-top: 1px solid #f3f4f6;">
                        ${sessionsCount} sessions
                      </td>
                    </tr>

                    <tr style="background-color: #f9fafb;">
                      <td style="padding: 10px 14px; font-size: 13px; color: #6b7280; border-top: 1px solid #f3f4f6;">
                        MAX MEMBERS
                      </td>
                      <td style="padding: 10px 14px; font-size: 13px; color: #111827; font-weight: 600; border-top: 1px solid #f3f4f6;">
                        ${maxMembers} members
                      </td>
                    </tr>

                    <tr>
                      <td style="padding: 10px 14px; font-size: 13px; color: #6b7280; border-top: 1px solid #f3f4f6;">
                        SESSION DURATION
                      </td>
                      <td style="padding: 10px 14px; font-size: 13px; color: #111827; font-weight: 600; border-top: 1px solid #f3f4f6;">
                        ${sessionDuration} mins
                      </td>
                    </tr>

                    <tr style="background-color: #f9fafb;">
                      <td style="padding: 10px 14px; font-size: 13px; color: #6b7280; border-top: 1px solid #f3f4f6;">
                        BILLING CYCLE
                      </td>
                      <td style="padding: 10px 14px; font-size: 13px; color: #111827; font-weight: 600; border-top: 1px solid #f3f4f6;">
                        ${billingCycle}
                      </td>
                    </tr>

                    <tr>
                      <td style="padding: 10px 14px; font-size: 13px; color: #6b7280; border-top: 1px solid #f3f4f6;">
                        AMOUNT PAID
                      </td>
                      <td style="padding: 10px 14px; font-size: 13px; color: #111827; font-weight: 600; border-top: 1px solid #f3f4f6;">
                        ₹${price} ${currency}
                      </td>
                    </tr>

                    <!-- Validity — highlighted -->
                    <tr style="background-color: #f0fdf4;">
                      <td style="padding: 10px 14px; font-size: 13px; color: #15803d; border-top: 1px solid #f3f4f6;">
                        VALID FROM
                      </td>
                      <td style="padding: 10px 14px; font-size: 13px; color: #15803d; font-weight: 600; border-top: 1px solid #f3f4f6;">
                        ${formatDate(validFrom)}
                      </td>
                    </tr>

                    <tr style="background-color: #f0fdf4;">
                      <td style="padding: 10px 14px; font-size: 13px; color: #15803d; border-top: 1px solid #f3f4f6;">
                        VALID TILL
                      </td>
                      <td style="padding: 10px 14px; font-size: 13px; color: #15803d; font-weight: 600; border-top: 1px solid #f3f4f6;">
                        ${formatDate(validTill)}
                      </td>
                    </tr>

                  </table>

                  <!-- Next Step CTA -->
                 <!-- Next Step CTA -->
<table width="100%" cellpadding="0" cellspacing="0"
  style="margin-top: 24px; background-color: #eff6ff; border-radius: 8px; padding: 16px; border: 1px solid #bfdbfe;">
  <tr>
    <td>
      <p style="margin: 0 0 6px; font-size: 14px; color: #1e40af; font-weight: 600;">
        Next Step: Set Up Your Organization
      </p>
      <p style="margin: 0; font-size: 13px; color: #3b82f6;">
        Click below to set up your team. You'll be asked to enter the email
        of the person who will manage your organization on Catalyst Care.
      </p>
      <p style="margin: 6px 0 0; font-size: 12px; color: #6b7280;">
        This link expires in 7 days.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding-top: 14px;">
      <a href="${serverConfig.baseFrontendUrl}/org/setup?token=${setupToken}"
        target="_blank"
        rel="noopener noreferrer"
        style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #ffffff; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">
        Set Up Your Organization →
      </a>
    </td>
  </tr>
</table>
                  <p style="color: #777; font-size: 13px; margin-top: 24px; text-align: center;">
                    Need help? Just reply to this email — we're happy to assist.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center"
                  style="background-color: #f3f4f6; padding: 12px; font-size: 13px; color: #555;">
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
                    style="margin-left: 10px;">
                    <img src="https://cdn-icons-png.flaticon.com/24/733/733585.png"
                      width="20" height="20" alt="WhatsApp" style="vertical-align: middle;">
                  </a>

                  <a href="mailto:${emailFromAddress().infoEmail.email}"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="margin-left: 10px;">
                    <img src="https://cdn-icons-png.flaticon.com/24/732/732200.png"
                      width="20" height="20" alt="Email" style="vertical-align: middle;">
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