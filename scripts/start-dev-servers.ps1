param(
  [int]$FrontendPort = 5174,
  [int]$ProxyPort = 3001
)

<#
Start both the proxy server and the Vite dev server as background processes in Windows PowerShell.
This script writes a PID file to .dev-servers/pids.json so `stop-dev-servers.ps1` can stop the same processes.

Usage (PowerShell):
  ./scripts/start-dev-servers.ps1 -FrontendPort 5174 -ProxyPort 3001
  npm run start:dev-bg  # package.json uses this script
#>

Set-StrictMode -Version Latest

# Working directories
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot ".."))

# Try to find proxy server - check stock-data-proxy-server2 first, then fallback to stock-data-proxy-server
$proxyRoot = $null
if (Test-Path (Join-Path $projectRoot "..\stock-data-proxy-server2")) {
  $proxyRoot = (Resolve-Path (Join-Path $projectRoot "..\stock-data-proxy-server2"))
  Write-Host "Using proxy server: stock-data-proxy-server2"
} elseif (Test-Path "c:\Project\myproject\stock-data-proxy-server") {
  $proxyRoot = "c:\Project\myproject\stock-data-proxy-server"
  Write-Host "Using proxy server: stock-data-proxy-server"
} else {
  Write-Host "WARNING: No proxy server found. Checked:" -ForegroundColor Yellow
  Write-Host "  - ..\stock-data-proxy-server2" -ForegroundColor Yellow
  Write-Host "  - c:\Project\myproject\stock-data-proxy-server" -ForegroundColor Yellow
}

$devDir = Join-Path -Path $projectRoot -ChildPath '.dev-servers'
if (-not (Test-Path $devDir)) { New-Item -ItemType Directory -Path $devDir | Out-Null }
$pidFile = Join-Path -Path $devDir -ChildPath 'pids.json'

function Start-CmdProcess($cmd, $args, $workDir) {
  if (-not $workDir) { $workDir = $projectRoot }
  $proc = Start-Process -FilePath 'cmd' -ArgumentList "/c`, $cmd $args" -WorkingDirectory $workDir -NoNewWindow -PassThru
  return $proc
}

function Get-PidListeningOnPort([int]$port) {
  $lines = netstat -ano | Select-String ":$port " -AllMatches | ForEach-Object { $_.Line }
  foreach ($line in $lines) {
    if ($line -match 'LISTENING.*\s+(\d+)$') { return [int]$matches[1] }
  }
  return $null
}

# Start proxy: check if there's already a process listening on the proxy port
$existingProxyPid = Get-PidListeningOnPort -port $ProxyPort
if ($existingProxyPid) {
  try {
    $procInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $existingProxyPid" | Select-Object ProcessId,CommandLine
    if ($procInfo -and ($procInfo.CommandLine -match 'stock-data-proxy-server')) {
      Write-Host "Found existing proxy (pid=$existingProxyPid) listening on port $ProxyPort; reusing"
      $proxyProc = Get-Process -Id $existingProxyPid -ErrorAction SilentlyContinue
    } else {
      Write-Host "Port $ProxyPort is in use by PID $existingProxyPid but doesn't look like the proxy. Skipping start and saving PID." -ForegroundColor Yellow
      $proxyProc = Get-Process -Id $existingProxyPid -ErrorAction SilentlyContinue
    }
  } catch {
    Write-Host "Unable to inspect process listening on $ProxyPort, starting a new proxy" -ForegroundColor Yellow
    $proxyProc = $null
  }
}
if (-not $proxyProc) {
  $proxyCmd = "set PORT=$ProxyPort && node index.js"
  Write-Host "Starting proxy (stock-data-proxy-server2) on port $ProxyPort..."
  $proxyProc = Start-CmdProcess -cmd $proxyCmd -args '' -workDir $proxyRoot
}

Start-Sleep -Milliseconds 500

# Start vite in dev mode on requested frontend port
$existingVitePid = Get-PidListeningOnPort -port $FrontendPort
if ($existingVitePid) {
  try {
    $procInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $existingVitePid" | Select-Object ProcessId,CommandLine
    if ($procInfo -and $procInfo.CommandLine -match 'vite' -or $procInfo.CommandLine -match 'npm run dev') {
      Write-Host "Found existing Vite (pid=$existingVitePid) listening on port $FrontendPort; reusing"
      $viteProc = Get-Process -Id $existingVitePid -ErrorAction SilentlyContinue
    } else {
      Write-Host "Port $FrontendPort is in use by PID $existingVitePid but doesn't look like Vite. Will attempt to start a new Vite instance (which may pick a different port)." -ForegroundColor Yellow
      $viteProc = $null
    }
  } catch {
    Write-Host "Unable to inspect process listening on $FrontendPort, starting Vite" -ForegroundColor Yellow
    $viteProc = $null
  }
}
if (-not $viteProc) {
  $viteCmd = "npm run dev -- --port $FrontendPort"
  Write-Host "Starting Vite on port $FrontendPort..."
  $viteProc = Start-CmdProcess -cmd $viteCmd -args '' -workDir $projectRoot
}

# Save PIDs to file so we can stop them later
$pids = @{
  proxy = $proxyProc.Id
  vite = $viteProc.Id
  startedAt = (Get-Date).ToString('o')
  frontendPort = $FrontendPort
  proxyPort = $ProxyPort
}
$pids | ConvertTo-Json | Out-File -FilePath $pidFile -Encoding utf8
Write-Host "Started proxy PID=$($proxyProc.Id), vite PID=$($viteProc.Id). PID file: $pidFile"
Write-Host "To stop: npm run stop:dev-bg or ./scripts/stop-dev-servers.ps1"
