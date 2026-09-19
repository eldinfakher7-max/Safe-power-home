const nodemailer = require('nodemailer');

function getEmailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    if (host) {
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });
    } else {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
      });
    }
  }
  return null;
}

async function sendEmailOtp(toEmail, otpCode) {
  const transporter = getEmailTransporter();
  if (!transporter) {
    console.log('[Notification Service] ⚠️ SMTP credentials (SMTP_USER/SMTP_PASS) not configured in environment.');
    return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || ('"Smart Power Home" <' + process.env.SMTP_USER + '>'),
    to: toEmail,
    subject: 'Verification Code - Smart Power Home',
    text: 'Your verification code is: ' + otpCode + '\n\nValid for 5 minutes.',
    html: '<div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;"><h2 style="color: #1e3a8a;">Smart Power Home Security</h2><p>Your password recovery verification code is:</p><div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; color: #2563eb; letter-spacing: 4px;">' + otpCode + '</div><p style="color: #6b7280; font-size: 13px;">This code expires in 5 minutes.</p></div>'
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Notification Service] ✅ Email sent to', toEmail, 'ID:', info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Notification Service] ❌ Email error:', error.message);
    return { sent: false, error: error.message };
  }
}

async function sendSmsOtp(toPhone, otpCode) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  if (accountSid && authToken && fromPhone) {
    try {
      const auth = Buffer.from(accountSid + ':' + authToken).toString('base64');
      const body = new URLSearchParams({
        To: toPhone,
        From: fromPhone,
        Body: 'Smart Power Home code: ' + otpCode + '. Valid for 5 minutes.'
      });
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + auth,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });
      const data = await res.json();
      if (res.ok) {
        console.log('[Notification Service] ✅ SMS sent via Twilio to', toPhone, data.sid);
        return { sent: true, sid: data.sid };
      } else {
        console.error('[Notification Service] ❌ Twilio API error:', data.message);
        return { sent: false, error: data.message };
      }
    } catch (error) {
      console.error('[Notification Service] ❌ SMS error:', error.message);
      return { sent: false, error: error.message };
    }
  }

  console.log('[Notification Service] ⚠️ SMS gateway (TWILIO_ACCOUNT_SID) not configured.');
  return { sent: false, reason: 'SMS_GATEWAY_NOT_CONFIGURED' };
}

module.exports = { sendEmailOtp, sendSmsOtp };
