import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: Number(process.env.MAILTRAP_PORT),
  auth: { user: process.env.MAILTRAP_USER, pass: process.env.MAILTRAP_PASS }
});

export async function sendOrderEmail({ to, subject, text }) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text
  });
}
