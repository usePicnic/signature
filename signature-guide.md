# Picnic Email Signature Guide

## 1. What to include

These are the fields every Picnic signature must have, in order of importance.

**Mandatory**
- Full name (first + last)
- Job title — keep it specific. "Senior Product Designer" beats "Designer".
- Company: **Picnic**
- Work email — yes, even in your signature. Recipients forward emails; the original `From` header gets stripped.
- Direct line or WhatsApp (with country code: `+55 11 9xxxx-xxxx`)

**Recommended**
- Avatar photo (round) — humanizes the signature and is a strong trust signal for partners. Generator auto-resizes to 144×144 JPEG, ~10 KB.
- LinkedIn profile (the biggest trust signal for B2B partners — they will check)
- Picnic website: `https://usepicnic.com`
- City / time zone: `São Paulo, BRT` — useful for international partners coordinating calls

> **About the round avatar:** rendered with `border-radius: 50%`. Gmail (web/iOS/Android) and Apple Mail render it round correctly. Outlook (especially desktop) ignores border-radius and shows a square — acceptable fallback. If you want a true circular image in Outlook, you'd need a pre-cropped circular PNG with transparency, which complicates the upload flow.

**Optional (use sparingly)**
- A short tagline ("Brazil's largest DeFi platform" — only if approved by marketing)
- Regulatory disclosure for client-facing roles (legal/finance team should specify wording)

**Never include**
- Quotes, mottos, or "Sent from my iPhone"
- More than one phone number
- Animated GIFs, vCards, social icons for every platform you've ever used
- Personal social media (unless you're in a public-facing role and it's pre-approved)
- Background images, colored full-width banners (bad mobile rendering, flagged by spam filters)

## 2. Best practices for trust + deliverability

### Trust signals (what partners actually look for)
- **Logo hosted on your own domain.** Never use a random image host — partners and security software check image origins. Host the logo at something like `https://usepicnic.com/brand/signature-logo.png`.
- **HTTPS everywhere.** Every link in the signature uses `https://`.
- **Real, working contact info.** A signature with a phone number that doesn't pick up is worse than no phone at all.
- **Consistency across the team.** When Maria from Sales and Pedro from Ops have visually identical signatures, recipients learn to recognize legitimate Picnic email.

### Deliverability rules (the boring ones that actually matter)
- **Table-based HTML layout.** Email clients (especially Outlook) butcher flexbox/grid. Tables render reliably.
- **Inline CSS only.** External stylesheets and `<style>` blocks get stripped by Gmail and most clients.
- **One image max.** Each additional image increases load time and spam score.
- **Image dimensions set explicitly** in `width=` and `height=` attributes (not just CSS) — Outlook needs both.
- **Total signature weight under 50 KB.** Most signatures should be under 10 KB.
- **Alt text on every image.** When images don't load (corporate firewalls, dark mode), alt text shows.
- **Plain-text fallback.** Gmail auto-generates one but check it once.

### Mobile (60%+ of business email is read on phones)
- Max width: **600 px**
- Body font size: **14–16 px** (smaller becomes unreadable on phones)
- Tap targets (links) at least **44 px tall**
- Single column when possible — two columns are fine but the right side gets cut off below 400 px

### Brand & legal
- Brand colors used as accents only, not large filled blocks (mail clients invert colors in dark mode)
- Match the look of `usepicnic.com` — fonts, color, spacing
- For client-facing finance roles, work with Legal on disclosure text (CVM/Banco Central considerations for Brazil-regulated activities)

## 3. Gmail (Google Workspace) setup

There are three ways to deploy. Pick based on team size and control needed.

### Option A — Manual per-user (simplest, no admin needed)

Each team member:
1. Opens `signature-generator.html`, fills the form, copies the signature.
2. Gmail → ⚙️ Settings → **See all settings** → **General** tab.
3. Scrolls to **Signature** → **Create new** → name it "Picnic".
4. Pastes the signature into the editor.
5. Under **Signature defaults**, sets "FOR NEW EMAILS USE" and "ON REPLY/FORWARD USE" both to "Picnic".
6. Scrolls to the bottom → **Save Changes**.

⚠️ Gmail strips some HTML when pasting from the clipboard. The generator already produces Gmail-safe HTML (table-based, inline styles, no `<style>` blocks).

### Option B — Append Footer (admin-controlled, server-side)

For administrators wanting a single signature for the whole domain:

1. Google Admin console → **Apps** → **Google Workspace** → **Gmail** → **Compliance**.
2. Find **Append footer** → Configure.
3. Paste the signature HTML.
4. Choose scope: entire org, or specific OUs (e.g. only `@usepicnic.com` employees).
5. Save.

**Trade-off:** the footer is added _server-side_ after the user sends. Users don't see it in their compose window. Personalization (name, title) per user is harder unless you build per-OU footers.

### Option C — Apps Script + Directory (best for full automation)

This is the recommended approach for a 20+ person team. The script (`apps-script-rollout.gs` in this folder):
1. Reads each user's name, title, email, and phone from the Workspace directory.
2. Builds their personalized signature HTML.
3. Writes it to their Gmail account via the Gmail API.
4. Runs on a schedule (e.g. weekly) to catch new hires automatically.

Requires:
- Workspace admin permissions
- Apps Script project with Admin SDK + Gmail API scopes enabled
- Service account with domain-wide delegation (so the script can write to any user's signature)

See the comments in `apps-script-rollout.gs` for setup steps.

### Third-party alternatives (if you don't want to build it)

Tools like **BulkSignature**, **SyncSignature**, **WiseStamp**, or **Exclaimer** wrap option C in a UI. Cost is roughly $1–3/user/month. Worth it if you don't have an engineer who wants to maintain the script.

## 4. Rollout checklist

- [ ] Get brand-approved logo at exact pixel dimensions (recommend 80×80 or 120×120 px) and host on usepicnic.com
- [ ] Marketing approves tagline (if any) and contact info standards
- [ ] Legal reviews any disclosure text for regulated roles
- [ ] Generator HTML tested in: Gmail web, Gmail iOS, Gmail Android, Apple Mail, Outlook (the painful one)
- [ ] Shared with team via Slack with a 5-minute Loom walkthrough
- [ ] One person on the comms team owns the signature and updates the template when brand changes
