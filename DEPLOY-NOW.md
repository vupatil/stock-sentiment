# 🚀 Deploy Stock Sentiment to prysan.com - Quick Guide

**Build Status:** ✅ Complete (220 KB ready in `dist/` folder)  
**Target:** https://prysan.com/stkcld/  
**Impact:** ✅ No changes to existing prysan.com site

---

## ⚡ Quick Deploy (5 Minutes)

### Step 1: Access cPanel (1 min)
1. Go to: **https://prysan.com/cpanel**
2. Log in with your credentials
3. Click **"File Manager"** icon

### Step 2: Navigate to Deployment Location (1 min)
1. In File Manager, click **"public_html"** in left sidebar
2. Look for folder named **"stkcld"**
   - ✅ **If exists:** Click to open it → Skip to Step 3
   - ❌ **If doesn't exist:** Create it now:
     - Click **"+ Folder"** button at top
     - Name: `stkcld`
     - Click **"Create New Folder"**
     - Open the new `stkcld` folder

### Step 3: Upload Your Build (2 min)
1. Inside the `stkcld` folder, click **"Upload"** button at top
2. In upload window, click **"Select File"** or drag files
3. Navigate to: `C:\Project\myproject\stock-sentiment\dist`
4. **Select ALL files** (Ctrl+A):
   - `index.html`
   - `assets` (folder)
   - `.htaccess` (hidden file - important!)
   - `DEPLOY_README.txt`
5. Click **"Open"** to start upload
6. Wait for upload to complete (should be fast, only 220 KB)
7. Click **"Go Back to..."** to return to File Manager

### Step 4: Verify Upload (30 sec)
Inside `public_html/stkcld/` you should see:
- ✅ `index.html`
- ✅ `assets/` (folder with JS/CSS files inside)
- ✅ `.htaccess`
- ✅ `DEPLOY_README.txt`

### Step 5: Set Permissions (30 sec)
1. Select all files/folders (Ctrl+A or checkbox next to Name)
2. Click **"Permissions"** at top menu
3. Set:
   - **Folders:** 755 (✓ Read, ✓ Write, ✓ Execute for Owner; ✓ Read, ✓ Execute for Group/Public)
   - **Files:** 644 (✓ Read, ✓ Write for Owner; ✓ Read for Group/Public)
4. Check **"Recurse into subdirectories"**
5. Click **"Change Permissions"**

### Step 6: Test Your Deployment (1 min)
1. Open new browser tab
2. Go to: **https://prysan.com/stkcld/**
3. You should see Stock Sentiment Pro app load
4. Test:
   - Type "AAPL" in search box
   - Click Analyze
   - Charts should load
   - Try Scanner tab

### Step 7: Verify Existing Site Unaffected (30 sec)
1. Open: **https://prysan.com/** (root, no /stkcld/)
2. Your existing site should work normally
3. No broken links or missing assets

---

## ✅ Success Checklist

- [ ] App loads at https://prysan.com/stkcld/
- [ ] No console errors (press F12)
- [ ] Can search stocks (AAPL, GOOGL, MSFT)
- [ ] Charts display correctly
- [ ] Scanner works
- [ ] Existing site at https://prysan.com/ works
- [ ] Mobile responsive (test on phone)

---

## 🎯 Deployment Structure

```
prysan.com/
├── index.html              ← Your existing site (UNTOUCHED)
├── assets/                 ← Existing assets (UNTOUCHED)
├── .htaccess               ← Existing config (UNTOUCHED)
├── api/                    ← Existing API if any (UNTOUCHED)
│
└── stkcld/                 ← NEW: Stock Sentiment
    ├── index.html          
    ├── assets/
    │   ├── index-KaZ7TQ3s.js    (218 KB)
    │   └── index-C185pC2Q.css   (3.5 KB)
    ├── .htaccess           
    └── DEPLOY_README.txt
```

---

## 🔧 Alternative: Upload via FTP

If you prefer FTP (FileZilla, WinSCP):

1. **Connect to FTP:**
   - Host: ftp.prysan.com (or prysan.com)
   - Username: Your cPanel username
   - Password: Your cPanel password
   - Port: 21

2. **Navigate:**
   - Remote: `/public_html/stkcld/`
   - Local: `C:\Project\myproject\stock-sentiment\dist\`

3. **Upload:**
   - Drag all files from local `dist/` to remote `stkcld/`
   - Ensure `.htaccess` is uploaded (show hidden files)

4. **Set Permissions:**
   - Right-click files → File Permissions
   - Folders: 755
   - Files: 644

---

## 🔄 Future Updates

When you make changes to the app:

```powershell
# 1. Make your code changes in C:\Project\myproject\stock-sentiment\

# 2. Rebuild
cd C:\Project\myproject\stock-sentiment
npm run build

# 3. Re-upload
# Upload dist/* to public_html/stkcld/ (overwrite existing files)

# 4. Test
# Visit https://prysan.com/stkcld/ (Ctrl+Shift+R to clear cache)
```

---

## 🐛 Troubleshooting

### Problem: Blank Page at /stkcld/

**Solutions:**
1. Press F12 → Check Console tab for errors
2. Verify `.htaccess` was uploaded (enable "Show Hidden Files" in cPanel)
3. Clear browser cache: Ctrl+Shift+R
4. Check file permissions (755 for folders, 644 for files)

### Problem: 404 on Assets (CSS/JS not loading)

**Solutions:**
1. Verify `assets/` folder uploaded correctly
2. Check folder structure: `stkcld/assets/index-*.js` not `stkcld/dist/assets/`
3. Verify permissions on assets folder: 755

### Problem: API Calls Fail

**Current Setup:** 
- Your `.env.production` is set to: `VITE_PROXY_URL=https://prysan.com/api`
- App expects backend API at: `https://prysan.com/api/api/stock/:symbol`

**Solutions:**
1. **If API not deployed yet:**
   - Deploy your `stock-data-proxy-server` to `/api/` path
   - See `API_DEPLOYMENT_GUIDE.md` for instructions

2. **Test API manually:**
   ```powershell
   Invoke-RestMethod -Uri "https://prysan.com/api/api/stock/AAPL?interval=1d&range=5d"
   ```

3. **Temporary workaround (dev API):**
   - Rebuild with local proxy
   - Create `.env.local`: `VITE_PROXY_URL=http://localhost:3001`
   - Run: `npm run build`
   - Re-upload

### Problem: Existing Site Broken

**Recovery:**
- You only uploaded to `/stkcld/` folder
- Existing site files at root `/` should be untouched
- If broken, you likely uploaded to wrong location
- Check `public_html/` (root) - should have your original files
- Remove incorrect files, re-upload to `/stkcld/` only

### Problem: .htaccess Not Uploaded

**Solution:**
1. In cPanel File Manager, click **Settings** (top right)
2. Check **"Show Hidden Files (dotfiles)"**
3. Click **"Save"**
4. Now you can see and upload `.htaccess`
5. Upload from: `dist/.htaccess` to `public_html/stkcld/.htaccess`

---

## 📊 What Gets Deployed

| File | Size | Purpose |
|------|------|---------|
| `index.html` | 0.5 KB | App entry point |
| `assets/index-KaZ7TQ3s.js` | 218 KB | All React code + libraries |
| `assets/index-C185pC2Q.css` | 3.5 KB | Styles + animations |
| `.htaccess` | <1 KB | SPA routing config |
| `DEPLOY_README.txt` | 3 KB | Deployment instructions |

**Total:** ~220 KB (0.22 MB)

---

## 🔐 Security Notes

1. **API Keys:** Never in frontend code
   - All API keys stay in backend server
   - Frontend only makes requests to `/api/` endpoint

2. **Environment Variables:**
   - `.env.production` used during build
   - Values compiled into JS (safe for VITE_* vars)
   - Backend .env stays on server (not uploaded)

3. **CORS:**
   - Backend API must allow `https://prysan.com` origin
   - Configure in your API server

---

## 📞 Need Help?

**Detailed Guides:**
- Full deployment: `DEPLOYMENT_TO_PRYSAN.md`
- API deployment: `API_DEPLOYMENT_GUIDE.md`
- General deployment: `DEPLOYMENT_GUIDE.md`

**Check Build:**
```powershell
cd C:\Project\myproject\stock-sentiment
Get-ChildItem .\dist -Recurse
```

**Verify .env:**
```powershell
Get-Content .env.production
# Should show: VITE_PROXY_URL=https://prysan.com/api
```

---

## 🎉 Post-Deployment

After successful deployment:

1. **Test thoroughly:**
   - All timeframes (1m to 1mo)
   - Multiple stocks
   - Scanner functionality
   - Multiple tabs
   - Mobile view

2. **Monitor:**
   - Check browser console for errors
   - Test API response times
   - Monitor server logs

3. **Share:**
   - Stock Sentiment: https://prysan.com/stkcld/
   - Main site: https://prysan.com/

4. **Document:**
   - Date deployed: ___________
   - Version: ___________
   - Issues found: ___________

---

## 📋 Pre-Deployment Checklist

- [x] Built production version (`npm run build`)
- [x] .htaccess included in dist
- [x] API URL configured (`.env.production`)
- [ ] cPanel access confirmed
- [ ] Backup of existing site (optional but recommended)
- [ ] Ready to upload to `/stkcld/` folder

---

**You're ready to deploy! Follow Steps 1-7 above.** 🚀

**Deployment Target:** https://prysan.com/stkcld/  
**Build Location:** `C:\Project\myproject\stock-sentiment\dist`  
**Upload To:** `public_html/stkcld/`

Good luck! 🎯
