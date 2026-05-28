/**
 * Picnic — Bulk Email Signature Deployer
 * ----------------------------------------
 * Reads users from your Google Workspace directory and writes a
 * personalized Gmail signature to every account.
 *
 * SETUP
 *   1. Go to script.google.com → New Project. Paste this file.
 *   2. Project Settings → enable "Show appsscript.json in editor".
 *   3. Open appsscript.json and add:
 *        "oauthScopes": [
 *          "https://www.googleapis.com/auth/admin.directory.user.readonly",
 *          "https://www.googleapis.com/auth/gmail.settings.basic",
 *          "https://www.googleapis.com/auth/script.external_request"
 *        ]
 *   4. Enable Advanced Services: AdminDirectory ("Directory API") and Gmail.
 *   5. Run this script as a Super Admin OR set up a service account
 *      with domain-wide delegation (recommended for production).
 *   6. Adjust the CONFIG block below.
 *   7. Run `previewForOneUser('rafael@usepicnic.com')` first to verify output.
 *   8. Then run `deployToEveryone()` — affects ALL active users in DOMAIN.
 *   9. Add a weekly trigger so new hires get a signature automatically:
 *        Triggers → Add trigger → deployToEveryone → time-based → weekly.
 */

const CONFIG = {
  DOMAIN: 'usepicnic.com',
  WEBSITE: 'https://usepicnic.com',
  // Picnic wordmark — host on a stable domain. See HOSTING-THE-LOGO.md.
  LOGO_URL: 'https://usepicnic.com/brand/picnic-wordmark.png',
  LOGO_WIDTH: 80,    // display px
  LOGO_HEIGHT: 26,   // display px (source should be 2x: 200x66)
  ACCENT_COLOR: '#B3F53D',
  COMPANY_NAME: 'picnic',
  SHOW_TAGLINE: false,
  TAGLINE: "Brazil's largest DeFi platform",
  // Phone format helper — directory often stores phones in E.164.
  // Set DEFAULT_PHONE_FALLBACK = null to skip phone if not present.
  DEFAULT_PHONE_FALLBACK: null,
  // Avatar: pulls each user's Workspace profile photo and embeds as a round image.
  // Set to false to skip avatars entirely and fall back to LOGO_URL.
  USE_AVATAR: true,
  AVATAR_SIZE: 72,
  // Exclude email patterns (no-reply, system accounts, etc.)
  EXCLUDE_EMAIL_REGEX: /^(no-?reply|admin|info|hello|support|alerts?|notifications?|billing)@/i,
  // Only deploy to users in these OUs (path strings). Empty = all users.
  ONLY_ORG_UNITS: [],
};

/**
 * Deploy signatures to every active user in the domain.
 * This is the entry point you schedule on a weekly trigger.
 */
function deployToEveryone() {
  const users = listAllUsers_();
  console.log(`Found ${users.length} candidate users.`);
  let ok = 0, skipped = 0, failed = 0;
  users.forEach(u => {
    if (shouldSkip_(u)) { skipped++; return; }
    try {
      const sig = buildSignature_(u);
      setSignature_(u.primaryEmail, sig);
      ok++;
      console.log(`✓ ${u.primaryEmail}`);
    } catch (e) {
      failed++;
      console.error(`✗ ${u.primaryEmail}: ${e.message}`);
    }
  });
  console.log(`Done. ok=${ok} skipped=${skipped} failed=${failed}`);
}

/**
 * Run this first to inspect what a user's signature will look like
 * without applying it. Pass any user's primary email.
 */
function previewForOneUser(email) {
  const u = AdminDirectory.Users.get(email);
  const sig = buildSignature_(u);
  console.log(`--- Signature for ${email} ---`);
  console.log(sig);
  return sig;
}

/**
 * Apply a signature to a single user — useful for testing.
 */
function deployToOneUser(email) {
  const u = AdminDirectory.Users.get(email);
  if (shouldSkip_(u)) { console.log('User excluded by CONFIG.'); return; }
  const sig = buildSignature_(u);
  setSignature_(email, sig);
  console.log(`Applied to ${email}`);
}

// ---------- internals ----------

function listAllUsers_() {
  const out = [];
  let pageToken;
  do {
    const res = AdminDirectory.Users.list({
      domain: CONFIG.DOMAIN,
      maxResults: 500,
      pageToken,
      projection: 'full',
    });
    if (res.users) out.push(...res.users);
    pageToken = res.nextPageToken;
  } while (pageToken);
  return out.filter(u => !u.suspended && !u.archived);
}

function shouldSkip_(user) {
  if (CONFIG.EXCLUDE_EMAIL_REGEX.test(user.primaryEmail)) return true;
  if (CONFIG.ONLY_ORG_UNITS.length > 0) {
    if (!CONFIG.ONLY_ORG_UNITS.includes(user.orgUnitPath)) return true;
  }
  return false;
}

function getUserField_(user, field) {
  switch (field) {
    case 'fullName': return (user.name && user.name.fullName) || user.primaryEmail.split('@')[0];
    case 'title':
      if (user.organizations && user.organizations[0] && user.organizations[0].title) {
        return user.organizations[0].title;
      }
      return '';
    case 'phone':
      if (user.phones && user.phones.length) {
        const work = user.phones.find(p => p.type === 'work');
        return (work || user.phones[0]).value;
      }
      return CONFIG.DEFAULT_PHONE_FALLBACK || '';
    case 'linkedin':
      // Custom schema lookup: customSchemas.External.linkedin
      try {
        return (user.customSchemas && user.customSchemas.External && user.customSchemas.External.linkedin) || '';
      } catch (_) { return ''; }
    case 'city':
      if (user.locations && user.locations[0]) {
        return user.locations[0].area || user.locations[0].buildingId || '';
      }
      return '';
  }
  return '';
}

function buildSignature_(user) {
  const name = escapeHtml_(getUserField_(user, 'fullName'));
  const title = escapeHtml_(getUserField_(user, 'title'));
  const email = escapeHtml_(user.primaryEmail);
  const phoneRaw = getUserField_(user, 'phone');
  const phone = escapeHtml_(phoneRaw);
  const phoneHref = phoneRaw.replace(/[^+\d]/g, '');
  const linkedin = getUserField_(user, 'linkedin');
  const city = escapeHtml_(getUserField_(user, 'city'));

  const accent = CONFIG.ACCENT_COLOR;
  const fontStack = `-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif`;
  const linkStyle = `color:#1a1a1a;text-decoration:none;`;
  const dimStyle = `color:#6b7280;`;

  const taglineLine = CONFIG.SHOW_TAGLINE
    ? `<div style="font-size:12px;${dimStyle}margin-top:2px;font-style:italic;">${escapeHtml_(CONFIG.TAGLINE)}</div>`
    : '';

  // Icons inherit the link text color. "@" literal for email, inline SVG for phone/globe.
  const iconColor = '#1a1a1a';
  const iconStyle = `vertical-align:-2px;margin-right:6px;display:inline-block;`;
  const iconMail = `<span style="margin-right:6px;font-weight:600;color:${iconColor};">@</span>`;
  const iconPhone = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="${iconColor}" style="${iconStyle}"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>`;
  const iconGlobe = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="${iconStyle}"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;

  // LinkedIn: semibold, in LinkedIn brand blue, sans-serif (matches LinkedIn wordmark)
  const linkedinStyle = `color:#0A66C2;text-decoration:none;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;`;

  const contactParts = [`<a href="mailto:${email}" style="${linkStyle}">${iconMail}${email}</a>`];
  if (phone) contactParts.push(`<a href="tel:${phoneHref}" style="${linkStyle}">${iconPhone}${phone}</a>`);
  const contactHtml = `<div style="font-size:13px;color:#1a1a1a;margin-top:8px;">${contactParts.join(' &nbsp;&nbsp; ')}</div>`;

  const websiteStyle = `color:#1a1a1a;text-decoration:none;font-weight:600;`;
  const separator = `<span style="color:#d1d5db;margin:0 8px;font-weight:400;">|</span>`;
  const linkParts = [];
  linkParts.push(`<a href="${CONFIG.WEBSITE}" style="${websiteStyle}">${iconGlobe}${CONFIG.WEBSITE.replace(/^https?:\/\//, '')}</a>`);
  if (linkedin) linkParts.push(`<a href="${linkedin}" style="${linkedinStyle}">LinkedIn</a>`);
  const linksHtml = `<div style="font-size:13px;margin-top:4px;">${linkParts.join(separator)}</div>`;

  const cityHtml = city ? `<div style="font-size:12px;${dimStyle}margin-top:6px;">${city}</div>` : '';

  // Avatar lives on the left. Wordmark logo lives in the text column (see below).
  const avatarDataUrl = CONFIG.USE_AVATAR ? fetchAvatarDataUrl_(user.primaryEmail) : '';
  const logoCell = avatarDataUrl
    ? `<td style="vertical-align:top;padding:0 16px 0 0;width:80px;">
       <img src="${avatarDataUrl}" width="${CONFIG.AVATAR_SIZE}" height="${CONFIG.AVATAR_SIZE}" alt="${name}" style="display:block;border:0;width:${CONFIG.AVATAR_SIZE}px;height:${CONFIG.AVATAR_SIZE}px;border-radius:50%;object-fit:cover;">
     </td>`
    : '';

  // Wordmark logo line in the text column
  const wordmarkLine = CONFIG.LOGO_URL
    ? `<div style="margin-top:6px;line-height:0;"><a href="${CONFIG.WEBSITE}" style="text-decoration:none;"><img src="${CONFIG.LOGO_URL}" width="${CONFIG.LOGO_WIDTH}" height="${CONFIG.LOGO_HEIGHT}" alt="${CONFIG.COMPANY_NAME}" style="display:block;border:0;width:${CONFIG.LOGO_WIDTH}px;height:auto;max-height:${CONFIG.LOGO_HEIGHT}px;"></a></div>`
    : `<div style="margin-top:4px;"><strong style="color:#1a1a1a;font-size:13px;">picnic</strong></div>`;

  return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:${fontStack};">
    <tr>${logoCell}
      <td style="vertical-align:top;font-family:${fontStack};padding:0;">
        <div style="line-height:1.15;margin:0;padding:0;"><span style="font-size:15px;font-weight:600;color:#1a1a1a;line-height:1.15;">${name}</span></div>
        <div style="line-height:1.15;margin:0;padding:0;"><span style="font-size:13px;color:#4b5563;line-height:1.15;">${title}</span></div>
        ${wordmarkLine}
        ${taglineLine}
        <div style="border-top:2px solid ${accent};width:32px;margin:10px 0;height:0;line-height:0;font-size:0;">&nbsp;</div>
        ${contactHtml}
        ${linksHtml}
        ${cityHtml}
      </td>
    </tr>
  </table>`.replace(/\s+/g, ' ').trim();
}

function setSignature_(email, signatureHtml) {
  Gmail.Users.Settings.SendAs.update(
    { signature: signatureHtml },
    email,
    email
  );
}

/**
 * Pulls the user's Workspace profile photo and returns a data: URL.
 * Returns empty string if the user has no photo or the request fails.
 * Note: data: URLs in Gmail signatures are converted to hosted images
 * by Gmail automatically on first send.
 */
function fetchAvatarDataUrl_(email) {
  try {
    const photo = AdminDirectory.Users.Photos.get(email);
    if (!photo || !photo.photoData) return '';
    // photoData is web-safe base64 — convert to standard base64
    const standard = photo.photoData.replace(/_/g, '/').replace(/-/g, '+');
    const mime = photo.mimeType || 'image/jpeg';
    return `data:${mime};base64,${standard}`;
  } catch (e) {
    return '';
  }
}

function escapeHtml_(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
