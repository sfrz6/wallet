import { getEnv, isProduction } from "@/lib/env";

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Sends an email via Resend. In development, if no Resend key is configured and
 * DEV_EMAIL_FALLBACK is enabled, the message is logged to the server console
 * instead. This fallback is refused in production.
 */
export async function sendEmail(args: SendArgs): Promise<void> {
  const env = getEnv();

  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    if (isProduction() || !env.DEV_EMAIL_FALLBACK) {
      throw new Error("Email provider is not configured.");
    }
    // Development-only fallback. Never logs in production.
    console.info(
      `[dev-email] To: ${args.to}\n[dev-email] Subject: ${args.subject}\n[dev-email] ${args.text}`,
    );
    // Opt-in test sink for E2E runs. Only active outside production when the
    // E2E_CODE_FILE env var is explicitly set. Never an HTTP endpoint.
    if (process.env.E2E_CODE_FILE) {
      const match = args.text.match(/(\d{6})/);
      if (match) {
        const fs = await import("node:fs/promises");
        await fs.appendFile(process.env.E2E_CODE_FILE, `${args.to}:${match[1]}\n`, "utf8");
      }
    }
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });
  if (error) {
    // Do not surface provider internals to callers.
    throw new Error("Failed to send email.");
  }
}

export function verificationEmailContent(code: string, locale: "ar" | "en") {
  if (locale === "ar") {
    return {
      subject: "رمز التحقق - محفظتي",
      text: `رمز التحقق الخاص بك هو ${code}. ينتهي خلال 10 دقائق.`,
      html: `<div style="font-family:Arial,sans-serif;direction:rtl;text-align:right">
        <h2>محفظتي</h2>
        <p>رمز التحقق الخاص بك هو:</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:4px">${code}</p>
        <p>ينتهي هذا الرمز خلال 10 دقائق. إذا لم تطلب هذا الرمز فتجاهل هذه الرسالة.</p>
      </div>`,
    };
  }
  return {
    subject: "Your verification code - Mahfazati",
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: `<div style="font-family:Arial,sans-serif">
      <h2>Mahfazati</h2>
      <p>Your verification code is:</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:4px">${code}</p>
      <p>This code expires in 10 minutes. If you did not request it, ignore this email.</p>
    </div>`,
  };
}
