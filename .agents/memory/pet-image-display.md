---
name: Pet image display (cards, explore, modal)
description: How pet photos must fill card space without cropping; the approaches that were tried and rejected.
---

# Pet image display rule

Pet image assets are **square** (~700×700, hero 478×498). Display them with:
`width:100%; aspect-ratio:1/1; object-fit:cover; object-position:center;` on
`.pet-card-img img`, `.explore-card-img img`, `.modal-img img`. Container keeps
`background: var(--bege)` for any non-square upload.

**Why:** the original cropping came from boxes whose aspect didn't match the
square photos (fixed heights like 170/300/280px on ~square images crop heavily).
A 1:1 box matching the 1:1 assets fills completely with zero crop and gives
uniform, responsive card heights.

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
