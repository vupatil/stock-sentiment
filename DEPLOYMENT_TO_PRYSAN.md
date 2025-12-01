# Deployment to prysan.com - Integration Guide

## ✅ Good News: No Changes Required!

Your Stock Sentiment app is **already configured** to deploy alongside your existing prysan.com site without any conflicts.

---

## 📁 Deployment Structure

After deployment, your server will have this structure:

```
prysan.com/
├── index.html              ← Existing site (prysan-reimagined-1)
├── assets/                 ← Existing site assets
├── .htaccess               ← Existing site config
├── favicon.ico
├── (other existing files)
│
├── stkcld/                 ← NEW: Stock Sentiment App
│   ├── index.html          ← Stock Sentiment entry point
│   ├── assets/             ← Stock Sentiment assets (separate)
│   ├── .htaccess           ← Stock Sentiment SPA routing
│   └── (other build files)
│
└── api/                    ← Backend API (shared or separate)
    ├── (existing API if any)
    └── (stock data proxy if deployed here)
```

---

## 🎯 Why No Conflicts?

1. **Different Base Paths:**
   - Existing site: `prysan.com/` (root)
   - Stock Sentiment: `prysan.com/stkcld/` (subdirectory)

2. **Separate Asset Folders:**
   - Existing: `prysan.com/assets/`
   - Stock Sentiment: `prysan.com/stkcld/assets/`

3. **Independent .htaccess:**
   - Each folder has its own routing configuration
   - No interference between applications

4. **Different API Endpoints (if needed):**
   - Existing API: `prysan.com/api/` (if exists)
   - Stock API: Can use same `/api/` or deploy to `prysan.com/stock-api/`

---

## 🚀 Deployment Steps

### Step 1: Build Stock Sentiment App

```powershell
cd C:\Project\myproject\stock-sentiment
npm run build:production
```

This creates a `dist/` folder with all files ready for deployment.

### Step 2: Verify Build

```powershell
# Check that dist folder was created
Test-Path .\dist

# List contents
Get-ChildItem .\dist
```

Should contain:
- `index.html`
- `assets/` folder
- `.htaccess` file

### Step 3: Upload to prysan.com

**Via cPanel File Manager:**

1. Log into cPanel at prysan.com
2. Go to **File Manager**
3. Navigate to `public_html/`
4. Create new folder: `stkcld`
5. Enter `stkcld/` folder
6. Upload ALL files from your local `dist/` folder:
   - `index.html`
   - `assets/` folder (entire folder)
   - `.htaccess` file
   - Any other files in `dist/`

**Via FTP (FileZilla):**

1. Connect to prysan.com FTP
2. Navigate to `/public_html/`
3. Create folder `stkcld/`
4. Upload `C:\Project\myproject\stock-sentiment\dist\*` to `/public_html/stkcld/`

**Via Command Line (if SSH access):**

```powershell
# Compress dist folder
Compress-Archive -Path .\dist\* -DestinationPath stock-sentiment-deploy.zip

# Upload via SCP (if available)
# scp stock-sentiment-deploy.zip user@prysan.com:/home/user/
# Then SSH in and unzip to public_html/stkcld/
```

### Step 4: Set Correct Permissions

In cPanel File Manager, select all uploaded files:
- **Files:** 644 permissions
- **Folders:** 755 permissions
- **.htaccess:** 644 permissions

### Step 5: Test Deployment

1. Open browser: `https://prysan.com/stkcld/`
2. Open DevTools (F12) → Console
3. Check for any errors
4. Test functionality:
   - Search for a stock (e.g., AAPL)
   - Change timeframes
   - Check Scanner tab
   - Verify TradingView charts load

### Step 6: Verify No Impact on Existing Site

1. Open: `https://prysan.com/` (root)
2. Verify existing site works normally
3. Check all existing pages/routes
4. Ensure no broken links or assets

---

## 🔧 Configuration Checklist

### ✅ Stock Sentiment App (Already Done)

- [x] `vite.config.js` has `base: '/stkcld/'`
- [x] `.env.production` points to correct API
- [x] `.htaccess.template` exists for SPA routing
- [x] TradingView charts configured
- [x] Build script ready (`npm run build:production`)

### ✅ Existing Site (No Changes Needed)

- [x] prysan-reimagined-1 stays at root path
- [x] No base path needed (default `/`)
- [x] Existing `dist/` folder untouched
- [x] Existing API routes unaffected

---

## 📊 URL Routing Table

| URL | Serves | Application |
|-----|--------|-------------|
| `prysan.com/` | Root index.html | Existing site (prysan-reimagined-1) |
| `prysan.com/about` | Existing routes | Existing site |
| `prysan.com/contact` | Existing routes | Existing site |
| `prysan.com/stkcld/` | Stock Sentiment | **NEW App** |
| `prysan.com/stkcld/assets/` | Stock Sentiment assets | **NEW App** |
| `prysan.com/api/` | Backend API | Shared (if needed) |

---

## 🛡️ .htaccess Configuration

Your Stock Sentiment app includes `.htaccess` for SPA routing:

```apache
# Stock Sentiment SPA Routing
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /stkcld/
  
  # Serve existing files directly
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Route everything else to index.html
  RewriteRule ^ index.html [L]
</IfModule>
```

This ensures:
- Direct file requests work (JS, CSS, images)
- Client-side routing works (React Router paths)
- No interference with parent directory

---

## 🔄 Update Workflow

### When You Update Stock Sentiment:

```powershell
cd C:\Project\myproject\stock-sentiment

# 1. Make your code changes
# 2. Test locally
npm run dev

# 3. Build for production
npm run build:production

# 4. Upload ONLY the stkcld folder contents
# Replace files in: public_html/stkcld/
```

### When You Update Existing Site:

```powershell
cd C:\Project\myproject\prysan-reimagined-1

# Your normal workflow - unchanged
npm run build

# Upload to: public_html/ (root)
# Stock Sentiment at /stkcld/ remains untouched
```

---

## 🔗 API Configuration

### Option 1: Shared API at /api/

Both apps can use the same API endpoint:

**Existing site:**
```javascript
fetch('https://prysan.com/api/endpoint')
```

**Stock Sentiment:**
```javascript
fetch('https://prysan.com/api/stock/AAPL')
```

No conflicts if routes are different.

### Option 2: Separate API Path

Deploy Stock Sentiment API to separate path:

```
prysan.com/
├── api/           ← Existing API
└── stock-api/     ← Stock Sentiment API
```

Update `.env.production`:
```bash
VITE_PROXY_URL=https://prysan.com/stock-api
```

---

## 🧪 Testing After Deployment

### 1. Functionality Tests

- [ ] App loads at `https://prysan.com/stkcld/`
- [ ] Search works (try AAPL, GOOGL, MSFT)
- [ ] Timeframe selector works (1m to 1mo)
- [ ] Technical indicators display correctly
- [ ] Scanner tab functions
- [ ] Multiple scanner tabs can be opened
- [ ] TradingView charts load without errors

### 2. Integration Tests

- [ ] Existing site still works at `https://prysan.com/`
- [ ] Existing site navigation unchanged
- [ ] No broken links in existing site
- [ ] Both sites can be accessed simultaneously

### 3. Performance Tests

- [ ] Fast load times (under 3 seconds)
- [ ] No console errors
- [ ] API calls succeed (check Network tab)
- [ ] Charts render smoothly

### 4. Mobile Tests

- [ ] Responsive design works
- [ ] Touch interactions work
- [ ] Charts are readable on mobile

---

## 🐛 Troubleshooting

### Issue: Stock Sentiment shows 404

**Fix:** Ensure `.htaccess` is uploaded to `/stkcld/` folder

### Issue: Assets not loading (404 on CSS/JS)

**Fix:** Verify `base: '/stkcld/'` in `vite.config.js` before building

### Issue: API calls fail

**Fix:** Check `.env.production` has correct API URL:
```bash
VITE_PROXY_URL=https://prysan.com/api
```

### Issue: Blank page at /stkcld/

**Fixes:**
1. Check browser console for errors
2. Verify all files uploaded correctly
3. Check file permissions (644/755)
4. Clear browser cache and try again

### Issue: Existing site broken after upload

**Recovery:**
1. You only uploaded to `/stkcld/` folder
2. Existing site at root should be unaffected
3. Check if you accidentally uploaded to wrong folder
4. Restore from backup if needed

---

## 📋 Quick Reference Commands

```powershell
# Current Directory
cd C:\Project\myproject\stock-sentiment

# Build for production
npm run build:production

# Preview production build locally
npm run preview

# Check build output
Get-ChildItem .\dist -Recurse

# Compress for upload
Compress-Archive -Path .\dist\* -DestinationPath deploy-$(Get-Date -Format 'yyyyMMdd').zip
```

---

## ✅ Final Checklist

Before going live:

- [ ] Built with `npm run build:production`
- [ ] Tested with `npm run preview`
- [ ] Verified API URL in `.env.production`
- [ ] Uploaded to `public_html/stkcld/` (not root)
- [ ] Set correct file permissions
- [ ] Tested at `https://prysan.com/stkcld/`
- [ ] Verified existing site still works
- [ ] Checked browser console for errors
- [ ] Tested on mobile device
- [ ] Documented deployment date

---

## 📞 Support

If you encounter issues:

1. Check browser console (F12)
2. Check cPanel error logs
3. Verify file permissions
4. Check API endpoint is accessible
5. Review `DEPLOYMENT_GUIDE.md` for detailed steps

---

**Deployment Date:** _________________

**Deployed By:** _________________

**Production URL:** https://prysan.com/stkcld/

**Status:** ⬜ Pending | ⬜ In Progress | ⬜ Complete | ⬜ Issues
