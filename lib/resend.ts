import { Resend } from "resend";

import type { SendResult } from "./messaging";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM ?? "InsureTrack <onboarding@resend.dev>";

function configured() {
  return Boolean(apiKey && !apiKey.startsWith("your-"));
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
}): Promise<SendResult> {
  if (!configured()) {
    console.log(
      `[resend:simulated] to=${opts.to} subject="${opts.subject}"`
    );
    return { ok: true, simulated: true };
  }
  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    });
    if (error) return { ok: false, simulated: false, error: error.message };
    return { ok: true, simulated: false, id: data?.id };
  } catch (e) {
    return {
      ok: false,
      simulated: false,
      error: e instanceof Error ? e.message : "Email send failed.",
    };
  }
}
