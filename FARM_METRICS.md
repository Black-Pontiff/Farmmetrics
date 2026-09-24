# Farm Metrics application files

The existing root HTML pages are preserved. The application is organized as:

- `api/` — FastAPI backend, SQLite persistence, recommendations, SSE and Merkle ledger
- `dashboard/` — zero-build telemetry dashboard
- `gateway/` — reserved for the Rust fog gateway and local hardware integration
- `edge/` — reserved for ESP32 firmware
- `models/` — optional local LLM download script
- `docker/` — container and Compose deployment files

Run locally:

```bash
cp .env.example .env
pip install -r requirements.txt
uvicorn api.main:app --reload
```

Then open <http://localhost:8000/dashboard/index.html> when serving the dashboard through your web server, or use the API endpoints directly. Demo data is available at `POST /api/simulate`.
