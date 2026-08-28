import "server-only";

import nodemailer from "nodemailer";
import type { EmailProvider } from "./provider";

export function createSmtpEmailProvider(): EmailProvider {
  const host = process.env.SMTP_HOST;
  const from = process.env.SMTP_FROM_EMAIL;
  if (!host || !from) throw new Error("EMAIL_NOT_CONFIGURED");
  const port = Number(process.env.SMTP_PORT || 587);
  const transport = nodemailer.createTransport({
    host, port, secure: process.env.SMTP_SECURE === "true",
    requireTLS: process.env.SMTP_REQUIRE_TLS !== "false",
    auth: process.env.SMTP_USERNAME ? { user: process.env.SMTP_USERNAME, pass: process.env.SMTP_PASSWORD } : undefined,
  });
  return {
    async send(message) {
      await transport.sendMail({ ...message, from: { name: process.env.SMTP_FROM_NAME || "Lisan", address: from } });
    },
  };
}
