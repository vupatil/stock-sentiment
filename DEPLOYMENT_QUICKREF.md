# 🚀 Quick Deployment Reference Card

## 📋 Pre-Deployment Checklist

```powershell
# 1. Run the automated build script
npm run build:production

# OR manual steps:
npm run build
```

## 📁 What to Upload

Upload ONLY the **contents** of the `dist` folder to cPanel:
- ✅ `index.html`
- ✅ `assets/` (entire folder)
- ✅ `.htaccess`
- ✅ `vite.svg` (if present)

❌ Do NOT upload the `dist` folder itself!

## 🎯 cPanel Upload Location

```
/public_html/stkcld/
```

Your site will be live at: `https://prysan.com/stkcld/`

## ⚙️ File Permissions

| Item | Permission |
|------|------------|
| Folders | 755 |
| Files | 644 |

## 📝 .htaccess Content

Copy from `.htaccess.template` file or use File Manager to create:

```apache
RewriteEngine On
RewriteBase /stkcld/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /stkcld/index.html [L,QSA]
```

## 🔧 Update Process

1. Make changes locally
2. Test: `npm run dev`
3. Build: `npm run build:production`
4. Upload to `/public_html/stkcld/`
5. Clear browser cache: `Ctrl + Shift + Delete`

## ✅ Testing Checklist

After deployment, test:
- [ ] `https://prysan.com/stkcld/` loads
- [ ] No console errors (F12)
- [ ] All assets load (Network tab)
- [ ] Navigation works
- [ ] Analyze tab works
- [ ] Scanner tab works
- [ ] Existing site unaffected: `https://prysan.com/`

## 🆘 Common Issues

### Blank page?
- Check `vite.config.js` has `base: '/stkcld/'`
- Rebuild and re-upload

### 404 errors?
- Verify `.htaccess` exists in `/stkcld/` folder
- Check `RewriteBase /stkcld/`

### CSS not loading?
- Check file permissions (644)
- Verify all files in `assets/` uploaded

### Routes break on refresh?
- Add/fix `.htaccess` file
- Enable mod_rewrite in cPanel

## 📞 Support Resources

- Full Guide: `DEPLOYMENT_GUIDE.md`
- cPanel Docs: Check your hosting provider
- Vite Docs: https://vitejs.dev/guide/static-deploy.html

---

**Quick Command:** `npm run build:production`
**Upload to:** `/public_html/stkcld/`
**Live URL:** `https://prysan.com/stkcld/`
