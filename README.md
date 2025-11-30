# Stock Sentiment — Local Development Helper

This repository contains a small React app that fetches stock data through a proxy server and calculates technical indicators.

## 🔗 Proxy Server Requirement

This project **requires** a running proxy server to fetch stock data. The client does not contain any hardcoded API URLs (Yahoo, Alpha Vantage, etc.) - all data fetching is delegated to the proxy server.

**External Proxy Server Location:** `C:\Project\myproject\stock-data-proxy-server`

The proxy server provides:
- Multiple data source failover (Yahoo → Alpha Vantage → Finnhub → Twelve Data → etc.)
- Automatic rate limit handling
- No CORS issues
- Centralized API key management
- Smart market hours detection (fetches last trading day data when market is closed)

**API Endpoint Format:**
```
GET http://localhost:3001/api/stock/:symbol?interval=INTERVAL&range=RANGE&includePrePost=BOOLEAN

Example: http://localhost:3001/api/stock/AAPL?interval=1d&range=1y&includePrePost=true
```

## Start dev servers (convenience)

Start the local proxy and Vite dev server in the background (Windows PowerShell):

```powershell
# Start both Vite and proxy in background and save PIDs
npm run start:dev-bg

# OR pass ports explicitly
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-dev-servers.ps1 -FrontendPort 5174 -ProxyPort 3001
```

Stop background servers:

```powershell
npm run stop:dev-bg
# OR
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stop-dev-servers.ps1
```

Notes:
- The scripts create `.dev-servers/pids.json` in the project root with PID information and a timestamp. This folder is ignored by VCS (`.gitignore`).
- The start script now inspects ports and reuses existing dev server processes if the ports are already bound.
- The stop script will check the process command line and only stop processes that look like Vite or the server proxy to avoid killing unrelated processes.

Development alternatives:
- `npm run dev:all` runs proxy and frontend in the foreground using concurrently (useful when you want logs). 
- To debug issues with CORS, use the "Use CORS proxy (dev)" toggle in the UI or ensure `VITE_LOCAL_PROXY_URL` is set to `http://localhost:3001`.

Happy hacking!
