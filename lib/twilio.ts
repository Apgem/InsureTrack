import twilio from "twilio";

import type { SendResult } from "./messaging";

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_PHONE_NUMBER;

function configured() {
  return Boolean(sid && token && from && !sid.startsWith("your-"));
}

export async function sendSms(opts: {
  to: string;
  body: string;
}): Promise<SendResult> {
  if (!configured()) {
    console.log(
      `[twilio:simulated] to=${opts.to} body="${opts.body.slice(0, 50)}"`
    );
    return { ok: true, simulated: true };
  }
  try {
    const client = twilio(sid, token);
    const msg = await client.messages.create({
      to: opts.to,
      from,
      body: opts.body,
    });
    return { ok: true, simulated: false, id: msg.sid };
  } catch (e) {
    return {
      ok: false,
      simulated: false,
      error: e instanceof Error ? e.message : "SMS send failed.",
    };
  }
}
