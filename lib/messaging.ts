import { sendEmail } from "./resend";
import { sendSms } from "./twilio";

export type SendResult = {
  ok: boolean;
  simulated: boolean;
  id?: string;
  error?: string;
};

export type TemplateVars = {
  first_name?: string;
  renewal_date?: string;
  policy_type?: string;
};

/**
 * Fill {{first_name}}, {{renewal_date}}, {{policy_type}} in a template body.
 * Unknown/missing vars render as empty strings.
 */
export function renderTemplate(template: string, vars: TemplateVars): string {
  return template
    .replace(/\{\{\s*first_name\s*\}\}/g, vars.first_name ?? "")
    .replace(/\{\{\s*renewal_date\s*\}\}/g, vars.renewal_date ?? "")
    .replace(/\{\{\s*policy_type\s*\}\}/g, vars.policy_type ?? "");
}

/**
 * Dispatch a message over the right channel. Delegates to Resend (email) or
 * Twilio (SMS); both simulate when their API keys aren't configured.
 */
export async function sendMessage(opts: {
  channel: "email" | "sms";
  to: string;
  subject?: string | null;
  body: string;
}): Promise<SendResult> {
  if (opts.channel === "email") {
    return sendEmail({
      to: opts.to,
      subject: opts.subject ?? "InsureTrack",
      text: opts.body,
    });
  }
  return sendSms({ to: opts.to, body: opts.body });
}
