# API Server Deployment Guide for prysan.com/api

## 🎯 Overview

Your Stock Sentiment app now works with TWO environments:
- **Development:** `http://localhost:3001` (local proxy server)
- **Production:** `https://prysan.com/api` (deployed proxy server)

---

## 📁 Project Structure

```
prysan.com/
├── public_html/
│   ├── (existing site files)
│   ├── stkcld/              ← Frontend app
│   │   ├── index.html
│   │   └── assets/
│   └── api/                 ← Backend API (Node.js proxy)
│       ├── server.js
│       ├── package.json
│       └── node_modules/
```

---

## 🚀 Part 1: Deploy API Server to prysan.com/api

### Option A: Node.js via cPanel (If Available)

#### Step 1: Check Node.js Support
1. Log into cPanel
2. Look for "**Setup Node.js App**" or "**Node.js Selector**"
3. If available, continue with these steps
4. If not available, use Option B (subdomain) or Option C (external hosting)

#### Step 2: Create Node.js Application
1. Click "**Setup Node.js App**"
2. Click "**Create Application**"
3. Configure:
   - **Node.js version:** Select latest (18.x or 20.x)
   - **Application mode:** Production
   - **Application root:** `api`
   - **Application URL:** Select your domain, path: `/api`
   - **Application startup file:** `server.js`
   - **Passenger log file:** Leave default
4. Click "**Create**"

#### Step 3: Upload API Server Files
1. Go to **File Manager**
2. Navigate to: `public_html/api/`
3. Upload from your `stock-data-proxy-server` folder:
   - `server.js` (or `index.js`)
   - `package.json`
   - `.env` (with your API keys)
   - Any other required files

#### Step 4: Install Dependencies
1. In cPanel, go back to "**Setup Node.js App**"
2. Find your app in the list
3. Click "**Run NPM Install**"
4. Wait for dependencies to install

#### Step 5: Configure Environment Variables
1. In Node.js App settings, find "**Environment variables**"
2. Add your variables:
   ```
   PORT=3001
   NODE_ENV=production
   YAHOO_FINANCE_API_KEY=your_key_here
   ```
3. Click "**Add Variable**" for each

#### Step 6: Start Application
1. Click "**Start App**" or "**Restart App**"
2. Application should now be running

#### Step 7: Verify API is Working
```bash
curl https://prysan.com/api/api/stock/AAPL?interval=1d&range=5d
```

---

### Option B: Using Subdomain (Alternative)

If cPanel doesn't support Node.js in subdirectories:

1. Create subdomain: `api.prysan.com`
2. Deploy Node.js app to subdomain
3. Update frontend `.env.production`:
   ```
   VITE_PROXY_URL=https://api.prysan.com
   ```
4. Configure CORS in your API server:
   ```javascript
   app.use(cors({
     origin: 'https://prysan.com',
     credentials: true
   }));
   ```

---

### Option C: External Hosting (Recommended if cPanel Limitations)

Deploy your API to a cloud service and point to it:

#### Railway.app (Free Tier)
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "**New Project**" → "**Deploy from GitHub repo**"
4. Select your `stock-data-proxy-server` repository
5. Add environment variables in Railway dashboard
6. Get your deployment URL: `https://your-app.railway.app`
7. Update `.env.production`:
   ```
   VITE_PROXY_URL=https://your-app.railway.app
   ```

#### Render.com (Free Tier)
1. Go to https://render.com
2. Click "**New**" → "**Web Service**"
3. Connect GitHub repository
4. Configure:
   - **Name:** stock-sentiment-api
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add environment variables
6. Deploy

#### Heroku (Paid, but reliable)
```bash
cd C:\Project\myproject\stock-data-proxy-server
heroku create stock-sentiment-api
git push heroku main
heroku config:set NODE_ENV=production
```

---

## 🔧 Part 2: Configure API Server for /api Path

If deploying to `prysan.com/api`, your API server needs configuration:

### Update server.js

Add this at the top of your server file:

```javascript
const express = require('express');
const app = express();

// Support deployment to /api subdirectory
const basePath = process.env.BASE_PATH || '';

// All routes should be prefixed with basePath
app.use(basePath, yourRoutes);

// Or if you have routes defined inline:
app.get(`${basePath}/api/stock/:symbol`, async (req, res) => {
  // your handler
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
```

### Set BASE_PATH Environment Variable

In cPanel Node.js App settings:
```
BASE_PATH=/api
```

---

## ✅ Part 3: Verify Everything Works

### Test API Endpoint
```bash
# Test production API
curl https://prysan.com/api/api/stock/AAPL?interval=1d&range=5d

# Should return JSON with stock data
```

### Test Frontend
1. Build with production settings:
   ```bash
   npm run build:production
   ```

2. Upload to `/public_html/stkcld/`

3. Visit: `https://prysan.com/stkcld/`

4. Open DevTools (F12) → Network tab

5. Try analyzing a stock

6. Verify API calls go to `https://prysan.com/api/api/stock/...`

---

## 🔄 Part 4: Development Workflow

### Running Locally (Both Frontend & API)

```powershell
# Terminal 1: Start local API
cd C:\Project\myproject\stock-data-proxy-server
npm start
# Runs on http://localhost:3001

# Terminal 2: Start frontend
cd C:\Project\myproject\stock-sentiment
npm run dev
# Runs on http://localhost:5176
# Automatically uses http://localhost:3001 via .env.development
```

### Switching Between Environments

The app automatically detects:
- **npm run dev** → Uses `http://localhost:3001` (from `.env.development`)
- **npm run build** → Uses `https://prysan.com/api` (from `.env.production`)

### Manual Override

Create `.env.local` (this file is gitignored):

```bash
# For local development but testing production API
VITE_PROXY_URL=https://prysan.com/api

# Or for production build but testing local API
VITE_PROXY_URL=http://localhost:3001
```

---

## 🔐 Security Considerations

### 1. Environment Variables

Never commit `.env` files with real API keys:

```bash
# .gitignore (make sure these are included)
.env
.env.local
.env.production.local
```

### 2. CORS Configuration

In your API server (`server.js`):

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://prysan.com',
    'http://localhost:5176',  // for local dev
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
}));
```

### 3. Rate Limiting

Add to API server:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 4. API Key Protection

Never expose API keys in frontend. Keep them in backend .env:

```bash
# API server .env (BACKEND ONLY)
YAHOO_FINANCE_API_KEY=your_key
ALPHA_VANTAGE_API_KEY=your_key
FINNHUB_API_KEY=your_key
```

---

## 🧪 Testing Checklist

- [ ] Local API responds: `http://localhost:3001/api/stock/AAPL`
- [ ] Production API responds: `https://prysan.com/api/api/stock/AAPL`
- [ ] Frontend dev mode uses local API
- [ ] Frontend production uses production API
- [ ] CORS allows requests from prysan.com
- [ ] No API keys exposed in frontend code
- [ ] Environment variables configured correctly
- [ ] Rate limiting enabled
- [ ] Error handling works (try invalid symbol)

---

## 📞 Troubleshooting

### API not responding at prysan.com/api

**Check:**
1. Node.js app is running in cPanel
2. Check error logs in cPanel
3. Verify `server.js` path is correct
4. Test with curl: `curl https://prysan.com/api/`

### CORS errors in browser

**Fix:** Add CORS headers in API server:
```javascript
res.header('Access-Control-Allow-Origin', 'https://prysan.com');
res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
```

### Frontend still using localhost in production

**Fix:**
1. Delete `dist` folder
2. Run `npm run build` again
3. Verify `.env.production` has correct URL
4. Clear browser cache

### Environment variables not working

**Check:**
1. `.env.development` exists for dev mode
2. `.env.production` exists for production
3. Variable names start with `VITE_`
4. Restart dev server after changing .env

---

## 📝 File Checklist

Your project should have:

```
stock-sentiment/
├── .env.development          ← Local dev config
├── .env.production          ← Production config
├── .env.example             ← Template for new developers
├── .gitignore               ← Ignore .env files
└── src/
    └── App.jsx              ← Updated with getApiUrl()

stock-data-proxy-server/
├── server.js                ← Your API server
├── package.json
└── .env                     ← API keys (NOT committed)
```

---

## 🚀 Quick Reference

| Environment | Frontend URL | API URL | Config File |
|-------------|--------------|---------|-------------|
| Local Dev | http://localhost:5176 | http://localhost:3001 | `.env.development` |
| Production | https://prysan.com/stkcld | https://prysan.com/api | `.env.production` |

**Build Commands:**
- Dev: `npm run dev`
- Production: `npm run build:production`
- Preview: `npm run preview`

---

## 📚 Additional Resources

- Express.js CORS: https://expressjs.com/en/resources/middleware/cors.html
- Vite Environment Variables: https://vitejs.dev/guide/env-and-mode.html
- Railway Deployment: https://docs.railway.app/
- Render Deployment: https://render.com/docs

---

**Need Help?** Check the main `DEPLOYMENT_GUIDE.md` for frontend deployment details.
