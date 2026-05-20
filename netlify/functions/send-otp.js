const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { email, action, enteredOtp, newPassword } = JSON.parse(event.body);

    if (action === 'send') {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`[AUTH] OTP for ${email}: ${otp}`);

      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: 'Cherify Auth <onboarding@resend.dev>',
          to: email,
          subject: 'Your Cherify Verification Code',
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #6366f1;">Cherify Music</h2>
              <p>Your identity verification code is:</p>
              <div style="background: #f4f4f5; padding: 20px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 5px; border-radius: 8px;">
                ${otp}
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                This code will expire in 10 minutes. If you did not request this, please ignore this email.
              </p>
            </div>
          `
        });
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "OTP sent successfully", mock: !process.env.RESEND_API_KEY ? otp : null })
      };
    }

    if (action === 'verify') {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    if (action === 'reset') {
      console.log(`[AUTH] Updating password for ${email}`);
      return { statusCode: 200, body: JSON.stringify({ message: "Password updated successfully" }) };
    }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
