# picnic email signature

Standardized email signature for the picnic team. Built to increase partner trust through visual consistency and verifiable contact info.

**→ Live generator: https://usepicnic.github.io/signature/**

---

## For team members (2 minutes)

1. Open https://usepicnic.github.io/signature/
2. Fill your name, role, email, phone, LinkedIn
3. Upload an avatar photo (recommended — humanizes the signature and is a strong trust signal)
4. Click **Copy signature**
5. In Gmail: ⚙️ Settings → **See all settings** → General tab → scroll to **Signature** → **Create new** → name it "picnic" → paste
6. Under **Signature defaults**, set both "FOR NEW EMAILS USE" and "ON REPLY/FORWARD USE" to "picnic"
7. Scroll to bottom → **Save Changes**

Done. Every email you send will now carry the consistent picnic signature.

## What the signature looks like

```
[avatar]  Your Name
          Your Role
          [picnic logo]
          ─── (lime accent line)
          @ you@usepicnic.com   ☎ +55 11 ...
          🌐 usepicnic.com  |  LinkedIn
          São Paulo, BRT
```

- Avatar: round (renders as circle in Gmail/Apple Mail, square in Outlook)
- Logo: hosted at `/logo-mail.png` in this repo — change it here and it propagates everywhere
- All links use `https://`
- Inline SVG icons inherit text color
- LinkedIn link uses LinkedIn brand blue (#0A66C2)
- usepicnic.com link is semibold to match LinkedIn weight

## Avatar upload — how it works

When you upload a photo:
1. JavaScript reads the file locally (never uploaded to any server)
2. Cropped to center square, resized to 144×144 px, re-encoded as JPEG at 80% quality (~10 KB)
3. Embedded into the signature HTML as a `data:` URL
4. When you paste into Gmail and save, Gmail uploads the image to its own CDN automatically — so recipients see a hosted image, not a data URL

No backend, no third-party service. Your photo never leaves your browser until Gmail uploads it.

## Repository contents

| File | What it is |
|---|---|
| `index.html` | The live generator page (served by GitHub Pages) |
| `signature-generator.html` | Mirror of `index.html` for clarity |
| `logo-mail.png` | The picnic wordmark logo. Update this file to update everyone's logo. |
| `signature-guide.md` | Detailed best practices, fields, deliverability rules |
| `HOSTING-THE-LOGO.md` | Notes on logo hosting and specs |
| `apps-script-rollout.gs` | Google Apps Script for admin-managed deployment across the whole team |

## Admin: deploy to everyone via Google Workspace

If you want to centrally enforce the signature across every team account (recommended once the team grows past 15–20 people):

1. Open `apps-script-rollout.gs`
2. Read the setup instructions in the top comment block
3. Create a Google Apps Script project as a Workspace Super Admin
4. Paste the script, configure the `CONFIG` block, enable required scopes
5. Run `previewForOneUser('your@usepicnic.com')` to verify output
6. Run `deployToEveryone()` to apply across the domain
7. Add a weekly trigger to auto-onboard new hires

## Updating the logo

To change the wordmark across all signatures:

1. Replace `logo-mail.png` in this repo with a new PNG (transparent background, ideally 200×66 px for 2x retina)
2. Commit and push
3. GitHub Pages re-deploys within ~1 minute
4. All existing signatures (with hosted URL) update instantly. Signatures that already had the previous logo embedded as data URL keep showing the old logo — they'd need to be regenerated.

## Local development

```bash
git clone https://github.com/usePicnic/signature.git
cd signature
python3 -m http.server 8000
open http://localhost:8000
```

That's it — no build step, no dependencies. The page is a single self-contained HTML file.

## Why this exists

Inconsistent email signatures are a small but real trust signal. Partners doing diligence on a fintech notice when one teammate signs with a logo, another with a quote, and a third with "Sent from my iPhone". A unified signature with hosted-on-our-domain assets and consistent typography signals operational discipline — which matters more for a company moving money.
