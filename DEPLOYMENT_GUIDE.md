# 🚀 Deployment Guide: Stock Sentiment Pro to prysan.com/stkcld

## Overview
This guide will help you deploy your Stock Sentiment application to `https://prysan.com/stkcld/` using cPanel without affecting your existing website.

---

## 📦 STEP 1: Build Your Application

### 1.1 Build the Frontend
```powershell
# Navigate to your project directory
cd C:\Project\myproject\stock-sentiment

# Build the production version
npm run build
```

This creates a `dist` folder with all optimized files ready for deployment.

**What to expect:**
- Output folder: `C:\Project\myproject\stock-sentiment\dist`
- Contains: `index.html`, `assets/` folder with JS/CSS files
- File size: ~500KB - 2MB (compressed)

---

## 🖥️ STEP 2: cPanel Deployment

### 2.1 Access Your cPanel
1. Go to `https://prysan.com/cpanel` or your hosting provider's cPanel URL
2. Log in with your credentials

### 2.2 Create the Subdirectory

**Option A: Using File Manager (Recommended)**

1. In cPanel, click **"File Manager"**
2. Navigate to `public_html/` directory (this is your website root)
3. Click **"+ Folder"** or **"Create New Folder"**
4. Name it: `stkcld`
5. Click **"Create New Folder"**

**File structure should look like:**
```
public_html/
├── index.html          (your existing prysan.com files)
├── css/
├── js/
├── images/
└── stkcld/            ← NEW FOLDER (empty for now)
```

### 2.3 Upload Your Built Files

**Method 1: Using cPanel File Manager (Easy)**

1. Open the `stkcld` folder you just created
2. Click **"Upload"** button at the top
3. Click **"Select File"** or drag-and-drop
4. Navigate to: `C:\Project\myproject\stock-sentiment\dist`
5. **Select ALL files** inside dist folder:
   - `index.html`
   - `assets/` folder
   - Any other files (e.g., `vite.svg`)
6. Click **"Upload"**
7. Wait for upload to complete (progress bar will show 100%)

**Method 2: Using FTP (FileZilla) - Alternative**

1. Download FileZilla Client if you don't have it
2. Connect using FTP credentials from cPanel
3. Navigate to: `/public_html/stkcld/`
4. Upload all contents from `dist` folder

**Final structure should be:**
```
public_html/
└── stkcld/
    ├── index.html
    ├── assets/
    │   ├── index-abc123.js
    │   ├── index-def456.css
    │   └── ... (other bundled files)
    └── vite.svg (if present)
```

### 2.4 Set Correct Permissions

1. In File Manager, select the `stkcld` folder
2. Click **"Permissions"** at the top
3. Set folder permission to: **755**
4. Select the `index.html` file
5. Set file permission to: **644**
6. For the `assets` folder:
   - Folder: **755**
   - Files inside: **644**

---

## 🌐 STEP 3: Configure .htaccess for React Router (IMPORTANT!)

Your app is a Single Page Application (SPA). We need to configure Apache to redirect all routes to `index.html`.

### 3.1 Create .htaccess File

1. In File Manager, navigate to `/public_html/stkcld/`
2. Click **"+ File"** or **"Create New File"**
3. Name it: `.htaccess` (note the dot at the beginning)
4. Right-click the file → **"Edit"**
5. Paste this code:

```apache
# Enable Rewrite Engine
RewriteEngine On

# Set base directory
RewriteBase /stkcld/

# If the request is for a file or directory that exists, serve it directly
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Otherwise, redirect all requests to index.html
RewriteRule ^(.*)$ /stkcld/index.html [L,QSA]

# Enable GZIP compression for better performance
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching for static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/x-javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
</IfModule>

# Security headers
<IfModule mod_headers.c>
  # Prevent clickjacking
  Header always set X-Frame-Options "SAMEORIGIN"
  
  # XSS Protection
  Header always set X-XSS-Protection "1; mode=block"
  
  # Prevent MIME sniffing
  Header always set X-Content-Type-Options "nosniff"
  
  # CORS headers (if you need to allow requests from other domains)
  # Uncomment if needed:
  # Header set Access-Control-Allow-Origin "*"
  # Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
</IfModule>
```

6. Click **"Save Changes"**
7. Set permission to **644**

---

## 🔧 STEP 4: Configure API Proxy (If Needed)

Since your app uses an external proxy server (`http://localhost:3001`), you have two options for production:

### Option A: Deploy Proxy Server Separately (Recommended)

1. Deploy your `stock-data-proxy-server` to a cloud service:
   - **Heroku** (Free tier available)
   - **Railway** (Free tier available)
   - **Render** (Free tier available)
   - **DigitalOcean** App Platform
   - **AWS Lambda** with API Gateway

2. Update your environment variables:
   - Create `.env` file in your project root (before building)
   - Set: `VITE_LOCAL_PROXY_URL=https://your-proxy-server.herokuapp.com`
   - Rebuild: `npm run build`
   - Re-upload to cPanel

### Option B: Use Direct API Calls (No Proxy)

If you don't want to maintain a separate server, you can modify your app to make direct API calls to Yahoo Finance or other providers from the client side (with CORS limitations).

---

## ✅ STEP 5: Test Your Deployment

### 5.1 Initial Test
1. Open your browser
2. Go to: `https://prysan.com/stkcld/`
3. You should see your Stock Sentiment Pro homepage

### 5.2 Test Checklist
- [ ] Homepage loads without errors
- [ ] Styles are applied correctly (dark theme, gradients)
- [ ] Logo and fonts display properly
- [ ] Navigation tabs work (Analyze, Scanner)
- [ ] Forms are interactive
- [ ] Console shows no 404 errors for assets

### 5.3 Test with Browser DevTools
1. Press `F12` to open DevTools
2. Go to **Console** tab
3. Check for errors (red text)
4. Go to **Network** tab
5. Reload page
6. Verify all files load successfully (green/200 status)

---

## 🚨 Troubleshooting Common Issues

### Issue 1: Blank Page or 404 Error
**Cause:** Incorrect base path configuration

**Solution:**
1. Verify `vite.config.js` has `base: '/stkcld/'`
2. Rebuild: `npm run build`
3. Re-upload all files

### Issue 2: CSS/JS Not Loading (Broken Styles)
**Cause:** Wrong file paths

**Solution:**
1. Check `.htaccess` has correct `RewriteBase /stkcld/`
2. Verify all files in `assets/` folder uploaded correctly
3. Check file permissions (644 for files, 755 for folders)

### Issue 3: Routes Don't Work (404 on Refresh)
**Cause:** Missing or incorrect `.htaccess`

**Solution:**
1. Ensure `.htaccess` file exists in `/public_html/stkcld/`
2. Verify file starts with a dot: `.htaccess` (not `htaccess.txt`)
3. Check RewriteEngine is enabled in cPanel

### Issue 4: Existing Site Affected
**Cause:** Global `.htaccess` rules conflict

**Solution:**
1. Your `stkcld/.htaccess` is self-contained and won't affect parent directory
2. If issues persist, add this to `/public_html/.htaccess` at the TOP:
```apache
# Exclude stkcld from parent rules
RewriteCond %{REQUEST_URI} !^/stkcld/
```

### Issue 5: API Calls Failing
**Cause:** Proxy server not accessible

**Solution:**
1. Deploy proxy server to cloud (see Step 4)
2. Update `.env` with production proxy URL
3. Rebuild and re-upload

---

## 🔄 STEP 6: Update Process (Future Changes)

When you need to update your app:

1. **Make changes locally**
2. **Test locally**: `npm run dev`
3. **Build**: `npm run build`
4. **Backup current version** (optional but recommended):
   - In cPanel, rename `stkcld` to `stkcld_backup_YYYYMMDD`
5. **Upload new build**:
   - Go to `/public_html/stkcld/`
   - Delete old files (except `.htaccess`)
   - Upload new files from `dist` folder
6. **Test**: Visit `https://prysan.com/stkcld/`
7. **Clear browser cache**: `Ctrl + Shift + Delete` or `Cmd + Shift + Delete`

---

## 🔐 Security Best Practices

### 1. Environment Variables
Never commit API keys or sensitive data. Use environment variables:

```bash
# .env (DO NOT commit this file)
VITE_PROXY_URL=https://your-proxy.com
VITE_API_KEY=your_secret_key
```

### 2. API Rate Limiting
Implement rate limiting on your proxy server to prevent abuse.

### 3. HTTPS
Ensure your site uses HTTPS (SSL certificate). Most cPanel hosting includes free Let's Encrypt SSL.

### 4. Regular Updates
Keep dependencies updated:
```bash
npm update
npm audit fix
```

---

## 📊 Monitoring & Analytics

### Add Google Analytics (Optional)

1. Edit `index.html` before building
2. Add Google Analytics script in `<head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

3. Replace `GA_MEASUREMENT_ID` with your actual ID
4. Rebuild and deploy

---

## 📝 Quick Reference Commands

```powershell
# Build production version
npm run build

# Test production build locally
npm run preview

# Check for errors
npm run test

# Update dependencies
npm update
```

---

## 📞 Need Help?

**Common Resources:**
- cPanel Documentation: Check your hosting provider's docs
- Vite Deployment Guide: https://vitejs.dev/guide/static-deploy.html
- React Deployment: https://react.dev/learn/start-a-new-react-project

**Your Project Structure:**
```
stock-sentiment/
├── dist/                  ← Upload contents to cPanel
├── src/
├── vite.config.js         ← Base path configured
├── package.json
└── DEPLOYMENT_GUIDE.md    ← This file
```

---

## ✅ Final Checklist

Before going live:

- [ ] `vite.config.js` has `base: '/stkcld/'`
- [ ] Run `npm run build` successfully
- [ ] Created `stkcld` folder in `/public_html/`
- [ ] Uploaded all files from `dist` to `stkcld`
- [ ] Created `.htaccess` in `stkcld` folder
- [ ] Set correct file permissions (644/755)
- [ ] Tested: `https://prysan.com/stkcld/`
- [ ] Verified existing site still works: `https://prysan.com/`
- [ ] All assets load correctly (no 404s in DevTools)
- [ ] Proxy server configured and accessible
- [ ] Mobile responsiveness tested

---

## 🎉 Success!

Your Stock Sentiment Pro app should now be live at:
**https://prysan.com/stkcld/**

Your existing website at `https://prysan.com/` remains completely unaffected!

---

**Version:** 1.0
**Last Updated:** November 30, 2025
**Project:** Stock Sentiment Pro
