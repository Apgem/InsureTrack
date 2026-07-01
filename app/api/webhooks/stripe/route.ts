import { NextResponse } from "next/server";
import type Stripe from "stripe";

import type { SubscriptionStatus } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Map Stripe's subscription statuses onto our narrower profile enum.
function mapStatus(s: Stripe.Subscription.Status): SubscriptionStatus {
  switch (s) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "incomplete":
      return "incomplete";
    case "canceled":
    case "incomplete_expired":
    case "paused":
    default:
      return "canceled";
  }
}

async function setStatusByCustomer(
  customerId: string,
  status: SubscriptionStatus
) {
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ subscription_status: status })
    .eq("stripe_customer_id", customerId);
}

export async function POST(request: Request) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe not configured." },
      { status: 503 }
    );
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (e) {
    return NextResponse.json(
      { error: `Signature verification failed: ${e instanceof Error ? e.message : "unknown"}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;
        if (customerId) await setStatusByCustomer(customerId, "active");
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const status =
          event.type === "customer.subscription.deleted"
            ? "canceled"
            : mapStatus(sub.status);
        await setStatusByCustomer(customerId, status);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;
        if (customerId) await setStatusByCustomer(customerId, "past_due");
        break;
      }
      default:
        break;
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Handler error." },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}