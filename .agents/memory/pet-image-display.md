---
name: Pet image display (cards, explore, modal)
description: How pet photos must fill card space without cropping; the approaches that were tried and rejected.
---

# Pet image display rule

Pet image assets are **square** (~700×700, hero 478×498). Put the `aspect-ratio:1/1`
on the **container** (`.pet-card-img`, `.explore-card-img`, `.modal-img`) and make the
`<img>` fill it: `width:100%; height:100%; object-fit:cover; object-position:center;`.
Container keeps `background: var(--bege)` for any non-square upload.

**Why:** a 1:1 box matching the 1:1 assets fills completely with zero crop and gives
uniform, responsive card heights (original crop came from non-square fixed heights like
170/300/280px). CRITICAL: `aspect-ratio` set **directly on the `<img>`** triggers an
**iOS Safari paint bug** — the box gets sized (square + beige bg) but the bitmap doesn't
render for cards below the fold, so "alguns animais ficaram sem fotos" on real iPhones.
Chromium/Playwright renders it fine, so e2e tests DO NOT catch this — only real Safari.
Moving aspect-ratio to the container + `height:100%` on the img paints reliably everywhere.

**Rejected approaches (do not reintroduce):**
- `object-fit: contain` with non-square boxes → leaves empty/letterbox space (user rejected).
- Blurred `::before` letterbox fill + JS `setupImageFills()` → user rejected the blur bars.
- `max-height` (vh) caps combined with `object-fit: cover` → cap makes the box
  non-square again, so `cover` re-crops the square photos. Don't cap height on
  cover'd square images.

**How to apply:** keep all three surfaces on 1:1 cover. Responsive breakpoints live
at the end of style.css (`@media max-width:768px` shrinks grid columns; `480px`
goes single-column). `body{overflow-x:clip}` guards horizontal scroll without
breaking the sticky header (clip, NOT hidden, so no scroll-container is created).
