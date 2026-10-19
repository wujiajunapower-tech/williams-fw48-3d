# Run from this folder; project and dependency cache stay on D: on the delivery host.
$ErrorActionPreference='Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'node_modules'))) {
    $env:npm_config_cache='D:/CodexWork/.npm-cache'
    npm ci
    if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
}
Write-Host 'Open the Local URL printed below. Press Ctrl+C to stop.'
npm run dev
