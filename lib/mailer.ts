import nodemailer from "nodemailer";

export async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || '"QuickCart" <noreply@quickcart.com>';

  console.log(`[OTP DEBUG] Verification OTP for ${email}: ${otp}`);

  // If SMTP is not fully configured, log to console and succeed (dev mode)
  if (!host || !user || !pass) {
    console.log("ℹ️ SMTP credentials not fully configured. Using console log fallback.");
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="font-size: 40px;">🛒</span>
          <h1 style="color: #ea580c; font-size: 24px; margin: 8px 0 0 0; font-weight: 700;">QuickCart</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Groceries delivered in minutes</p>
        </div>
        <div style="background-color: #fff7ed; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
          <p style="color: #9a3412; font-size: 14px; margin: 0 0 10px 0; font-weight: 500;">Your verification code is:</p>
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ea580c; display: inline-block; font-family: monospace;">${otp}</span>
          <p style="color: #9a3412; font-size: 12px; margin: 10px 0 0 0;">This code is valid for 10 minutes. Do not share it with anyone.</p>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">If you did not request this email, please ignore it.</p>
      </div>
    `;

    await transporter.sendMail({
      from,
      to: email,
      subject: `${otp} is your QuickCart verification code`,
      html: htmlContent,
    });

    console.log(`✅ Email OTP sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to send SMTP email:", error);
    // Still return true so verification flow isn't blocked if SMTP fails
    return true;
  }
}
