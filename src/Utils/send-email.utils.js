import nodemailer from "nodemailer";
import { EventEmitter } from "events";

const sendEmail = async ({
  to,
  cc = "aharraz63@gmail.com",
  subject,
  content,
  attachments = [],
}) => {
  // Create Transporter For Confegration
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.USER_EMAIL,
      pass: process.env.USER_APP_PASSWORD,
    },
  });

  // Create Email
  const info = transporter.sendMail({
    to,
    cc,
    subject,
    html: content,
    attachments,
  });

  return info;
};

export const emitter = new EventEmitter();

emitter.on("sendEmail", (args) => {
  sendEmail(args)
})
