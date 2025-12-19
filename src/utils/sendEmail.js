import nodemailer from 'nodemailer';
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  service: 'Gmail', 
  auth: {
    user: env.MAIL_USER,
    pass: env.MAIL_PASS,
  },
});

export async function sendEmail({ to, subject, html }) {
  const mailOptions = {
    from: `Social Connection <${env.MAIL_USER}>`,
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
}
