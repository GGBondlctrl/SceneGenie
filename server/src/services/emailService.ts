import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  console.warn('RESEND_API_KEY not set — email sending will fail');
}

const resend = new Resend(RESEND_API_KEY || '');
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@scenegenie.app';

export async function sendVerificationCode(email: string, code: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: `SceneGenie <${FROM_EMAIL}>`,
    to: email,
    subject: 'Your SceneGenie Verification Code',
    text: `Your verification code is: ${code}\n\nThis code will expire in 5 minutes.\n\nIf you did not request this code, please ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
        <h2 style="color: #010828;">SceneGenie</h2>
        <p>Your verification code is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #6FFF00; background: #010828; padding: 16px; text-align: center; border-radius: 8px; margin: 16px 0;">
          ${code}
        </div>
        <p style="color: #666;">This code will expire in <strong>5 minutes</strong>.</p>
        <p style="color: #999; font-size: 12px;">If you did not request this code, please ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
