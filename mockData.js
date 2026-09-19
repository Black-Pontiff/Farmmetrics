/* ===================================================================
   Farm Metrics — mockData.js
   Illustrative, simulated data only. Used whenever the configured API
   is unreachable, so the dashboard demo always has something real
   to show. Values are randomised slightly on each call so the demo
   feels alive when you click "Simulate Cycle".
   =================================================================== */
(function () {
  "use strict";

  function rand(min, max, decimals) {
    var v = Math.random() * (max - min) + min;
    return decimals ? parseFloat(v.toFixed(decimals)) : Math.round(v);
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  var FIELDS = [
    { id: "field-a", name: "Field A", crop: "Maize" },
    { id: "field-b", name: "Field B", crop: "Soybean" },
    { id: "field-c", name: "Field C", crop: "Tobacco" }
  ];

  function mockTelemetry() {
    return {
      generatedAt: new Date().toISOString(),
      fields: FIELDS.map(function (f) {
        return {
          id: f.id,
          name: f.name,
          crop: f.crop,
          soilMoisture: rand(14, 68),
          temperature: rand(17, 34, 1),
          humidity: rand(35, 88),
          lightLux: rand(4200, 92000)
        };
      })
    };
  }

  var REC_POOL = [
    { field: "Field A", crop: "Maize", type: "critical", text: "Soil moisture has dropped to 18% — irrigate within 6 hours to avoid stress during tasselling." },
    { field: "Field A", crop: "Maize", type: "warning", text: "Leaf-level humidity is trending high overnight. Watch for early grey leaf spot over the next 48 hours." },
    { field: "Field B", crop: "Soybean", type: "notice", text: "Fertiliser top-dressing is due in 3 days based on current growth-stage model." },
    { field: "Field B", crop: "Soybean", type: "optimal", text: "Soil moisture, temperature and light are all within target range. No action needed today." },
    { field: "Field C", crop: "Tobacco", type: "warning", text: "Light exposure is below target for curing-leaf development — consider reducing shade netting." },
    { field: "Field C", crop: "Tobacco", type: "notice", text: "Historical yield model suggests scheduling first reaping in 9–11 days." },
    { field: "Field A", crop: "Maize", type: "optimal", text: "Nitrogen uptake is tracking ahead of last season's benchmark for this field." },
    { field: "Field B", crop: "Soybean", type: "critical", text: "Two consecutive readings show a sharp temperature spike — check for irrigation-line blockage." }
  ];

  function mockRecommendations() {
    var shuffled = REC_POOL.slice().sort(function () { return Math.random() - 0.5; });
    return { generatedAt: new Date().toISOString(), items: shuffled.slice(0, 4) };
  }

  function mockInventory() {
    return {
      generatedAt: new Date().toISOString(),
      items: [
        { label: "Maize seed", pct: rand(20, 95) },
        { label: "Compound D fertiliser", pct: rand(10, 90) },
        { label: "Herbicide", pct: rand(15, 80) },
        { label: "Irrigation water reserve", pct: rand(25, 100) }
      ]
    };
  }

  function mockFinancials() {
    var revenue = rand(2800, 5200);
    var expenses = rand(1600, 3400);
    return {
      generatedAt: new Date().toISOString(),
      period: "This season",
      currency: "USD",
      revenue: revenue,
      expenses: expenses,
      net: revenue - expenses
    };
  }

  function hexChar() { return "0123456789abcdef"[Math.floor(Math.random() * 16)]; }
  function fakeHash() {
    var s = "";
    for (var i = 0; i < 64; i++) s += hexChar();
    return s;
  }

  function mockBlockchainStatus() {
    return { generatedAt: new Date().toISOString(), valid: true, blockCount: rand(1180, 1340) };
  }

  function mockBlockchainLast() {
    return {
      generatedAt: new Date().toISOString(),
      hash: fakeHash(),
      previousHash: fakeHash(),
      event: pick([
        "Telemetry batch recorded — Field A",
        "AI recommendation logged — Field C",
        "Inventory adjustment — Compound D fertiliser",
        "Irrigation cycle completed — Field B"
      ])
    };
  }

  function mockSimulateResponse() {
    return {
      ok: true,
      message: "Simulation cycle complete.",
      telemetry: mockTelemetry(),
      recommendations: mockRecommendations(),
      blockchain: mockBlockchainLast()
    };
  }

  window.FarmMetricsMock = {
    telemetry: mockTelemetry,
    recommendations: mockRecommendations,
    inventory: mockInventory,
    financials: mockFinancials,
    blockchainStatus: mockBlockchainStatus,
    blockchainLast: mockBlockchainLast,
    simulate: mockSimulateResponse
  };
})();
