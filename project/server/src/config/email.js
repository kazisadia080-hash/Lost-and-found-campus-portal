import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_PORT === '465',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  } else {
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
    });
  }
  return transporter;
}

export async function sendOtpEmail(toEmail, otpCode, purpose) {
  const transport = getTransporter();
  const subject = purpose === 'reset_password' ? 'Your password reset OTP' : 'Your account deletion OTP';
  const text = purpose === 'reset_password'
    ? `Your OTP for password reset is: ${otpCode}\n\nThis code expires in 10 minutes. If you did not request this, you can safely ignore this email.`
    : `Your OTP for account deletion is: ${otpCode}\n\nThis code expires in 10 minutes. If you did not request this, you can safely ignore this email.`;
  const html = purpose === 'reset_password'
    ? `<p>Your OTP for password reset is:</p><h2 style="letter-spacing:4px;font-size:28px">${otpCode}</h2><p>This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>`
    : `<p>Your OTP for account deletion is:</p><h2 style="letter-spacing:4px;font-size:28px">${otpCode}</h2><p>This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>`;
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Lost & Found <noreply@lostfound.local>',
    to: toEmail,
    subject,
    text,
    html,
  };
  await transport.sendMail(mailOptions);
}
