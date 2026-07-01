import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Seeds the four default sequences (and their steps) for a newly created agent.
 *
 * Call this once, right after the agent's `profiles` row is created during
 * signup. Pass a Supabase client whose RLS context can satisfy
 * `agent_id = auth.uid()` for the new user — i.e. the authenticated user's
 * server client once their session exists, or a service-role client during a
 * server-side signup action.
 *
 * Idempotency: if signup can be retried, guard the call (e.g. only seed when
 * the agent has zero sequences) so retries don't create duplicates.
 */
export async function seedDefaultSequences(
  supabase: SupabaseClient<Database>,
  agentId: string
): Promise<void> {
  for (const seq of DEFAULT_SEQUENCES) {
    const { data: sequence, error: seqError } = await supabase
      .from("sequences")
      .insert({
        agent_id: agentId,
        name: seq.name,
        trigger_type: seq.trigger_type,
        is_active: true,
      })
      .select("id")
      .single();

    if (seqError || !sequence) {
      throw new Error(
        `Failed to seed sequence "${seq.name}": ${seqError?.message ?? "no row returned"}`
      );
    }

    const steps = seq.steps.map((step, i) => ({
      sequence_id: sequence.id,
      step_order: i + 1,
      channel: step.channel,
      delay_days: step.delay_days,
      subject: step.subject ?? null,
      body: step.body,
    }));

    const { error: stepsError } = await supabase
      .from("sequence_steps")
      .insert(steps);

    if (stepsError) {
      throw new Error(
        `Failed to seed steps for "${seq.name}": ${stepsError.message}`
      );
    }
  }
}

type DefaultStep = {
  channel: "email" | "sms";
  delay_days: number; // days after enrollment (cumulative), matching cron logic
  subject?: string; // email only
  body: string;
};

type DefaultSequence = {
  name: string;
  trigger_type: "renewal_90" | "renewal_60" | "renewal_30" | "new_lead" | "new_client";
  steps: DefaultStep[];
};

const DEFAULT_SEQUENCES: DefaultSequence[] = [
  {
    name: "90-day renewal email",
    trigger_type: "renewal_90",
    steps: [
      {
        channel: "email",
        delay_days: 0,
        subject: "Your {{policy_type}} policy renews soon",
        body:
          "Hi {{first_name}},\n\n" +
          "Your {{policy_type}} policy is coming up for renewal on {{renewal_date}}. " +
          "I'd love to review your coverage and make sure you're still getting the " +
          "best rate before it renews.\n\n" +
          "Reply to this email or give me a call and we'll set up a quick check-in.\n\n" +
          "Best,\nYour insurance agent",
      },
    ],
  },
  {
    name: "30-day renewal SMS",
    trigger_type: "renewal_30",
    steps: [
      {
        channel: "sms",
        delay_days: 0,
        body:
          "Hi {{first_name}}, your {{policy_type}} policy renews on {{renewal_date}}. " +
          "Want a quick coverage review before then? Reply YES and I'll call you. " +
          "Reply STOP to opt out.",
      },
    ],
  },
  {
    name: "New lead follow-up (3-step)",
    trigger_type: "new_lead",
    steps: [
      {
        channel: "email",
        delay_days: 0,
        subject: "Thanks for reaching out",
        body:
          "Hi {{first_name}},\n\n" +
          "Thanks for your interest! I'd love to learn a bit more about what you're " +
          "looking for so I can put together the right quote. When's a good time to " +
          "connect?\n\nBest,\nYour insurance agent",
      },
      {
        channel: "sms",
        delay_days: 2,
        body:
          "Hi {{first_name}}, just following up on your insurance quote. Happy to answer " +
          "any questions — reply here anytime. Reply STOP to opt out.",
      },
      {
        channel: "email",
        delay_days: 5,
        subject: "Still here to help",
        body:
          "Hi {{first_name}},\n\n" +
          "I don't want to crowd your inbox, but I'm still happy to help whenever you're " +
          "ready to look at your options. Just reply and we'll pick up where we left off.\n\n" +
          "Best,\nYour insurance agent",
      },
    ],
  },
  {
    name: "New client welcome",
    trigger_type: "new_client",
    steps: [
      {
        channel: "email",
        delay_days: 0,
        subject: "Welcome aboard, {{first_name}}!",
        body:
          "Hi {{first_name}},\n\n" +
          "Welcome, and thank you for trusting me with your coverage! Save my number so " +
          "you can reach me anytime you have a question or a life change that might affect " +
          "your policies.\n\n" +
          "I'll be in touch before each renewal — but never hesitate to reach out first.\n\n" +
          "Best,\nYour insurance agent",
      },
    ],
  },
];
