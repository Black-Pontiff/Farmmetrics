# Changelog

## [1.0.0] — Initial build — 2026-09-19

### Added
- Full 10-page static site (11 HTML files counting the blog article template):
  Home, Features, How It Works, Pricing, Dashboard, About, Contact,
  Blog (index + one full article template), Privacy Policy, Terms of Service.
- Shared design system: `css/variables.css` (design tokens + dark theme),
  `css/base.css`, `css/layout.css`, `css/components.css`, `css/pages.css`,
  `css/dashboard.css`.
- Hand-built SVG icon sprite (`assets/icons/sprite.svg`) covering navigation,
  the four product modules, the three process steps, architecture/security
  concepts, contact/meta icons and social icons — no external icon CDN.
- Brand mark, standalone favicon, an animated hero illustration (self-contained
  CSS animation inside the SVG) and an Open Graph share image, all as SVG.
- `js/main.js`: mobile navigation, dark-mode toggle with `localStorage`
  persistence, cookie-consent banner, back-to-top button, single-open FAQ
  accordions, pricing monthly/annual toggle, blog category filters, animated
  metric counters (`IntersectionObserver`), contact-form validation with a
  honeypot field and a toast notification, and a reusable newsletter-form
  handler.
- `js/mockData.js` + `js/dashboard.js`: a live dashboard demo that calls a
  configurable REST API (`/telemetry/latest`, `/recommendations/latest`,
  `/inventory`, `/financials`, `/blockchain/status`, `/blockchain/last`,
  `/simulate`) and falls back automatically to realistic simulated data
  per-card on any failure, with loading skeletons, a live/demo-mode badge,
  a manual refresh button, a "Simulate Cycle" action, and a running actions
  log — auto-refreshing every 10 seconds.
- On-page copy grounded in the project's actual market analysis, business
  model and system overview documents (Zimbabwe-focused smallholder market,
  maize/soybean/tobacco/horticulture focus, the four-module system
  architecture, the Free/Pro/Enterprise revenue model).
- SEO: unique per-page titles/descriptions, canonical tags, Open Graph and
  Twitter card tags, JSON-LD `Organization` schema on the home page and
  `BlogPosting` schema on the article page, `sitemap.xml`, `robots.txt`,
  `site.webmanifest`.
- Accessibility: skip-to-content link, semantic landmarks, visible
  focus-visible outlines, `aria-current`/`aria-expanded`/`aria-pressed`
  states throughout, labelled form fields with inline error messaging,
  colour combinations checked/adjusted for WCAG AA contrast.

### Notes
- Testimonials, most team/advisor entries, the phone number on the Contact
  page, and the metrics-strip figures are clearly labelled as illustrative
  placeholders — see the "Before you launch this for real" section of
  `README.md`.
- One team bio (Co-Founder & CTO) reflects real background supplied for
  this project; identifying personal details (contact number, ID number,
  home address) were intentionally left off the public page.
