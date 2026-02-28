import nodemailer from 'nodemailer';

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

function otpHTML(otp, type) {
  const isSignup = type === 'signup';
  const title = isSignup ? 'Verify Your Account' : 'Reset Your Password';
  const message = isSignup
    ? 'Welcome to Stones & Spices! Use the OTP below to verify your account.'
    : 'Use the OTP below to reset your password. This code expires in 10 minutes.';
  return `
    <div style="font-family:'Outfit',Arial,sans-serif;max-width:480px;margin:0 auto;background:#FBF7F0;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#2A1810,#3D2215);padding:32px;text-align:center;">
        <div style="font-size:28px;font-weight:700;color:#D4A017;letter-spacing:1px;">Stones & Spices</div>
        <div style="font-size:10px;letter-spacing:3px;color:rgba(212,160,23,0.6);text-transform:uppercase;margin-top:4px;">Cloud Kitchen</div>
      </div>
      <div style="padding:36px 32px;">
        <h2 style="color:#2A1810;margin:0 0 12px;font-size:22px;">${title}</h2>
        <p style="color:#8B7355;font-size:14px;line-height:1.7;margin:0 0 28px;">${message}</p>
        <div style="background:#fff;border:2px solid #D4A017;border-radius:14px;padding:24px;text-align:center;margin-bottom:28px;">
          <div style="font-size:11px;color:#8B7355;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Your OTP</div>
          <div style="font-size:42px;font-weight:700;color:#2A1810;letter-spacing:10px;">${otp}</div>
        </div>
        <p style="color:#B89B7A;font-size:12px;text-align:center;margin:0;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      </div>
      <div style="background:#2A1810;padding:16px;text-align:center;">
        <p style="color:rgba(251,247,240,0.4);font-size:11px;margin:0;">© 2024 Stones & Spices Cloud Kitchen</p>
      </div>
    </div>
  `;
}

export async function sendOTPEmail({ to, otp, type }) {
  const isSignup = type === 'signup';
  const subject = isSignup ? 'Verify your Stones & Spices account' : 'Reset your Stones & Spices password';
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Stones & Spices" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: otpHTML(otp, type),
    text: `Your Stones & Spices OTP is: ${otp}. It expires in 10 minutes.`,
  });
}
