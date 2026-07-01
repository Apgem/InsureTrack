# Deploying InsureTrack to Vercel (GitHub flow)

This deploys the app in **simulate mode** — Stripe/Resend/Twilio run simulated
until you add real keys (see the last section). You still get a live, working
URL with real auth, clients, leads, renewals, sequences, and the paywall.

> **Never commit `.env.local`.** It's already gitignored. All secrets go into
> Vercel's Environment Variables UI, copied from your local `.env.local`.

---

## 1. Install Git (one-time)

Git isn't installed on this machine. Pick one:

- **Git CLI:** https://git-scm.com/download/win — then use the terminal steps below.
- **GitHub Desktop:** https://desktop.github.com — a GUI; "Add local repository"
  → point it at `C:\Users\user\Downloads\insuretrack` → Publish.

---

## 2. Push the project to GitHub

Open a terminal in the project folder and run:

```powershell
cd C:\Users\user\Downloads\insuretrack
git init
git add .
git commit -m "InsureTrack: phases 1-6 complete"
```

Create an **empty** repo at https://github.com/new (no README/.gitignore), then:

```powershell
git branch -M main
git remote add origin https://github.com/<your-username>/insuretrack.git
git push -u origin main
```

Confirm on GitHub that **`.env.local` and `node_modules/` are NOT there**
(the `.gitignore` handles this).

---

## 3. Import into Vercel

1. Go to https://vercel.com/new and import the `insuretrack` repo.
2. Framework preset: **Next.js** (auto-detected). Leave build/output defaults.
3. **Before** clicking Deploy, add the Environment Variables below.

---

## 4. Environment variables (set in Vercel → Project → Settings → Environment Variables)

Set these for **Production** (and Preview if you want branch deploys). Copy the
secret **values** from your local `C:\Users\user\Downloads\insuretrack\.env.local`.

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | from `.env.local` | required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from `.env.local` | required |
| `SUPABASE_SERVICE_ROLE_KEY` | from `.env.local` | **secret** — server only |
| `CRON_SECRET` | generate a **new** random string | see note below |
| `NEXT_PUBLIC_APP_URL` | your Vercel URL | set in step 6 |
| `RESEND_FROM` | `InsureTrack <onboarding@resend.dev>` | fine to leave as-is |
| Stripe / Resend / Twilio keys | leave empty | simulate mode |

Generate a fresh `CRON_SECRET` (don't reuse the local dev one):

```powershell
[guid]::NewGuid().ToString("N")
```

> **Vercel Cron auth is automatic:** when a `CRON_SECRET` env var exists, Vercel
> sends `Authorization: Bearer $CRON_SECRET` on every cron invocation. The route
> at `/api/cron/send-sequences` already checks exactly that — no extra wiring.

Click **Deploy**.

---

## 5. Point Supabase Auth at the live URL

Supabase → your project → **Authentication → URL Configuration**:

- **Site URL:** `https://<your-app>.vercel.app`
- **Redirect URLs:** add `https://<your-app>.vercel.app/**`

Without this, magic-link / email-confirmation logins redirect to the wrong place.
(Email confirmation is currently **off** in Auth settings, which is fine.)

---

## 6. Set `NEXT_PUBLIC_APP_URL` and redeploy

After the first deploy you know the URL. Set:

- `NEXT_PUBLIC_APP_URL = https://<your-app>.vercel.app`

Then **redeploy** (Vercel → Deployments → ⋯ → Redeploy) so it takes effect.
This value is used for auth redirects and (later) Stripe checkout return URLs.

---

## 7. Smoke-test the live app

- Sign up → lands on `/dashboard` with 4 seeded sequences.
- Add a client + policy; check `/renewals` and the dashboard stats.
- Add a lead, drag it across the pipeline.
- Visit **Billing** (avatar menu). In simulate mode you'll see the
  "Simulate activate / cancel / restart trial" buttons; use them to confirm the
  paywall redirects to `/settings/billing` when expired/canceled.
- Cron: verify it runs (Vercel → Project → Cron Jobs → run now, or wait for 8am
  UTC). It returns JSON like `{ ok: true, enrolled, sent, ... }`.

---

## 8. Going live for real (later)

When you're ready to take payments and send real email/SMS:

**Stripe**
1. Create a $49/mo recurring **Price** → copy its `price_...` id.
2. In Vercel set: `STRIPE_SECRET_KEY` (`sk_...`), `STRIPE_PRICE_ID` (`price_...`),
   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_...`).
3. Stripe → Developers → **Webhooks** → add endpoint
   `https://<your-app>.vercel.app/api/webhooks/stripe`, subscribe to
   `checkout.session.completed`, `customer.subscription.*`,
   `invoice.payment_failed` → copy the signing secret into
   `STRIPE_WEBHOOK_SECRET` (`whsec_...`).
4. Redeploy. The billing page now shows real **Upgrade / Manage billing**
   buttons instead of the simulate controls.

**Resend** — set `RESEND_API_KEY` + a verified `RESEND_FROM` domain.

**Twilio** — set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`,
then point your Twilio number's inbound SMS webhook at
`https://<your-app>.vercel.app/api/webhooks/twilio` (STOP/START handling).

Each service independently flips from simulated to live the moment its keys are
present — you can enable them one at a time.
