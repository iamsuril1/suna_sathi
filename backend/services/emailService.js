// backend/services/emailService.js
// CREATE a new folder called "services" inside backend/ and put this file there

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const sendOTPEmail = async (toEmail, otp, userName) => {
  const mailOptions = {
    from: `"SunaSathi" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Verify your SunaSathi account — OTP inside",
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
      <body style="margin:0;padding:0;background:#0B0F1A;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0F1A;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0"
                style="background:#111827;border-radius:16px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;max-width:480px;width:100%;">

                <!-- Header gradient -->
                <tr>
                  <td style="background:linear-gradient(135deg,#6366F1,#8B5CF6,#EC4899);padding:32px;text-align:center;">
                    <h1 style="margin:0;color:#fff;font-size:26px;font-weight:bold;">🎵 SunaSathi</h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Your Perfect Music Companion</p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:36px 32px;">
                    <p style="margin:0 0 6px;color:#9CA3AF;font-size:14px;">Hello${userName ? ` <strong style="color:#fff;">${userName}</strong>` : ""},</p>
                    <h2 style="margin:0 0 14px;color:#fff;font-size:20px;font-weight:bold;">Verify your email address</h2>
                    <p style="margin:0 0 28px;color:#9CA3AF;font-size:14px;line-height:1.6;">
                      Enter the code below to verify your account.
                      This code expires in <strong style="color:#fff;">10 minutes</strong>.
                    </p>

                    <!-- OTP Box -->
                    <div style="background:#1F2937;border:2px solid #6366F1;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                      <p style="margin:0 0 8px;color:#9CA3AF;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Your verification code</p>
                      <p style="margin:0;color:#fff;font-size:42px;font-weight:bold;letter-spacing:14px;font-family:'Courier New',monospace;">${otp}</p>
                    </div>

                    <p style="margin:0 0 6px;color:#6B7280;font-size:12px;">⚠️ Never share this code with anyone.</p>
                    <p style="margin:0;color:#6B7280;font-size:12px;">If you didn't create an account, ignore this email.</p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="border-top:1px solid rgba(255,255,255,0.08);padding:18px 32px;text-align:center;">
                    <p style="margin:0;color:#4B5563;font-size:11px;">© ${new Date().getFullYear()} SunaSathi · Pātan, Nepal</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Call this on server startup to confirm Gmail connection works
 */
const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log("✅ Email service ready (Gmail)");
  } catch (err) {
    console.error("❌ Email service error:", err.message);
    console.error("   → Check GMAIL_USER and GMAIL_APP_PASSWORD in .env");
  }
};

module.exports = { sendOTPEmail, verifyEmailConnection };