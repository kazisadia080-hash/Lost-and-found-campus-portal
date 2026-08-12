import nodemailer from 'nodemailer';

let transporter = null;

function parseSender(from) {
  const match = /^(.*)<([^>]+)>$/.exec(from);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { email: from.trim() };
}

async function sendWithBrevo(mailOptions) {
  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is not set');
  }

  const sender = parseSender(mailOptions.from || process.env.EMAIL_FROM || 'Lost & Found <noreply@lostfound.local>');
  const payload = {
    sender,
    to: [{ email: mailOptions.to }],
    subject: mailOptions.subject,
    textContent: mailOptions.text,
    htmlContent: mailOptions.html,
  };

  if (process.env.EMAIL_REPLY_TO) {
    const replyTo = parseSender(process.env.EMAIL_REPLY_TO);
    payload.replyTo = replyTo;
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Brevo email send failed: ${response.status} ${body}`);
  }

  return response.json();
}

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.BREVO_API_KEY) {
    transporter = { sendMail: sendWithBrevo };
    console.log('Using Brevo transactional email API for sending messages.');
  } else if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: parseInt(process.env.EMAIL_PORT || '587', 10) === 465,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    transporter.verify((err) => {
      if (err) {
        console.error('SMTP transporter verification failed:', err);
      } else {
        console.log('SMTP transporter ready to send emails.');
      }
    });
  } else {
    console.warn('EMAIL_HOST/EMAIL_USER/EMAIL_PASS not fully set — using stream transport (emails will not actually send).');
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
    });
  }
  return transporter;
}

export async function sendOtpEmail(toEmail, otpCode, purpose) {
  const transport = getTransporter();
  let subject = 'Your OTP code';
  let text = `Your OTP is: ${otpCode}\n\nThis code expires in 10 minutes.`;
  let html = `<p>Your OTP is:</p><h2 style="letter-spacing:4px;font-size:28px">${otpCode}</h2><p>This code expires in 10 minutes.</p>`;

  if (purpose === 'reset_password') {
    subject = 'Your password reset OTP';
    text = `Your OTP for password reset is: ${otpCode}\n\nThis code expires in 10 minutes. If you did not request this, you can safely ignore this email.`;
    html = `<p>Your OTP for password reset is:</p><h2 style="letter-spacing:4px;font-size:28px">${otpCode}</h2><p>This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>`;
  } else if (purpose === 'delete_account') {
    subject = 'Your account deletion OTP';
    text = `Your OTP for account deletion is: ${otpCode}\n\nThis code expires in 10 minutes. If you did not request this, you can safely ignore this email.`;
    html = `<p>Your OTP for account deletion is:</p><h2 style="letter-spacing:4px;font-size:28px">${otpCode}</h2><p>This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>`;
  } else if (purpose === 'verify_university') {
    subject = 'Verify your university email';
    text = `Your OTP to verify your university email is: ${otpCode}\n\nThis code expires in 10 minutes.`;
    html = `<p>Your OTP to verify your university email is:</p><h2 style="letter-spacing:4px;font-size:28px">${otpCode}</h2><p>This code expires in 10 minutes.</p>`;
  }
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Lost & Found <noreply@lostfound.local>',
    to: toEmail,
    subject,
    text,
    html,
  };
  await transport.sendMail(mailOptions);
}