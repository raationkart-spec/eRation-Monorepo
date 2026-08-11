import nodemailer from "nodemailer";

export async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  const user = process.env.APP_EMAIL || process.env.SMTP_USER || "devilrngr@gmail.com";
  const pass = process.env.APP_PASSWORD || process.env.SMTP_PASS || "tznowozavibfpglo";
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const fromName = process.env.SMTP_FROM_NAME || "QuickCart Verification";
  const fromEmail = user;
  const from = `"${fromName}" <${fromEmail}>`;

  console.log(`[OTP DEBUG] Sending verification OTP for ${email}: ${otp}`);

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your QuickCart Verification Code</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f8fafc; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01); border: 1px solid #e2e8f0;">
                <!-- Header with Gradient Accent -->
                <tr>
                  <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 32px 24px; text-align: center;">
                    <div style="display: inline-block; background-color: #ffffff; padding: 12px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 12px;">
                      <span style="font-size: 36px; line-height: 1;">🛒</span>
                    </div>
                    <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">QuickCart</h1>
                    <p style="color: #ffedd5; font-size: 14px; margin: 6px 0 0 0; font-weight: 500;">Fresh groceries delivered to your door</p>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 36px 32px; text-align: center;">
                    <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">Verify Your Account</h2>
                    <p style="color: #64748b; font-size: 15px; line-height: 1.5; margin: 0 0 28px 0;">
                      Use the 6-digit verification code below to complete your sign in on QuickCart.
                    </p>

                    <!-- OTP Code Card -->
                    <div style="background-color: #fff7ed; border: 2px dashed #fdba74; border-radius: 16px; padding: 24px 16px; margin-bottom: 28px;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; color: #c2410c; letter-spacing: 12px; display: block; margin-left: 12px;">${otp}</span>
                    </div>

                    <!-- Expiry Note -->
                    <div style="display: flex; align-items: center; justify-content: center; gap: 6px; color: #9a3412; font-size: 13px; font-weight: 500; margin-bottom: 24px;">
                      <span>⏱️ This code will expire in <strong>10 minutes</strong>.</span>
                    </div>

                    <p style="color: #94a3b8; font-size: 13px; line-height: 1.4; margin: 0;">
                      If you didn't request this email, you can safely ignore it. Someone might have typed your email address by mistake.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f1f5f9; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 12px; margin: 0 0 4px 0;">© ${new Date().getFullYear()} QuickCart Commerce Inc. All rights reserved.</p>
                    <p style="color: #94a3b8; font-size: 11px; margin: 0;">QuickCart Instant Grocery Delivery</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from,
      to: email,
      subject: `${otp} is your QuickCart verification code`,
      html: htmlContent,
    });

    console.log(`✅ Email OTP successfully sent to ${email} via Nodemailer. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to send SMTP email:", error);
    throw error;
  }
}
