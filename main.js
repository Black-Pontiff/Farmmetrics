/* ===================================================================
   Farm Metrics — main.js
   Shared, progressively-enhanced behaviour for every page.
   No framework, no build step. Safe to load on every page.
   =================================================================== */
(function () {
  "use strict";

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  document.addEventListener("DOMContentLoaded", function () {
    initMobileNav();
    initThemeToggle();
    initBackToTop();
    initCookieBanner();
    initFooterYear();
    initAccordionSingleOpen();
    initBillingToggle();
    initBlogFilters();
    initAnimatedCounters();
    initContactForm();
    initNewsletterForms();
  });

  /* ---------------- Mobile navigation ---------------- */
  function initMobileNav() {
    var toggle = $(".nav-toggle");
    var nav = $("#mobile-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
      document.body.style.overflow = !open ? "hidden" : "";
    });

    $$("a", nav).forEach(function (link) {
      link.addEventListener("click", function () {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        document.body.style.overflow = "";
      });
    });

    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        document.body.style.overflow = "";
        toggle.focus();
      }
    });
  }

  /* ---------------- Dark mode ---------------- */
  function initThemeToggle() {
    var root = document.documentElement;
    var stored = null;
    try { stored = localStorage.getItem("fm-theme"); } catch (e) { /* storage may be blocked */ }
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = stored || (prefersDark ? "dark" : "light");
    if (theme === "dark") root.setAttribute("data-theme", "dark");

    $$(".theme-toggle").forEach(function (btn) {
      btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      btn.addEventListener("click", function () {
        var isDark = root.getAttribute("data-theme") === "dark";
        if (isDark) {
          root.removeAttribute("data-theme");
        } else {
          root.setAttribute("data-theme", "dark");
        }
        try { localStorage.setItem("fm-theme", isDark ? "light" : "dark"); } catch (e) {}
        $$(".theme-toggle").forEach(function (b) { b.setAttribute("aria-pressed", String(!isDark)); });
      });
    });
  }

  /* ---------------- Back to top ---------------- */
  function initBackToTop() {
    var btn = $(".back-to-top");
    if (!btn) return;
    var toggleVisibility = function () {
      btn.classList.toggle("is-visible", window.scrollY > 640);
    };
    window.addEventListener("scroll", toggleVisibility, { passive: true });
    toggleVisibility();
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------------- Cookie consent ---------------- */
  function initCookieBanner() {
    var banner = $(".cookie-banner");
    if (!banner) return;
    var KEY = "fm-cookie-consent";
    var stored = null;
    try { stored = localStorage.getItem(KEY); } catch (e) {}
    if (!stored) {
      window.setTimeout(function () { banner.classList.add("is-visible"); }, 700);
    }
    var close = function (value) {
      banner.classList.remove("is-visible");
      try { localStorage.setItem(KEY, value); } catch (e) {}
    };
    var accept = $(".cookie-accept", banner);
    var decline = $(".cookie-decline", banner);
    if (accept) accept.addEventListener("click", function () { close("accepted"); });
    if (decline) decline.addEventListener("click", function () { close("declined"); });
  }

  /* ---------------- Footer year ---------------- */
  function initFooterYear() {
    $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* ---------------- FAQ accordion: only one open per group ---------------- */
  function initAccordionSingleOpen() {
    $$(".accordion").forEach(function (group) {
      var items = $$(".accordion-item", group);
      items.forEach(function (item) {
        item.addEventListener("toggle", function () {
          if (item.open) {
            items.forEach(function (other) {
              if (other !== item) other.open = false;
            });
          }
        });
      });
    });
  }

  /* ---------------- Pricing: monthly / annual toggle ---------------- */
  function initBillingToggle() {
    var toggle = $(".billing-toggle");
    if (!toggle) return;
    var monthlyBtn = $('[data-billing="monthly"]', toggle);
    var annualBtn = $('[data-billing="annual"]', toggle);
    if (!monthlyBtn || !annualBtn) return;

    var setBilling = function (mode) {
      monthlyBtn.setAttribute("aria-pressed", String(mode === "monthly"));
      annualBtn.setAttribute("aria-pressed", String(mode === "annual"));
      $$("[data-price-monthly]").forEach(function (el) {
        var monthly = el.getAttribute("data-price-monthly");
        var annual = el.getAttribute("data-price-annual");
        el.textContent = mode === "monthly" ? monthly : annual;
      });
      $$("[data-period]").forEach(function (el) {
        el.textContent = mode === "monthly" ? "/ month" : "/ month, billed yearly";
      });
    };

    monthlyBtn.addEventListener("click", function () { setBilling("monthly"); });
    annualBtn.addEventListener("click", function () { setBilling("annual"); });
  }

  /* ---------------- Blog category filters ---------------- */
  function initBlogFilters() {
    var bar = $(".blog-filters");
    if (!bar) return;
    var buttons = $$("button", bar);
    var cards = $$("[data-category]");

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        var cat = btn.getAttribute("data-filter");
        cards.forEach(function (card) {
          var show = cat === "all" || card.getAttribute("data-category") === cat;
          card.style.display = show ? "" : "none";
        });
      });
    });
  }

  /* ---------------- Animated metric counters ---------------- */
  function initAnimatedCounters() {
    var counters = $$("[data-count-to]");
    if (!counters.length) return;

    var animate = function (el) {
      var target = parseFloat(el.getAttribute("data-count-to"));
      var suffix = el.getAttribute("data-suffix") || "";
      var duration = 1200;
      var start = null;

      var step = function (ts) {
        if (start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = Math.round(target * eased);
        el.textContent = value + suffix;
        if (progress < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    };

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animate(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { observer.observe(el); });
    } else {
      counters.forEach(animate);
    }
  }

  /* ---------------- Contact form ---------------- */
  function initContactForm() {
    var form = $("#contact-form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Honeypot: bots fill every field, humans never see this one.
      var honeypot = $('input[name="company_website"]', form);
      if (honeypot && honeypot.value.trim() !== "") return;

      var valid = true;
      var fields = [
        { el: $('[name="name"]', form), test: function (v) { return v.trim().length > 1; } },
        { el: $('[name="email"]', form), test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); } },
        { el: $('[name="country"]', form), test: function (v) { return v.trim().length > 1; } },
        { el: $('[name="message"]', form), test: function (v) { return v.trim().length > 9; } },
        { el: $('[name="consent"]', form), test: function (_, el) { return el.checked; }, isCheckbox: true }
      ];

      fields.forEach(function (f) {
        if (!f.el) return;
        var field = f.el.closest(".form-field");
        var ok = f.isCheckbox ? f.test(null, f.el) : f.test(f.el.value);
        if (field) field.classList.toggle("has-error", !ok);
        if (!ok) valid = false;
      });

      if (!valid) {
        var firstError = $(".form-field.has-error", form);
        if (firstError) firstError.querySelector("input,textarea,select").focus();
        return;
      }

      showToast("Thanks — your message is in. We'll reply within two working days.");
      form.reset();
      $$(".form-field.has-error", form).forEach(function (f) { f.classList.remove("has-error"); });
    });
  }

  /* ---------------- Newsletter forms (footer + anywhere reused) ---------------- */
  function initNewsletterForms() {
    $$(".footer-newsletter form, [data-newsletter-form]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var input = $('input[type="email"]', form);
        if (input && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
          input.focus();
          return;
        }
        showToast("You're subscribed. Watch for our next field notes.");
        form.reset();
      });
    });
  }

  /* ---------------- Toast ---------------- */
  function showToast(message) {
    var toast = $("#toast");
    if (!toast) return;
    var msgEl = $(".toast-message", toast);
    if (msgEl) msgEl.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toast._timer);
    toast._timer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 4200);
  }

  window.FarmMetrics = window.FarmMetrics || {};
  window.FarmMetrics.showToast = showToast;
})();
