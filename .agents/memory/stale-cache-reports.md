---
name: Stale-cache reports
description: When a visual-change report ("photos gone", "update not showing") can't be reproduced, suspect browser cache, not a code bug.
---

# Stale-cache reports (meu4patas)

When a user reports a visual regression (e.g. "ficaram sem fotos" / a recent change not appearing) but the data, markup, and CSS are all correct and a fresh-browser test renders fine, the cause is a **stale browser/proxy cache**, not a code defect.

**Fix:** bump the cache-busting token on the CSS+JS `<link>`/`<script>` refs across ALL HTML files (convention here: `?v=fix-vN` → `vN+1`, applied via `sed -i 's/v=fix-vN/v=fix-vN+1/g' *.html`). Editing the HTML also changes its mtime, so PHP's built-in server (Last-Modified revalidation) serves fresh HTML → fresh asset refs.

**Why:** `router.php` delegates static files to PHP's built-in server (no aggressive max-age, only Last-Modified). Browsers key cache on the full URL incl. query string, so the token bump forces a re-fetch; without it, an old HTML page keeps pointing at the old asset version.

**How to apply:** before touching layout/CSS again, reproduce in a fresh browser context (Playwright test at desktop AND mobile widths). If it renders correctly, do the version bump and tell the user to refresh — do NOT change layout code on an unreproducible report.
