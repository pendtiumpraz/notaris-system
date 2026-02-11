import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@notaris.com';
const APP_NAME = process.env.APP_NAME || 'Portal Notaris';
const APP_URL = process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">⚖️ ${APP_NAME}</h1>
      </div>
      <div style="padding: 32px; color: #e2e8f0;">
        <h2 style="color: #f1f5f9; margin-top: 0;">Reset Password</h2>
        <p>Anda menerima email ini karena ada permintaan reset password untuk akun Anda.</p>
        <p>Klik tombol di bawah untuk membuat password baru:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Reset Password
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 14px;">Link ini akan kadaluarsa dalam 1 jam.</p>
        <p style="color: #94a3b8; font-size: 14px;">Jika Anda tidak meminta reset password, abaikan email ini.</p>
        <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />
        <p style="color: #64748b; font-size: 12px; text-align: center;">
          &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Reset Password - ${APP_NAME}`,
    html,
  });
}

export async function sendDocumentStatusEmail(
  email: string,
  documentTitle: string,
  documentNumber: string,
  newStatus: string,
  statusLabel: string
) {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">⚖️ ${APP_NAME}</h1>
      </div>
      <div style="padding: 32px; color: #e2e8f0;">
        <h2 style="color: #f1f5f9; margin-top: 0;">Update Status Dokumen</h2>
        <p>Dokumen Anda telah diperbarui:</p>
        <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Judul:</strong> ${documentTitle}</p>
          <p style="margin: 4px 0;"><strong>Nomor:</strong> ${documentNumber}</p>
          <p style="margin: 4px 0;"><strong>Status Baru:</strong> <span style="color: #10b981; font-weight: 600;">${statusLabel}</span></p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${APP_URL}/documents" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Lihat Dokumen
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />
        <p style="color: #64748b; font-size: 12px; text-align: center;">
          &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Update Dokumen ${documentNumber} - ${APP_NAME}`,
    html,
  });
}
