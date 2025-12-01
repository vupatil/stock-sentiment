# Stock Sentiment Pro - Deployment Preparation Script
# Run this before uploading to cPanel

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Stock Sentiment Pro - Build for Production" -ForegroundColor Cyan
Write-Host "Target: prysan.com/stkcld" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean previous build
Write-Host "[1/4] Cleaning previous build..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "  ✓ Cleaned dist folder" -ForegroundColor Green
} else {
    Write-Host "  ℹ No previous build found" -ForegroundColor Gray
}

# Step 2: Install/Update dependencies
Write-Host ""
Write-Host "[2/4] Checking dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Dependencies ready" -ForegroundColor Green
} else {
    Write-Host "  ✗ Dependency installation failed!" -ForegroundColor Red
    exit 1
}

# Step 3: Build production version
Write-Host ""
Write-Host "[3/4] Building production version..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Build completed successfully" -ForegroundColor Green
} else {
    Write-Host "  ✗ Build failed!" -ForegroundColor Red
    exit 1
}

# Step 4: Create deployment package
Write-Host ""
Write-Host "[4/4] Preparing deployment package..." -ForegroundColor Yellow

# Copy .htaccess template to dist
if (Test-Path ".htaccess.template") {
    Copy-Item ".htaccess.template" "dist/.htaccess"
    Write-Host "  ✓ Added .htaccess to dist folder" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Warning: .htaccess.template not found" -ForegroundColor Yellow
    Write-Host "    You'll need to create .htaccess manually in cPanel" -ForegroundColor Yellow
}

# Create a README for deployment
$deploymentReadme = @"
DEPLOYMENT INSTRUCTIONS FOR CPANEL
===================================

1. Log in to your cPanel: https://prysan.com/cpanel

2. Open File Manager

3. Navigate to: public_html/

4. Create folder: stkcld (if not exists)

5. Open the stkcld folder

6. Upload ALL contents from this 'dist' folder:
   - index.html
   - assets/ (entire folder)
   - .htaccess
   - vite.svg (if present)

7. Set Permissions:
   - Folders: 755
   - Files: 644

8. Visit: https://prysan.com/stkcld/

9. Test thoroughly before announcing!

IMPORTANT NOTES:
- Do NOT upload the 'dist' folder itself, only its CONTENTS
- Make sure .htaccess is uploaded (it starts with a dot)
- Clear your browser cache after deployment
- Your existing prysan.com site will NOT be affected

For detailed instructions, see: DEPLOYMENT_GUIDE.md
"@

Set-Content -Path "dist/DEPLOY_README.txt" -Value $deploymentReadme
Write-Host "  ✓ Created DEPLOY_README.txt in dist folder" -ForegroundColor Green

# Show build summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BUILD COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Calculate dist folder size
$distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Build Output Location: $(Get-Location)\dist" -ForegroundColor White
Write-Host "Build Size: $([math]::Round($distSize, 2)) MB" -ForegroundColor White
Write-Host ""

# List files in dist
Write-Host "Files ready for upload:" -ForegroundColor Yellow
Get-ChildItem -Path "dist" -Name | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Open cPanel File Manager" -ForegroundColor White
Write-Host "2. Navigate to: public_html/stkcld/" -ForegroundColor White
Write-Host "3. Upload ALL files from the 'dist' folder" -ForegroundColor White
Write-Host "4. Read DEPLOY_README.txt in dist folder for details" -ForegroundColor White
Write-Host "5. Visit: https://prysan.com/stkcld/" -ForegroundColor White
Write-Host ""
Write-Host "For complete instructions, see:" -ForegroundColor Yellow
Write-Host "  DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
