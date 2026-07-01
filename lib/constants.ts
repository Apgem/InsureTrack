import type {
  PolicyType,
  PolicyStatus,
  TriggerType,
  LeadStatus,
  LeadSource,
} from "@/types/database";

export const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quoted" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: "referral", label: "Referral" },
  { value: "facebook", label: "Facebook" },
  { value: "website", label: "Website" },
  { value: "cold", label: "Cold" },
];

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> =
  Object.fromEntries(LEAD_SOURCES.map((s) => [s.value, s.label])) as Record<
    LeadSource,
    string
  >;

export const TRIGGER_TYPES: { value: TriggerType; label: string }[] = [
  { value: "renewal_90", label: "90 days before renewal" },
  { value: "renewal_60", label: "60 days before renewal" },
  { value: "renewal_30", label: "30 days before renewal" },
  { value: "new_lead", label: "New lead added" },
  { value: "new_client", label: "New client added" },
];

export const TRIGGER_TYPE_LABELS: Record<TriggerType, string> =
  Object.fromEntries(TRIGGER_TYPES.map((t) => [t.value, t.label])) as Record<
    TriggerType,
    string
  >;

export const TEMPLATE_VARIABLES = [
  "{{first_name}}",
  "{{renewal_date}}",
  "{{policy_type}}",
];

export const POLICY_TYPES: { value: PolicyType; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "home", label: "Home" },
  { value: "life", label: "Life" },
  { value: "health", label: "Health" },
  { value: "commercial", label: "Commercial" },
];

export const POLICY_STATUSES: { value: PolicyStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "renewed", label: "Renewed" },
  { value: "lapsed", label: "Lapsed" },
  { value: "cancelled", label: "Cancelled" },
];

export const POLICY_TYPE_LABELS: Record<PolicyType, string> =
  Object.fromEntries(POLICY_TYPES.map((t) => [t.value, t.label])) as Record<
    PolicyType,
    string
  >;
