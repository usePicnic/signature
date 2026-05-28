# Hosting the Picnic wordmark logo

The signature uses two images: the **avatar** (per-person, embedded as a data URL — no hosting needed) and the **Picnic wordmark logo** (shared across the team — must be hosted on a stable URL).

## Why hosting matters

Email clients fetch external images at render time. If the image lives on a flaky domain or a shared CDN (Imgur, random S3 buckets), some recipients will see broken-image icons — and corporate spam filters flag external images on untrusted hosts.

The logo URL must be:
- HTTPS
- On a domain you control (ideally `usepicnic.com` or a subdomain)
- Set with proper `Cache-Control` headers (the same image gets re-fetched billions of times across emails)
- Returning the correct `Content-Type` (`image/png` for PNG)

## Recommended setup

Upload the wordmark PNG to a stable path. Two good options:

**Option A — Static folder on the main site**

```
https://usepicnic.com/brand/picnic-wordmark.png
```

Add to your Next.js / Vercel / web stack as a public static asset. Done.

**Option B — Dedicated brand subdomain (cleaner for long-term)**

```
https://brand.usepicnic.com/wordmark.png
```

Lets the brand/marketing team manage assets without touching the main site deploy.

## Logo specs for email signatures

- **Format:** PNG with transparent background (renders correctly in both light and dark email modes)
- **Dimensions:** export at 2x retina — actual display is 100×33 px, so export at **200×66 px**
- **Color:** black wordmark for light mode. If your team uses dark mode email clients heavily, consider also exporting a white version and serving it via `prefers-color-scheme` media query (advanced, optional)
- **File size:** under 10 KB. The wordmark you sent compresses to ~3–4 KB

## How to plug it in

Once hosted, update both places:

1. **`signature-generator.html`** — change the default value of the "Picnic logo URL" field (advanced panel)
2. **`apps-script-rollout.gs`** — change `CONFIG.LOGO_URL`

## Quick verification

After uploading, paste the URL into a browser. You should see the logo with a transparent background. Then run `signature-generator.html`, see it render in the preview, and send yourself a test email.
