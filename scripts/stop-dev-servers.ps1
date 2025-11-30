<#
Stop background servers started by `start-dev-servers.ps1`.
It reads `.dev-servers/pids.json` and stops listed processes.

Usage:
  ./scripts/stop-dev-servers.ps1
  npm run stop:dev-bg
#>

Set-StrictMode -Version Latest
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot ".."))
$pidFile = Join-Path -Path (Join-Path -Path $projectRoot -ChildPath '.dev-servers') -ChildPath "pids.json"
if (-not (Test-Path $pidFile)) {
  Write-Host "PID file not found: $pidFile" -ForegroundColor Yellow
  return
}

try {
  $json = Get-Content $pidFile -Raw | ConvertFrom-Json
  $pids = @()
  if ($json.proxy) { $pids += [int]$json.proxy }
  if ($json.vite) { $pids += [int]$json.vite }
  foreach ($pid in $pids) {
    try {
      # Inspect command line and only stop if it looks like a dev server we started
      $procInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $pid" -ErrorAction SilentlyContinue | Select-Object ProcessId,CommandLine
      $cmd = $procInfo?.CommandLine -as [string]
      if ($cmd -and ($cmd -match 'stock-data-proxy-server' -or $cmd -match 'vite' -or $cmd -match 'npm-cli.js')) {
        Write-Host "Stopping PID $pid (cmd: $cmd)..."
        Stop-Process -Id $pid -Force -ErrorAction Stop
      } else {
        Write-Host "PID $pid does not appear to be a dev server (cmd: $cmd), skipping stop." -ForegroundColor Yellow
      }
    } catch {
      Write-Host "Failed to stop PID $pid: $_" -ForegroundColor Yellow
    }
  }
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
  Write-Host "Stopped processes and removed PID file."
} catch {
  Write-Host "Error stopping dev servers: $_" -ForegroundColor Red
}
