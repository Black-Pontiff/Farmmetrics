# Farm Metrics — Marketing Website & Dashboard Demo

A complete, responsive, static website for **Farm Metrics** — precision-farming
sensors, AI recommendations and blockchain traceability for farmers in
Zimbabwe. Built with plain HTML, CSS and vanilla JavaScript. No build step,
no framework, no dependencies to install.

## Quick start

You can open `index.html` directly in a browser, but **running a tiny local
server is strongly recommended** — a couple of features rely on the page
being served over `http://` rather than opened as a local `file://` path:

- The reusable icon set (`assets/icons/sprite.svg`) is loaded by every page
  via `<use href="assets/icons/sprite.svg#name">`. Some browsers (Chrome in
  particular) block that kind of cross-file SVG reference under `file://`
  for security reasons, so icons can silently fail to render if you just
  double-click `index.html`. They render correctly once served over `http`.
- The dashboard's `fetch()` calls behave more predictably over `http` too
  (it still works over `file://` thanks to the built-in mock-data fallback,
  but a local server gives you the intended experience).

Pick whichever you have installed:

```bash
# Option 1 — Node (no install needed)
npx serve .

# Option 2 — Python 3
python3 -m http.server 8000

# Option 3 — PHP
php -S localhost:8000
```

Then open the printed local URL (e.g. `http://localhost:8000`).

## Folder structure

```
farm-metrics-website/
├── index.html                Home
├── features.html             Product features (4 modules, alternating layout)
├── how-it-works.html         Architecture, edge/fog/cloud, sensors, security, FAQ
├── pricing.html               Plans, comparison table, billing toggle, FAQ
├── dashboard.html             Live dashboard demo (see below)
├── about.html                 Mission, vision, team, advisors, careers
├── contact.html                Demo request form + company details
├── blog/
│   ├── index.html             Filterable article grid (6 cards, 4 categories)
│   └── why-guesswork-irrigation-costs-more.html
│                               Full article — this file is the reusable
│                               template; duplicate it for each new post
├── legal/
│   ├── privacy.html
│   └── terms.html
├── css/
│   ├── variables.css          Design tokens (colour, type, spacing, shadow) + dark theme
│   ├── base.css                Reset and base element styles
│   ├── layout.css              Header, footer, containers, grid, cookie banner
│   ├── components.css          Buttons, cards, badges, forms, accordion, timeline…
│   ├── pages.css               Page-specific tweaks (legal, about, contact, blog)
│   └── dashboard.css           Dashboard-only card styles
├── js/
│   ├── main.js                 Nav, dark mode, cookie banner, forms, FAQ, counters
│   ├── mockData.js             Simulated data generator (dashboard fallback)
│   └── dashboard.js            Dashboard fetch/render/refresh/simulate logic
├── assets/
│   ├── icons/sprite.svg        All UI icons as reusable <symbol> defs
│   ├── icons/favicon.svg
│   └── images/hero-illustration.svg, og-image.svg
├── sitemap.xml
├── robots.txt
├── site.webmanifest
├── README.md
└── CHANGELOG.md
```

## The dashboard demo

`dashboard.html` calls these endpoints, relative to the `FARM_METRICS_API_BASE`
constant set in a small inline `<script>` at the top of `dashboard.html`:

```
GET  /telemetry/latest
GET  /recommendations/latest
GET  /inventory
GET  /financials
GET  /blockchain/status
GET  /blockchain/last
POST /simulate   (falls back to GET /simulate, then to local mock data)
```

If a request fails for any reason — no backend configured, CORS, offline —
that card automatically falls back to realistic simulated data from
`js/mockData.js`, and a **"Demo mode"** badge appears in the dashboard header
so it's always clear which state you're looking at. Point
`FARM_METRICS_API_BASE` at your real API to go live; no other code changes
are required as long as your API's response shapes match what
`js/dashboard.js` expects (see the render functions in that file for the
exact fields each card reads).

## Before you launch this for real

This is a complete, working mockup, not a finished production deployment.
A few things are deliberately left as clearly-marked placeholders:

- **Domain** — `https://www.farmmetrics.co.zw` is used throughout (canonical
  tags, Open Graph URLs, JSON-LD, `sitemap.xml`, `robots.txt`). Find-and-replace
  it with your real domain.
- **Contact details** — the phone number on `contact.html` is a placeholder;
  the email address `hello@farmmetrics.co.zw` and social links are
  illustrative and should be swapped for your real accounts.
- **Testimonials** (home page) and **team members / advisors** (`about.html`,
  beyond the one real bio) are clearly-labelled placeholders — replace them
  with real customers and colleagues before publishing.
- **Metrics strip** on the home page (water savings, yield uplift, etc.) is
  labelled as illustrative, research-based figures, not audited results —
  replace with your own data as it becomes available.
- **Legal pages** (`legal/privacy.html`, `legal/terms.html`) are a solid
  starting draft, flagged on-page as a template — have them reviewed by a
  qualified lawyer before publishing.
- **Favicon/app icons** — `assets/icons/favicon.svg` covers modern browsers.
  For maximum compatibility (older Safari, some Android launchers), run it
  through a favicon generator to produce a `.ico` and PNG app icons, then
  add the extra `<link>` tags.
- **OG image** — `assets/images/og-image.svg` is provided as an SVG. Some
  platforms that scrape Open Graph tags don't render SVG previews; export it
  to a 1200×630 PNG/JPG (any browser's "screenshot" of the file, or an SVG-
  to-PNG converter, works) and update the `og:image` tags to point at it.

## Design notes

- Colour, type and spacing are all defined once in `css/variables.css` —
  change a value there and it propagates everywhere, including the dark
  theme (`[data-theme="dark"]` overrides in the same file).
- A few status colours (critical red, warning amber) are paired with darker
  "-strong" variants specifically so solid badges with white text keep
  WCAG AA contrast; the base hex codes from the brief are kept for icons,
  borders and light-tinted backgrounds.
- Icons are hand-built as a single SVG sprite (`assets/icons/sprite.svg`) in
  an outline style rather than pulled from an external icon CDN, so the site
  has zero runtime dependencies beyond Google Fonts.
- No JavaScript framework, no bundler, no `node_modules`. `js/main.js` is
  shared by every page and checks for each element it needs before wiring
  up behaviour, so it's safe to include everywhere.
- Every page renders a complete, readable document with JavaScript
  disabled — navigation, content and the FAQ accordions (built on native
  `<details>/<summary>`) all work without it. JavaScript adds the mobile
  menu toggle, dark mode, cookie banner, form validation/toast, animated
  counters, and the dashboard's live data.

## Performance & accessibility

The site is built with Lighthouse's four categories in mind: semantic
landmarks and skip link, WCAG AA colour contrast, `alt` text throughout,
keyboard-focusable controls with visible focus rings, lazy-loading where it
helps, and lightweight vanilla JS (no page loads more than one small script
bundle). Lighthouse itself wasn't run inside this environment — verify with
`npx lighthouse <url> --view` (or Chrome DevTools → Lighthouse) once the
site is hosted, and treat the 95+ target as a check to run, not an assumed
result.

## License / usage

All copy, layout and code here were written for this project. Swap the
placeholders noted above, then it's yours to deploy.
