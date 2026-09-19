/* ===================================================================
   Farm Metrics — dashboard.js
   Pulls live telemetry / AI / inventory / financial / blockchain data
   from the Farm Metrics API. If the API is unreachable (no backend
   configured, offline demo, CORS, etc.) every card falls back to
   realistic simulated data so the dashboard is never empty or broken.
   =================================================================== */
(function () {
  "use strict";

  var API_BASE = window.FARM_METRICS_API_BASE || "http://localhost:5000/api";
  var REFRESH_MS = 10000;
  var FETCH_TIMEOUT_MS = 3500;

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };

  var state = {
    liveEndpointsReached: 0,
    totalEndpointsTried: 0,
    log: []
  };

  document.addEventListener("DOMContentLoaded", function () {
    if (!$("#dashboard-root")) return; // not on the dashboard page

    seedLog();
    renderLog();
    renderDate();
    loadAll(true);

    var refreshBtn = $("#refresh-btn");
    if (refreshBtn) refreshBtn.addEventListener("click", function () { loadAll(false); });

    var simulateBtn = $("#simulate-btn");
    if (simulateBtn) simulateBtn.addEventListener("click", runSimulation);

    window.setInterval(function () { loadAll(false); }, REFRESH_MS);
  });

  function renderDate() {
    var el = $("#dash-date");
    if (!el) return;
    el.textContent = new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  }

  function seedLog() {
    var now = new Date();
    state.log = [
      { time: new Date(now - 1000 * 60 * 42), text: "Telemetry batch recorded and hashed to the ledger — Field A." },
      { time: new Date(now - 1000 * 60 * 19), text: "AI generated a new irrigation recommendation for Field A." },
      { time: new Date(now - 1000 * 60 * 6), text: "Inventory levels synced from field sensors." }
    ];
  }

  function pushLog(text) {
    state.log.unshift({ time: new Date(), text: text });
    state.log = state.log.slice(0, 12);
    renderLog();
  }

  /* ---------------- Fetch with timeout + mock fallback ---------------- */
  function fetchJSON(path) {
    state.totalEndpointsTried++;
    if (!("fetch" in window)) return Promise.reject(new Error("fetch unsupported"));

    var controller = ("AbortController" in window) ? new AbortController() : null;
    var timer = controller ? window.setTimeout(function () { controller.abort(); }, FETCH_TIMEOUT_MS) : null;

    return fetch(API_BASE + path, { signal: controller ? controller.signal : undefined, headers: { Accept: "application/json" } })
      .then(function (res) {
        if (timer) window.clearTimeout(timer);
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        state.liveEndpointsReached++;
        return data;
      })
      .catch(function (err) {
        if (timer) window.clearTimeout(timer);
        throw err;
      });
  }

  function withFallback(path, mockFn) {
    return fetchJSON(path).catch(function () { return mockFn(); });
  }

  /* ---------------- Orchestration ---------------- */
  function loadAll(showSkeletons) {
    if (showSkeletons) {
      ["telemetry", "recommendations", "inventory", "financials", "blockchain"].forEach(showSkeleton);
    }
    state.liveEndpointsReached = 0;
    state.totalEndpointsTried = 0;

    var pTelemetry = withFallback("/telemetry/latest", window.FarmMetricsMock.telemetry);
    var pRecs = withFallback("/recommendations/latest", window.FarmMetricsMock.recommendations);
    var pInventory = withFallback("/inventory", window.FarmMetricsMock.inventory);
    var pFinancials = withFallback("/financials", window.FarmMetricsMock.financials);
    var pChainStatus = withFallback("/blockchain/status", window.FarmMetricsMock.blockchainStatus);
    var pChainLast = withFallback("/blockchain/last", window.FarmMetricsMock.blockchainLast);

    pTelemetry.then(renderTelemetry);
    pRecs.then(renderRecommendations);
    pInventory.then(renderInventory);
    pFinancials.then(renderFinancials);
    Promise.all([pChainStatus, pChainLast]).then(function (r) { renderBlockchain(r[0], r[1]); });

    Promise.allSettled ? Promise.allSettled([pTelemetry, pRecs, pInventory, pFinancials, pChainStatus, pChainLast]).then(updateModeBadge)
                        : window.setTimeout(updateModeBadge, FETCH_TIMEOUT_MS + 200);
  }

  function updateModeBadge() {
    var badge = $("#dash-mode-badge");
    if (!badge) return;
    var isLive = state.totalEndpointsTried > 0 && state.liveEndpointsReached === state.totalEndpointsTried;
    badge.classList.toggle("is-live", isLive);
    badge.classList.toggle("is-demo", !isLive);
    badge.querySelector(".label").textContent = isLive
      ? "Live data"
      : "Demo mode — showing simulated data";
    var stamp = $("#last-refreshed");
    if (stamp) stamp.textContent = "Updated " + new Date().toLocaleTimeString();
  }

  /* ---------------- Skeletons ---------------- */
  function showSkeleton(key) {
    var body = $('[data-card-body="' + key + '"]');
    if (!body) return;
    body.innerHTML =
      '<div class="skeleton skeleton-line w-80"></div>' +
      '<div class="skeleton skeleton-line w-60"></div>' +
      '<div class="skeleton skeleton-line w-40"></div>';
  }

  function pulseCard(key) {
    var card = $('[data-card="' + key + '"]');
    if (!card) return;
    card.classList.remove("just-updated");
    void card.offsetWidth;
    card.classList.add("just-updated");
  }

  /* ---------------- Renderers ---------------- */
  function renderTelemetry(data) {
    var body = $('[data-card-body="telemetry"]');
    if (!body) return;
    var rows = data.fields.map(function (f) {
      return (
        '<div class="telemetry-field">' +
          '<div>' +
            '<span class="telemetry-field-name">' + escapeHTML(f.name) + '</span> ' +
            '<span class="badge badge-outline">' + escapeHTML(f.crop) + '</span>' +
          '</div>' +
          '<div class="telemetry-readings">' +
            reading(f.soilMoisture, "%", "Soil", f.soilMoisture < 22 ? "is-low" : "") +
            reading(f.temperature, "°C", "Temp", f.temperature > 32 ? "is-high" : "") +
            reading(f.humidity, "%", "Humidity", "") +
            reading(Math.round(f.lightLux / 1000), "k lux", "Light", "") +
          '</div>' +
        '</div>'
      );
    }).join("");
    body.innerHTML = '<div class="telemetry-list">' + rows + '</div>';
    pulseCard("telemetry");
  }

  function reading(value, unit, label, cls) {
    return (
      '<div class="reading">' +
        '<span class="reading-label">' + label + '</span>' +
        '<span class="val tnum ' + cls + '">' + value + '<span class="unit">' + unit + '</span></span>' +
      '</div>'
    );
  }

  var REC_ICON = {
    critical: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 9v4m0 4h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0Z" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 8v4m0 4h.01M12 3 2 21h20L12 3Z" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    notice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    optimal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="m4 12 5 5L20 6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  var REC_LABEL = { critical: "Act now", warning: "Watch", notice: "Upcoming", optimal: "On track" };

  function renderRecommendations(data) {
    var body = $('[data-card-body="recommendations"]');
    if (!body) return;
    if (!data.items || !data.items.length) {
      body.innerHTML = '<p class="dash-empty">No active recommendations right now.</p>';
      return;
    }
    var rows = data.items.map(function (item) {
      return (
        '<div class="rec-item rec-' + item.type + '">' +
          (REC_ICON[item.type] || REC_ICON.notice) +
          '<div><span class="rec-field">' + escapeHTML(REC_LABEL[item.type] || "Notice") + '</span>' +
          '<p><strong>' + escapeHTML(item.field) + ':</strong> ' + escapeHTML(item.text) + '</p></div>' +
        '</div>'
      );
    }).join("");
    body.innerHTML = '<div class="rec-list">' + rows + '</div>';
    pulseCard("recommendations");
  }

  function renderInventory(data) {
    var body = $('[data-card-body="inventory"]');
    if (!body) return;
    var rows = data.items.map(function (item) {
      var cls = item.pct < 25 ? "is-low" : item.pct < 55 ? "is-mid" : "";
      return (
        '<div class="inv-item">' +
          '<span class="inv-label">' + escapeHTML(item.label) + '</span>' +
          '<div class="inv-bar-track"><div class="inv-bar-fill ' + cls + '" style="width:' + item.pct + '%"></div></div>' +
          '<span class="inv-pct tnum">' + item.pct + '%</span>' +
        '</div>'
      );
    }).join("");
    body.innerHTML = '<div class="inv-list">' + rows + '</div>';
    pulseCard("inventory");
  }

  function renderFinancials(data) {
    var body = $('[data-card-body="financials"]');
    if (!body) return;
    var fmt = function (n) { return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 }); };
    body.innerHTML =
      '<div class="fin-grid">' +
        '<div class="fin-item"><div class="label">Revenue</div><div class="amount tnum">' + fmt(data.revenue) + '</div></div>' +
        '<div class="fin-item"><div class="label">Expenses</div><div class="amount tnum">' + fmt(data.expenses) + '</div></div>' +
        '<div class="fin-item is-net"><div class="label">Net</div><div class="amount tnum">' + fmt(data.net) + '</div></div>' +
      '</div>' +
      '<p class="fin-note">Figures shown in ' + escapeHTML(data.currency || "USD") + ', ' + escapeHTML((data.period || "this season").toLowerCase()) + '.</p>';
    pulseCard("financials");
  }

  function renderBlockchain(status, last) {
    var body = $('[data-card-body="blockchain"]');
    if (!body) return;
    var validChip = status.valid
      ? '<span class="chip is-valid"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m4 12 5 5L20 6" stroke-linecap="round" stroke-linejoin="round"/></svg>Chain verified</span>'
      : '<span class="chip is-invalid"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18" stroke-linecap="round"/></svg>Integrity check failed</span>';

    body.innerHTML =
      '<div class="chain-status">' + validChip + '</div>' +
      '<div class="chain-meta">' +
        '<div><div class="label">Blocks recorded</div><div class="val tnum">' + status.blockCount.toLocaleString() + '</div></div>' +
      '</div>' +
      '<div class="chain-hash"><strong>Last block hash</strong>' + last.hash + '</div>' +
      '<p class="fin-note mt-2">Last event: ' + escapeHTML(last.event) + '</p>';
    pulseCard("blockchain");
  }

  function renderLog() {
    var list = $("#log-list");
    if (!list) return;
    list.innerHTML = state.log.map(function (entry) {
      return (
        '<li class="log-item"><span class="dot" aria-hidden="true"></span>' +
          '<div><span class="log-time">' + entry.time.toLocaleTimeString() + '</span>' + escapeHTML(entry.text) + '</div>' +
        '</li>'
      );
    }).join("");
  }

  /* ---------------- Simulate cycle ---------------- */
  function runSimulation() {
    var btn = $("#simulate-btn");
    if (btn) { btn.disabled = true; btn.textContent = "Simulating…"; }

    fetchJSON("/simulate")
      .catch(function () {
        return fetch(API_BASE + "/simulate", { method: "POST" })
          .then(function (r) { if (!r.ok) throw new Error("bad response"); return r.json(); });
      })
      .catch(function () { return window.FarmMetricsMock.simulate(); })
      .then(function (result) {
        pushLog(result.message || "Simulation cycle complete — new readings recorded to the ledger.");
        loadAll(false);
      })
      .finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = "Simulate Cycle"; }
      });
  }

  /* ---------------- Utilities ---------------- */
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
