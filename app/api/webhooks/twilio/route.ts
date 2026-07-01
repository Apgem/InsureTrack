import { NextResponse } from "next/server";
import twilio from "twilio";

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const STOP_KEYWORDS = ["stop", "stopall", "unsubscribe", "cancel", "end", "quit"];
const START_KEYWORDS = ["start", "yes", "unstop"];

/** Last 10 digits, for matching across phone formats. */
function phoneKey(v: string | null | undefined): string | null {
  if (!v) return null;
  const digits = v.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits || null;
}

function twiml(message?: string) {
  const body = message
    ? `<Response><Message>${message}</Message></Response>`
    : `<Response></Response>`;
  return new NextResponse(body, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const from = String(form.get("From") ?? "");
  const text = String(form.get("Body") ?? "")
    .trim()
    .toLowerCase();

  // Optional signature validation (only when Twilio is actually configured).
  const token = process.env.TWILIO_AUTH_TOKEN;
  const signature = request.headers.get("x-twilio-signature");
  if (token && !token.startsWith("your-") && signature) {
    const params: Record<string, string> = {};
    form.forEach((v, k) => {
      params[k] = String(v);
    });
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`;
    const valid = twilio.validateRequest(token, signature, url, params);
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
  }

  const key = phoneKey(from);
  if (!key) return twiml();

  const isStop = STOP_KEYWORDS.includes(text);
  const isStart = START_KEYWORDS.includes(text);
  if (!isStop && !isStart) return twiml();

  const supabase = createAdminClient();

  // Match clients by the last 10 digits of their phone.
  const { data: clients } = await supabase
    .from("clients")
    .select("id, phone");
  const matches = (clients ?? []).filter((c) => phoneKey(c.phone) === key);

  for (const c of matches) {
    await supabase
      .from("clients")
      .update({ sms_opted_out: isStop })
      .eq("id", c.id);
  }

  if (isStop) {
    return twiml("You've been unsubscribed and won't receive more texts.");
  }
  return twiml("You're re-subscribed. Welcome back!");
}
