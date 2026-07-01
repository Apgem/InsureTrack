import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

const optionalEmail = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : undefined));

export const clientSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required."),
  email: optionalEmail,
  phone: optionalText,
  address: optionalText,
  notes: optionalText,
  // Comma-separated in the form; stored as text[].
  tags: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : []
    ),
});

export type ClientInput = z.input<typeof clientSchema>;
export type ClientValues = z.output<typeof clientSchema>;

export const policySchema = z.object({
  client_id: z.string().uuid(),
  policy_type: z.enum(["auto", "home", "life", "health", "commercial"]),
  carrier: optionalText,
  policy_number: optionalText,
  premium: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === "" || v === undefined || v === null) return undefined;
      const n = typeof v === "number" ? v : Number(v);
      return isNaN(n) ? undefined : n;
    }),
  renewal_date: z.string().min(1, "Renewal date is required."),
  status: z
    .enum(["active", "renewed", "lapsed", "cancelled"])
    .default("active"),
});

export type PolicyInput = z.input<typeof policySchema>;
export type PolicyValues = z.output<typeof policySchema>;

export const sequenceSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  trigger_type: z.enum([
    "renewal_30",
    "renewal_60",
    "renewal_90",
    "new_lead",
    "new_client",
  ]),
});

export type SequenceInput = z.input<typeof sequenceSchema>;

export const stepSchema = z.object({
  channel: z.enum(["email", "sms"]),
  delay_days: z
    .union([z.string(), z.number()])
    .transform((v) => {
      const n = typeof v === "number" ? v : Number(v);
      return isNaN(n) || n < 0 ? 0 : Math.floor(n);
    }),
  subject: optionalText,
  body: z.string().trim().min(1, "Message body is required."),
});

export type StepInput = z.input<typeof stepSchema>;

export const leadSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required."),
  email: optionalEmail,
  phone: optionalText,
  source: z
    .enum(["referral", "facebook", "website", "cold"])
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  status: z
    .enum(["new", "contacted", "quoted", "won", "lost"])
    .default("new"),
  notes: optionalText,
  // Comma-separated in the form; stored as text[].
  interested_in: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : []
    ),
});

export type LeadInput = z.input<typeof leadSchema>;
