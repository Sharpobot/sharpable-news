# Sharpable News — Project Spec

## Overview
AI news publication in Malay. Editorial, professional, credible. Target: researchers, developers, decision-makers.

**Stack:** Vanilla HTML/CSS/JS. Single-file pages for now. No framework.

---

## Design Philosophy

**Tone:** Calm, mature, authoritative. Think MIT Tech Review meets The Economist online.

**Typography:**
- Headlines: `Fraunces` (variable serif, `font-optical-sizing: auto`)
- Body: `DM Sans`
- Labels/meta/tags: `DM Sans` (was Courier Prime — switched for readability)
- Sizes: hero `clamp(30px,3.8vw,50px)` → section titles ~24px → card titles ~19px → body 14–16px

**Color palette (dark editorial):**
```
--bg: #0c0b0a
--bg-2: #111010        (ticker bar, trending strip, footer)
--bg-card: #161412
--text-1: #ede8df      (primary)
--text-2: #8c857c      (secondary)
--text-3: #56514d      (meta/muted)
--accent: #d4a853      (amber gold — single accent, used sparingly)
--border: rgba(237,232,223,0.07)
--border-mid: rgba(237,232,223,0.11)
```

**Avoid (strictly):**
- Purple gradients, neon, cyberpunk
- Rounded cards (border-radius max 4px on cards, 6px on buttons)
- Flashy animations or parallax
- Cluttered layouts, icon overload
- Inter/Roboto/Arial/system fonts
- AI-slop aesthetics of any kind

---

## Layout & Components

### Navbar
Fixed, blur backdrop. Logo (`Fraunces`) + amber dot + pipe + nav links + search (`⌘K`) + subscribe button. Nav links: Terkini, Penyelidikan, Permulaan, Alatan, Dasar, Analisis, Industri.

### Breaking Ticker
34px bar below navbar. Amber `LIVE` label left. Infinite scroll animation, pauses on hover.

### Hero Section
Two-column grid (`1fr 360px`). Left: large image (16/9) + eyebrow label + `Fraunces` headline + excerpt + meta row. Right: "Berita Utama" sidebar list (4 items, no images).

### Article Cards (`.card`)
Image (16/10 aspect) with `object-fit:cover`, `filter: brightness(0.82) saturate(0.65)`. Tag → title (`Fraunces`) → excerpt (`DM Sans`) → meta row. Hover: title turns `--accent`, image brightens slightly, scale(1.04).

### Category Tags (`.tag`)
`DM Sans`, 9px, weight 600, letter-spacing 0.05em, uppercase. Colour-coded per category:
- Penyelidikan: blue tint `#5a9ee0`
- Analisis: amber `#c97c42`
- Permulaan: green `#50aa70`
- Dasar: rose `#c84c6a`
- Alatan: violet `#9070cc`
- Industri: gold `#c4a030`

### Trending Strip
Dark bg (`--bg-2`), 4-column grid. Large faded serif numbers (01–04, `rgba(237,232,223,0.16)`) + tag + title + meta. `align-items: center` on each item.

### Deep Dive
Asymmetric grid (`1.15fr 1fr`). Featured card (4/3 image) left. Stack list (thumbnail 90×64 + text, `align-items: center`) right.

### Category Spotlights
`2fr 1fr` grid. Main card with 16/9 image. Side list of 4 text-only items with tags.

### Newsletter
2-column. Left: eyebrow + headline + desc + stats row. Right: email input + submit inline. Input border-radius `4px 0 0 4px`, button `0 4px 4px 0`.

### Footer
4-column grid (`1.8fr 1fr 1fr 1fr`). Logo + desc + social icons | Liputan | Syarikat | Surat Berita. Bottom bar: copyright left, legal links right.

### Search Overlay
Full-screen, `backdrop-filter: blur(24px)`. Large `Fraunces` input, borderless except bottom rule. Tag chips for popular searches. Toggle: `⌘K` or search button. Close: `Escape`.

---

## Images
Source: `https://picsum.photos/seed/{descriptor}/{w}/{h}` — deterministic, free, no API key.
Always apply: `filter: brightness(0.82) saturate(0.65)` on cards, `brightness(0.72) saturate(0.55)` on hero.

---

## Article Pages (not yet built)
When building, follow this structure:
1. Sticky navbar (same as homepage)
2. Article header: category tag → large `Fraunces` headline → meta row (author avatar, date, read time) → featured image (16/9, full-width, same filter)
3. Body: max-width ~680px centered, `DM Sans` 17px, line-height 1.75, generous paragraph spacing
4. Pull quotes: left border `--accent`, italic `Fraunces`
5. Related articles: 3-card grid at bottom (same `.card` component)
6. Same footer

---

## Development Guidelines

**Responsiveness:**
- Breakpoints: 1060px (collapse sidebars/deep-dive), 768px (single column, hide nav links), 480px (stack newsletter row)
- Use `clamp()` for fluid type, CSS Grid for all layouts

**Scroll reveal:** `IntersectionObserver` on `.reveal` elements — fade up 18px, 0.55s ease. Stagger via `transitionDelay` modulo 4.

**Accessibility:** Semantic HTML (`<nav>`, `<section>`, `<footer>`, `<h1>`–`<h3>` hierarchy). `alt` text on all images. Keyboard-navigable search overlay (Escape closes).

**Performance:** Fonts via Google Fonts with `preconnect`. Images lazy-loaded (add `loading="lazy"` on new img tags). No JS frameworks — keep it lean.

**Consistency rules:**
- All dates in Malay format: `DD Mei YYYY` or `DD Mei`
- All content in Malay (natural, not literal translation)
- Tag labels always uppercase, colour always matches category
- Border-radius: 2px cards/images, 4–6px buttons/inputs only
- Hover transitions: 0.18s ease (fast, subtle)
- Section labels: 10px mono-style DM Sans, `--text-3`, uppercase, gold left-bar via `::before`

---

## File Structure
```
sharpable-news/
├── index.html          # Homepage (complete)
├── CLAUDE.md           # This file
└── article/            # Article pages (not yet built)
    └── [slug].html
```

---

## Language
All UI text in **Bahasa Malaysia** — natural, editorial Malay. Not direct translation. Refer to existing homepage copy as the tone standard.
