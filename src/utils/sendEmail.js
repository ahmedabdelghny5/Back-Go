import nodemailer from "nodemailer";

export async function sendEmail(email, subject, html) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_SENDER,
      pass: process.env.EMAIL_Password,
    },
  });

  let info = await transporter.sendMail({
    from: process.env.EMAIL_SENDER,
    to: email,
    subject,
    html,
  });

  return info.rejected.length ? false : true;
}
